import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { auth, db } from "./api/Firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// COMPONENTES E PAGES
import GuardiaoSessao from "./components/GuardiaoSessao";
import { useLicenseGuard } from "./hooks/useLicenseGuard";
import LicencaExpirada from "./pages/LicencaExpirada";
import MensagemBloqueio from "./pages/MensagemBloqueio";
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
import GestaoChefia from "./pages/GestaoeChefia";
import PainelGestao from "./pages/PainelGestao";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(
    !!sessionStorage.getItem("app_blocked")
  );

  const { isLicenseValid, loadingLicense } = useLicenseGuard();

  useEffect(() => {
    const handleBlockEvent = () => {
      sessionStorage.setItem("app_blocked", "true");
      setIsBlocked(true);
    };
    window.addEventListener("force-block", handleBlockEvent);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();

            // LÓGICA DE BLOQUEIO: Usuário desativado ou Licença específica bloqueada
            const bloqueado =
              userData.status === "Bloqueado" ||
              userData.statusLicenca === "bloqueada";

            if (bloqueado) {
              sessionStorage.setItem("app_blocked", "true");
              setIsBlocked(true);
              setUser(null);
              await signOut(auth);
            } else {
              sessionStorage.removeItem("app_blocked");
              setIsBlocked(false);
              setRole(userData.role?.toLowerCase().trim() || "usuario");
              setUser(currentUser);
            }
          }
        } catch (error) {
          console.error("Erro ao carregar perfil:", error);
        }
      } else {
        setUser(null);
        // Só limpa o bloqueio se não houver a flag persistente de bloqueio forçado
        if (!sessionStorage.getItem("app_blocked")) setIsBlocked(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener("force-block", handleBlockEvent);
    };
  }, []);

  // --- LÓGICA DE PERMISSÕES ---
  const isTiOrAdmin = useMemo(
    () => ["root", "admin", "analista", "ti"].includes(role),
    [role]
  );

  const isGestao = useMemo(
    () => ["chefia", "coordenador"].includes(role),
    [role]
  );

  const isUsuarioComum = useMemo(() => role === "usuario", [role]);

  // --- DEFINIÇÃO DE ROTA INICIAL ---
  const getHomePath = () => {
    if (isTiOrAdmin) return "/dashboard";
    if (isGestao) return "/gestao-chefia";
    return "/home";
  };

  const ProtectedRoute = ({ children, condition }) => {
    return condition ? children : <Navigate to={getHomePath()} replace />;
  };

  // Loader inicial enquanto valida segurança
  if (loading || loadingLicense) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        <p className="mt-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">
          Validando Segurança
        </p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <BrowserRouter>
        <Routes>
          {/* HIERARQUIA 1: BLOQUEIO POR STATUS (USUÁRIO/LICENÇA ESPECÍFICA) */}
          {isBlocked ? (
            <>
              <Route path="/bloqueado" element={<MensagemBloqueio />} />
              <Route path="*" element={<Navigate to="/bloqueado" replace />} />
            </>
          ) : /* HIERARQUIA 2: LICENÇA GERAL DO SISTEMA EXPIRADA */
          !isLicenseValid ? (
            <>
              <Route path="/expirado" element={<LicencaExpirada />} />
              <Route path="*" element={<Navigate to="/expirado" replace />} />
            </>
          ) : (
            /* HIERARQUIA 3: FLUXO NORMAL */
            <>
              <Route
                path="/login"
                element={
                  !user ? <Login /> : <Navigate to={getHomePath()} replace />
                }
              />

              {user ? (
                <Route element={<GuardiaoSessao />}>
                  <Route
                    path="/"
                    element={<Navigate to={getHomePath()} replace />}
                  />

                  {/* ROTAS COMUNS */}
                  <Route
                    path="/home"
                    element={
                      <ProtectedRoute condition={isUsuarioComum}>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/trocar-senha" element={<TrocarSenha />} />
                  <Route
                    path="/cadastro-chamado"
                    element={<CadastroChamado />}
                  />

                  {/* DASHBOARDS TI */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard-bi"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <DashboardBI />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/painel-analista"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <PainelAnalista />
                      </ProtectedRoute>
                    }
                  />

                  {/* SEÇÃO GESTÃO */}
                  <Route
                    path="/gestao-chefia"
                    element={
                      <ProtectedRoute condition={isGestao || role === "root"}>
                        <GestaoChefia />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<PainelGestao />} />
                    <Route path="painel-gestao" element={<PainelGestao />} />
                  </Route>

                  {/* OPERACIONAL E ADMIN */}
                  <Route
                    path="/cadastro-equipamento"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <CadastroEquipamento />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/estoque"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <Estoque />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inventario"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <Inventario />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transferencia"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <Transferencia />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/usuarios"
                    element={
                      <ProtectedRoute
                        condition={role === "admin" || role === "root"}
                      >
                        <Usuarios />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/licencas"
                    element={
                      <ProtectedRoute condition={role === "root"}>
                        <AdminLicencas />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="*"
                    element={<Navigate to={getHomePath()} replace />}
                  />
                </Route>
              ) : (
                <Route path="*" element={<Navigate to="/login" replace />} />
              )}
            </>
          )}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
