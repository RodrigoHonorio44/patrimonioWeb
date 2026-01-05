import React, { useState } from "react";
import {
  X,
  Send,
  Loader2,
  Building2,
  AlertCircle,
  Monitor,
  Hash,
  MapPin,
  FileText,
  BarChart,
  CheckCircle2, // Ícone para o sucesso
} from "lucide-react";
import { auth, db } from "../api/Firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function CadastroChamado({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false); // Novo estado
  const [protocoloGerado, setProtocoloGerado] = useState(""); // Para exibir no recibo

  // Estados do formulário
  const [unidade, setUnidade] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [setor, setSetor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("média");
  const [naoSeiPatrimonio, setNaoSeiPatrimonio] = useState(false);

  if (!isOpen) return null;

  const handleNovoChamado = async (e) => {
    e.preventDefault();
    if (!unidade) return;

    setLoading(true);
    const novaOs = `${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    try {
      await addDoc(collection(db, "chamados"), {
        equipamento,
        patrimonio: naoSeiPatrimonio ? "NÃO INFORMADO" : patrimonio,
        setor,
        descricao,
        unidade,
        prioridade,
        criadoEm: serverTimestamp(),
        emailSolicitante: auth.currentUser.email,
        nome:
          auth.currentUser.displayName || auth.currentUser.email.split("@")[0],
        numeroOs: novaOs,
        status: "aberto",
        userId: auth.currentUser.uid,
        feedbackAnalista: "",
        tecnicoResponsavel: "",
      });

      setProtocoloGerado(novaOs);
      setSucesso(true); // Ativa tela de sucesso

      // Limpeza de campos
      setEquipamento("");
      setPatrimonio("");
      setSetor("");
      setDescricao("");
      setUnidade("");
      setPrioridade("média");
      setNaoSeiPatrimonio(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar chamado técnico.");
    } finally {
      setLoading(false);
    }
  };

  const handleFechar = () => {
    setSucesso(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.25)] relative overflow-hidden animate-in zoom-in duration-300">
        {sucesso ? (
          /* TELA DE CONFIRMAÇÃO (REPLACE ALERT) */
          <div className="p-10 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 size={48} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
              TUDO CERTO!
            </h2>
            <p className="text-slate-500 font-medium mb-8">
              Seu chamado foi registrado com o protocolo: <br />
              <span className="text-blue-600 font-black text-2xl uppercase tracking-widest mt-2 block italic">
                #{protocoloGerado}
              </span>
            </p>
            <button
              onClick={handleFechar}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 uppercase tracking-widest text-xs"
            >
              Concluir e Voltar
            </button>
          </div>
        ) : (
          /* FORMULÁRIO */
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">
                  Novo Chamado
                </h2>
                <div className="h-1 w-12 bg-blue-600 rounded-full mt-1"></div>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleNovoChamado} className="space-y-5">
              {/* UNIDADE */}
              <div className="group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2 block group-focus-within:text-blue-600 transition-colors">
                  Unidade de Atendimento
                </label>
                <div className="relative">
                  <Building2
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                    size={18}
                  />
                  <select
                    required
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 appearance-none text-sm font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    <option value="">Onde você está?</option>
                    <option value="Hospital Conde">Hospital Conde</option>
                    <option value="UPA INOÃ">UPA INOÃ</option>
                    <option value="UPA SANTA RITA">UPA SANTA RITA</option>
                    <option value="SAMU BARROCO">SAMU BARROCO</option>
                    <option value="SAMU CENTRO">SAMU CENTRO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* EQUIPAMENTO */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">
                    Equipamento
                  </label>
                  <div className="relative">
                    <Monitor
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      required
                      value={equipamento}
                      onChange={(e) => setEquipamento(e.target.value)}
                      placeholder="Ex: Impressora"
                      className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 text-sm font-bold text-slate-700 transition-all"
                    />
                  </div>
                </div>

                {/* PATRIMÔNIO */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                      Patrimônio
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setNaoSeiPatrimonio(!naoSeiPatrimonio);
                        if (!naoSeiPatrimonio) setPatrimonio("");
                      }}
                      className={`text-[8px] font-black px-2 py-1 rounded-lg transition-all ${
                        naoSeiPatrimonio
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {naoSeiPatrimonio ? "SEM TAG" : "NÃO SEI"}
                    </button>
                  </div>
                  <div className="relative">
                    <Hash
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      required={!naoSeiPatrimonio}
                      disabled={naoSeiPatrimonio}
                      value={patrimonio}
                      onChange={(e) => setPatrimonio(e.target.value)}
                      placeholder={naoSeiPatrimonio ? "---" : "Série/Tag"}
                      className={`w-full p-4 pl-11 border-2 rounded-2xl outline-none text-sm font-bold transition-all ${
                        naoSeiPatrimonio
                          ? "bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-slate-50 border-slate-50 focus:bg-white focus:border-blue-600 text-slate-700"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* SETOR E PRIORIDADE */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">
                    Setor
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      required
                      value={setor}
                      onChange={(e) => setSetor(e.target.value)}
                      placeholder="Ex: Recepção"
                      className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 text-sm font-bold text-slate-700 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">
                    Prioridade
                  </label>
                  <div className="relative">
                    <BarChart
                      className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                        prioridade === "urgente"
                          ? "text-red-500"
                          : "text-slate-400"
                      }`}
                      size={18}
                    />
                    <select
                      required
                      value={prioridade}
                      onChange={(e) => setPrioridade(e.target.value)}
                      className={`w-full p-4 pl-11 border-2 rounded-2xl outline-none appearance-none text-sm font-black transition-all cursor-pointer ${
                        prioridade === "urgente"
                          ? "bg-red-50 border-red-200 text-red-700"
                          : prioridade === "alta"
                          ? "bg-orange-50 border-orange-200 text-orange-700"
                          : "bg-slate-50 border-slate-50 text-slate-700 focus:border-blue-600"
                      }`}
                    >
                      <option value="baixa">Baixa</option>
                      <option value="média">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* DESCRIÇÃO */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">
                  Relato do Problema
                </label>
                <div className="relative">
                  <FileText
                    className="absolute left-4 top-4 text-slate-400"
                    size={18}
                  />
                  <textarea
                    required
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o que aconteceu de forma clara..."
                    rows="3"
                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-blue-600 text-sm font-medium text-slate-700 transition-all resize-none"
                  />
                </div>
              </div>

              {naoSeiPatrimonio && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 animate-pulse">
                  <AlertCircle size={18} className="shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-tight">
                    Aviso: O técnico fará a triagem do patrimônio no local.
                  </span>
                </div>
              )}

              <button
                disabled={loading}
                type="submit"
                className="w-full relative group overflow-hidden bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Send size={16} /> Enviar Chamado Técnico
                  </>
                )}
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
