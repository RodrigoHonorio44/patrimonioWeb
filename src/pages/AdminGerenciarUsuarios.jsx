import React, { useState, useEffect } from "react";
import { db } from "../api/Firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { FiTrash2, FiShield, FiUserPlus, FiX, FiPlus } from "react-icons/fi";

const AdminGerenciarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  // Controles de visibilidade
  const [showAnalista, setShowAnalista] = useState(false);
  const [showUsuario, setShowUsuario] = useState(false);

  // Estados dos forms
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [unidade, setUnidade] = useState("");
  const [matricula, setMatricula] = useState("");
  const [cargoH, setCargoH] = useState("");
  const [senha, setSenha] = useState("");

  useEffect(() => {
    const q = query(collection(db, "usuarios"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsuarios(docs);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e, tipo) => {
    e.preventDefault();
    setLoading(true);
    try {
      const id = email.toLowerCase().trim();
      const dados = {
        name: nome,
        email: id,
        status: "Ativo",
        createdAt: new Date(),
        requiresPasswordChange: true,
        role: tipo === "analista" ? "analista" : "user",
        cargo: tipo === "analista" ? "ANALISTA" : "USUÁRIO",
        unidade: tipo === "analista" ? "TI" : unidade,
        cargoHospitalar: tipo === "analista" ? "Técnico TI" : cargoH,
        matricula: matricula || "N/A",
      };
      await setDoc(doc(db, "usuarios", id), dados);
      toast.success("✅ Cadastrado com sucesso!");
      // Limpar campos e fechar
      setNome("");
      setEmail("");
      setUnidade("");
      setMatricula("");
      setCargoH("");
      setSenha("");
      setShowAnalista(false);
      setShowUsuario(false);
    } catch (err) {
      toast.error("Erro ao cadastrar");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* BARRA DE BOTÕES - FORÇADA NO TOPO */}
      <div className="bg-white border-b sticky top-0 z-50 p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="font-black text-slate-800 uppercase tracking-tighter">
            Gestão de Acessos
          </h1>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowAnalista(!showAnalista);
                setShowUsuario(false);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 hover:bg-blue-700 transition-all"
            >
              {showAnalista ? <FiX /> : <FiPlus />} Analista TI
            </button>

            <button
              onClick={() => {
                setShowUsuario(!showUsuario);
                setShowAnalista(false);
              }}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 hover:bg-black transition-all"
            >
              {showUsuario ? <FiX /> : <FiPlus />} Usuário Unidade
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 mt-6">
        {/* FORMULÁRIO ANALISTA */}
        {showAnalista && (
          <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-200 mb-6 shadow-lg">
            <h2 className="font-black text-blue-700 mb-4 uppercase text-sm italic">
              Novo Analista de TI
            </h2>
            <form
              onSubmit={(e) => handleSubmit(e, "analista")}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <input
                type="text"
                placeholder="Nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="p-3 rounded-xl border-none outline-none focus:ring-2 ring-blue-400"
                required
              />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-3 rounded-xl border-none outline-none focus:ring-2 ring-blue-400"
                required
              />
              <input
                type="text"
                placeholder="Senha Provisória"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="p-3 rounded-xl border-none outline-none focus:ring-2 ring-blue-400"
                required
              />
              <button className="md:col-span-3 bg-blue-600 text-white font-bold py-3 rounded-xl">
                CADASTRAR ANALISTA
              </button>
            </form>
          </div>
        )}

        {/* FORMULÁRIO USUÁRIO */}
        {showUsuario && (
          <div className="bg-slate-800 p-6 rounded-2xl mb-6 shadow-lg text-white">
            <h2 className="font-black text-white/50 mb-4 uppercase text-sm italic">
              Novo Usuário Unidade (Hospitalar)
            </h2>
            <form
              onSubmit={(e) => handleSubmit(e, "usuario")}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-slate-900"
            >
              <input
                type="text"
                placeholder="Nome Completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="p-3 rounded-xl"
                required
              />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-3 rounded-xl"
                required
              />
              <input
                type="text"
                placeholder="Matrícula"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="p-3 rounded-xl"
                required
              />

              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="p-3 rounded-xl"
                required
              >
                <option value="">Selecione Unidade...</option>
                <option value="Hospital Conde">Hospital Conde</option>
                <option value="Upa Inoão">Upa Inoão</option>
                <option value="Upa Santa Rita">Upa Santa Rita</option>
                <option value="Samu Barroco">Samu Barroco</option>
                <option value="Samu Centro">Samu Centro</option>
                <option value="Samu Ponta Negra">Samu Ponta Negra</option>
              </select>

              <select
                value={cargoH}
                onChange={(e) => setCargoH(e.target.value)}
                className="p-3 rounded-xl"
                required
              >
                <option value="">Selecione Cargo...</option>
                <option value="Enfermeira">Enfermeira</option>
                <option value="Tecnico de Enfermagem">
                  Técnico de Enfermagem
                </option>
                <option value="Chefia">Chefia</option>
                <option value="Supervisão">Supervisão</option>
                <option value="Recepcionista">Recepcionista</option>
                <option value="Administrativo">Administrativo</option>
              </select>

              <input
                type="text"
                placeholder="Senha Provisória"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="p-3 rounded-xl"
                required
              />
              <button className="lg:col-span-3 bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-400">
                CADASTRAR FUNCIONÁRIO
              </button>
            </form>
          </div>
        )}

        {/* TABELA */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr className="text-[10px] font-black text-slate-400 uppercase">
                <th className="p-4">Colaborador</th>
                <th className="p-4">Unidade</th>
                <th className="p-4 text-center">Nível</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <p className="font-bold text-slate-700 text-sm">{u.name}</p>
                    <p className="text-[10px] text-slate-400">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-xs font-bold text-slate-600 uppercase">
                      {u.unidade}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {u.cargoHospitalar}
                    </p>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                        u.role === "analista"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.cargo}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        if (window.confirm("Remover acesso?"))
                          deleteDoc(doc(db, "usuarios", u.id));
                      }}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminGerenciarUsuarios;
