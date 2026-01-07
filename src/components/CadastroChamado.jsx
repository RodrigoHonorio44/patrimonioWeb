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
  CheckCircle2,
} from "lucide-react";
import { auth, db } from "../api/Firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function CadastroChamado({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState("");

  const [unidade, setUnidade] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [setor, setSetor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("média");
  const [naoSeiPatrimonio, setNaoSeiPatrimonio] = useState(false);

  if (!isOpen) return null;

  // Lógica para alternar o "Não sei"
  const toggleNaoSei = () => {
    const novoEstado = !naoSeiPatrimonio;
    setNaoSeiPatrimonio(novoEstado);
    if (novoEstado) {
      setPatrimonio("S/P"); // Preenche com S/P
    } else {
      setPatrimonio(""); // Limpa para digitar
    }
  };

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
        patrimonio,
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
      setSucesso(true);

      // Resetar campos
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md transition-all">
      {/* Ajuste de responsividade: max-h e overflow-y-auto */}
      <div className="bg-white w-full max-w-lg rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
        {sucesso ? (
          <div className="p-8 sm:p-10 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-y-auto">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              TUDO CERTO!
            </h2>
            <p className="text-slate-500 mb-8 text-sm sm:text-base">
              Seu chamado foi registrado: <br />
              <span className="text-blue-600 font-black text-xl mt-2 block italic uppercase tracking-widest">
                #{protocoloGerado}
              </span>
            </p>
            <button
              onClick={handleFechar}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all uppercase text-xs"
            >
              Concluir e Voltar
            </button>
          </div>
        ) : (
          <div className="p-6 sm:p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 italic uppercase tracking-tighter">
                  Novo Chamado
                </h2>
                <div className="h-1 w-12 bg-blue-600 rounded-full mt-1"></div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleNovoChamado}
              className="space-y-4 sm:space-y-5"
            >
              {/* UNIDADE */}
              <div className="group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                  Unidade de Atendimento
                </label>
                <div className="relative">
                  <Building2
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <select
                    required
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 appearance-none text-sm font-bold text-slate-700 transition-all"
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

              {/* GRID RESPONSIVO: 1 coluna no celular, 2 no PC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">
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

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                      Patrimônio
                    </label>
                    <button
                      type="button"
                      onClick={toggleNaoSei}
                      className={`text-[9px] font-black px-2 py-1 rounded-lg transition-all ${
                        naoSeiPatrimonio
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {naoSeiPatrimonio ? "DIGITAR" : "NÃO SEI"}
                    </button>
                  </div>
                  <div className="relative">
                    <Hash
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      required
                      readOnly={naoSeiPatrimonio}
                      value={patrimonio}
                      onChange={(e) => setPatrimonio(e.target.value)}
                      placeholder={naoSeiPatrimonio ? "S/P" : "Série/Tag"}
                      className={`w-full p-4 pl-11 border-2 rounded-2xl outline-none text-sm font-bold transition-all ${
                        naoSeiPatrimonio
                          ? "bg-amber-50 border-amber-100 text-amber-700 cursor-not-allowed"
                          : "bg-slate-50 border-slate-50 focus:bg-white focus:border-blue-600 text-slate-700"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">
                    Prioridade
                  </label>
                  <div className="relative">
                    <BarChart
                      className={`absolute left-4 top-1/2 -translate-y-1/2 ${
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
                      className="w-full p-4 pl-11 border-2 border-slate-50 bg-slate-50 rounded-2xl outline-none appearance-none text-sm font-black transition-all"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="média">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">
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
                    placeholder="Descreva o que aconteceu..."
                    rows="3"
                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-blue-600 text-sm font-medium text-slate-700 transition-all resize-none"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full relative group overflow-hidden bg-blue-600 text-white font-black py-4 sm:py-5 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 uppercase text-xs active:scale-95 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Send size={16} /> Enviar Chamado
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
