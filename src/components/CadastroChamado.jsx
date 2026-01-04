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
} from "lucide-react";
import { auth, db } from "../api/Firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function CadastroChamado({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [unidade, setUnidade] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [setor, setSetor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [naoSeiPatrimonio, setNaoSeiPatrimonio] = useState(false);

  if (!isOpen) return null;

  const handleNovoChamado = async (e) => {
    e.preventDefault();
    if (!unidade) {
      alert("Selecione a unidade");
      return;
    }

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
        criadoEm: serverTimestamp(),
        emailSolicitante: auth.currentUser.email,
        nome:
          auth.currentUser.displayName || auth.currentUser.email.split("@")[0],
        numeroOs: novaOs,
        status: "aberto",
        userId: auth.currentUser.uid,
        prioridade: "média",
        feedbackAnalista: "",
        tecnicoResponsavel: "",
      });

      // Limpar campos
      setEquipamento("");
      setPatrimonio("");
      setSetor("");
      setDescricao("");
      setUnidade("");
      setNaoSeiPatrimonio(false);
      onClose();
      alert(`Chamado ${novaOs} registrado com sucesso!`);
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar chamado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-900 italic">
              Novo Chamado
            </h2>
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleNovoChamado} className="space-y-4">
            {/* UNIDADE */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                Unidade de Saúde
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
                  className="w-full p-4 pl-12 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-600 appearance-none text-sm font-bold text-slate-700 transition-all"
                >
                  <option value="">Selecione a Unidade...</option>
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
                    placeholder="Ex: Monitor"
                    className="w-full p-4 pl-11 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium border-none"
                  />
                </div>
              </div>

              {/* PATRIMÔNIO */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                    Patrimônio
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNaoSeiPatrimonio(!naoSeiPatrimonio);
                      if (!naoSeiPatrimonio) setPatrimonio("");
                    }}
                    className={`text-[8px] font-bold px-2 py-0.5 rounded ${
                      naoSeiPatrimonio
                        ? "bg-amber-100 text-amber-600"
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
                    placeholder={naoSeiPatrimonio ? "---" : "Tag"}
                    className={`w-full p-4 pl-11 rounded-2xl outline-none text-sm font-medium border-none transition-all ${
                      naoSeiPatrimonio
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-slate-50 focus:ring-2 focus:ring-blue-600"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* SETOR */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">
                Setor (Local exato)
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
                  placeholder="Ex: Sala de Raio-X"
                  className="w-full p-4 pl-12 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium border-none"
                />
              </div>
            </div>

            {/* DESCRIÇÃO */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">
                Relato do Defeito
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
                  placeholder="Descreva o problema aqui..."
                  rows="3"
                  className="w-full p-4 pl-12 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium border-none resize-none"
                />
              </div>
            </div>

            {naoSeiPatrimonio && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                <AlertCircle size={16} />
                <span className="text-[10px] font-bold uppercase">
                  Identificação manual necessária no local.
                </span>
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Send size={20} /> Enviar Chamado
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
