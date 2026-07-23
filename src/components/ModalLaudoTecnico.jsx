import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { 
  X, 
  Printer, 
  Eye, 
  FileText, 
  CheckCircle,
  Wrench,
  AlertOctagon,
  Clock,
  AlertTriangle
} from "lucide-react";

const ModalLaudoTecnico = ({ equipamento, isOpen, onClose, onAtualizar }) => {
  const [etapa, setEtapa] = useState("formulario"); 
  const [diagnosticoTecnico, setDiagnosticoTecnico] = useState("");
  const [justificativaSubstituicao, setJustificativaSubstituicao] = useState("");
  const [processando, setProcessando] = useState(false);

  const [historicoManutencoes, setHistoricoManutencoes] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  useEffect(() => {
    if (isOpen && equipamento?.patrimonio) {
      buscarHistoricoChamados();
    }
  }, [isOpen, equipamento]);

  const fecharELimpar = () => {
    setEtapa("formulario");
    setDiagnosticoTecnico("");
    setJustificativaSubstituicao("");
    setHistoricoManutencoes([]);
    onClose();
  };

  const buscarHistoricoChamados = async () => {
    setLoadingHistorico(true);
    try {
      const patrimonioLimpo = String(equipamento.patrimonio).trim().toLowerCase();
      
      const q = query(
        collection(db, "chamados"), 
        where("patrimonio", "==", patrimonioLimpo)
      );
      
      const querySnapshot = await getDocs(q);
      const listaOS = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setHistoricoManutencoes(listaOS);
    } catch (error) {
      console.error("Erro ao buscar histórico de chamados:", error);
      toast.error("Erro ao carregar histórico de manutenções.");
    } finally {
      setLoadingHistorico(false);
    }
  };

  const emitirLaudoDefinitivo = async () => {
    if (!diagnosticoTecnico.trim() || !justificativaSubstituicao.trim()) {
      toast.error("Por favor, preencha todos os campos do laudo técnico.");
      return;
    }

    setProcessando(true);
    try {
      const historicoTratado = historicoManutencoes.map(os => ({
        id: os.id,
        numeroOs: os.numeroOs || os.id.substring(0, 6),
        dataAbertura: os.dataAbertura || "n/i",
        defeito: (os.descricaoDefeito || os.descricaoProblema || "").toLowerCase().trim(),
        solucao: (os.solucaoTecnica || "").toLowerCase().trim()
      }));

      const laudosRef = collection(db, "laudos");
      await addDoc(laudosRef, {
        equipamentoId: equipamento.id,
        nomeEquipamento: equipamento.nome.toLowerCase().trim(),
        patrimonio: equipamento.patrimonio ? equipamento.patrimonio.toString().toLowerCase().trim() : "s/p",
        unidade: equipamento.unidade.toLowerCase().trim(),
        setor: equipamento.setor.toLowerCase().trim(),
        diagnosticoDefeito: diagnosticoTecnico.trim().toLowerCase(),
        justificativaLaudo: justificativaSubstituicao.trim().toLowerCase(),
        status: "pendente", 
        dataEmissao: serverTimestamp(),
        ultimaMovimentacao: serverTimestamp(),
        totalManutencoesAnteriores: historicoManutencoes.length,
        historicoAnexo: historicoTratado
      });

      const ativoRef = doc(db, "ativos", equipamento.id);
      await updateDoc(ativoRef, {
        status: "laudo pendente",
        diagnosticoDefeito: diagnosticoTecnico.trim().toLowerCase(),
        justificativaLaudo: justificativaSubstituicao.trim().toLowerCase(),
        dataLaudoTecnico: serverTimestamp(),
        ultimaMovimentacao: serverTimestamp()
      });

      toast.success("Laudo técnico emitido com sucesso! Aguardando homologação final.");
      fecharELimpar();
      if (onAtualizar) onAtualizar();
    } catch (error) {
      console.error("Erro ao processar laudo duplo:", error);
      toast.error("Erro ao registrar o laudo técnico.");
    } finally {
      setProcessando(false);
    }
  };

  if (!isOpen || !equipamento) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto print-container">
      
      {/* ETAPA 1: FORMULÁRIO DE PARECER TÉCNICO */}
      {etapa === "formulario" && (
        <div className="bg-white rounded-[24px] sm:rounded-[32px] w-full max-w-5xl shadow-2xl border border-slate-100 flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
          
          <div className="w-full md:w-5/12 bg-slate-50 p-4 sm:p-6 border-b md:border-b-0 md:border-r border-slate-200/60 flex flex-col overflow-y-auto max-h-[40vh] md:max-h-none">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-black text-slate-700 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-red-500" /> Histórico de Chamados Ocorridos
              </h4>
              <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                {historicoManutencoes.length} Ocorrência(s)
              </span>
            </div>

            {loadingHistorico ? (
              <div className="flex-grow flex items-center justify-center py-12">
                <p className="text-xs font-black text-slate-400 animate-pulse uppercase">Buscando folha corrida do ativo...</p>
              </div>
            ) : historicoManutencoes.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-400 p-6 text-center border border-dashed border-slate-200 rounded-2xl bg-white/50">
                <AlertTriangle size={28} className="opacity-30 mb-2 text-slate-500" />
                <p className="text-[11px] font-bold uppercase tracking-wide">Nenhuma manutenção anterior localizada para este patrimônio.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1 flex-grow">
                {historicoManutencoes.map((os) => (
                  <div key={os.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500 text-xs">
                    <div className="flex justify-between font-black text-slate-400 text-[9px] uppercase mb-1">
                      <span>OS #{os.numeroOs || os.id.substring(0, 6)}</span>
                      <span className="font-mono">{os.dataAbertura || "Data N/I"}</span>
                    </div>
                    <p className="font-bold text-slate-800 uppercase mb-1">
                      <span className="text-slate-400 font-medium">Reclamação:</span> {os.descricaoDefeito || os.descricaoProblema}
                    </p>
                    {os.solucaoTecnica && (
                      <p className="bg-emerald-50/60 text-emerald-800 p-2 rounded-lg font-medium mt-1 uppercase text-[11px] border border-emerald-100/40">
                        <span className="font-black">Ação Aplicada:</span> {os.solucaoTecnica}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full md:w-7/12 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[90vh]">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2">
                  <Wrench size={16} className="text-blue-600" /> Emitir Laudo de Inviabilidade Técnica
                </h3>
                <button onClick={fecharELimpar} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 border border-slate-100 space-y-2 text-xs font-sans">
                <div className="grid grid-cols-2 gap-2">
                  <div className="capitalize"><strong>Equipamento:</strong> <span className="text-slate-700">{equipamento.nome}</span></div>
                  <div><strong>Nº Patrimônio:</strong> <span className="text-blue-600 font-mono uppercase">#{equipamento.patrimonio || "S/P"}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2">
                  <div><strong>Unidade:</strong> <span className="text-slate-700 capitalize">{equipamento.unidade}</span></div>
                  <div className="capitalize"><strong>Setor Atual:</strong> <span className="text-slate-700">{equipamento.setor}</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Diagnóstico Técnico / Situação do Ativo
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Descreva detalhadamente os defeitos encontrados..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none uppercase"
                    value={diagnosticoTecnico}
                    onChange={(e) => setDiagnosticoTecnico(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Justificativa para Substituição Imediata
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Justifique o impacto da falta deste equipamento na unidade..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none uppercase"
                    value={justificativaSubstituicao}
                    onChange={(e) => setJustificativaSubstituicao(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-4 mt-4">
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

        </div>
      )}

      {/* ETAPA 2: PREVIEW / IMPRESSÃO */}
      {etapa === "preview" && (
        <div id="secao-laudo-oficial" className="bg-white w-full max-w-[850px] max-h-[90vh] shadow-2xl p-6 sm:p-10 flex flex-col justify-between font-serif text-slate-900 mx-auto rounded-[24px] animate-in fade-in duration-200 overflow-y-auto">
          
          <div className="flex justify-between items-center bg-slate-100 border border-slate-200 p-3 sm:p-4 rounded-2xl mb-4 font-sans barra-botoes-preview print:hidden shrink-0">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-tight">
              <FileText size={16} /> Conferência do Laudo de Inviabilidade
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEtapa("formulario")}
                className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-50 uppercase tracking-wider cursor-pointer"
              >
                Editar
              </button>
              <button
                onClick={() => window.print()}
                className="bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-900 flex items-center gap-1.5 shadow-md uppercase tracking-wider cursor-pointer"
              >
                <Printer size={14} /> Imprimir
              </button>
              <button
                onClick={emitirLaudoDefinitivo}
                disabled={processando}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 shadow-md uppercase tracking-wider cursor-pointer"
              >
                <CheckCircle size={14} /> {processando ? "Salvando..." : "Homologar"}
              </button>
            </div>
          </div>

          <div className="w-full flex flex-col justify-between flex-1 corpo-documento-print">
            <div>
              {/* CABEÇALHO DAS LOGOS COM PROPORÇÃO E MARGEM CORRETAS */}
              <div className="grid grid-cols-4 items-center justify-items-center gap-3 mb-4 pb-3 border-b border-slate-200 w-full px-2">
                <img src="/Imagem1.png" alt="Logo 1" className="max-h-12 w-auto object-contain" />
                <img src="/Imagem2.png" alt="Logo 2" className="max-h-12 w-auto object-contain" />
                <img src="/Imagem3.png" alt="Logo 3" className="max-h-12 w-auto object-contain" />
                <img src="/Imagem4.png" alt="Logo 4" className="max-h-12 w-auto object-contain" />
              </div>

              <div className="text-center space-y-1 border-b-2 border-slate-800 pb-3 mb-4 font-sans">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">Laudo Técnico de Inviabilidade e Substituição de Bem</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Setor de Patrimônio</p>
              </div>

              <div className="grid grid-cols-2 gap-y-1.5 text-xs mb-4 font-sans border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                <div className="capitalize"><strong>Equipamento / Ativo:</strong> {equipamento.nome}</div>
                <div><strong>Nº de Patrimônio (TAG):</strong> <span className="font-mono font-bold uppercase">#{equipamento.patrimonio || "S/P"}</span></div>
                <div className="capitalize"><strong>Unidade de Origem:</strong> {equipamento.unidade}</div>
                <div className="capitalize"><strong>Setor de Alocação:</strong> {equipamento.setor}</div>
                <div><strong>Data do Diagnóstico:</strong> {new Date().toLocaleDateString("pt-BR")}</div>
                <div className="text-red-600 font-bold flex items-center gap-1 uppercase text-[11px]">
                  <AlertOctagon size={13} /> Classificação: Inserviceável / Condenado
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-justify font-sans">
                <div>
                  <h4 className="font-bold text-[10px] uppercase text-slate-500 tracking-wider mb-1">1. Diagnóstico e Parecer do Exame Técnico</h4>
                  <p className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-100 italic whitespace-pre-wrap text-slate-800 uppercase">
                    {diagnosticoTecnico}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[10px] uppercase text-slate-500 tracking-wider mb-1">2. Justificativa para Nexo de Substituição</h4>
                  <p className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-100 italic whitespace-pre-wrap text-slate-800 uppercase">
                    {justificativaSubstituicao}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[10px] uppercase text-slate-500 tracking-wider mb-1 flex items-center gap-1">
                    3. Histórico de Ocorrências e Reincidências Vinculadas (Folha Corrida do Ativo)
                  </h4>
                  {historicoManutencoes.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic p-2 border border-slate-100 rounded-xl bg-slate-50/30 uppercase">
                      Sem registros anteriores de intervenções críticas nesta TAG até a presente data.
                    </p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm max-h-36 overflow-y-auto">
                      <table className="w-full text-[10px] border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black uppercase text-[9px] sticky top-0">
                            <th className="p-2 w-[15%]">Cód OS</th>
                            <th className="p-2 w-[15%]">Abertura</th>
                            <th className="p-2 w-[35%]">Defeito Constatado</th>
                            <th className="p-2 w-[35%]">Ação/Solução Aplicada</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 uppercase">
                          {historicoManutencoes.map((os) => (
                            <tr key={os.id} className="hover:bg-slate-50/50">
                              <td className="p-1.5 font-mono font-bold text-slate-500">#{os.numeroOs || os.id.substring(0, 6)}</td>
                              <td className="p-1.5 text-slate-500">{os.dataAbertura || "n/i"}</td>
                              <td className="p-1.5 font-medium">{os.descricaoDefeito || os.descricaoProblema}</td>
                              <td className="p-1.5 text-slate-600 bg-slate-50/30">{os.solucaoTecnica || "intervenção técnica s/ r."}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <p className="pt-1 font-serif text-xs">
                  Conclui-se que o referido patrimônio apresenta desgaste oneroso ou obsolescência técnica que inviabiliza economicamente qualquer intervenção de manutenção corretiva conforme histórico analítico anexo. Fica recomendada pelo **Setor de Patrimônio** a baixa do registro patrimonial vigente da unidade.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 font-sans shrink-0">
              <div className="grid grid-cols-2 gap-12 text-center text-xs">
                <div className="space-y-1">
                  <div className="border-t border-slate-400 w-full mx-auto pt-2"></div>
                  <p className="font-bold text-slate-700">Técnico Responsável pela Avaliação</p>
                  <p className="text-[10px] text-slate-400 uppercase">Visto Técnico</p>
                </div>
                <div className="space-y-1">
                  <div className="border-t border-slate-400 w-full mx-auto pt-2"></div>
                  <p className="font-bold text-slate-700">Direção / Supervisão Hospitalar</p>
                  <p className="text-[10px] text-slate-400 uppercase">Assinatura e Carimbo</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ESTILOS DE IMPRESSÃO CORRIGIDOS E SEGURbuffer */}
      <style>{`
        @media print {
          /* Define o tamanho da folha A4 e as margens padrão da impressora */
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }

          /* Oculta apenas os elementos que não devem ir para o papel */
          body * {
            visibility: hidden !important;
          }

          /* Revela EXCLUSIVAMENTE a folha do laudo e seus filhos */
          #secao-laudo-oficial,
          #secao-laudo-oficial * {
            visibility: visible !important;
          }

          /* Posiciona o laudo no topo exato da página impressa */
          #secao-laudo-oficial {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }

          /* Esconde os botões do modal no papel */
          .barra-botoes-preview {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ModalLaudoTecnico;
