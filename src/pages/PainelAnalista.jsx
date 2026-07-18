import React from "react";
import { Link } from "react-router-dom";
import { usePainelAnalista } from "../hooks/usePainelAnalista"; // Ajuste o caminho se necessário

import Header from "../components/Header";
import Footer from "../components/Footer";
import ImprimirAnalista from "../components/ImprimirAnalista";
import ModalFilaAnalista from "../components/ModalFilaAnalista";

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
  FiLock,
  FiUser,
} from "react-icons/fi";

const PainelAnalista = () => {
  const {
    user,
    userData,
    loading,
    inputValue,
    setInputValue,
    paginaAtual,
    setPaginaAtual,
    totalPaginas,
    chamadosPaginados,
    chamadoSelecionado,
    setChamadoSelecionado,
    mostrarModal,
    tipoModal,
    equipamento,
    setEquipamento,
    patrimonio,
    setPatrimonio,
    parecerTecnico,
    setParecerTecnico,
    motivoPausa,
    setMotivoPausa,
    detalhePausa,
    setDetalhePausa,
    enviandoPlanilha,
    isRemaneja,
    analistaNome,
    formatarDataHora,
    executarBusca,
    limparBusca,
    handleAssumirChamado,
    handleDevolverChamado,
    handleFinalizarChamado,
    handlePausarSLA,
    handleRetomarChamado,
    handleEnviarParaPlanilha,
    abrirModalUnificado,
    fecharModalUnificado,
  } = usePainelAnalista();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased">
      <style>{`
        @keyframes blink-urgent {
          0%, 100% { background-color: #fee2e2; color: #dc2626; border-color: #fecaca; }
          50% { background-color: #dc2626; color: #ffffff; border-color: #dc2626; }
        }
        .animate-urgent { animation: blink-urgent 1s infinite ease-in-out; }
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
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && executarBusca()}
                placeholder="Pesquisar OS, Nome ou Unidade..."
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
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
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

        <div className="no-print bg-white rounded-4xl shadow-xl border border-slate-100 overflow-hidden">
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
                    Equipamento
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Equipe
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Prioridade
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Técnico / Status
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-10 text-center text-slate-400 font-bold uppercase animate-pulse"
                    >
                      Carregando chamados...
                    </td>
                  </tr>
                ) : (
                  chamadosPaginados.map((item) => {
                    const status = item.status?.toLowerCase();
                    const rem = isRemaneja(item);
                    const prio = item.prioridade?.toLowerCase() || "baixa";

                    const isDono = item.tecnicoId === user?.uid;
                    const isAdminOuRoot = ["root", "admin"].includes(
                      userData?.role?.toLowerCase()
                    );
                    const isOcupado =
                      (status === "em atendimento" || status === "pendente") &&
                      !isDono;
                    const estaBloqueado = isOcupado && !isAdminOuRoot;

                    const estiloPrio =
                      prio === "urgente"
                        ? "animate-urgent font-black shadow-sm"
                        : prio === "alta"
                        ? "bg-red-600 text-white border-red-700 font-black"
                        : prio === "média" || prio === "media"
                        ? "bg-orange-100 text-orange-600 border-orange-200 font-bold"
                        : "bg-emerald-100 text-emerald-600 border-emerald-200 font-bold";

                    const statusStyles = {
                      aberto: "bg-emerald-100 text-emerald-700 border-emerald-200",
                      "em atendimento": "bg-blue-100 text-blue-700 border-blue-200",
                      pendente: "bg-orange-100 text-orange-700 border-orange-200",
                      fechado: "bg-red-100 text-red-700 border-red-200",
                      arquivado: "bg-slate-100 text-slate-500 border-slate-200",
                    };

                    return (
                      <tr
                        key={item.id}
                        className={`${
                          rem ? "bg-orange-50/30" : ""
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
                          <span className="text-xs font-extrabold uppercase text-slate-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 tracking-wide max-w-[180px] inline-block truncate">
                            {item.equipamento || "Não Informado"}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <span className="text-xs font-bold uppercase text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            {item.equipe || "Não Definida"}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <div
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg border text-[10px] uppercase transition-all ${estiloPrio}`}
                          >
                            <FiAlertCircle size={12} /> {prio}
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {item.tecnicoResponsavel && (
                              <div
                                className={`flex items-center gap-1 text-[9px] font-black uppercase ${
                                  isDono ? "text-blue-600" : "text-slate-400"
                                }`}
                              >
                                <FiUser size={10} />{" "}
                                {isDono ? "Você" : item.tecnicoResponsavel}
                              </div>
                            )}
                            <span
                              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                                statusStyles[status] || ""
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex gap-2 justify-center items-center">
                            <button
                              onClick={() => abrirModalUnificado("visualizar", item)}
                              className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:text-blue-600 transition-colors"
                              title="Ver Detalhes"
                            >
                              <FiEye size={18} />
                            </button>

                            <button
                              onClick={() => {
                                setChamadoSelecionado(item);
                                setTimeout(() => window.print(), 100);
                              }}
                              className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:text-orange-600 transition-colors"
                              title="Imprimir OS"
                            >
                              <FiPrinter size={18} />
                            </button>

                            {estaBloqueado ? (
                              <div
                                className="flex items-center gap-2 bg-slate-100 text-slate-400 px-4 py-2 rounded-xl cursor-not-allowed border border-slate-200"
                                title={`Bloqueado: ${item.tecnicoResponsavel} está atendendo.`}
                              >
                                <FiLock size={14} />
                                <span className="text-[10px] font-black uppercase">
                                  Ocupado
                                </span>
                              </div>
                            ) : (
                              <>
                                {status === "aberto" && (
                                  <button
                                    onClick={() => handleAssumirChamado(item)}
                                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase text-white shadow-md transition-transform active:scale-95 ${
                                      rem ? "bg-orange-500" : "bg-blue-600"
                                    }`}
                                  >
                                    Atender
                                  </button>
                                )}

                                {isOcupado && isAdminOuRoot && (
                                  <button
                                    onClick={() => handleAssumirChamado(item)}
                                    className="px-5 py-2 rounded-xl text-[10px] font-black uppercase text-white bg-red-600 shadow-md hover:bg-red-700 transition-all"
                                  >
                                    Assumir
                                  </button>
                                )}

                                {status === "pendente" && isDono && (
                                  <button
                                    onClick={() => handleRetomarChamado(item)}
                                    className="bg-amber-500 text-white p-2.5 rounded-xl hover:bg-amber-600 shadow-md"
                                  >
                                    <FiPlayCircle size={20} />
                                  </button>
                                )}

                                {status === "em atendimento" && isDono && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => abrirModalUnificado("finalizar", item)}
                                      className="bg-emerald-500 text-white p-2.5 rounded-xl hover:bg-emerald-600 shadow-md"
                                      title="Finalizar OS"
                                    >
                                      <FiCheck size={18} />
                                    </button>
                                    <button
                                      onClick={() => abrirModalUnificado("pausar", item)}
                                      className="bg-amber-500 text-white p-2.5 rounded-xl hover:bg-amber-600 shadow-md"
                                      title="Pausar Atendimento"
                                    >
                                      <FiPauseCircle size={18} />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}

                            {(isDono ||
                              (isAdminOuRoot &&
                                (status === "em atendimento" ||
                                  status === "pendente"))) && (
                              <button
                                onClick={() => handleDevolverChamado(item)}
                                className="p-2.5 bg-slate-200 text-slate-500 rounded-xl hover:bg-orange-500 hover:text-white transition-colors"
                                title="Devolver para fila"
                              >
                                <FiRotateCcw size={18} />
                              </button>
                            )}

                            {status === "fechado" && (
                              <button
                                onClick={() => handleEnviarParaPlanilha(item)}
                                disabled={enviandoPlanilha === item.id}
                                className={`p-2.5 text-white rounded-xl shadow-lg transition-all ${
                                  enviandoPlanilha === item.id
                                    ? "bg-slate-400 cursor-not-allowed"
                                    : "bg-emerald-600 hover:bg-emerald-700 animate-pulse"
                                }`}
                                title="Arquivar OS"
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
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-slate-50 flex justify-between items-center">
            <button
              disabled={paginaAtual === 1}
              onClick={() => setPaginaAtual((p) => p - 1)}
              className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
              <FiChevronLeft />
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <button
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPaginaAtual((p) => p + 1)}
              className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </main>

      <ImprimirAnalista
        chamado={chamadoSelecionado}
        isRemaneja={isRemaneja}
        formatarDataHora={formatarDataHora}
      />

      <ModalFilaAnalista
        isOpen={mostrarModal}
        tipoModal={tipoModal}
        chamado={chamadoSelecionado}
        onClose={fecharModalUnificado}
        equipamento={equipamento}
        setEquipamento={setEquipamento}
        patrimonio={patrimonio}
        setPatrimonio={setPatrimonio}
        parecerTecnico={parecerTecnico}
        setParecerTecnico={setParecerTecnico}
        handleFinalizar={handleFinalizarChamado}
        motivoPausa={motivoPausa}
        setMotivoPausa={setMotivoPausa}
        detalhePausa={detalhePausa}
        setDetalhePausa={setDetalhePausa}
        handlePausar={handlePausarSLA}
      />

      <Footer />
    </div>
  );
};

export default PainelAnalista;