import React, { useEffect } from "react";
import { X, Send, Loader2, Building2, Monitor, Hash, MapPin, FileText, BarChart, CheckCircle2, Users, Search, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCadastroChamado } from "../hooks/useCadastroChamado";

export default function CadastroChamado({ isOpen = true, onClose }) {
  const navigate = useNavigate();
  const hook = useCadastroChamado();

  // Garante que, se o setor for preenchido pela busca, ele fique editável
  useEffect(() => {
    if (hook.setor) {
      hook.setSetorManual(true);
    }
  }, [hook.setor]);

  if (onClose && !isOpen) return null;

  const handleFechar = () => {
    hook.setSucesso(false);
    if (onClose) onClose();
    else navigate(-1);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
        {hook.sucesso ? (
          <div className="p-10 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">Protocolo Gerado!</h2>
            <p className="text-slate-500 mb-8 italic text-xl font-bold">#{hook.protocoloGerado}</p>
            <button onClick={handleFechar} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all uppercase text-xs">
              Concluir e Voltar
            </button>
          </div>
        ) : (
          <div className="p-6 sm:p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Novo Chamado</h2>
              <button onClick={handleFechar} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={hook.handleNovoChamado} className="space-y-4">
              {/* Patrimônio */}
              <div>
                <div className="flex justify-between items-center mb-1 px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patrimônio / Tag</label>
                  <button type="button" onClick={hook.toggleNaoSei} className={`text-[9px] font-black px-2 py-1 rounded-lg transition-all ${hook.naoSeiPatrimonio ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {hook.naoSeiPatrimonio ? "DIGITAR" : "NÃO SEI TAG"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required readOnly={hook.naoSeiPatrimonio} value={hook.patrimonio} onChange={(e) => hook.setPatrimonio(e.target.value)} placeholder="Ex: 25779" className={`w-full p-4 pl-11 border-2 rounded-2xl outline-none text-sm font-bold ${hook.naoSeiPatrimonio ? "bg-amber-50 border-amber-200 text-slate-700" : "bg-slate-50 border-slate-50 focus:border-blue-600 text-slate-700"}`} />
                  </div>
                  <button type="button" disabled={hook.buscandoAtivo || hook.naoSeiPatrimonio} onClick={hook.handleBotaoBusca} className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 min-w-[52px]">
                    {hook.buscandoAtivo ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  </button>
                  <button type="button" onClick={hook.handleLimparCampos} className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-4 rounded-2xl flex items-center justify-center transition-all min-w-[52px]">
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>

              {/* Unidade */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Unidade</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select required value={hook.unidade} onChange={(e) => hook.setUnidade(e.target.value)} className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 appearance-none text-sm font-bold text-slate-700 transition-all">
                    <option value="">Onde você está?</option>
                    {Object.keys(hook.MAPA_SETORES_POR_UNIDADE || {}).map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Equipe */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Equipe Responsável</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select required value={hook.equipe} onChange={(e) => hook.setEquipe(e.target.value)} className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 appearance-none text-sm font-bold text-slate-700 transition-all cursor-pointer">
                    <option value="">Para qual equipe é o chamado?</option>
                    <option value="refrigeracao">Refrigeração</option>
                    <option value="patrimonio">Patrimônio</option>
                    <option value="ti computadores impressoras">TI Computadores e Impressoras</option>
                    <option value="ti sistema e redes">TI Sistema e Redes</option>
                    <option value="manutencao predial">Manutenção Predial</option>
                    <option value="engenharia clinica">Engenharia Clínica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Equipamento */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Equipamento</label>
                  <div className="relative">
                    <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required value={hook.equipamento} onChange={(e) => hook.setEquipamento(e.target.value)} placeholder="Ex: Frigobar" className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 text-sm font-bold text-slate-700" />
                  </div>
                </div>

                {/* Setor */}
                <div>
                  <div className="flex justify-between items-center mb-1 px-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {hook.setorManual ? "Digitar Setor" : "Setor"}
                    </label>
                    <button type="button" onClick={() => hook.setSetorManual(!hook.setorManual)} className="text-[9px] font-black text-blue-600 hover:underline uppercase">
                      {hook.setorManual ? "Lista" : "Não achou? Digitar"}
                    </button>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    {hook.setorManual ? (
                      <input required value={hook.setor} onChange={(e) => hook.setSetor(e.target.value)} placeholder="Digite o setor..." className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 text-sm font-bold text-slate-700" />
                    ) : (
                      <select required disabled={!hook.unidade} value={hook.setor} onChange={(e) => hook.setSetor(e.target.value)} className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 appearance-none text-sm font-bold text-slate-700">
                        <option value="">{hook.unidade ? "Selecione o setor..." : "Escolha a unidade primeiro"}</option>
                        {hook.MAPA_SETORES_POR_UNIDADE[hook.unidade]?.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Prioridade */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Prioridade</label>
                <div className="relative">
                  <BarChart className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select value={hook.prioridade} onChange={(e) => hook.setPrioridade(e.target.value)} className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 appearance-none text-sm font-bold text-slate-700">
                    <option value="baixa">Baixa</option>
                    <option value="média">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Descrição do Problema</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
                  <textarea required value={hook.descricao} onChange={(e) => hook.setDescricao(e.target.value)} placeholder="Descreva o problema detalhadamente..." rows="3" className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-blue-600 text-sm font-medium text-slate-700 resize-none" />
                </div>
              </div>

              <button disabled={hook.loading} type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 uppercase text-xs active:scale-95 disabled:opacity-70">
                {hook.loading ? <Loader2 className="animate-spin" /> : <><Send size={16} /> Enviar Chamado</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}