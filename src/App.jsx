import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "./api/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Suporte para notificações (Toasts)
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// SISTEMA DE SEGURANÇA E LICENÇA
import GuardiaoSessao from "./components/GuardiaoSessao";
import { useLicenseGuard } from "./hooks/useLicenseGuard"; // Hook que criamos
import LicencaExpirada from "./pages/LicencaExpirada"; // Página de bloqueio

// Importação das Páginas
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
import AdminLicencas from "./pages/AdminLicencas"; // Sua nova tela de gestão

// Importando componentes
import CadastroChamado from "./components/CadastroChamado";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hook de verificação de licença
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
            const userRole = userData.role?.toLowerCase().trim();
            setRole(userRole);
            setMustChangePassword(userData.requiresPasswordChange === true);
          } else {
            setRole("user");
          }
        } catch (error) {
          console.error("Erro ao buscar dados:", error);
          setRole("user");
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. TELA DE CARREGAMENTO
  if (loading || loadingLicense) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-slate-100"></div>
        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest animate-pulse text-[10px]">
          Rodhon System: Validando Acesso
        </p>
      </div>
    );
  }

  // 2. VERIFICAÇÃO DE LICENÇA (Bloqueia tudo se estiver expirado, exceto se for Admin)
  // Nota: Geralmente o Admin (você) não deve ser bloqueado pela própria trava
  if (user && !isLicenseValid && role !== "admin") {
    return <LicencaExpirada />;
  }

  const isStaff = ["admin", "analista", "ti", "adm"].includes(role);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <BrowserRouter>
        <GuardiaoSessao>
          <Routes>
            {/* CASO: TROCA DE SENHA */}
            {user && mustChangePassword ? (
              <>
                <Route path="/trocar-senha" element={<TrocarSenha />} />
                <Route
                  path="*"
                  element={<Navigate to="/trocar-senha" replace />}
                />
              </>
            ) : (
              <>
                <Route
                  path="/"
                  element={
                    !user ? (
                      <Navigate to="/login" replace />
                    ) : isStaff ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <Navigate to="/home" replace />
                    )
                  }
                />

                <Route
                  path="/login"
                  element={
                    !user ? (
                      <Login />
                    ) : (
                      <Navigate to={isStaff ? "/dashboard" : "/home"} replace />
                    )
                  }
                />

                {/* PAINEL DO DONO (GESTÃO DE LICENÇAS) */}
                {user && role === "admin" && (
                  <Route path="/admin/licencas" element={<AdminLicencas />} />
                )}

                {/* ROTAS STAFF */}
                {user && isStaff && (
                  <>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/indicadores" element={<DashboardBI />} />
                    <Route path="/operacional" element={<PainelAnalista />} />
                    <Route
                      path="/cadastrar-patrimonio"
                      element={<CadastroEquipamento />}
                    />
                    <Route path="/transferencia" element={<Transferencia />} />
                    <Route path="/inventario" element={<Inventario />} />
                    <Route path="/estoque" element={<Estoque />} />
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route
                      path="/cadastrar-chamado"
                      element={
                        <CadastroChamado
                          isOpen={true}
                          onClose={() => window.history.back()}
                        />
                      }
                    />
                  </>
                )}

                <Route
                  path="/home"
                  element={user ? <Home /> : <Navigate to="/login" replace />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </GuardiaoSessao>
      </BrowserRouter>
    </>
  );
}

export default App;
