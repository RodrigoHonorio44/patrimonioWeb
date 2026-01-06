import React, { useState, useEffect } from "react";
import { db, auth } from "../api/Firebase";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  query,
  orderBy,
  setDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import {
  FiShield,
  FiUserPlus,
  FiX,
  FiArrowLeft,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import app from "../api/Firebase";
import FormAnalista from "../components/FormAnalista";
import FormUsuario from "../components/FormUsuario";

export default function Usuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formAberto, setFormAberto] = useState(null);
  const [novoUser, setNovoUser] = useState({
    nome: "",
    email: "",
    senha: "",
    unidade: "",
    cargoH: "",
    matricula: "",
  });

  const requisitos = {
    nome: novoUser.nome.trim().split(" ").length >= 2,
    minimo: novoUser.senha.length >= 6,
  };

  useEffect(() => {
    const q = query(collection(db, "usuarios"), orderBy("email", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const lista = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setUsuarios(lista);
    });
    return () => unsubscribe();
  }, []);

  const handleCadastrar = async (e, tipo) => {
    e.preventDefault();
    setLoading(true);

    const secondaryAppName = `SecondaryAuth_${Date.now()}`;
    const secondaryApp = initializeApp(app.options, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // 1. Tenta criar no Firebase Auth
      const { user } = await createUserWithEmailAndPassword(
        secondaryAuth,
        novoUser.email.trim(),
        novoUser.senha
      );

      // 2. Tenta salvar no Firestore
      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nome: novoUser.nome,
        email: novoUser.email.toLowerCase().trim(),
        role: tipo === "analista" ? "analista" : "user",
        cargo: tipo === "analista" ? "ANALISTA" : "USUÁRIO",
        unidade: tipo === "analista" ? "TI" : novoUser.unidade,
        cargoHospitalar: tipo === "analista" ? "Técnico TI" : novoUser.cargoH,
        matricula: novoUser.matricula || "",
        status: "Ativo",
        requiresPasswordChange: true,
        createdAt: new Date(),
      });

      // 3. Finalização segura
      await signOut(secondaryAuth);

      toast.success("Usuário criado com sucesso!");

      // 4. Limpeza dos estados (Só ocorre se não houver erro acima)
      setFormAberto(null);
      setNovoUser({
        nome: "",
        email: "",
        senha: "",
        unidade: "",
        cargoH: "",
        matricula: "",
      });
    } catch (err) {
      console.error("Erro no cadastro:", err.code);

      // MENSAGENS DE ERRO TRADUZIDAS
      if (err.code === "auth/email-already-in-use") {
        toast.error("Este usuário já está cadastrado!");
      } else if (err.code === "auth/invalid-email") {
        toast.error("O e-mail digitado é inválido.");
      } else if (err.code === "auth/weak-password") {
        toast.error("A senha é muito fraca (mínimo 6 caracteres).");
      } else {
        toast.error("Erro ao cadastrar: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const removerAcesso = async (id, nome) => {
    if (window.confirm(`Excluir dados de ${nome} do Banco?`)) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        toast.success("Registro removido.");
      } catch (err) {
        toast.error("Erro ao remover registro.");
      }
    }
  };

  const alterarNivel = async (id, novoRole, novoCargoLabel) => {
    try {
      await updateDoc(doc(db, "usuarios", id), {
        role: novoRole,
        cargo: novoCargoLabel,
      });
      toast.info(`Nível alterado para ${novoCargoLabel}`);
    } catch (err) {
      toast.error("Erro ao atualizar nível.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-2 transition-colors font-bold text-sm"
            >
              <FiArrowLeft /> Voltar ao Painel
            </button>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">
              Controle de Acessos
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setFormAberto(formAberto === "analista" ? null : "analista")
              }
              className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase flex items-center gap-2 transition-all ${
                formAberto === "analista"
                  ? "bg-red-500 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {formAberto === "analista" ? <FiX /> : <FiShield />} Novo Analista
            </button>
            <button
              onClick={() =>
                setFormAberto(formAberto === "usuario" ? null : "usuario")
              }
              className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase flex items-center gap-2 transition-all ${
                formAberto === "usuario"
                  ? "bg-red-500 text-white"
                  : "bg-slate-800 text-white"
              }`}
            >
              {formAberto === "usuario" ? <FiX /> : <FiUserPlus />} Novo Usuário
            </button>
          </div>
        </div>

        {formAberto === "analista" && (
          <FormAnalista
            dados={novoUser}
            setDados={setNovoUser}
            onSubmit={handleCadastrar}
            loading={loading}
            requisitos={requisitos}
          />
        )}
        {formAberto === "usuario" && (
          <FormUsuario
            dados={novoUser}
            setDados={setNovoUser}
            onSubmit={handleCadastrar}
            loading={loading}
            requisitos={requisitos}
          />
        )}

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mt-6">
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest">
              Equipe Cadastrada ({usuarios.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <th className="p-6">Nome / Identificação</th>
                  <th className="p-6">Unidade / Departamento</th>
                  <th className="p-6">Nível</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-6">
                      <p className="font-bold text-slate-700">
                        {u.nome || "Sem Nome"}
                      </p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="p-6">
                      <p className="text-xs font-black text-slate-600 uppercase">
                        {u.unidade || "TI"}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-medium">
                        {u.cargoHospitalar || u.cargo || "Analista"}
                      </p>
                    </td>
                    <td className="p-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                          u.role === "admin" || u.role === "adm"
                            ? "bg-purple-100 text-purple-600"
                            : u.role === "analista"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-end gap-2">
                        {u.role !== "analista" &&
                          u.role !== "admin" &&
                          u.role !== "adm" && (
                            <button
                              onClick={() =>
                                alterarNivel(u.id, "analista", "ANALISTA")
                              }
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Promover"
                            >
                              <FiArrowUp size={18} />
                            </button>
                          )}
                        {u.role === "analista" && (
                          <button
                            onClick={() =>
                              alterarNivel(u.id, "user", "USUÁRIO")
                            }
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Rebaixar"
                          >
                            <FiArrowDown size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => removerAcesso(u.id, u.nome || u.email)}
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
      </div>
    </div>
  );
}
