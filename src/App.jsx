import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "./api/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Importação das Páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard"; // Dashboard de Gestão (Cards)
import DashboardBI from "./pages/DashboardBI"; // Dashboard de Gráficos (Power BI Style)
import PainelAnalista from "./pages/PainelAnalista";
import Home from "./pages/Home";
import CadastroEquipamento from "./pages/CadastroEquipamento";
import Transferencia from "./pages/Transferencia";
import Inventario from "./pages/Inventario";
import Estoque from "./pages/Estoque";
import Usuarios from "./pages/Usuarios";

// Importando da pasta 'components'
import CadastroChamado from "./components/CadastroChamado";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userRole = docSnap.data().role?.toLowerCase().trim();
            setRole(userRole);
          } else {
            setRole("user");
          }
        } catch (error) {
          console.error("Erro ao buscar cargo:", error);
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

  // Tela de Carregamento Estilizada
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
    <BrowserRouter>
      <Routes>
        {/* --- LÓGICA DE REDIRECIONAMENTO INICIAL --- */}
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

        {/* --- ROTA PÚBLICA --- */}
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

        {/* --- ROTAS ADMINISTRATIVAS / STAFF --- */}
        {user && isStaff ? (
          <>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/indicadores" element={<DashboardBI />} />{" "}
            {/* <-- ATUALIZADO PARA O BI */}
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
        ) : (
          // Se tentar acessar rota staff sem permissão, joga para home ou login
          <Route path="/staff/*" element={<Navigate to="/" replace />} />
        )}

        {/* --- ROTAS DO USUÁRIO COMUM --- */}
        <Route
          path="/home"
          element={user ? <Home /> : <Navigate to="/login" replace />}
        />

        {/* --- FALLBACK --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
