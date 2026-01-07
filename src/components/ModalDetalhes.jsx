import React from "react";
import {
  FiX,
  FiCheckCircle,
  FiTool,
  FiPauseCircle,
  FiClock,
  FiCalendar,
} from "react-icons/fi";

const ModalDetalhes = ({ chamado, aoFechar, calcularSLA }) => {
  if (!chamado) return null;

  const statusLower = chamado.status?.toLowerCase().trim() || "";

  // Definições de estado de status
  const isPendente = statusLower === "pendente";
  const isPausado = statusLower === "pausado";
  const isFechado = statusLower === "fechado" || statusLower === "arquivado";
  const isRemanejamento = chamado.tipo === "Remanejamento";

  // Função para formatar o timestamp do Firebase
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
        <div className="p-8 md:p-10">
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

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar text-left">
            {/* BANNER DINÂMICO DE STATUS */}
            {isFechado ? (
              <div className="bg-green-50 border-l-[6px] border-green-500 p-6 rounded-r-2xl shadow-sm">
                <div className="flex items-center gap-2 text-green-700 font-black text-[11px] uppercase tracking-widest mb-3">
                  <FiCheckCircle size={20} /> SLA FINALIZADO
                </div>
                <p className="text-green-800 text-[15px] font-bold leading-tight italic">
                  {chamado.feedbackAnalista ||
                    "Atendimento concluído com sucesso."}
                </p>
              </div>
            ) : isPausado || isPendente ? (
              <div className="bg-orange-50 border-l-[6px] border-orange-500 p-6 rounded-r-2xl shadow-sm">
                <div className="flex items-center gap-2 text-orange-700 font-black text-[11px] uppercase tracking-widest mb-3">
                  <FiPauseCircle size={20} /> STATUS:{" "}
                  {statusLower.toUpperCase()}
                </div>
                <p className="text-orange-800 text-[15px] font-bold leading-tight italic">
                  {chamado.motivoPausa ||
                    chamado.motivoPendente ||
                    "Aguardando retorno ou material para prosseguir."}
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border-l-[6px] border-blue-500 p-6 rounded-r-2xl shadow-sm">
                <div className="flex items-center gap-2 text-blue-700 font-black text-[11px] uppercase tracking-widest mb-3">
                  <FiTool size={20} /> CHAMADO EM ANDAMENTO
                </div>
                <p className="text-blue-800 text-[15px] font-bold leading-tight italic">
                  O técnico iniciou a análise deste chamado.
                </p>
              </div>
            )}

            {/* GRID DE INFORMAÇÕES */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
              <Detail
                label="STATUS ATUAL"
                value={chamado.status}
                color={
                  isFechado
                    ? "text-green-600"
                    : isPendente || isPausado
                    ? "text-orange-500"
                    : "text-blue-600"
                }
              />
              <Detail
                label="TÉCNICO RESPONSÁVEL"
                value={chamado.tecnicoResponsavel || "Não atribuído"}
                color="text-slate-900"
              />

              {/* DATAS ADICIONADAS AQUI */}
              <Detail
                label="ABERTURA DO CHAMADO"
                value={formatarDataModal(chamado.criadoEm)}
              />
              <Detail
                label="FECHAMENTO / ATUALIZAÇÃO"
                value={formatarDataModal(chamado.finalizadoEm)}
              />

              <Detail
                label="TEMPO DE SLA"
                value={calcularSLA(chamado.criadoEm, chamado.finalizadoEm)}
              />
              <Detail label="EQUIPAMENTO" value={chamado.equipamento} />

              <Detail
                label={isRemanejamento ? "ORIGEM ➔ DESTINO" : "SETOR / UNIDADE"}
                value={
                  isRemanejamento
                    ? `${chamado.setorOrigem} ➔ ${chamado.setorDestino}`
                    : `${chamado.setor} (${chamado.unidade})`
                }
                className="col-span-2"
              />
            </div>

            {/* SEÇÃO: DIAGNÓSTICO */}
            <div className="bg-blue-50/30 p-6 rounded-[2.5rem] border border-blue-100">
              <p className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                <FiTool size={14} /> Diagnóstico / Ações Técnicas:
              </p>
              <p className="text-slate-700 text-sm font-semibold italic leading-relaxed">
                {chamado.feedbackAnalista ||
                  "Aguardando o técnico descrever as ações realizadas..."}
              </p>
            </div>

            <button
              onClick={aoFechar}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-orange-500 transition-all text-xs uppercase tracking-widest"
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
  <div className={`flex flex-col pb-2 ${className}`}>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
      {label}
    </span>
    <span className={`text-[13px] font-bold ${color}`}>{value || "---"}</span>
  </div>
);

export default ModalDetalhes;
