import React from "react";
import { FiX, FiInfo, FiMapPin, FiTool, FiAlertCircle, FiUsers, FiArrowRight } from "react-icons/fi";

const ModalDetalhesAnalista = ({ chamado, isRemaneja, onClose, isOpen }) => {
  if (!isOpen || !chamado) return null;

  const rem = isRemaneja(chamado);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Box do Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-[24px] sm:rounded-[32px] w-full max-w-2xl p-5 sm:p-8 border-t-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] ${
          rem ? "border-orange-500" : "border-blue-600"
        }`}
      >
        {/* Cabeçalho - Fixo no topo */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase italic text-slate-800 flex items-center gap-2 leading-tight">
              <FiInfo className={rem ? "text-orange-500" : "text-blue-600"} />
              Ficha OS #{chamado.numeroOs}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
              Status Atual:{" "}
              <span className="text-slate-600">{chamado.status}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm flex-shrink-0"
          >
            <FiX size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Conteúdo com Scroll Interno */}
        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          {/* Grid Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Solicitante */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-sm/none font-black text-slate-400 uppercase tracking-widest mb-1">
                Solicitante
              </p>
              <p className="font-bold text-slate-700 uppercase break-words">
                {chamado.nome || chamado.quemSolicitou}
              </p>
            </div>
            
            {/* Unidade / Local */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-sm/none font-black text-slate-400 uppercase tracking-widest mb-1">
                Unidade / Local
              </p>
              <p className="font-bold text-slate-700 uppercase break-words">
                {chamado.unidade}
              </p>
            </div>
          </div>

          {/* NOVO: Exibição da Equipe Responsável */}
          <div className={`${rem ? "bg-orange-50/50 border-orange-200" : "bg-blue-50/30 border-blue-100"} p-4 rounded-2xl border flex items-center gap-3`}>
            <div className={`p-2.5 rounded-xl ${rem ? "bg-orange-100 text-orange-500" : "bg-blue-100 text-blue-600"}`}>
              <FiUsers size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Equipe Responsável
              </p>
              <p className={`font-black text-sm uppercase ${rem ? "text-orange-700" : "text-blue-700"}`}>
                {chamado.equipe || "Não Definida"}
              </p>
            </div>
          </div>

          {/* Seção de Localização/Patrimônio/Equipamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Setor de Origem ou Setor Padrão */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-sm/none font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <FiMapPin size={10} /> {rem ? "Setor de Origem" : "Setor"}
              </p>
              <p className="font-bold text-slate-700 uppercase break-words">
                {rem 
                  ? (chamado.setorOrigem && chamado.setorOrigem.trim() !== "" ? chamado.setorOrigem : "Não Informado")
                  : (chamado.setor && chamado.setor.trim() !== "" ? chamado.setor : "Não Informado")
                }
              </p>
            </div>

            {/* Equipamento */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-sm/none font-black text-slate-400 uppercase tracking-widest mb-1">
                Equipamento
              </p>
              <p className={`font-black uppercase break-words ${rem ? "text-orange-600" : "text-blue-600"}`}>
                {chamado.equipamento || "Não informado"}
              </p>
            </div>

            {/* Setor de Destino ou Patrimônio */}
            {rem ? (
              <>
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 md:col-span-2 flex flex-col gap-1">
                  <p className="text-sm/none font-black text-orange-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <FiArrowRight size={12} /> Setor de Destino
                  </p>
                  <p className="font-bold text-orange-700 uppercase break-words">
                    {chamado.setorDestino || "Não Informado"}
                  </p>
                </div>
                {/* Mostra também o Patrimônio no remanejamento abaixo se ele existir */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                  <p className="text-sm/none font-black text-slate-400 uppercase tracking-widest mb-1">
                    Patrimônio do Equipamento
                  </p>
                  <p className="font-bold text-slate-700 uppercase">
                    {chamado.patrimonio || "S/P"}
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                <p className="text-sm/none font-black text-slate-400 uppercase tracking-widest mb-1">
                  Patrimônio
                </p>
                <p className="font-bold text-slate-700 uppercase">
                  {chamado.patrimonio || "N/A"}
                </p>
              </div>
            )}
          </div>

          {/* Descrição / Motivo */}
          <div className={`bg-slate-50 p-4 sm:p-5 rounded-2xl border-l-4 ${rem ? "border-orange-500" : "border-blue-500"}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
              {rem ? "Motivo do Remanejamento" : "Descrição do Problema"}
            </p>
            <p className="font-bold text-slate-700 text-sm leading-relaxed whitespace-pre-wrap uppercase">
              {chamado.descricao || chamado.problema || "Sem detalhes adicionais."}
            </p>
          </div>

          {/* SLA/Pausa */}
          {chamado.status === "pendente" && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start gap-3">
              <FiAlertCircle
                className="text-amber-600 mt-1 flex-shrink-0"
                size={18}
              />
              <div className="w-full">
                <p className="text-[10px] font-black text-amber-600 uppercase mb-1">
                  Motivo da Pausa (SLA)
                </p>
                <p className="text-sm font-bold text-amber-800 uppercase">
                  {chamado.motivoPausa || "Não Informado"}
                </p>
                {/* Correção de compatibilidade para detalhePausa ou detalhesPausa */}
                {(chamado.detalhePausa || chamado.detalhesPausa) && (
                  <p className="text-xs text-amber-700 italic mt-1.5 leading-tight uppercase">
                    {chamado.detalhePausa || chamado.detalhesPausa}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Parecer Técnico */}
          {(chamado.feedbackAnalista || (rem && chamado.patrimonio && chamado.patrimonio !== "S/P" && chamado.status === "concluido")) && (
            <div className="bg-emerald-50 p-4 sm:p-5 rounded-2xl border-l-4 border-emerald-500">
              <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest flex items-center gap-1">
                <FiTool size={12} /> Parecer Técnico / Finalização
              </p>
              <p className="font-bold text-emerald-800 text-sm leading-relaxed uppercase">
                {chamado.feedbackAnalista || "Atendimento concluído."}
              </p>
              {chamado.patrimonio && (
                <div className="mt-3 pt-2 border-t border-emerald-200">
                  <p className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter text-right">
                    Confirmado Patrimônio: {chamado.patrimonio}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botão Inferior */}
        <div className="mt-6 flex-shrink-0">
          <button
            onClick={onClose}
            className={`w-full text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-colors shadow-lg active:scale-[0.98] text-xs sm:text-sm ${
              rem ? "bg-orange-500 hover:bg-orange-600" : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            Fechar Visualização
          </button>
        </div>
      </div>

      {/* ESTILO SCROLLBAR */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `,
        }}
      />
    </div>
  );
};

export default ModalDetalhesAnalista;