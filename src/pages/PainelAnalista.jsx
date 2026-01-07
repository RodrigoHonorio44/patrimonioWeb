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
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../components/Header";
import Footer from "../components/Footer";
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
  FiDownload,
} from "react-icons/fi";

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyGgcYmM7oXjpx0li898F2RCy5M4a6os5Ti9s9t5J6h9BbgO0W8PpOfrQ3TxqIOCNNVpg/exec";

const PainelAnalista = () => {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const [termoBusca, setTermoBusca] = useState("");
  const [filtroOs, setFiltroOs] = useState("");

  const [enviandoSheets, setEnviandoSheets] = useState(false);
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);
  const [mostrarModalPausar, setMostrarModalPausar] = useState(false);
  const [mostrarModalVer, setMostrarModalVer] = useState(false);

  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [parecerTecnico, setParecerTecnico] = useState("");
  const [patrimonio, setPatrimonio] = useState("");

  const [motivoPausa, setMotivoPausa] = useState("");
  const [detalhePausa, setDetalhePausa] = useState("");

  const user = auth.currentUser;

  const handleBuscar = () => setFiltroOs(termoBusca);
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleBuscar();
  };

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
    const q = query(collection(db, "chamados"), orderBy("criadoEm", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const lista = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      const prioridadeOrdem = { urgente: 1, alta: 2, normal: 3, baixa: 4 };
      const listaOrdenada = lista.sort((a, b) => {
        const pA = prioridadeOrdem[a.prioridade?.toLowerCase()] || 3;
        const pB = prioridadeOrdem[b.prioridade?.toLowerCase()] || 3;
        return pA - pB;
      });
      setChamados(listaOrdenada);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

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
        detalhePausa: deleteField(),
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
        detalhePausa: detalhePausa,
        pausadoEm: serverTimestamp(),
      });
      setMostrarModalPausar(false);
      setMotivoPausa("");
      setDetalhePausa("");
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
        motivoPausa: deleteField(),
        detalhePausa: deleteField(),
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
          Status: "FECHADO",
          Patrimonio: item.patrimonio || "",
          Finalizado_Por: item.tecnicoResponsavel || "",
          Finalizado_Em: new Date().toLocaleString("pt-BR"),
        },
      ],
    };
    try {
      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
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

  const handleImprimir = (item) => {
    setChamadoSelecionado(item);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const chamadosExibidos = useMemo(() => {
    const busca = filtroOs.toLowerCase().trim();
    return chamados.filter((c) => {
      const correspondeBusca =
        c.numeroOs?.toString().includes(busca) ||
        c.nome?.toLowerCase().includes(busca) ||
        c.unidade?.toLowerCase().includes(busca);
      if (!busca) return c.status?.toLowerCase() !== "arquivado";
      return correspondeBusca;
    });
  }, [chamados, filtroOs]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">
          Carregando fila...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <style>{`
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
        <div className="no-print flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Fila de Trabalho
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Gerenciando chamados
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[280px]">
              <button
                onClick={handleBuscar}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 z-10"
              >
                <FiSearch size={18} />
              </button>
              <input
                type="text"
                placeholder="Digite e aperte ENTER para buscar..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-11 pr-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white shadow-sm"
              />
              {filtroOs && (
                <button
                  onClick={() => {
                    setTermoBusca("");
                    setFiltroOs("");
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-400 uppercase"
                >
                  Limpar
                </button>
              )}
            </div>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-slate-900 px-6 py-3 rounded-2xl text-white font-bold hover:bg-slate-800 transition-all"
            >
              <FiArrowLeftCircle size={18} /> Painel
            </Link>
          </div>
        </div>

        <div className="no-print bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    OS / Entrada
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Solicitante
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Problema
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Prioridade
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Status
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {chamadosExibidos.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="p-5">
                      <span className="font-black text-blue-600 text-lg">
                        #{item.numeroOs}
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {item.criadoEm?.toDate().toLocaleString("pt-BR")}
                      </p>
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-slate-700">
                        {item.nome}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400 uppercase">
                        {item.unidade}
                      </div>
                    </td>
                    <td className="p-5 max-w-[200px]">
                      <p className="text-[11px] font-bold text-slate-600 line-clamp-2 uppercase">
                        {item.problema || item.descricao}
                      </p>
                    </td>
                    <td className="p-5">
                      <span
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${
                          item.prioridade === "urgente"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-slate-50 text-slate-500 border-slate-100"
                        }`}
                      >
                        {item.prioridade || "Normal"}
                      </span>
                    </td>
                    <td className="p-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                          item.status === "pendente"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleImprimir(item)}
                          className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-orange-500"
                        >
                          <FiPrinter size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setChamadoSelecionado(item);
                            setMostrarModalVer(true);
                          }}
                          className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600"
                        >
                          <FiEye size={18} />
                        </button>

                        {item.status === "aberto" && (
                          <button
                            onClick={() => handleAssumirChamado(item)}
                            className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase"
                          >
                            Atender
                          </button>
                        )}

                        {item.status === "pendente" && (
                          <button
                            onClick={() => handleRetomarChamado(item)}
                            className="bg-amber-500 text-white p-2.5 rounded-xl"
                          >
                            <FiPlayCircle size={18} />
                          </button>
                        )}

                        {item.status === "em atendimento" && (
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
                            <button
                              onClick={() => handleDevolverChamado(item)}
                              className="bg-slate-100 text-slate-400 p-2.5 rounded-xl hover:text-red-500"
                            >
                              <FiRotateCcw size={18} />
                            </button>
                          </div>
                        )}

                        {item.status === "fechado" && (
                          <button
                            onClick={() => handleEnviarParaSheets(item)}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase animate-pulse"
                          >
                            <FiDownload size={14} className="inline mr-1" />{" "}
                            Enviar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="no-print">
          <Footer />
        </div>
      </main>

      {/* ÁREA DE IMPRESSÃO (OTIMIZADA PARA 1 FOLHA) */}
      {chamadoSelecionado && (
        <div id="area-impressao" className="hidden p-0 text-black">
          <div
            className="border-[3px] border-black p-6 m-2 bg-white"
            style={{ minHeight: "270mm", maxWidth: "200mm" }}
          >
            {/* Cabeçalho Compacto */}
            <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
              <h1 className="text-2xl font-black uppercase tracking-tighter">
                Relatório de Serviço
              </h1>
              <div className="text-right">
                <span className="text-2xl font-mono font-black">
                  #{chamadoSelecionado.numeroOs}
                </span>
                <p className="text-[10px] font-bold uppercase leading-none">
                  Via da Unidade
                </p>
              </div>
            </div>

            {/* Informações Principais */}
            <div className="grid grid-cols-2 gap-6 text-sm mb-4">
              <div className="space-y-1">
                <p>
                  <strong>SOLICITANTE:</strong> {chamadoSelecionado.nome}
                </p>
                <p>
                  <strong>UNIDADE:</strong> {chamadoSelecionado.unidade}
                </p>
                <p>
                  <strong>DATA ABERTURA:</strong>{" "}
                  {chamadoSelecionado.criadoEm
                    ?.toDate()
                    .toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p>
                  <strong>TÉCNICO:</strong>{" "}
                  {chamadoSelecionado.tecnicoResponsavel || "N/A"}
                </p>
                <p>
                  <strong>PATRIMÔNIO:</strong>{" "}
                  {chamadoSelecionado.patrimonio || "N/A"}
                </p>
                <p>
                  <strong>STATUS:</strong>{" "}
                  {chamadoSelecionado.status?.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Descrição do Problema - Altura Controlada */}
            <div className="mt-4 border-t border-black pt-2">
              <p className="font-black text-xs mb-1">DESCRIÇÃO DO PROBLEMA:</p>
              <div className="p-3 bg-gray-50 border border-gray-300 min-h-[80px] max-h-[150px] overflow-hidden text-sm uppercase">
                {chamadoSelecionado.problema || chamadoSelecionado.descricao}
              </div>
            </div>

            {/* Parecer Técnico - Área que costuma expandir */}
            <div className="mt-4 border-t border-black pt-2">
              <p className="font-black text-xs mb-1">PARECER TÉCNICO FINAL:</p>
              <div className="p-3 bg-gray-50 border border-gray-300 min-h-[150px] max-h-[350px] overflow-hidden text-sm">
                {chamadoSelecionado.feedbackAnalista ||
                  "______________________________________________________"}
              </div>
            </div>

            {/* Assinaturas - Posicionadas com margem fixa do topo para evitar quebra */}
            <div className="mt-12 grid grid-cols-2 gap-12">
              <div className="text-center">
                <div className="border-t border-black mb-1"></div>
                <p className="font-black text-[10px] uppercase">
                  Assinatura do Técnico
                </p>
                <p className="text-xs">
                  {chamadoSelecionado.tecnicoResponsavel || "Analista de TI"}
                </p>
              </div>
              <div className="text-center">
                <div className="border-t border-black mb-1"></div>
                <p className="font-black text-[10px] uppercase">
                  Assinatura do Solicitante
                </p>
                <p className="text-xs">{chamadoSelecionado.nome}</p>
              </div>
            </div>

            {/* Rodapé fixo */}
            <div className="mt-8 text-center text-[9px] font-bold text-gray-400 uppercase">
              Documento gerado pelo Sistema em{" "}
              {new Date().toLocaleString("pt-BR")}
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZAR (COM INFO DE PAUSA) */}
      {mostrarModalVer && chamadoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  Detalhes OS
                </h2>
                <span className="text-blue-600 font-bold">
                  #{chamadoSelecionado.numeroOs}
                </span>
              </div>
              <button
                onClick={() => setMostrarModalVer(false)}
                className="p-2 bg-slate-50 rounded-full hover:bg-red-50 transition-all"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-400">
                    Solicitante
                  </p>
                  <p className="font-bold text-slate-700">
                    {chamadoSelecionado.nome}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-400">
                    Unidade
                  </p>
                  <p className="font-bold text-slate-700">
                    {chamadoSelecionado.unidade}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-400">
                    Abertura
                  </p>
                  <p className="font-bold text-slate-700 text-[11px]">
                    {chamadoSelecionado.criadoEm
                      ?.toDate()
                      .toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>

              {/* Bloco de Pausa (Visível se estiver pendente) */}
              {chamadoSelecionado.status === "pendente" && (
                <div className="bg-amber-50 p-6 rounded-[24px] border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FiPauseCircle className="text-amber-600" size={20} />
                    <p className="text-[10px] font-black uppercase text-amber-600">
                      Chamado em Pausa
                    </p>
                  </div>
                  <p className="text-slate-800 font-black text-lg">
                    {chamadoSelecionado.motivoPausa || "Motivo não informado"}
                  </p>
                  {chamadoSelecionado.detalhePausa && (
                    <p className="text-sm text-amber-700 mt-2 bg-white/50 p-3 rounded-lg border border-amber-100 italic">
                      "{chamadoSelecionado.detalhePausa}"
                    </p>
                  )}
                  <p className="text-[9px] text-amber-500 mt-2 font-bold uppercase">
                    Pausado em:{" "}
                    {chamadoSelecionado.pausadoEm
                      ?.toDate()
                      .toLocaleString("pt-BR")}
                  </p>
                </div>
              )}

              <div className="bg-blue-50/50 p-6 rounded-[24px] border border-blue-100">
                <p className="text-[10px] font-black uppercase text-blue-400 mb-2">
                  Descrição do Problema
                </p>
                <p className="text-slate-700 leading-relaxed font-medium uppercase">
                  {chamadoSelecionado.problema || chamadoSelecionado.descricao}
                </p>
              </div>

              {chamadoSelecionado.feedbackAnalista && (
                <div className="bg-emerald-50 p-6 rounded-[24px] border border-emerald-100">
                  <p className="text-[10px] font-black uppercase text-emerald-400 mb-2">
                    Parecer Técnico
                  </p>
                  <p className="text-slate-700 font-bold">
                    {chamadoSelecionado.feedbackAnalista}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL FINALIZAR */}
      {mostrarModalFinalizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 uppercase">
                Finalizar OS
              </h2>
              <button
                onClick={() => setMostrarModalFinalizar(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleFinalizarChamado} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">
                  Patrimônio / TAG *
                </label>
                <input
                  required
                  value={patrimonio}
                  onChange={(e) => setPatrimonio(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  placeholder="Ex: CPU-001"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">
                  Parecer Técnico
                </label>
                <textarea
                  rows="4"
                  value={parecerTecnico}
                  onChange={(e) => setParecerTecnico(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="O que foi feito?"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase"
              >
                Encerrar Chamado
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAUSAR */}
      {mostrarModalPausar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 uppercase">
                Pausar SLA
              </h2>
              <button
                onClick={() => setMostrarModalPausar(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handlePausarSLA} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">
                  Motivo da Pausa *
                </label>
                <select
                  required
                  value={motivoPausa}
                  onChange={(e) => setMotivoPausa(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold"
                >
                  <option value="">Selecione...</option>
                  <option value="Aguardando peça">Aguardando peça</option>
                  <option value="Aguardando usuário">Aguardando usuário</option>
                  <option value="Aguardando aprovação">
                    Aguardando aprovação
                  </option>
                  <option value="Aguardando terceiro">
                    Aguardando terceiro
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">
                  Detalhes
                </label>
                <textarea
                  rows="3"
                  value={detalhePausa}
                  onChange={(e) => setDetalhePausa(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none"
                  placeholder="Explique a situação..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black uppercase"
              >
                Confirmar Pausa
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PainelAnalista;
