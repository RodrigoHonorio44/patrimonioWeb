import React, { useEffect, useState, useMemo } from "react";
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
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ModalDetalhesAnalista from "../components/ModalDetalhesAnalista";
import ImprimirAnalista from "../components/ImprimirAnalista";

import {
  FiPauseCircle,
  FiCheck,
  FiArrowLeftCircle,
  FiRotateCcw,
  FiPlayCircle,
  FiEye,
  FiX,
  FiPrinter,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiDownload,
  FiAlertCircle,
} from "react-icons/fi";

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyGgcYmM7oXjpx0li898F2RCy5M4a6os5Ti9s9t5J6h9BbgO0W8PpOfrQ3TxqIOCNNVpg/exec";

const PainelAnalista = () => {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // ESTADOS DE BUSCA (Ajustado para manual)
  const [inputValue, setInputValue] = useState("");
  const [termoBusca, setTermoBusca] = useState("");

  const [enviandoPlanilha, setEnviandoPlanilha] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 12;

  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);
  const [mostrarModalPausar, setMostrarModalPausar] = useState(false);
  const [mostrarModalVer, setMostrarModalVer] = useState(false);

  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [parecerTecnico, setParecerTecnico] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [motivoPausa, setMotivoPausa] = useState("");
  const [detalhePausa, setDetalhePausa] = useState("");

  const user = auth.currentUser;

  const isRemaneja = (item) =>
    item?.tipo?.toLowerCase().includes("remanejamento") || !!item?.setorDestino;

  const analistaNome = useMemo(() => {
    return (
      userData?.nome ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "Analista"
    );
  }, [userData, user]);

  const formatarDataHora = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("pt-BR");
  };

  // Funções de Busca
  const executarBusca = () => {
    setTermoBusca(inputValue);
    setPaginaAtual(1);
  };

  const limparBusca = () => {
    setInputValue("");
    setTermoBusca("");
    setPaginaAtual(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") executarBusca();
  };

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "usuarios", user.uid));
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
    const q = query(collection(db, "chamados"), orderBy("criadoEm", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setChamados(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Handlers de Ação
  const handleAssumirChamado = async (chamado) => {
    try {
      await updateDoc(doc(db, "chamados", chamado.id), {
        status: "em atendimento",
        tecnicoResponsavel: analistaNome,
        tecnicoId: user.uid,
        iniciadoEm: serverTimestamp(),
      });
      toast.info(`Você assumiu a OS #${chamado.numeroOs}`);
    } catch (err) {
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
      });
      toast.warning("Chamado devolvido para a fila.");
    } catch (err) {
      toast.error("Erro ao devolver.");
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
      });
      setMostrarModalFinalizar(false);
      setParecerTecnico("");
      setPatrimonio("");
      toast.success("Finalizado!");
    } catch (err) {
      toast.error("Erro ao finalizar.");
    }
  };

  const handlePausarSLA = async (e) => {
    e.preventDefault();
    if (!motivoPausa) return toast.error("Escolha um motivo.");
    try {
      await updateDoc(doc(db, "chamados", chamadoSelecionado.id), {
        status: "pendente",
        motivoPausa,
        detalhePausa,
        pausadoEm: serverTimestamp(),
      });
      setMostrarModalPausar(false);
      toast.warning("SLA Pausado.");
    } catch (err) {
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
    } catch (err) {
      toast.error("Erro ao retomar.");
    }
  };

  const handleEnviarParaPlanilha = async (item) => {
    if (enviandoPlanilha) return;
    setEnviandoPlanilha(item.id);
    const idToast = toast.loading(`Sincronizando OS #${item.numeroOs}...`);
    try {
      const payload = {
        tipo: "CHAMADOS_POWERBI",
        dados: [
          {
            OS: item.numeroOs || "S/N",
            Data: formatarDataHora(item.criadoEm),
            Solicitante: item.nome || "Não informado",
            Unidade: item.unidade || "Não informada",
            Descricao: item.problema || item.descricao || "Sem descrição",
            Status: "FECHADO",
            Patrimonio: item.patrimonio || "N/A",
            Parecer_Tecnico: item.feedbackAnalista || "Sem parecer",
            Finalizado_Por: item.tecnicoResponsavel || analistaNome,
            Finalizado_Em: formatarDataHora(item.finalizadoEm),
          },
        ],
      };
      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload),
      });
      await updateDoc(doc(db, "chamados", item.id), {
        status: "arquivado",
        arquivadoEm: serverTimestamp(),
      });
      toast.update(idToast, {
        render: "Sincronizado!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(idToast, {
        render: "Erro na sincronização.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setEnviandoPlanilha(null);
    }
  };

  const handleImprimir = (item) => {
    setChamadoSelecionado(item);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const chamadosFiltrados = useMemo(() => {
    const busca = termoBusca.toLowerCase().trim();
    return chamados.filter((c) => {
      const matches =
        c.numeroOs?.toString().includes(busca) ||
        c.nome?.toLowerCase().includes(busca) ||
        c.unidade?.toLowerCase().includes(busca) ||
        c.patrimonio?.toLowerCase().includes(busca);
      return busca ? matches : c.status?.toLowerCase() !== "arquivado";
    });
  }, [chamados, termoBusca]);

  const totalPaginas =
    Math.ceil(chamadosFiltrados.length / itensPorPagina) || 1;
  const chamadosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return chamadosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [chamadosFiltrados, paginaAtual]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased">
      <style>{`
        @keyframes blink-soft-red {
          0%, 100% { background-color: rgba(254, 226, 226, 0.8); color: #dc2626; border-color: #fecaca; }
          50% { background-color: rgba(239, 68, 68, 0.2); color: #b91c1c; border-color: #ef4444; }
        }
        .animate-blink-priority { animation: blink-soft-red 1.5s infinite ease-in-out; }
        @media print { 
          body * { visibility: hidden; } 
          #area-impressao, #area-impressao * { visibility: visible; } 
          #area-impressao { position: absolute; left: 0; top: 0; width: 100%; display: block !important; } 
          .no-print { display: none !important; } 
        }
      `}</style>

      <div className="no-print">
        <Header />
      </div>

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        <div className="no-print flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">
            Fila Técnica
          </h1>
          <div className="flex gap-2 w-full md:w-auto">
            {/* BUSCA MANUAL */}
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pesquisar e dar Enter..."
                className="w-full pl-4 pr-20 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {inputValue && (
                  <button
                    onClick={limparBusca}
                    className="p-2 text-slate-400 hover:text-red-500"
                  >
                    <FiX size={18} />
                  </button>
                )}
                <button
                  onClick={executarBusca}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  <FiSearch size={18} />
                </button>
              </div>
            </div>

            <Link
              to="/dashboard"
              className="bg-white border border-slate-200 p-3 rounded-2xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
            >
              <FiArrowLeftCircle size={24} />
            </Link>
          </div>
        </div>

        <div className="no-print bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    OS / Entrada
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Detalhes
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Prioridade
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Status
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {!loading &&
                  chamadosPaginados.map((item) => {
                    const status = item.status?.toLowerCase();
                    const rem = isRemaneja(item);
                    const prio = item.prioridade?.toLowerCase() || "baixa";

                    let estiloPrio =
                      prio === "alta" || prio === "urgente"
                        ? "animate-blink-priority"
                        : prio === "média" || prio === "media"
                        ? "bg-orange-100 text-orange-600 border-orange-200"
                        : "bg-emerald-100 text-emerald-600 border-emerald-200";

                    let estiloStatus = "";
                    switch (status) {
                      case "aberto":
                        estiloStatus =
                          "bg-emerald-100 text-emerald-700 border-emerald-200";
                        break;
                      case "em atendimento":
                        estiloStatus =
                          "bg-blue-100 text-blue-700 border-blue-200";
                        break;
                      case "pendente":
                        estiloStatus =
                          "bg-orange-100 text-orange-700 border-orange-200";
                        break;
                      case "fechado":
                        estiloStatus = "bg-red-100 text-red-700 border-red-200";
                        break;
                      default:
                        estiloStatus =
                          "bg-slate-100 text-slate-500 border-slate-200";
                    }

                    return (
                      <tr
                        key={item.id}
                        className={`${
                          rem ? "bg-orange-50/20" : ""
                        } hover:bg-slate-50 transition-colors`}
                      >
                        <td className="p-5">
                          <span
                            className={`font-black text-lg ${
                              rem ? "text-orange-600" : "text-blue-600"
                            }`}
                          >
                            #{item.numeroOs}
                          </span>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {formatarDataHora(item.criadoEm)}
                          </p>
                        </td>
                        <td className="p-5">
                          <div className="font-bold text-slate-700 uppercase text-xs">
                            {item.nome}
                          </div>
                          <div className="text-[10px] font-black uppercase text-slate-400">
                            {item.unidade} |{" "}
                            <span
                              className={
                                rem ? "text-orange-600" : "text-blue-600"
                              }
                            >
                              {item.setor || item.setorOrigem}
                            </span>
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <div
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg border font-black text-[10px] uppercase transition-all ${estiloPrio}`}
                          >
                            <FiAlertCircle size={12} /> {prio}
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${estiloStatus}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex gap-2 justify-center items-center">
                            <button
                              onClick={() => handleImprimir(item)}
                              className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:text-orange-600"
                            >
                              <FiPrinter size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setChamadoSelecionado(item);
                                setMostrarModalVer(true);
                              }}
                              className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:text-blue-600"
                            >
                              <FiEye size={18} />
                            </button>

                            {/* BOTÃO ATENDER - RESPEITANDO CORES ORIGINAIS */}
                            {status === "aberto" && (
                              <button
                                onClick={() => handleAssumirChamado(item)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase text-white shadow-md ${
                                  rem ? "bg-orange-500" : "bg-blue-600"
                                }`}
                              >
                                Atender
                              </button>
                            )}

                            {status === "pendente" && (
                              <button
                                onClick={() => handleRetomarChamado(item)}
                                className="bg-amber-500 text-white p-2.5 rounded-xl"
                              >
                                <FiPlayCircle size={20} />
                              </button>
                            )}

                            {status === "em atendimento" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setChamadoSelecionado(item);
                                    setMostrarModalFinalizar(true);
                                  }}
                                  className="bg-emerald-500 text-white p-2.5 rounded-xl"
                                >
                                  <FiCheck size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setChamadoSelecionado(item);
                                    setMostrarModalPausar(true);
                                  }}
                                  className="bg-amber-500 text-white p-2.5 rounded-xl"
                                >
                                  <FiPauseCircle size={18} />
                                </button>
                                {/* BOTÃO DE VOLTAR PARA A FILA */}
                                <button
                                  onClick={() => handleDevolverChamado(item)}
                                  className="bg-slate-200 text-slate-500 p-2.5 rounded-xl"
                                >
                                  <FiRotateCcw size={18} />
                                </button>
                              </div>
                            )}

                            {status === "fechado" && (
                              <button
                                onClick={() => handleEnviarParaPlanilha(item)}
                                disabled={enviandoPlanilha === item.id}
                                className={`p-2.5 text-white rounded-xl shadow-lg ${
                                  enviandoPlanilha === item.id
                                    ? "bg-slate-400"
                                    : "bg-emerald-600 animate-pulse"
                                }`}
                              >
                                {enviandoPlanilha === item.id ? (
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <FiDownload size={20} />
                                )}
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
          <div className="p-6 border-t border-slate-50 flex justify-between items-center">
            <button
              disabled={paginaAtual === 1}
              onClick={() => setPaginaAtual((p) => p - 1)}
              className="p-2 rounded-xl border border-slate-200 disabled:opacity-30"
            >
              <FiChevronLeft />
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <button
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPaginaAtual((p) => p + 1)}
              className="p-2 rounded-xl border border-slate-200 disabled:opacity-30"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </main>

      {/* MODAIS (FINAIS DO CÓDIGO) */}
      <ModalDetalhesAnalista
        isOpen={mostrarModalVer}
        chamado={chamadoSelecionado}
        onClose={() => setMostrarModalVer(false)}
        isRemaneja={isRemaneja}
      />
      <ImprimirAnalista
        chamado={chamadoSelecionado}
        isRemaneja={isRemaneja}
        formatarDataHora={formatarDataHora}
      />

      {/* RESTANTE DOS MODAIS... (FINALIZAR E PAUSAR) */}
      {mostrarModalFinalizar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 text-slate-800 uppercase italic">
              Finalizar OS
            </h2>
            <form onSubmit={handleFinalizarChamado} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Patrimônio
                </label>
                <input
                  required
                  value={patrimonio}
                  onChange={(e) => setPatrimonio(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold"
                  placeholder="Digite o patrimônio..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Parecer Técnico
                </label>
                <textarea
                  value={parecerTecnico}
                  onChange={(e) => setParecerTecnico(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 h-32 outline-none font-medium"
                  placeholder="O que foi feito?"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalFinalizar(false)}
                  className="flex-1 py-4 font-black uppercase text-xs text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 py-4 rounded-2xl font-black uppercase text-xs text-white shadow-lg"
                >
                  Concluir OS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalPausar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 text-slate-800 uppercase">
              Pausar SLA
            </h2>
            <form onSubmit={handlePausarSLA} className="space-y-4">
              <select
                required
                value={motivoPausa}
                onChange={(e) => setMotivoPausa(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold outline-none"
              >
                <option value="">Selecione o motivo...</option>
                <option value="Aguardando Peça">Aguardando Peça</option>
                <option value="Aguardando Peça">Recolhido para Oficina</option>
                <option value="Aguardando Retorno Usuário">
                  Aguardando Retorno Usuário
                </option>
                <option value="Serviço Externo">Serviço Externo</option>
              </select>
              <textarea
                value={detalhePausa}
                onChange={(e) => setDetalhePausa(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 h-24 outline-none"
                placeholder="Detalhes adicionais..."
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalPausar(false)}
                  className="flex-1 text-slate-400 font-black uppercase text-xs"
                >
                  Sair
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 py-4 rounded-2xl text-white font-black uppercase text-xs shadow-lg"
                >
                  Confirmar Pausa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="no-print">
        <Footer />
      </div>
    </div>
  );
};

export default PainelAnalista;
