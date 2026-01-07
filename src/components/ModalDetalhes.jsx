import React from "react";
import {
  FiX,
  FiCheckCircle,
  FiTool,
  FiPauseCircle,
  FiClock,
  FiInfo,
  FiCalendar,
  FiArrowRight,
} from "react-icons/fi";

const ModalDetalhes = ({ chamado, aoFechar, calcularSLA }) => {
  if (!chamado) return null;

  const statusLower = chamado.status?.toLowerCase().trim() || "";

  // Definições de estado de status
  const isPendente = statusLower === "pendente";
  const isPausado = statusLower === "pausado";
  const isFechado = statusLower === "fechado" || statusLower === "arquivado";

  // Lógica para detectar remanejamento
  const isRemanejamento = chamado.tipo?.toLowerCase().includes("remanejamento");

  // Função para formatar o timestamp do Firebase (Data e Hora)
  const formatarDataModal = (timestamp) => {
    if (!timestamp) return "---";
    const data = timestamp.toDate();
    return `${data.toLocaleDateString("pt-BR")} às ${data.toLocaleTimeString(
      "pt-BR",
      { hour: "2-digit", minute: "2-digit" }
    )}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={aoFechar}
      ></div>

      <div className="bg-white w-full max-w-[550px] rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 md:p-10 text-left">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-800 italic">
              Chamado{" "}
              <span
                className={isRemanejamento ? "text-amber-500" : "text-blue-600"}
              >
                #{chamado.numeroOs}
              </span>
            </h2>
            <button
              onClick={aoFechar}
              className="p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* BANNER DE STATUS COM DATA DE FECHAMENTO SE ESTIVER CONCLUÍDO */}
            {isFechado ? (
              <div className="bg-green-50 border-l-[6px] border-green-500 p-6 rounded-r-2xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-green-700 font-black text-[11px] uppercase tracking-widest">
                    <FiCheckCircle size={20} /> ATENDIMENTO FINALIZADO
                  </div>
                </div>
                <p className="text-green-800 text-[14px] font-bold italic mb-2">
                  {chamado.feedbackAnalista ||
                    "O chamado foi encerrado com sucesso."}
                </p>
                <div className="flex items-center gap-2 text-green-600/70 text-[10px] font-black uppercase">
                  <FiCalendar size={12} /> Concluído em:{" "}
                  {formatarDataModal(chamado.finalizadoEm)}
                </div>
              </div>
            ) : isPausado || isPendente ? (
              <div className="bg-orange-50 border-l-[6px] border-orange-500 p-6 rounded-r-2xl shadow-sm">
                <div className="flex items-center gap-2 text-orange-700 font-black text-[11px] uppercase tracking-widest mb-3">
                  <FiPauseCircle size={20} /> STATUS:{" "}
                  {statusLower.toUpperCase()}
                </div>
                <p className="text-orange-800 text-[14px] font-bold italic">
                  {chamado.motivoPausa ||
                    chamado.motivoPendente ||
                    "Aguardando materiais ou retorno técnico."}
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border-l-[6px] border-blue-500 p-6 rounded-r-2xl shadow-sm">
                <div className="flex items-center gap-2 text-blue-700 font-black text-[11px] uppercase tracking-widest mb-3">
                  <FiTool size={20} /> EM ATENDIMENTO
                </div>
                <p className="text-blue-800 text-[14px] font-bold italic">
                  O analista está trabalhando na sua solicitação.
                </p>
              </div>
            )}

            {/* SEÇÃO: DESCRIÇÃO / TIPO */}
            <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1 flex items-center gap-2">
                <FiInfo size={14} />{" "}
                {isRemanejamento
                  ? "Tipo de Solicitação"
                  : "Descrição do Problema"}
              </p>
              <p className="text-slate-700 text-sm font-bold italic">
                {isRemanejamento
                  ? chamado.tipo
                  : chamado.descricao || "Não informada."}
              </p>
            </div>

            {/* GRID DE INFORMAÇÕES DETALHADAS */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 px-2">
              <Detail
                label="DATA DE ABERTURA"
                value={formatarDataModal(chamado.criadoEm)}
              />
              <Detail
                label="DATA DE FECHAMENTO"
                value={formatarDataModal(chamado.finalizadoEm)}
                color={isFechado ? "text-green-600" : "text-slate-400"}
              />
              <Detail
                label="TÉCNICO RESPONSÁVEL"
                value={chamado.tecnicoResponsavel || "Aguardando Analista"}
              />
              <Detail
                label="TEMPO TOTAL (SLA)"
                value={calcularSLA(chamado.criadoEm, chamado.finalizadoEm)}
              />

              <Detail
                label={
                  isRemanejamento
                    ? "TRAJETO DO REMANEJAMENTO"
                    : "UNIDADE / SETOR"
                }
                className="col-span-2 border-t border-slate-50 pt-4"
                value={
                  isRemanejamento ? (
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-red-50 text-red-500 rounded-lg text-xs font-black uppercase">
                        {chamado.setorOrigem || chamado.localOrigem}
                      </span>
                      <FiArrowRight size={14} className="text-slate-300" />
                      <span className="px-3 py-1 bg-green-50 text-green-500 rounded-lg text-xs font-black uppercase">
                        {chamado.setorDestino || chamado.localDestino}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-700 font-bold">
                      {chamado.unidade}{" "}
                      <span className="text-slate-400 mx-1">|</span>{" "}
                      {chamado.local || chamado.setor}
                    </span>
                  )
                }
              />
            </div>

            <button
              onClick={aoFechar}
              className={`w-full text-white font-black py-4 rounded-2xl transition-all text-xs uppercase tracking-widest shadow-lg ${
                isRemanejamento
                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                  : "bg-slate-900 hover:bg-blue-600 shadow-slate-200"
              }`}
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Detail = ({ label, value, className = "", color = "text-slate-700" }) => (
  <div className={`flex flex-col ${className}`}>
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">
      {label}
    </span>
    <div className={`text-[12px] font-bold ${color}`}>{value || "---"}</div>
  </div>
);

export default ModalDetalhes;
