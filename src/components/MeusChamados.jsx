import React, { useEffect, useState } from "react";
import { db, auth } from "../api/Firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  FiEye,
  FiPlus,
  FiClock,
  FiRefreshCw,
  FiArrowRight,
} from "react-icons/fi";
import ModalDetalhes from "./ModalDetalhes";

const MeusChamados = ({ abrirFormulario, abrirRemanejamento }) => {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const user = auth.currentUser;

  const calcularSLA = (criadoEm, finalizadoEm) => {
    if (!criadoEm) return "---";
    const inicio = criadoEm.toDate();
    const fim = finalizadoEm ? finalizadoEm.toDate() : new Date();
    const diffInMs = Math.abs(fim - inicio);
    const horas = Math.floor(diffInMs / (1000 * 60 * 60));
    const minutos = Math.floor((diffInMs / (1000 * 60)) % 60);
    return `${horas}h ${minutos}m`;
  };

  const renderDataHora = (timestamp) => {
    if (!timestamp)
      return (
        <span className="text-slate-300 italic text-[10px]">Pendente</span>
      );
    const data = timestamp.toDate();
    return (
      <div className="flex flex-col items-center">
        <span className="text-sm font-bold text-slate-600">
          {data.toLocaleDateString("pt-BR")}
        </span>
        <span className="text-[10px] font-black text-slate-400 flex items-center gap-1">
          <FiClock size={10} className="text-slate-300" />
          {data.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    );
  };

  useEffect(() => {
    if (!user) return;
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
      <div className="p-10 text-center text-slate-400 font-bold animate-pulse">
        Carregando chamados...
      </div>
    );

  return (
    <div className="w-full max-w-[1600px] mx-auto mt-12 px-4 md:px-10 mb-20 text-left">
      <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">
            Meus Chamados
          </h1>
          <p className="text-slate-400 text-sm italic">
            Histórico de solicitações e remanejamentos
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={abrirRemanejamento}
            className="px-6 py-3.5 bg-amber-500 text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-100 hover:scale-105 transition-all flex items-center gap-2"
          >
            <FiRefreshCw size={16} /> Remanejamento
          </button>
          <button
            onClick={abrirFormulario}
            className="px-6 py-3.5 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-100 hover:scale-105 transition-all flex items-center gap-2"
          >
            <FiPlus size={18} /> Nova Manutenção
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase">
                  Nº OS / Analista
                </th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase">
                  Unidade / Local
                </th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase">
                  Problema / Solicitação
                </th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase text-center">
                  Status
                </th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase text-center">
                  Abertura
                </th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase text-center">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {chamados.map((item) => {
                const statusClean = item.status?.toLowerCase().trim();
                const isRemanejamento = item.tipo
                  ?.toLowerCase()
                  .includes("remanejamento");

                let estiloStatus =
                  "bg-green-50 text-green-600 border-green-200";
                if (statusClean === "em atendimento")
                  estiloStatus = "bg-blue-50 text-blue-600 border-blue-200";
                if (statusClean === "pendente" || statusClean === "pausado")
                  estiloStatus =
                    "bg-orange-50 text-orange-600 border-orange-200";
                if (statusClean === "fechado" || statusClean === "arquivado")
                  estiloStatus = "bg-red-50 text-red-600 border-red-200";

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-all group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span
                          className={`font-bold text-sm ${
                            isRemanejamento
                              ? "text-orange-500"
                              : "text-blue-600"
                          }`}
                        >
                          #{item.numeroOs}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500 italic mt-1">
                          {item.tecnicoResponsavel || "AGUARDANDO ANALISTA"}
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-sm">
                          {item.unidade}
                        </span>
                        <span className="text-[10px] font-bold uppercase italic flex items-center gap-1">
                          {isRemanejamento ? (
                            <>
                              <span className="text-red-400">
                                {item.setorOrigem || item.localOrigem}
                              </span>
                              <FiArrowRight
                                size={10}
                                className="text-slate-300"
                              />
                              <span className="text-green-500">
                                {item.setorDestino || item.localDestino}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400">
                              {item.local || item.setor || "Sem local"}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* COLUNA PROBLEMA / SOLICITAÇÃO (DADOS DO FIREBASE) */}
                    <td className="px-8 py-6 max-w-[280px]">
                      <p className="text-xs text-slate-500 truncate italic font-medium">
                        {isRemanejamento
                          ? item.tipo || "Solicitação de Remanejamento"
                          : item.descricao || "Descrição não informada"}
                      </p>
                    </td>

                    <td className="px-8 py-6 text-center">
                      <span
                        className={`text-[10px] font-black px-4 py-2 rounded-xl border uppercase inline-block w-32 shadow-sm ${estiloStatus}`}
                      >
                        {item.status || "Aberto"}
                      </span>
                    </td>

                    <td className="px-8 py-6 text-center">
                      {renderDataHora(item.criadoEm)}
                    </td>

                    <td className="px-8 py-6 text-center">
                      <button
                        onClick={() => {
                          setChamadoSelecionado(item);
                          setModalAberto(true);
                        }}
                        className="p-3 text-slate-400 bg-slate-50 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <FiEye size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <ModalDetalhes
          chamado={chamadoSelecionado}
          aoFechar={() => setModalAberto(false)}
          calcularSLA={calcularSLA}
        />
      )}
    </div>
  );
};

export default MeusChamados;
