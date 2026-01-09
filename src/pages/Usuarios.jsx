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
  Timestamp,
} from "firebase/firestore";
import {
  FiShield,
  FiUserPlus,
  FiX,
  FiArrowLeft,
  FiTrash2,
  FiArrowUp,
  FiArrowRight,
  FiRefreshCw,
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
    prazoLicenca: "30",
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
      const diasParaAdicionar = parseInt(novoUser.prazoLicenca || "30");
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + diasParaAdicionar);

      const { user } = await createUserWithEmailAndPassword(
        secondaryAuth,
        novoUser.email.trim(),
        novoUser.senha
      );

      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nome: novoUser.nome,
        email: novoUser.email.toLowerCase().trim(),
        role: tipo === "analista" ? "analista" : "user",
        cargo: tipo === "analista" ? "ANALISTA" : "USUÁRIO",
        unidade: tipo === "analista" ? "TI" : novoUser.unidade,
        cargoHospitalar: tipo === "analista" ? "Técnico TI" : novoUser.cargoH,
        matricula: novoUser.matricula || "",
        statusLicenca: "ativa",
        validadeLicenca: Timestamp.fromDate(dataVencimento),
        status: "Ativo",
        requiresPasswordChange: true,
        createdAt: Timestamp.now(),
      });

      await signOut(secondaryAuth);
      toast.success(
        `Usuário criado! Acesso até ${dataVencimento.toLocaleDateString()}`
      );
      setFormAberto(null);
      setNovoUser({
        nome: "",
        email: "",
        senha: "",
        unidade: "",
        cargoH: "",
        matricula: "",
        prazoLicenca: "30",
      });
    } catch (err) {
      toast.error("Erro ao cadastrar: " + err.message);
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

  // FUNÇÃO DE ALTERAÇÃO DE NÍVEL COM O CICLO SOLICITADO
  const alterarNivel = async (id, novoRole) => {
    try {
      const cargoLabel =
        novoRole === "analista"
          ? "ANALISTA"
          : novoRole === "gestor"
          ? "GESTOR"
          : "USUÁRIO";

      await updateDoc(doc(db, "usuarios", id), {
        role: novoRole,
        cargo: cargoLabel,
      });
      toast.info(`Nível alterado para ${cargoLabel}`);
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
              className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-2 transition-colors font-bold text-sm cursor-pointer"
            >
              <FiArrowLeft /> Voltar ao Painel
            </button>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800 italic">
              Rodhon<span className="text-blue-600 font-black">System</span>{" "}
              <span className="text-slate-400">| Acessos</span>
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setFormAberto(formAberto === "analista" ? null : "analista")
              }
              className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                formAberto === "analista"
                  ? "bg-red-500 text-white shadow-red-100"
                  : "bg-blue-600 text-white shadow-blue-100"
              }`}
            >
              {formAberto === "analista" ? <FiX /> : <FiShield />} Novo Analista
            </button>
            <button
              onClick={() =>
                setFormAberto(formAberto === "usuario" ? null : "usuario")
              }
              className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                formAberto === "usuario"
                  ? "bg-red-500 text-white shadow-red-100"
                  : "bg-slate-800 text-white shadow-slate-200"
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
          <div className="p-6 border-b border-slate-50 flex justify-between items-center text-xs font-black uppercase text-slate-400 tracking-widest">
            Equipe Cadastrada ({usuarios.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <th className="p-6">Nome / Identificação</th>
                  <th className="p-6">Validade Licença</th>
                  <th className="p-6">Nível</th>
                  <th className="p-6 text-right px-10">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((u) => {
                  const r = (u.role || "user").toLowerCase().trim();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-6">
                        <p className="font-bold text-slate-700">
                          {u.nome || "Sem Nome"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {u.email}
                        </p>
                      </td>
                      <td className="p-6 text-xs font-black uppercase">
                        <p
                          className={
                            u.statusLicenca === "bloqueada"
                              ? "text-red-500"
                              : "text-slate-600"
                          }
                        >
                          {u.validadeLicenca
                            ? u.validadeLicenca.toDate().toLocaleDateString()
                            : "Sem Prazo"}
                        </p>
                      </td>
                      <td className="p-6">
                        <span
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                            r === "admin"
                              ? "bg-purple-100 text-purple-600"
                              : r === "analista"
                              ? "bg-blue-100 text-blue-600"
                              : r === "gestor"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {r}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-end gap-3 items-center">
                          {/* BOTÃO DE MUDANÇA DE NÍVEL (ADMIN NÃO SE MUDA) */}
                          {r !== "admin" && (
                            <>
                              {r === "analista" ? (
                                <button
                                  onClick={() => alterarNivel(u.id, "gestor")}
                                  className="p-2.5 bg-orange-500 text-white rounded-xl hover:scale-110 shadow-lg shadow-orange-100 transition-all cursor-pointer"
                                  title="Promover a Gestor"
                                >
                                  <FiArrowRight size={18} strokeWidth={3} />
                                </button>
                              ) : r === "gestor" ? (
                                <button
                                  onClick={() => alterarNivel(u.id, "user")}
                                  className="p-2.5 bg-blue-500 text-white rounded-xl hover:scale-110 shadow-lg shadow-blue-100 transition-all cursor-pointer"
                                  title="Resetar para Usuário"
                                >
                                  <FiRefreshCw size={18} strokeWidth={3} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => alterarNivel(u.id, "analista")}
                                  className="p-2.5 bg-emerald-500 text-white rounded-xl hover:scale-110 shadow-lg shadow-emerald-100 transition-all cursor-pointer"
                                  title="Promover a Analista"
                                >
                                  <FiArrowUp size={18} strokeWidth={3} />
                                </button>
                              )}
                            </>
                          )}

                          <button
                            onClick={() =>
                              removerAcesso(u.id, u.nome || u.email)
                            }
                            className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
