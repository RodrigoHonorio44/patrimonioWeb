import React, { useState } from "react";
import {
  ShieldCheck,
  Stethoscope,
  Lock,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { auth, db } from "../api/Firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Realiza a autenticação
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. Busca o documento na coleção 'usuarios' usando o UID
      const userDocRef = doc(db, "usuarios", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        // AJUSTE CRÍTICO: No seu banco o campo é 'role' (não cargo)
        // Convertemos para minúsculo para evitar erro de 'Analista' vs 'analista'
        const userRole = userData.role?.toLowerCase().trim();

        console.log("Role detectado:", userRole); // Debug no console do navegador

        // 3. Redirecionamento baseado no 'role'
        if (userRole === "analista" || userRole === "admin") {
          navigate("/dashboard");
        } else {
          navigate("/home");
        }
      } else {
        // Se o documento não existir, por segurança enviamos para a home
        console.warn("Documento do usuário não encontrado no Firestore.");
        navigate("/home");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("E-mail ou senha incorretos.");
      } else {
        setError("Erro ao acessar o sistema. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* LADO ESQUERDO: Visual/Marketing */}
      <div className="hidden lg:flex w-1/2 bg-blue-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

        <div className="relative z-10 text-white max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <Stethoscope size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Hospital Conde Modesto Leal
            </h2>
          </div>

          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Gestão de Patrimônio <br />
            <span className="text-blue-200">& Chamados</span>
          </h1>

          <p className="text-blue-100 text-lg leading-relaxed">
            Plataforma dedicada ao monitoramento, manutenção e controle de
            ativos hospitalares com precisão e rapidez.
          </p>
        </div>
      </div>

      {/* LADO DIREITO: Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h3 className="text-3xl font-bold text-slate-900 mb-2">
              Bem-vindo
            </h3>
            <p className="text-slate-500">
              Insira suas credenciais para gerenciar o patrimônio.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                E-mail Corporativo
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                  placeholder="nome@hospital.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Entrar no Sistema"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
