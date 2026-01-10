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
  FiArrowDown,
  FiChevronLeft,
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
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsuarios(lista);
    });
    return () => unsubscribe();
  }, []);

  // --- FUNÇÃO DE PROMOÇÃO ATUALIZADA (SETA PRETA = ADMIN) ---
  const alterarNivel = async (id, novoRole) => {
    try {
      const mapeamento = {
        admin: "ADMINISTRADOR", // Alterado de ADMIN ROOT para ADMINISTRADOR
        analista: "ANALISTA",
        chefia: "CHEFIA",
        coordenador: "COORDENADOR",
        usuario: "USUÁRIO",
      };

      const cargoNome = mapeamento[novoRole];

      if (!cargoNome) {
        toast.error("Nível de acesso inválido.");
        return;
      }

      await updateDoc(doc(db, "usuarios", id), {
        role: novoRole, // aqui gravará 'admin' no banco
        cargo: cargoNome,
      });

      toast.success(`Usuário promovido para ${cargoNome}`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar nível. Verifique suas permissões.");
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
        role: tipo === "analista" ? "analista" : "usuario",
        cargo: tipo === "analista" ? "ANALISTA" : "USUÁRIO",
        unidade: tipo === "analista" ? "TI" : novoUser.unidade,
        statusLicenca: "ativa",
        validadeLicenca: Timestamp.fromDate(dataVencimento),
        status: "Ativo",
        requiresPasswordChange: true,
        createdAt: Timestamp.now(),
      });

      await signOut(secondaryAuth);
      toast.success(`Usuário criado com sucesso!`);
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans antialiased text-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-4 transition-all font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />{" "}
              Voltar ao Painel
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">
              Gestão de <span className="text-blue-600">Acessos</span>
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                setFormAberto(formAberto === "analista" ? null : "analista")
              }
              className={`px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-xl ${
                formAberto === "analista"
                  ? "bg-red-500 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {formAberto === "analista" ? (
                <FiX size={18} />
              ) : (
                <FiShield size={18} />
              )}{" "}
              Novo Analista
            </button>
            <button
              onClick={() =>
                setFormAberto(formAberto === "usuario" ? null : "usuario")
              }
              className={`px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-xl ${
                formAberto === "usuario"
                  ? "bg-red-50 text-red-500"
                  : "bg-slate-900 text-white"
              }`}
            >
              {formAberto === "usuario" ? (
                <FiX size={18} />
              ) : (
                <FiUserPlus size={18} />
              )}{" "}
              Novo Usuário
            </button>
          </div>
        </div>

        {formAberto && (
          <div className="mb-10 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            {formAberto === "analista" ? (
              <FormAnalista
                dados={novoUser}
                setDados={setNovoUser}
                onSubmit={(e) => handleCadastrar(e, "analista")}
                loading={loading}
                requisitos={requisitos}
              />
            ) : (
              <FormUsuario
                dados={novoUser}
                setDados={setNovoUser}
                onSubmit={(e) => handleCadastrar(e, "usuario")}
                loading={loading}
                requisitos={requisitos}
              />
            )}
          </div>
        )}

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="p-8">Membro / Email</th>
                  <th className="p-8">Cargo Atual</th>
                  <th className="p-8 text-right">Controle de Hierarquia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usuarios.map((u) => {
                  const r = (u.role || "usuario").toLowerCase().trim();
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/30 transition-colors group"
                    >
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {u.nome?.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 uppercase italic text-sm">
                              {u.nome || "Sem Nome"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-tight">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-8">
                        <span
                          className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                            r === "admin"
                              ? "bg-slate-900 text-white"
                              : r === "analista"
                              ? "bg-emerald-100 text-emerald-600"
                              : r === "chefia"
                              ? "bg-blue-100 text-blue-600"
                              : r === "coordenador"
                              ? "bg-orange-100 text-orange-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {u.cargo || r}
                        </span>
                      </td>
                      <td className="p-8">
                        <div className="flex justify-end gap-2 items-center">
                          <LevelButton
                            icon={FiArrowUp}
                            color="bg-black"
                            label="ADMIN"
                            onClick={() => alterarNivel(u.id, "admin")}
                          />
                          <LevelButton
                            icon={FiArrowUp}
                            color="bg-emerald-500"
                            label="ANALISTA"
                            onClick={() => alterarNivel(u.id, "analista")}
                          />
                          <LevelButton
                            icon={FiArrowRight}
                            color="bg-blue-500"
                            label="CHEFIA"
                            onClick={() => alterarNivel(u.id, "chefia")}
                          />
                          <LevelButton
                            icon={FiChevronLeft}
                            color="bg-orange-500"
                            label="COORD"
                            onClick={() => alterarNivel(u.id, "coordenador")}
                          />
                          <LevelButton
                            icon={FiArrowDown}
                            color="bg-red-500"
                            label="USER"
                            onClick={() => alterarNivel(u.id, "usuario")}
                          />
                          <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>
                          <button
                            onClick={() =>
                              removerAcesso(u.id, u.nome || u.email)
                            }
                            className="p-3 text-slate-300 hover:text-red-600 transition-all cursor-pointer"
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

function LevelButton({ icon: Icon, color, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`p-2.5 ${color} text-white rounded-xl hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-sm flex flex-col items-center group relative`}
      title={`Promover para ${label}`}
    >
      <Icon size={14} strokeWidth={4} />
    </button>
  );
}
