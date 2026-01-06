import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "./api/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// IMPORTANTE: Suporte para notificações (Toasts)
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

// Importando da pasta 'components'
import CadastroChamado from "./components/CadastroChamado";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

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

            // VERIFICAÇÃO CRÍTICA: Se a flag existir e for true, bloqueia o App
            setMustChangePassword(userData.requiresPasswordChange === true);
          } else {
            setRole("user");
            setMustChangePassword(false);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setRole("user");
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setRole(null);
        setMustChangePassword(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc] gap-6">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-slate-200 border-t-blue-600"></div>
          <div className="absolute h-8 w-8 bg-blue-600 rounded-lg animate-pulse"></div>
        </div>
        <div className="text-center">
          <p className="text-slate-900 font-black text-xl tracking-tight uppercase">
            PatriHosp
          </p>
          <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">
            Validando Credenciais
          </p>
        </div>
      </div>
    );

  const isStaff = ["admin", "analista", "ti", "adm"].includes(role);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <BrowserRouter>
        <Routes>
          {/* --- CASO 1: USUÁRIO PRECISA TROCAR SENHA (BLOQUEIO TOTAL) --- */}
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
              {/* --- CASO 2: FLUXO NORMAL DO SISTEMA --- */}
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

              {/* ROTAS USUÁRIO COMUM & GERAL */}
              <Route
                path="/home"
                element={user ? <Home /> : <Navigate to="/login" replace />}
              />

              <Route
                path="/trocar-senha"
                element={
                  user ? <TrocarSenha /> : <Navigate to="/login" replace />
                }
              />

              {/* FALLBACK FINAL */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
