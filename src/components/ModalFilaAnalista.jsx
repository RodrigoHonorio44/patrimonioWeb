import React from "react";
import { FiX, FiAlertCircle } from "react-icons/fi";

const ModalFilaAnalista = ({
  isOpen,
  tipoModal, // "visualizar", "finalizar" ou "pausar"
  chamado,
  onClose,
  equipamento,
  setEquipamento,
  patrimonio,
  setPatrimonio,
  parecerTecnico,
  setParecerTecnico,
  handleFinalizar,
  motivoPausa,
  setMotivoPausa,
  detalhePausa,
  setDetalhePausa,
  handlePausar,
}) => {
  if (!isOpen || !chamado) return null;

  // ----------------------------------------------------
  // 1. MODAL VISUALIZAR DETALHES
  // ----------------------------------------------------
  if (tipoModal === "visualizar") {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          
          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-2 text-blue-600">
              <FiAlertCircle size={24} className="stroke-[2.5]" />
              <h2 className="text-xl font-black tracking-wide uppercase italic">
                FICHA OS #{chamado.numeroOs || "Sem Número"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          <p className="text-xs font-bold text-slate-400 uppercase -mt-3 mb-5 tracking-wider">
            Status Atual: <span className="text-blue-600 font-black">{chamado.status}</span>
          </p>

          {/* Grid de Informações Principal - Ajustado para 3 colunas para acomodar os 5 campos perfeitamente */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {/* Solicitante */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Solicitante</label>
              <p className="text-sm font-black text-slate-700 uppercase">{chamado.nome || "Não informado"}</p>
            </div>

            {/* Unidade / Local */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Unidade / Local</label>
              <p className="text-sm font-black text-slate-700 uppercase">{chamado.unidade || "Não informada"}</p>
            </div>

            {/* Setor */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Setor</label>
              <p className="text-sm font-black text-slate-700 uppercase">{chamado.setor || "Não informado"}</p>
            </div>

            {/* Equipamento */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Equipamento</label>
              <p className="text-sm font-black text-blue-600 uppercase">{chamado.equipamento || "Não informado"}</p>
            </div>

            {/* Patrimônio */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl md:col-span-2">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Patrimônio</label>
              <p className="text-sm font-black text-slate-700 uppercase">{chamado.patrimonio || "S/P"}</p>
            </div>
          </div>

          {/* Descrição do Problema */}
          <div className="bg-slate-50 border border-l-4 border-blue-500 p-4 rounded-r-2xl mb-6">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Descrição do Problema</label>
            <p className="text-sm font-bold text-slate-700 uppercase leading-relaxed">
              {chamado.descricao || chamado.problema || "Sem descrição"}
            </p>
          </div>

          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-sm tracking-widest py-4 rounded-2xl uppercase transition-colors"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. MODAL FINALIZAR OS
  // ----------------------------------------------------
  if (tipoModal === "finalizar") {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-4xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
          <h2 className="text-2xl font-black mb-6 text-slate-800 uppercase italic">
            Finalizar OS
          </h2>
          <form onSubmit={handleFinalizar} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">
                Equipamento
              </label>
              <input
                type="text"
                value={equipamento || chamado.equipamento || ""}
                onChange={(e) => setEquipamento && setEquipamento(e.target.value.toLowerCase())}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold focus:ring-2 focus:ring-emerald-500"
                placeholder="Ex: leito elétrico"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">
                Patrimônio
              </label>
              <input
                required
                type="text"
                value={patrimonio}
                onChange={(e) => setPatrimonio(e.target.value.toLowerCase())}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold focus:ring-2 focus:ring-emerald-500"
                placeholder="Ex: 25116"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">
                Parecer Técnico
              </label>
              <textarea
                required
                value={parecerTecnico}
                onChange={(e) => setParecerTecnico(e.target.value.toLowerCase())}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 h-32 outline-none font-medium focus:ring-2 focus:ring-emerald-500"
                placeholder="Descreva a solução técnica aplicada..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 font-black uppercase text-xs text-slate-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-500 py-4 rounded-2xl font-black uppercase text-xs text-white shadow-lg active:scale-95"
              >
                Concluir OS
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. MODAL PAUSAR SLA
  // ----------------------------------------------------
  if (tipoModal === "pausar") {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-4xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
          <h2 className="text-2xl font-black mb-6 text-slate-800 uppercase">
            Pausar SLA
          </h2>
          <form onSubmit={handlePausar} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">
                Equipamento
              </label>
              <input
                type="text"
                disabled
                value={chamado.equipamento || ""}
                className="w-full p-4 rounded-2xl bg-slate-100 border border-slate-200 outline-none font-bold text-slate-500 uppercase cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">
                Motivo da Pausa
              </label>
              <select
                required
                value={motivoPausa}
                onChange={(e) => setMotivoPausa(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Selecione o motivo...</option>
                <option value="Aguardando Peça">Aguardando Peça</option>
                <option value="Recolhido para Oficina">Recolhido para Oficina</option>
                <option value="Aguardando Retorno Usuário">Aguardando Retorno Usuário</option>
                <option value="Serviço Externo">Serviço Externo</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">
                Detalhes da Pausa
              </label>
              <textarea
                required
                value={detalhePausa}
                onChange={(e) => setDetalhePausa(e.target.value.toLowerCase())}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 h-24 outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Detalhes adicionais..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 text-slate-400 font-black uppercase text-xs"
              >
                Sair
              </button>
              <button
                type="submit"
                className="flex-1 bg-amber-500 py-4 rounded-2xl text-white font-black uppercase text-xs shadow-lg active:scale-95"
              >
                Confirmar Pausa
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default ModalFilaAnalista;