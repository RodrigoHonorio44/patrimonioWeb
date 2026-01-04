import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "./api/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Iniciamos o loading sempre que houver mudança de estado
      setLoading(true);

      if (currentUser) {
        try {
          // Busca o cargo na coleção correta "usuarios"
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userRole = docSnap.data().role?.toLowerCase().trim();
            setRole(userRole);
            console.log("Sistema: Role identificado como:", userRole);
          } else {
            console.warn(
              "Sistema: Documento não encontrado, definindo como 'user'"
            );
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

      // SÓ DESLIGA O LOADING AQUI, após todas as consultas terminarem
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

  // Verificação de equipe técnica (Staff)
  const isStaff = role === "admin" || role === "analista" || role === "ti";

  return (
    <BrowserRouter>
      <Routes>
        {/* Se já estiver logado e for Staff, não deixa voltar pro login, manda pro Dash */}
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

        {/* ROTA RAIZ (Decisor Automático) */}
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

        {/* Dashboard Protegido */}
        <Route
          path="/dashboard"
          element={
            user && isStaff ? <Dashboard /> : <Navigate to="/" replace />
          }
        />

        {/* Home do Usuário */}
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
