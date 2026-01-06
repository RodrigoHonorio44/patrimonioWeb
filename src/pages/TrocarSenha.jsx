import React, { useState, useEffect } from "react";
import { auth, db } from "../api/Firebase";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import CryptoJS from "crypto-js";
import { toast } from "react-toastify";
import {
  FiLock,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiShield,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const TrocarSenha = () => {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const [verSenhaAtual, setVerSenhaAtual] = useState(false);
  const [verNovaSenha, setVerNovaSenha] = useState(false);
  const [verConfirmarSenha, setVerConfirmarSenha] = useState(false);

  const navigate = useNavigate();

  const [validacoes, setValidacoes] = useState({
    minimo: false,
    maiuscula: false,
    minuscula: false,
    especial: false,
  });

  useEffect(() => {
    setValidacoes({
      minimo: novaSenha.length >= 6,
      maiuscula: /[A-Z]/.test(novaSenha),
      minuscula: /[a-z]/.test(novaSenha),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha),
    });
  }, [novaSenha]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.values(validacoes).includes(false)) {
      return toast.error("A senha não atende aos requisitos mínimos!");
    }
    if (novaSenha !== confirmarSenha) {
      return toast.error("As senhas novas não coincidem!");
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Sessão expirada. Entre novamente.");
        navigate("/login");
        return;
      }

      const userRef = doc(db, "usuarios", user.uid);
      const credential = EmailAuthProvider.credential(user.email, senhaAtual);

      // 1. Reautentica
      await reauthenticateWithCredential(user, credential);

      // 2. Busca dados
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("Usuário não encontrado.");

      const userData = userSnap.data();
      const historico = userData.historicoSenhas || [];
      const novoHash = CryptoJS.SHA256(novaSenha).toString();

      if (historico.includes(novoHash)) {
        setLoading(false);
        return toast.error("Você já utilizou esta senha anteriormente!");
      }

      // 3. Atualiza no Auth
      await updatePassword(user, novaSenha);

      // 4. Atualiza no Firestore (MUITO IMPORTANTE: requiresPasswordChange: false)
      const novoHistorico = [...historico, novoHash].slice(-5);
      await updateDoc(userRef, {
        ultimaTrocaSenha: serverTimestamp(),
        historicoSenhas: novoHistorico,
        requiresPasswordChange: false, // Isso libera o usuário das travas de rota
      });

      toast.success("Senha atualizada com sucesso!");

      // 5. REDIRECIONAMENTO COM DELAY (Para o Firebase processar a mudança)
      setTimeout(() => {
        const role = userData.role?.toLowerCase();
        if (role === "admin" || role === "adm" || role === "analista") {
          navigate("/dashboard");
        } else {
          navigate("/home");
        }
      }, 1000); // 1 segundo de espera antes de mudar de tela
    } catch (error) {
      console.error(error);
      if (error.code === "auth/wrong-password") {
        toast.error("Senha atual incorreta!");
      } else {
        toast.error("Erro ao processar alteração.");
      }
    } finally {
      setLoading(false);
    }
  };

  const RegraItem = ({ condicao, texto }) => (
    <div
      className={`flex items-center gap-2 text-[11px] font-bold ${
        condicao ? "text-emerald-500" : "text-slate-400"
      }`}
    >
      {condicao ? <FiCheck size={14} /> : <FiX size={14} />}
      <span>{texto}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-12">
        <header className="text-center mb-10">
          <div className="inline-flex p-4 bg-blue-50 rounded-2xl text-blue-600 mb-4">
            <FiShield size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Segurança</h1>
          <p className="text-slate-500 text-sm">
            Atualize seu acesso para continuar
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SENHA ATUAL */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Senha Atual
            </label>
            <div className="relative">
              <input
                type={verSenhaAtual ? "text" : "password"}
                required
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all pr-12"
                placeholder="Senha de login atual"
              />
              <button
                type="button"
                onClick={() => setVerSenhaAtual(!verSenhaAtual)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
              >
                {verSenhaAtual ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          {/* NOVA SENHA */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={verNovaSenha ? "text" : "password"}
                required
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all pr-12"
                placeholder="Crie uma nova senha"
              />
              <button
                type="button"
                onClick={() => setVerNovaSenha(!verNovaSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
              >
                {verNovaSenha ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-y-2">
              <RegraItem condicao={validacoes.minimo} texto="6+ Caracteres" />
              <RegraItem condicao={validacoes.maiuscula} texto="1 Maiúscula" />
              <RegraItem condicao={validacoes.minuscula} texto="1 Minúscula" />
              <RegraItem condicao={validacoes.especial} texto="1 Especial" />
            </div>
          </div>

          {/* CONFIRMAR NOVA SENHA */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={verConfirmarSenha ? "text" : "password"}
                required
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all pr-12"
                placeholder="Repita a nova senha"
              />
              <button
                type="button"
                onClick={() => setVerConfirmarSenha(!verConfirmarSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
              >
                {verConfirmarSenha ? (
                  <FiEyeOff size={20} />
                ) : (
                  <FiEye size={20} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <FiRefreshCw className="animate-spin" /> : <FiLock />}
            {loading ? "SALVANDO..." : "ATUALIZAR ACESSO"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TrocarSenha;
