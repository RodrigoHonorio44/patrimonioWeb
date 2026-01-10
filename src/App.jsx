import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { auth, db } from "./api/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Notificações e Segurança
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GuardiaoSessao from "./components/GuardiaoSessao";
import { useLicenseGuard } from "./hooks/useLicenseGuard";
import LicencaExpirada from "./pages/LicencaExpirada";

// Páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardBI from "./pages/DashboardBI";
import PainelAnalista from "./pages/PainelAnalista";
import Home from "./pages/Home";
import CadastroEquipamento from "./pages/CadastroEquipamento";
import Transferencia from "./pages/Transferencia";
import Inventario from "./pages/Inventario";
import Estoque from "./pages/Estoque";
import Usuarios from "./pages/Usuarios";
import TrocarSenha from "./pages/TrocarSenha";
import AdminLicencas from "./pages/AdminLicencas";
import CadastroChamado from "./components/CadastroChamado";

// NOVAS PÁGINAS DE GESTÃO
import GestaoChefia from "./pages/GestaoeChefia";
import PainelGestao from "./pages/PainelGestao";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [cargo, setCargo] = useState(null); // Estado para o campo 'cargo' do Firestore
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const { isLicenseValid, loadingLicense } = useLicenseGuard();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();

            // Padronizando para evitar erros de case-sensitive (Maiúsculas/Minúsculas)
            const userRole = userData.role?.toLowerCase().trim() || "usuario";
            const userCargo = userData.cargo?.toLowerCase().trim() || "";

            setRole(userRole);
            setCargo(userCargo);
            setMustChangePassword(userData.requiresPasswordChange === true);
          } else {
            setRole("usuario");
          }
        } catch (error) {
          console.error("Erro ao buscar dados:", error);
          setRole("usuario");
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setRole(null);
        setCargo(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- DEFINIÇÃO DE PERMISSÕES ATUALIZADA ---

  // É considerado Admin se role for root/admin OU cargo for administrador
  const isAdmin = useMemo(
    () => role === "root" || role === "admin" || cargo === "administrador",
    [role, cargo]
  );

  // Define quem tem acesso às ferramentas técnicas e Dashboard
  const isStaff = useMemo(
    () =>
      ["root", "analista", "ti", "admin"].includes(role) ||
      cargo === "administrador",
    [role, cargo]
  );

  const isGestao = useMemo(
    () => ["chefia", "coordenador"].includes(role),
    [role]
  );

  // Lógica de Redirecionamento Inicial
  const getHomePath = () => {
    if (isStaff || isAdmin) return "/dashboard";
    if (isGestao) return "/painel-gestao";
    return "/home";
  };

  if (loading || loadingLicense) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        <p className="mt-4 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
          Rodhon System: Validando Acesso
        </p>
      </div>
    );
  }

  if (user && !isLicenseValid && !isAdmin) {
    return <LicencaExpirada />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <BrowserRouter>
        <GuardiaoSessao>
          <Routes>
            {!user ? (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : mustChangePassword ? (
              <>
                <Route path="/trocar-senha" element={<TrocarSenha />} />
                <Route
                  path="*"
                  element={<Navigate to="/trocar-senha" replace />}
                />
              </>
            ) : (
              <>
                {/* Redirecionamento Baseado em Cargo/Role */}
                <Route
                  path="/"
                  element={<Navigate to={getHomePath()} replace />}
                />

                <Route
                  path="/home"
                  element={
                    isStaff || isAdmin ? (
                      <Navigate to="/dashboard" replace />
                    ) : isGestao ? (
                      <Navigate to="/painel-gestao" replace />
                    ) : (
                      <Home />
                    )
                  }
                />

                {/* --- ROTAS STAFF & ADMIN --- */}
                {(isStaff || isAdmin) && (
                  <>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/indicadores" element={<DashboardBI />} />
                    <Route path="/operacional" element={<PainelAnalista />} />
                    <Route
                      path="/cadastrar-chamado"
                      element={<CadastroChamado />}
                    />
                    <Route
                      path="/cadastrar-patrimonio"
                      element={<CadastroEquipamento />}
                    />
                    <Route path="/transferencia" element={<Transferencia />} />
                    <Route path="/inventario" element={<Inventario />} />
                    <Route path="/estoque" element={<Estoque />} />
                    <Route path="/usuarios" element={<Usuarios />} />
                  </>
                )}

                {/* --- ROTAS GESTÃO --- */}
                {(isGestao || isAdmin) && (
                  <Route path="/painel-gestao" element={<GestaoChefia />}>
                    <Route index element={<PainelGestao />} />
                    <Route path="indicadores" element={<DashboardBI />} />
                    <Route
                      path="relatorios"
                      element={
                        <div className="p-8 font-black text-slate-400 italic uppercase">
                          Relatórios em desenvolvimento
                        </div>
                      }
                    />
                  </Route>
                )}

                {/* --- ACESSO MASTER (LICENÇAS) --- */}
                {isAdmin && (
                  <Route path="/admin/licencas" element={<AdminLicencas />} />
                )}

                <Route
                  path="*"
                  element={<Navigate to={getHomePath()} replace />}
                />
              </>
            )}
          </Routes>
        </GuardiaoSessao>
      </BrowserRouter>
    </>
  );
}

export default App;
