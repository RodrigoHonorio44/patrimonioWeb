import React, { useState } from "react";
import { db } from "../services/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { 
  X, 
  Printer, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  Archive
} from "lucide-react";

const ModalInventario = ({ equipamento, isOpen, onClose, onAtualizar }) => {
  // Estados de controle das etapas internas da baixa
  const [etapa, setEtapa] = useState("confirmacao"); // confirmacao | formulario | preview
  const [localArmazenamento, setLocalArmazenamento] = useState("");
  const [processando, setProcessando] = useState(false);

  if (!isOpen || !equipamento) return null;

  // Reseta os estados internos e fecha o modal completo
  const fecharELimpar = () => {
    setEtapa("confirmacao");
    setLocalArmazenamento("");
    onClose();
  };

  // Executa a baixa definitiva gravando no Firebase
  const executarBaixaDefinitiva = async () => {
    if (!localArmazenamento.trim()) {
      toast.error("Por favor, informe o local onde o patrimônio será guardado.");
      return;
    }

    setProcessando(true);
    try {
      const ativoRef = doc(db, "ativos", equipamento.id);
      
      await updateDoc(ativoRef, {
        status: "baixado",
        // Salva em lowercase para padronização de buscas no banco
        localArmazenamentoAcervo: localArmazenamento.toLowerCase().trim(),
        dataBaixa: serverTimestamp(),
        ultimaMovimentacao: serverTimestamp()
      });

      toast.success("Baixa de patrimônio realizada com sucesso!");
      fecharELimpar();
      if (onAtualizar) onAtualizar();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar a baixa do patrimônio.");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0 print:shadow-none">
      
      {/* ETAPA 1: CONFIRMAÇÃO INICIAL */}
      {etapa === "confirmacao" && (
        <div className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-red-50 text-red-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-base uppercase">Confirmar Processo de Baixa?</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Você está prestes a iniciar o termo de baixa do patrimônio <span className="font-bold text-slate-600 font-mono uppercase">{equipamento.patrimonio || "S/P"}</span>. Deseja prosseguir?
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={fecharELimpar}
              className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
            >
              Não
            </button>
            <button
              onClick={() => setEtapa("formulario")}
              className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-red-700 shadow-md uppercase tracking-wider cursor-pointer"
            >
              Sim
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 2: FORMULÁRIO DE PREENCHIMENTO DO DESTINO */}
      {etapa === "formulario" && (
        <div className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2">
              <Archive size={16} className="text-red-600" /> Detalhes da Baixa Patrimonial
            </h3>
            <button onClick={fecharELimpar} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs font-sans">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-slate-400 font-bold block uppercase text-[10px]">Equipamento:</span> <strong className="text-slate-700 capitalize">{equipamento.nome}</strong></div>
              <div><span className="text-slate-400 font-bold block uppercase text-[10px]">Nº Patrimônio:</span> <strong className="text-blue-600 font-mono uppercase">{equipamento.patrimonio || "S/P"}</strong></div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2">
              <div><span className="text-slate-400 font-bold block uppercase text-[10px]">Unidade Atual:</span> <strong className="text-slate-700">{equipamento.unidade}</strong></div>
              <div><span className="text-slate-400 font-bold block uppercase text-[10px]">Setor Atual:</span> <strong className="text-slate-700 capitalize">{equipamento.setor}</strong></div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Local de Armazenamento / Destino do Descarte
            </label>
            <input
              type="text"
              placeholder="Ex: Depósito de Inservíveis / Galpão Central"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500 transition-all"
              value={localArmazenamento}
              onChange={(e) => setLocalArmazenamento(e.target.value)} // Mantém o input livre conforme sua preferência
            />
          </div>

          <div className="flex gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={fecharELimpar}
              className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!localArmazenamento.trim()}
              onClick={() => setEtapa("preview")}
              className="flex-1 bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-slate-900 flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              <Eye size={14} /> Visualizar Termo
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 3: LAUDO OFICIAL EM FORMATO A4 PARA IMPRESSÃO */}
      {etapa === "preview" && (
        <div className="bg-white w-full max-w-[800px] min-h-[1050px] shadow-2xl p-12 flex flex-col justify-between font-serif text-slate-900 mx-auto rounded-[24px] print:rounded-none print:shadow-none print:p-4 animate-in fade-in duration-200">
          
          {/* Menu Superior do Preview (Escondido na Folha Impressa) */}
          <div className="flex justify-between items-center bg-slate-100 border border-slate-200 p-4 rounded-2xl mb-8 font-sans print:hidden">
            <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-tight">
              <AlertTriangle size={16} /> Conferência do Laudo de Baixa
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEtapa("formulario")}
                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 uppercase tracking-wider cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={() => window.print()}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-900 flex items-center gap-1.5 shadow-md uppercase tracking-wider cursor-pointer"
              >
                <Printer size={14} /> Imprimir Documento
              </button>
              <button
                onClick={executarBaixaDefinitiva}
                disabled={processando}
                className="bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 shadow-md uppercase tracking-wider cursor-pointer"
              >
                <CheckCircle size={14} /> {processando ? "Processando..." : "Confirmar Baixa no Sistema"}
              </button>
            </div>
          </div>

          {/* Conteúdo Físico do Papel */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-200 w-full">
              <img src="/Imagem1.png" alt="Logo 1" className="h-12 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem2.png" alt="Logo 2" className="h-12 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem3.png" alt="Logo 3" className="h-12 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem4.png" alt="Logo 4" className="h-12 w-auto max-w-[22%] object-contain" />
            </div>

            <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6 mb-8 font-sans">
              <h2 className="text-xl font-black uppercase tracking-wide">Termo de Baixa Definitiva de Bem Patrimonial</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Setor de Patrimônio e Inventário Central</p>
            </div>

            <div className="grid grid-cols-2 gap-y-4 text-sm mb-8 font-sans border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <div className="capitalize"><strong>Equipamento / Ativo:</strong> {equipamento.nome}</div>
              <div><strong>Nº de Patrimônio (TAG):</strong> <span className="font-mono font-bold uppercase">{equipamento.patrimonio || "S/P"}</span></div>
              <div><strong>Unidade de Origem:</strong> {equipamento.unidade}</div>
              <div className="capitalize"><strong>Setor de Origem:</strong> {equipamento.setor}</div>
              <div className="col-span-2 border-t border-slate-200 pt-2 capitalize text-red-700">
                <strong>Destino / Local de Armazenamento:</strong> {localArmazenamento}
              </div>
              <div><strong>Data de Emissão:</strong> {new Date().toLocaleDateString("pt-BR")}</div>
              <div><strong>Status do Processo:</strong> Aguardando Homologação</div>
            </div>

            <div className="text-sm leading-relaxed text-justify mb-8 space-y-4">
              <p>
                Pelo presente termo técnico de controle de acervo, atesta-se que o equipamento acima discriminado foi retirado de suas atividades operacionais na respectiva unidade de saúde física, passando pelo processo de desativação patrimonial permanente.
              </p>
              <p>
                O bem foi devidamente conferido por número de tombamento individualizado e encaminhado para o local de destinação/armazenamento final especificado neste documento, ficando proibida sua reutilização ou movimentação interna sem prévia abertura de processo administrativo de reversão.
              </p>
            </div>
          </div>

          {/* Rodapé Corrigido para as Assinaturas Administrativas Oficiais */}
          <div className="mt-20 pt-12 font-sans">
            <div className="grid grid-cols-2 gap-12 text-center text-xs">
              <div className="space-y-1">
                <div className="border-t border-slate-400 w-full mx-auto pt-2"></div>
                <p className="font-bold text-slate-700">Técnico de Patrimônio</p>
                <p className="text-[10px] text-slate-400 uppercase">Setor de Patrimônio / Matrícula</p>
              </div>
              <div className="space-y-1">
                <div className="border-t border-slate-400 w-full mx-auto pt-2"></div>
                <p className="font-bold text-slate-700">Direção / Supervisão Hospitalar</p>
                <p className="text-[10px] text-slate-400 uppercase">Assinatura e Carimbo</p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default ModalInventario;