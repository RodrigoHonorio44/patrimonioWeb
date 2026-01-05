import React, { useEffect, useState, useCallback, useMemo } from "react";
import { db, auth } from "../api/Firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  getDoc,
  deleteField,
  getDocs,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  FiPauseCircle,
  FiCheck,
  FiArrowLeftCircle,
  FiRotateCcw,
  FiPlayCircle,
  FiEye,
  FiX,
  FiPrinter,
  FiSearch,
  FiDownload, // Ícone da setinha
  FiAlertCircle,
} from "react-icons/fi";

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyGgcYmM7oXjpx0li898F2RCy5M4a6os5Ti9s9t5J6h9BbgO0W8PpOfrQ3TxqIOCNNVpg/exec";

const PainelAnalista = () => {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [filtroOs, setFiltroOs] = useState("");
  const [enviandoSheets, setEnviandoSheets] = useState(false);

  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);
  const [mostrarModalPausar, setMostrarModalPausar] = useState(false);
  const [mostrarModalVer, setMostrarModalVer] = useState(false);

  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [parecerTecnico, setParecerTecnico] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [motivoPausa, setMotivoPausa] = useState("");

  const user = auth.currentUser;

  const analistaNome = useMemo(() => {
    return (
      userData?.nome ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "Analista"
    );
  }, [userData, user]);

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());
      } catch (error) {
        console.error(error);
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, "chamados"), orderBy("criadoEm", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const lista = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status?.toLowerCase().trim();
        if (status !== "arquivado") {
          lista.push({ id: doc.id, ...data });
        }
      });

      const prioridadeOrdem = { urgente: 1, alta: 2, normal: 3, baixa: 4 };
      const listaOrdenada = lista.sort((a, b) => {
        const pA = prioridadeOrdem[a.prioridade?.toLowerCase()] || 3;
        const pB = prioridadeOrdem[b.prioridade?.toLowerCase()] || 3;
        if (pA !== pB) return pA - pB;
        return a.criadoEm - b.criadoEm;
      });

      setChamados(listaOrdenada);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleEnviarParaSheets = async (item) => {
    if (enviandoSheets) return;
    setEnviandoSheets(true);
    const toastId = toast.info("Integrando com Planilha Master...", {
      autoClose: false,
    });

    const payload = {
      tipo: "CHAMADOS_POWERBI",
      dados: [
        {
          OS: item.numeroOs || "N/A",
          Data: item.criadoEm?.toDate().toLocaleString("pt-BR") || "",
          Solicitante: item.nome || "N/A",
          Unidade: item.unidade || "N/A",
          Setor: item.setor || "N/A",
          Status: "FECHADO",
          Descricao: item.descricao || "N/A",
          Patrimonio: item.patrimonio || "",
          Parecer_Tecnico: item.feedbackAnalista || "",
          Finalizado_Por: item.tecnicoResponsavel || "",
          Finalizado_Em:
            item.finalizadoEm?.toDate().toLocaleString("pt-BR") ||
            new Date().toLocaleString("pt-BR"),
        },
      ],
    };

    try {
      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await updateDoc(doc(db, "chamados", item.id), { status: "arquivado" });
      toast.update(toastId, {
        render: "Dados enviados e OS arquivada!",
        type: "success",
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(toastId, {
        render: "Erro na integração.",
        type: "error",
        autoClose: 3000,
      });
    } finally {
      setEnviandoSheets(false);
    }
  };

  const handleAssumirChamado = async (chamado) => {
    try {
      await updateDoc(doc(db, "chamados", chamado.id), {
        status: "em atendimento",
        tecnicoResponsavel: analistaNome,
        tecnicoId: user.uid,
        iniciadoEm: serverTimestamp(),
      });
      toast.info(`Você assumiu a OS #${chamado.numeroOs}`);
    } catch (error) {
      toast.error("Erro ao assumir.");
    }
  };

  const handleDevolverChamado = async (chamado) => {
    try {
      await updateDoc(doc(db, "chamados", chamado.id), {
        status: "aberto",
        tecnicoResponsavel: deleteField(),
        tecnicoId: deleteField(),
        iniciadoEm: deleteField(),
        motivoPausa: deleteField(),
        pausadoEm: deleteField(),
      });
      toast.warning("Chamado disponível na fila.");
    } catch (error) {
      toast.error("Erro ao devolver.");
    }
  };

  const handlePausarSLA = async (e) => {
    e.preventDefault();
    if (!motivoPausa.trim()) return toast.error("Informe o motivo.");
    try {
      await updateDoc(doc(db, "chamados", chamadoSelecionado.id), {
        status: "pendente",
        motivoPausa: motivoPausa,
        pausadoEm: serverTimestamp(),
      });
      setMostrarModalPausar(false);
      setMotivoPausa("");
      toast.warning("Atendimento pausado.");
    } catch (error) {
      toast.error("Erro ao pausar.");
    }
  };

  const handleRetomarChamado = async (chamado) => {
    try {
      await updateDoc(doc(db, "chamados", chamado.id), {
        status: "em atendimento",
        retomadoEm: serverTimestamp(),
      });
      toast.success("Atendimento retomado!");
    } catch (error) {
      toast.error("Erro ao retomar.");
    }
  };

  const handleFinalizarChamado = async (e) => {
    e.preventDefault();
    if (!patrimonio.trim()) return toast.error("Informe o patrimônio.");
    try {
      await updateDoc(doc(db, "chamados", chamadoSelecionado.id), {
        status: "fechado",
        feedbackAnalista: parecerTecnico,
        patrimonio: patrimonio.toUpperCase().trim(),
        finalizadoEm: serverTimestamp(),
        tecnicoResponsavel: analistaNome,
      });
      setMostrarModalFinalizar(false);
      setParecerTecnico("");
      setPatrimonio("");
      toast.success("OS Fechada!");
    } catch (error) {
      toast.error("Erro ao finalizar.");
    }
  };

  const handleImprimir = (item) => {
    setChamadoSelecionado(item);
    setTimeout(() => window.print(), 300);
  };

  const chamadosExibidos = useMemo(() => {
    return chamados.filter(
      (c) =>
        c.numeroOs?.toString().includes(filtroOs) ||
        c.nome?.toLowerCase().includes(filtroOs.toLowerCase())
    );
  }, [chamados, filtroOs]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Carregando fila...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #area-impressao, #area-impressao * { visibility: visible; } 
          #area-impressao { position: absolute; left: 0; top: 0; width: 100%; display: block !important; } 
          .no-print { display: none !important; } 
        }
      `}</style>

      {/* HEADER */}
      <header className="no-print flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 max-w-7xl mx-auto gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">
            Fila de Trabalho
          </h1>
          <p className="text-slate-500 text-sm">
            Analista:{" "}
            <span className="font-bold text-blue-600">{analistaNome}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[240px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por OS ou Solicitante..."
              value={filtroOs}
              onChange={(e) => setFiltroOs(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white shadow-sm"
            />
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 shadow-sm"
          >
            <FiArrowLeftCircle size={18} /> Voltar
          </Link>
        </div>
      </header>

      {/* TABELA */}
      <div className="no-print max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  OS / Entrada
                </th>
                <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Solicitante
                </th>
                <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Problema
                </th>
                <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Prioridade
                </th>
                <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chamadosExibidos.map((item) => {
                const statusNorm = item.status?.toLowerCase().trim();
                const prio = item.prioridade?.toLowerCase() || "normal";
                const isFechado = statusNorm === "fechado";

                return (
                  <tr
                    key={item.id}
                    className={`${
                      isFechado ? "bg-emerald-50/40" : "hover:bg-blue-50/40"
                    } transition-colors group`}
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-700 text-base">
                          #{item.numeroOs}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {item.criadoEm?.toDate().toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">
                        {item.nome}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {item.unidade}
                      </div>
                    </td>
                    <td className="p-4 max-w-[220px]">
                      <div className="text-[11px] text-slate-600 line-clamp-2 italic leading-relaxed">
                        "{item.descricao}"
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                          prio === "urgente" || prio === "alta"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {item.prioridade || "Normal"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          statusNorm === "aberto"
                            ? "bg-amber-100 text-amber-700"
                            : statusNorm === "pendente"
                            ? "bg-orange-100 text-orange-700"
                            : statusNorm === "fechado"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleImprimir(item)}
                          className="p-2 text-slate-400 hover:text-orange-500"
                        >
                          <FiPrinter size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setChamadoSelecionado(item);
                            setMostrarModalVer(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600"
                        >
                          <FiEye size={20} />
                        </button>
                        {statusNorm === "aberto" && (
                          <button
                            onClick={() => handleAssumirChamado(item)}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase"
                          >
                            Atender
                          </button>
                        )}
                        {statusNorm === "em atendimento" && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setChamadoSelecionado(item);
                                setMostrarModalFinalizar(true);
                              }}
                              className="bg-emerald-500 text-white p-2 rounded-lg"
                            >
                              <FiCheck size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setChamadoSelecionado(item);
                                setMostrarModalPausar(true);
                              }}
                              className="bg-amber-500 text-white p-2 rounded-lg"
                            >
                              <FiPauseCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleDevolverChamado(item)}
                              className="bg-slate-100 text-slate-400 p-2 rounded-lg hover:text-red-500"
                            >
                              <FiRotateCcw size={16} />
                            </button>
                          </div>
                        )}
                        {statusNorm === "pendente" && (
                          <button
                            onClick={() => handleRetomarChamado(item)}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1"
                          >
                            <FiPlayCircle /> Retomar
                          </button>
                        )}
                        {isFechado && (
                          <button
                            disabled={enviandoSheets}
                            onClick={() => handleEnviarParaSheets(item)}
                            className={`${
                              enviandoSheets
                                ? "bg-slate-400"
                                : "bg-emerald-600 animate-pulse"
                            } text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1`}
                          >
                            <FiDownload /> Enviar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO */}
      <div id="area-impressao" className="hidden p-10 text-black">
        <div className="border-4 border-black p-6">
          <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-6">
            <h1 className="text-3xl font-black uppercase">
              Relatório de Serviço
            </h1>
            <span className="text-3xl font-mono font-black">
              #{chamadoSelecionado?.numeroOs}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm mb-8">
            <p className="border-b border-black pb-1">
              <strong>SOLICITANTE:</strong> {chamadoSelecionado?.nome}
            </p>
            <p className="border-b border-black pb-1">
              <strong>UNIDADE:</strong> {chamadoSelecionado?.unidade}
            </p>
            <p className="border-b border-black pb-1">
              <strong>PATRIMÔNIO:</strong>{" "}
              {chamadoSelecionado?.patrimonio || "N/A"}
            </p>
            <p className="border-b border-black pb-1">
              <strong>TÉCNICO RESP.:</strong>{" "}
              {chamadoSelecionado?.tecnicoResponsavel}
            </p>
          </div>
          <div className="mb-6">
            <h3 className="bg-black text-white px-2 py-1 text-xs font-bold uppercase mb-2">
              Descrição do Problema
            </h3>
            <div className="p-4 border-2 border-black min-h-[80px] text-sm italic">
              {chamadoSelecionado?.descricao}
            </div>
          </div>
          <div className="mb-12">
            <h3 className="bg-black text-white px-2 py-1 text-xs font-bold uppercase mb-2">
              Parecer Técnico / Solução
            </h3>
            <div className="p-4 border-2 border-black min-h-[120px] text-sm">
              {chamadoSelecionado?.feedbackAnalista ||
                "__________________________________________________________________"}
            </div>
          </div>
          <div className="mt-20 flex justify-around gap-10">
            <div className="text-center w-full">
              <div className="border-t-2 border-black w-full mb-1"></div>
              <p className="text-[10px] font-bold uppercase">
                Assinatura Solicitante ({chamadoSelecionado?.nome})
              </p>
            </div>
            <div className="text-center w-full">
              <div className="border-t-2 border-black w-full mb-1"></div>
              <p className="text-[10px] font-bold uppercase">
                Assinatura Técnico ({chamadoSelecionado?.tecnicoResponsavel})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL VISUALIZAÇÃO */}
      {mostrarModalVer && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-black text-blue-600">
                OS #{chamadoSelecionado?.numeroOs}
              </h2>
              <button
                onClick={() => setMostrarModalVer(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <FiX size={28} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <DetailItem
                label="Solicitante"
                value={chamadoSelecionado?.nome}
              />
              <DetailItem label="Unidade" value={chamadoSelecionado?.unidade} />
              <DetailItem
                label="Equipamento"
                value={chamadoSelecionado?.equipamento}
              />
              <DetailItem
                label="Patrimônio"
                value={chamadoSelecionado?.patrimonio}
              />
              <DetailItem
                label="Técnico"
                value={chamadoSelecionado?.tecnicoResponsavel}
              />
              <DetailItem
                label="Status"
                value={chamadoSelecionado?.status?.toUpperCase()}
              />
            </div>

            <div className="mt-4">
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Descrição
              </label>
              <div className="p-4 bg-slate-50 rounded-xl border text-sm">
                {chamadoSelecionado?.descricao}
              </div>
            </div>

            {chamadoSelecionado?.feedbackAnalista && (
              <div className="mt-4">
                <label className="text-[10px] font-black uppercase text-emerald-600 block mb-1">
                  Parecer Técnico / Solução
                </label>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-sm text-emerald-900 font-medium">
                  {chamadoSelecionado.feedbackAnalista}
                </div>
              </div>
            )}

            {chamadoSelecionado?.status === "pendente" &&
              chamadoSelecionado?.motivoPausa && (
                <div className="mt-4">
                  <label className="text-[10px] font-black uppercase text-orange-600 block mb-1">
                    Motivo da Pausa
                  </label>
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-sm text-orange-900 font-medium">
                    {chamadoSelecionado.motivoPausa}
                  </div>
                </div>
              )}

            <button
              onClick={() => setMostrarModalVer(false)}
              className="w-full mt-8 bg-slate-900 text-white font-bold py-4 rounded-2xl"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}

      {/* MODAL FINALIZAR */}
      {mostrarModalFinalizar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Finalizar Atendimento
            </h2>
            <form onSubmit={handleFinalizarChamado} className="space-y-4">
              <input
                type="text"
                className="w-full border p-4 rounded-2xl bg-slate-50 uppercase"
                value={patrimonio}
                onChange={(e) => setPatrimonio(e.target.value)}
                placeholder="Patrimônio"
                required
              />
              <textarea
                className="w-full border p-4 rounded-2xl h-32 bg-slate-50 resize-none"
                value={parecerTecnico}
                onChange={(e) => setParecerTecnico(e.target.value)}
                placeholder="Descreva o que foi feito..."
                required
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl"
                >
                  Concluir OS
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModalFinalizar(false)}
                  className="px-6 bg-slate-100 text-slate-600 rounded-2xl font-bold"
                >
                  Voltar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAUSAR */}
      {mostrarModalPausar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Pausar SLA
            </h2>
            <form onSubmit={handlePausarSLA} className="space-y-4">
              <textarea
                className="w-full border p-4 rounded-2xl h-32 bg-slate-50 resize-none"
                value={motivoPausa}
                onChange={(e) => setMotivoPausa(e.target.value)}
                placeholder="Motivo da pausa..."
                required
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 text-white font-bold py-4 rounded-2xl"
                >
                  Pausar
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModalPausar(false)}
                  className="px-6 bg-slate-100 text-slate-600 rounded-2xl font-bold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="flex flex-col">
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
      {label}
    </label>
    <span className="text-slate-700 font-semibold text-sm truncate">
      {value || "Não informado"}
    </span>
  </div>
);

export default PainelAnalista;
