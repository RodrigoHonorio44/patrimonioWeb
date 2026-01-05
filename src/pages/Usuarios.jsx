import React, { useState, useEffect } from "react";
import { db, auth } from "../api/Firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  FiUserPlus,
  FiTrash2,
  FiMail,
  FiShield,
  FiSearch,
  FiX,
  FiCheck,
  FiAlertTriangle,
  FiArrowLeft,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function Usuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  // Estados para Modal de Cadastro
  const [modalOpen, setModalOpen] = useState(false);
  const [novoUser, setNovoUser] = useState({ nome: "", email: "", senha: "" });

  // Requisitos de Senha
  const requisitos = {
    nome: novoUser.nome.trim().split(" ").length >= 2,
    minimo: novoUser.senha.length >= 6,
    maiuscula: /[A-Z]/.test(novoUser.senha),
    especial: /[!@#$%^&*(),.?":{}|<>]/.test(novoUser.senha),
  };
  const podeCadastrar =
    Object.values(requisitos).every(Boolean) && novoUser.email.includes("@");

  // Escuta os usuários em tempo real
  useEffect(() => {
    const q = query(collection(db, "usuarios"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsuarios(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCadastrar = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        novoUser.email,
        novoUser.senha
      );
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        name: novoUser.nome,
        email: novoUser.email,
        role: "analista",
        createdAt: new Date(),
      });

      toast.success("Analista cadastrado com sucesso!");
      setModalOpen(false);
      setNovoUser({ nome: "", email: "", senha: "" });
    } catch (error) {
      toast.error("Erro ao cadastrar: " + error.message);
    }
  };

  const handleResetSenha = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Link de reset enviado para ${email}`);
    } catch (error) {
      toast.error("Erro ao enviar e-mail de reset.");
    }
  };

  const toggleRole = async (userId, currentRole) => {
    const novoCargo = currentRole === "analista" ? "user" : "analista";
    try {
      await updateDoc(doc(db, "usuarios", userId), { role: novoCargo });
      toast.info(`Cargo atualizado para ${novoCargo}`);
    } catch (error) {
      toast.error("Erro ao atualizar cargo.");
    }
  };

  const handleExcluir = async (id, nome) => {
    if (window.confirm(`Remover permanentemente o acesso de ${nome}?`)) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        toast.success("Usuário removido.");
      } catch (error) {
        toast.error("Erro ao remover.");
      }
    }
  };

  const filtrados = usuarios.filter(
    (u) =>
      u.name?.toLowerCase().includes(busca.toLowerCase()) ||
      u.email?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <FiArrowLeft /> Voltar ao Painel
          </button>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FiShield className="text-blue-600" /> Controle de Acessos
          </h1>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all"
        >
          <FiUserPlus /> Novo Analista
        </button>
      </div>

      {/* Busca e Tabela */}
      <div className="max-w-6xl mx-auto bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Nível de Acesso</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {u.name}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {u.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        u.role === "analista" || u.role === "adm"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.role || "usuário"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleResetSenha(u.email)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Enviar Reset de Senha"
                      >
                        <FiMail size={18} />
                      </button>
                      <button
                        onClick={() => toggleRole(u.id, u.role)}
                        className={`p-2 rounded-lg transition-colors ${
                          u.role === "analista"
                            ? "text-red-600 hover:bg-red-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={
                          u.role === "analista"
                            ? "Remover cargo de Analista"
                            : "Tornar Analista"
                        }
                      >
                        <FiShield size={18} />
                      </button>
                      <button
                        onClick={() => handleExcluir(u.id, u.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir Usuário"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                Novo Analista
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleCadastrar} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                  Nome Completo
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={novoUser.nome}
                  onChange={(e) =>
                    setNovoUser({ ...novoUser, nome: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                  E-mail
                </label>
                <input
                  required
                  type="email"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={novoUser.email}
                  onChange={(e) =>
                    setNovoUser({ ...novoUser, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">
                  Senha Provisória
                </label>
                <input
                  required
                  type="password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={novoUser.senha}
                  onChange={(e) =>
                    setNovoUser({ ...novoUser, senha: e.target.value })
                  }
                />
              </div>

              {/* Password Checker */}
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Requisitos de Segurança
                </p>
                <div
                  className={`flex items-center gap-2 text-xs ${
                    requisitos.nome ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {requisitos.nome ? <FiCheck /> : <FiX />} Nome e sobrenome
                </div>
                <div
                  className={`flex items-center gap-2 text-xs ${
                    requisitos.minimo ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {requisitos.minimo ? <FiCheck /> : <FiX />} Mínimo 6
                  caracteres
                </div>
                <div
                  className={`flex items-center gap-2 text-xs ${
                    requisitos.maiuscula ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {requisitos.maiuscula ? <FiCheck /> : <FiX />} Uma letra
                  maiúscula
                </div>
              </div>

              <button
                type="submit"
                disabled={!podeCadastrar}
                className="w-full py-4 bg-blue-600 disabled:bg-slate-300 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all mt-4"
              >
                Criar Acesso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
