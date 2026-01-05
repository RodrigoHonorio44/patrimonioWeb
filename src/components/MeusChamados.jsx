import React, { useEffect, useState } from "react";
import { db, auth } from "../api/Firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  FiEye,
  FiX,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiTool,
  FiAlertCircle,
} from "react-icons/fi";

const MeusChamados = ({ abrirFormulario }) => {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const user = auth.currentUser;

  // Função para calcular o tempo de SLA (parado ou correndo)
  const calcularSLA = (criadoEm, finalizadoEm) => {
    if (!criadoEm) return "---";
    const inicio = criadoEm.toDate();
    const fim = finalizadoEm ? finalizadoEm.toDate() : new Date();

    const diffInMs = Math.abs(fim - inicio);
    const horas = Math.floor(diffInMs / (1000 * 60 * 60));
    const minutos = Math.floor((diffInMs / (1000 * 60)) % 60);

    return `${horas}h ${minutos}m`;
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "chamados"),
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const lista = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      lista.sort(
        (a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0)
      );
      setChamados(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading)
    return (
      <div className="p-10 text-center text-slate-400 font-bold italic animate-pulse">
        Carregando chamados...
      </div>
    );

  return (
    <div className="w-full max-w-[1600px] mx-auto mt-12 px-4 md:px-10 mb-20">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
            Meus Chamados
          </h1>
          <p className="text-slate-400 text-sm font-medium italic">
            Histórico de solicitações
          </p>
        </div>

        <button
          onClick={abrirFormulario}
          className="group relative px-7 py-3.5 bg-blue-600 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-2xl overflow-hidden transition-all hover:shadow-[0_15px_35px_rgba(37,99,235,0.4)] hover:-translate-y-1 active:scale-95 shadow-xl shadow-blue-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative flex items-center gap-2">
            <FiPlus className="text-lg" /> Abrir Novo Chamado
          </span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Nº OS
                </th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Solicitante
                </th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Unidade / Setor
                </th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Status
                </th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Data / Hora
                </th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {chamados.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/20 transition-all group"
                >
                  <td className="px-8 py-6 font-bold text-blue-600 text-sm italic">
                    #{item.numeroOs}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm group-hover:text-blue-700 transition-colors">
                        {item.nome}
                      </span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md w-fit font-black mt-1 uppercase tracking-wider">
                        {item.cargo || "Funcionário"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">
                        {item.unidade}
                      </span>
                      <span className="text-[10px] text-blue-500 font-bold uppercase italic tracking-tight">
                        {item.setor || "Não Informado"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span
                      className={`text-[10px] font-black px-4 py-2 rounded-xl border uppercase tracking-tighter ${
                        item.status?.toLowerCase() === "aberto"
                          ? "bg-green-50 text-green-700 border-green-100"
                          : item.status?.toLowerCase() === "pendente"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-slate-50 text-slate-400 border-slate-100"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-500">
                        {item.criadoEm?.toDate().toLocaleDateString("pt-BR")}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase">
                        <FiClock size={10} className="text-blue-400" />
                        {item.criadoEm?.toDate().toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button
                      onClick={() => {
                        setChamadoSelecionado(item);
                        setModalAberto(true);
                      }}
                      className="p-3.5 text-blue-500 bg-blue-50 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <FiEye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALHES */}
      {modalAberto && chamadoSelecionado && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setModalAberto(false)}
          ></div>
          <div className="bg-white w-full max-w-[550px] rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 md:p-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-800 italic">
                  Chamado #{chamadoSelecionado.numeroOs}
                </h2>
                <button
                  onClick={() => setModalAberto(false)}
                  className="p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* STATUS FINALIZADO */}
                {chamadoSelecionado.status?.toLowerCase() === "fechado" && (
                  <div className="bg-green-50 border-l-[6px] border-green-500 p-6 rounded-r-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-green-700 font-black text-[11px] uppercase tracking-widest mb-3">
                      <FiCheckCircle size={20} /> SLA FINALIZADO
                    </div>
                    <p className="text-green-800 text-[15px] font-bold leading-tight mb-4 italic">
                      {chamadoSelecionado.feedbackAnalista ||
                        "Incidente resolvido com sucesso."}
                    </p>
                    <div className="text-green-700 text-[10px] font-black border-t border-green-200 pt-3 uppercase">
                      TEMPO TOTAL DE ATENDIMENTO:{" "}
                      {calcularSLA(
                        chamadoSelecionado.criadoEm,
                        chamadoSelecionado.finalizadoEm
                      )}
                    </div>
                  </div>
                )}

                {/* MOTIVO DA PAUSA (APARECE SE STATUS FOR PENDENTE) */}
                {(chamadoSelecionado.status?.toLowerCase() === "pendente" ||
                  chamadoSelecionado.status?.toLowerCase() === "pausado") && (
                  <div className="bg-amber-50 border-l-[6px] border-amber-500 p-6 rounded-r-2xl shadow-sm animate-pulse">
                    <div className="flex items-center gap-2 text-amber-700 font-black text-[11px] uppercase tracking-widest mb-2">
                      <FiAlertCircle size={18} /> SLA PAUSADO
                    </div>
                    <p className="text-amber-900 text-[14px] font-bold italic leading-tight">
                      Motivo:{" "}
                      {chamadoSelecionado.motivoPausa ||
                        "Aguardando informações ou peça técnica."}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Detail
                    label="STATUS"
                    value={chamadoSelecionado.status?.toUpperCase()}
                  />
                  <Detail
                    label="TEMPO DE SLA"
                    value={calcularSLA(
                      chamadoSelecionado.criadoEm,
                      chamadoSelecionado.finalizadoEm
                    )}
                  />
                  <Detail
                    label="SETOR"
                    value={chamadoSelecionado.setor?.toUpperCase()}
                  />
                  <Detail
                    label="EQUIPAMENTO"
                    value={chamadoSelecionado.equipamento}
                  />
                  <Detail
                    label="UNIDADE"
                    value={chamadoSelecionado.unidade}
                    className="col-span-2"
                  />
                </div>

                {/* SEÇÃO: AÇÕES DO TÉCNICO */}
                <div className="bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100">
                  <p className="text-blue-500 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FiTool size={14} /> Diagnóstico / Ações Técnicas:
                  </p>
                  <p className="text-slate-700 text-sm font-semibold italic leading-relaxed">
                    {chamadoSelecionado.acoesTecnico ||
                      "Aguardando o técnico descrever as ações realizadas..."}
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">
                    Descrição do Usuário:
                  </p>
                  <p className="text-slate-600 text-sm font-semibold italic leading-relaxed">
                    "{chamadoSelecionado.descricao}"
                  </p>
                </div>

                <button
                  onClick={() => setModalAberto(false)}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all text-xs uppercase tracking-[0.2em]"
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Detail = ({ label, value, className = "" }) => (
  <div className={`flex flex-col border-b border-slate-100 pb-2 ${className}`}>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
      {label}
    </span>
    <span className="text-[14px] font-bold text-slate-700">
      {value || "---"}
    </span>
  </div>
);

export default MeusChamados;
