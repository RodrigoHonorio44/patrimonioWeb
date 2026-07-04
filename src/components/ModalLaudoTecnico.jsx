import React, { useState } from "react";
import { db } from "../services/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { 
  X, 
  Printer, 
  Eye, 
  FileText, 
  CheckCircle,
  Wrench,
  AlertOctagon
} from "lucide-react";

const ModalLaudoTecnico = ({ equipamento, isOpen, onClose, onAtualizar }) => {
  // Controle de telas: formulario | preview
  const [etapa, setEtapa] = useState("formulario"); 
  
  // Estados dos inputs livres do Laudo
  const [diagnosticoTecnico, setDiagnosticoTecnico] = useState("");
  const [justificativaSubstituicao, setJustificativaSubstituicao] = useState("");
  const [processando, setProcessando] = useState(false);

  if (!isOpen || !equipamento) return null;

  const fecharELimpar = () => {
    setEtapa("formulario");
    setDiagnosticoTecnico("");
    setJustificativaSubstituicao("");
    onClose();
  };

  // Grava o laudo e altera o status do ativo para "condenado" ou "substituição"
  const emitirLaudoDefinitivo = async () => {
    if (!diagnosticoTecnico.trim() || !justificativaSubstituicao.trim()) {
      toast.error("Por favor, preencha todos os campos do laudo técnico.");
      return;
    }

    setProcessando(true);
    try {
      const ativoRef = doc(db, "ativos", equipamento.id);
      
      await updateDoc(ativoRef, {
        status: "condenado",
        // Padronização: Salvando inputs livres em lowercase no Firebase para buscas precisas
        diagnosticoDefeito: diagnosticoTecnico.toLowerCase().trim(),
        justificativaLaudo: justificativaSubstituicao.toLowerCase().trim(),
        dataLaudoTecnico: serverTimestamp(),
        ultimaMovimentacao: serverTimestamp()
      });

      toast.success("Laudo técnico emitido e registrado com sucesso!");
      fecharELimpar();
      if (onAtualizar) onAtualizar();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar o laudo técnico.");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0 print:shadow-none">
      
      {/* ETAPA 1: FORMULÁRIO DE PARECER TÉCNICO */}
      {etapa === "formulario" && (
        <div className="bg-white rounded-[32px] p-6 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2">
              <Wrench size={16} className="text-blue-600" /> Emitir Laudo de Inviabilidade Técnica
            </h3>
            <button onClick={fecharELimpar} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Resumo do Ativo */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs font-sans">
            <div className="grid grid-cols-2 gap-2">
              <div className="capitalize"><strong>Equipamento:</strong> <span className="text-slate-700">{equipamento.nome}</span></div>
              <div><strong>Nº Patrimônio:</strong> <span className="text-blue-600 font-mono uppercase">{equipamento.patrimonio || "S/P"}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2">
              <div><strong>Unidade:</strong> <span className="text-slate-700">{equipamento.unidade}</span></div>
              <div className="capitalize"><strong>Setor Atual:</strong> <span className="text-slate-700">{equipamento.setor}</span></div>
            </div>
          </div>

          {/* Form Inputs livres */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Diagnóstico Técnico / Situação do Ativo
              </label>
              <textarea
                rows={3}
                placeholder="Descreva detalhadamente os defeitos encontrados e o porquê de não haver condições de manutenção (Ex: Placa lógica principal queimada, sem peças de reposição no mercado)."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                value={diagnosticoTecnico}
                onChange={(e) => setDiagnosticoTecnico(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Justificativa para Substituição Imediata
              </label>
              <textarea
                rows={3}
                placeholder="Justifique o impacto da falta deste equipamento na unidade e a necessidade de troca (Ex: Equipamento essencial para o fluxo de atendimento do setor, gerando gargalo operacional)."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                value={justificativaSubstituicao}
                onChange={(e) => setJustificativaSubstituicao(e.target.value)}
              />
            </div>
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
              disabled={!diagnosticoTecnico.trim() || !justificativaSubstituicao.trim()}
              onClick={() => setEtapa("preview")}
              className="flex-1 bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-slate-900 flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              <Eye size={14} /> Pré-visualizar Laudo
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 2: LAUDO TÉCNICO OFICIAL EM FORMATO A4 PARA IMPRESSÃO */}
      {etapa === "preview" && (
        <div className="bg-white w-full max-w-[800px] min-h-[1050px] shadow-2xl p-12 flex flex-col justify-between font-serif text-slate-900 mx-auto rounded-[24px] print:rounded-none print:shadow-none print:p-4 animate-in fade-in duration-200">
          
          {/* Menu Superior do Preview (Escondido na Folha Impressa) */}
          <div className="flex justify-between items-center bg-slate-100 border border-slate-200 p-4 rounded-2xl mb-8 font-sans print:hidden">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-tight">
              <FileText size={16} /> Conferência do Laudo de Inviabilidade
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEtapa("formulario")}
                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 uppercase tracking-wider cursor-pointer"
              >
                Editar
              </button>
              <button
                onClick={() => window.print()}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-900 flex items-center gap-1.5 shadow-md uppercase tracking-wider cursor-pointer"
              >
                <Printer size={14} /> Imprimir Laudo
              </button>
              <button
                onClick={emitirLaudoDefinitivo}
                disabled={processando}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 shadow-md uppercase tracking-wider cursor-pointer"
              >
                <CheckCircle size={14} /> {processando ? "Salvando..." : "Homologar Laudo no Banco"}
              </button>
            </div>
          </div>

          {/* Conteúdo Físico do Papel */}
          <div>
            {/* Cabeçalho de Logos */}
            <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-200 w-full">
              <img src="/Imagem1.png" alt="Logo 1" className="h-12 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem2.png" alt="Logo 2" className="h-12 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem3.png" alt="Logo 3" className="h-12 w-auto max-w-[22%] object-contain" />
              <img src="/Imagem4.png" alt="Logo 4" className="h-12 w-auto max-w-[22%] object-contain" />
            </div>

            <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6 mb-8 font-sans">
              <h2 className="text-xl font-black uppercase tracking-wide">Laudo Técnico de Inviabilidade e Substituição de Bem</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Setor de Engenharia Clínica e Manutenção Central</p>
            </div>

            {/* Informações Estruturadas do Bem */}
            <div className="grid grid-cols-2 gap-y-3 text-sm mb-6 font-sans border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <div className="capitalize"><strong>Equipamento / Ativo:</strong> {equipamento.nome}</div>
              <div><strong>Nº de Patrimônio (TAG):</strong> <span className="font-mono font-bold uppercase">{equipamento.patrimonio || "S/P"}</span></div>
              <div><strong>Unidade de Origem:</strong> {equipamento.unidade}</div>
              <div className="capitalize"><strong>Setor de Alocação:</strong> {equipamento.setor}</div>
              <div><strong>Data do Diagnóstico:</strong> {new Date().toLocaleDateString("pt-BR")}</div>
              <div className="text-red-600 font-bold flex items-center gap-1">
                <AlertOctagon size={14} /> Classificação: Inserviceável / Condenado
              </div>
            </div>

            {/* Corpo do Parecer Técnico */}
            <div className="space-y-6 text-sm leading-relaxed text-justify">
              <div>
                <h4 className="font-sans font-bold text-xs uppercase text-slate-500 tracking-wider mb-2">1. Diagnóstico e Parecer do Exame Técnico</h4>
                <p className="bg-slate-50/40 p-4 rounded-xl border border-slate-100 italic">
                  {diagnosticoTecnico}
                </p>
              </div>

              <div>
                <h4 className="font-sans font-bold text-xs uppercase text-slate-500 tracking-wider mb-2">2. Justificativa para Nexo de Substituição</h4>
                <p className="bg-slate-50/40 p-4 rounded-xl border border-slate-100 italic">
                  {justificativaSubstituicao}
                </p>
              </div>

              <p className="pt-2">
                Conclui-se que o referido patrimônio apresenta desgaste oneroso ou obsolescência técnica que inviabiliza economicamente qualquer intervenção de manutenção corretiva. Fica recomendada a baixa do registro patrimonial vigente da unidade e a aquisição/permuta de um novo ativo correspondente para suprimento das demandas do setor afetado.
              </p>
            </div>
          </div>

          {/* Rodapé Administrativo para Assinaturas */}
          <div className="mt-20 pt-12 font-sans">
            <div className="grid grid-cols-2 gap-12 text-center text-xs">
              <div className="space-y-1">
                <div className="border-t border-slate-400 w-full mx-auto pt-2"></div>
                <p className="font-bold text-slate-700">Técnico Responsável pela Avaliação</p>
                <p className="text-[10px] text-slate-400 uppercase">Visto Técnico / CFT</p>
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

export default ModalLaudoTecnico;