import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "./api/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Importação das Páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PainelAnalista from "./pages/PainelAnalista";
import Home from "./pages/Home";
import CadastroEquipamento from "./pages/CadastroEquipamento";

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

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-r-4"></div>
        <p className="text-blue-600 font-bold animate-pulse">
          Autenticando acesso...
        </p>
      </div>
    );

  const isStaff =
    role === "admin" || role === "analista" || role === "ti" || role === "adm";

  return (
    <BrowserRouter>
      <Routes>
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

        {/* --- ROTAS STAFF --- */}
        <Route
          path="/dashboard"
          element={
            user && isStaff ? <Dashboard /> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/operacional"
          element={
            user && isStaff ? <PainelAnalista /> : <Navigate to="/" replace />
          }
        />

        {/* --- ROTA ATUALIZADA: PASSANDO PROPS PARA O COMPONENTE --- */}
        <Route
          path="/cadastrar-chamado"
          element={
            user && isStaff ? (
              <CadastroChamado
                isOpen={true}
                onClose={() => window.history.back()}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/cadastrar-patrimonio"
          element={
            user && isStaff ? (
              <CadastroEquipamento />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* --- ROTAS ADICIONAIS --- */}
        <Route
          path="/indicadores"
          element={user && isStaff ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/transferencia"
          element={user && isStaff ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/inventario"
          element={user && isStaff ? <Dashboard /> : <Navigate to="/" />}
        />

        <Route
          path="/home"
          element={user ? <Home /> : <Navigate to="/login" replace />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
