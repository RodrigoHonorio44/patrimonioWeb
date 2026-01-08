import React from "react";
import { FiX } from "react-icons/fi";

const ModalDetalhesAnalista = ({ chamado, isRemaneja, onClose, isOpen }) => {
  // Se não estiver aberto ou não houver chamado, não renderiza nada
  if (!isOpen || !chamado) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop: Fundo escuro. Clicar aqui também fecha o modal */}
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Box do Modal: stopPropagation evita que cliques aqui dentro fechem o modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-[32px] w-full max-w-2xl p-8 border-t-8 shadow-2xl animate-in zoom-in-95 duration-200 ${
          isRemaneja(chamado) ? "border-orange-500" : "border-blue-600"
        }`}
      >
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase italic text-slate-800">
            Ficha OS #{chamado.numeroOs}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
          >
            <FiX size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Solicitante
              </p>
              <p className="font-bold text-slate-700 uppercase">
                {chamado.nome}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Unidade
              </p>
              <p className="font-bold text-slate-700 uppercase">
                {chamado.unidade}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border-l-4 border-blue-500">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
              Descrição / Problema
            </p>
            <p className="font-bold text-slate-700 text-sm leading-relaxed whitespace-pre-wrap uppercase">
              {chamado.problema || chamado.descricao || "Sem detalhes"}
            </p>
          </div>

          {isRemaneja(chamado) && (
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
              <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">
                Setor de Destino
              </p>
              <p className="font-bold text-orange-700 uppercase">
                {chamado.setorDestino || "Não Informado"}
              </p>
            </div>
          )}
        </div>

        {/* Botão Inferior para fechar (Reforço) */}
        <div className="mt-8">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalhesAnalista; // Corrigido aqui!
