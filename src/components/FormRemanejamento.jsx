import React, { useState } from "react";
import { db, auth } from "../api/Firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  FiX,
  FiSend,
  FiMonitor,
  FiHash,
  FiFileText,
  FiArrowRight,
  FiMapPin,
  FiHome,
  FiCheckCircle,
} from "react-icons/fi";

const FormRemanejamento = ({ fecharFormulario }) => {
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [osGerada, setOsGerada] = useState("");
  const [modoSetor, setModoSetor] = useState(false);
  const [naoSeiPatrimonio, setNaoSeiPatrimonio] = useState(false);

  const [formData, setFormData] = useState({
    unidade: "",
    equipamento: "",
    patrimonio: "",
    setorOrigem: "",
    setorDestino: "",
    descricao: "",
  });

  const unidades = [
    "Hospital Conde",
    "Upa Inoã",
    "Upa Santa Rita",
    "Samu Centro",
    "Samu Barroco",
    "Samu Ponta Negra",
  ];

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNaoSeiPatrimonio = () => {
    const novoEstado = !naoSeiPatrimonio;
    setNaoSeiPatrimonio(novoEstado);
    setFormData({ ...formData, patrimonio: novoEstado ? "S/P" : "" });
  };

  const alternarModoSetor = () => {
    const novoModo = !modoSetor;
    setModoSetor(novoModo);
    setFormData({
      ...formData,
      equipamento: novoModo ? "SETOR INTEIRO" : "",
      patrimonio: novoModo ? "S/P" : "",
    });
    setNaoSeiPatrimonio(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      // Gerar o número da OS primeiro
      const numeroOS = `#REM-${new Date().getFullYear()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const novoRemanejamento = {
        numeroOs: numeroOS,
        tipo: modoSetor
          ? "Remanejamento de Setor"
          : "Remanejamento de Equipamento",
        status: "Aberto",
        nome: user.displayName || "Usuário",
        userId: user.uid,
        userEmail: user.email,
        ...formData,
        criadoEm: serverTimestamp(),
      };

      await addDoc(collection(db, "chamados"), novoRemanejamento);

      // CONFIGURAÇÃO DE SUCESSO:
      setOsGerada(numeroOS);
      setSucesso(true);
      // O alert foi removido daqui completamente.
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[550px] rounded-[2.5rem] shadow-2xl relative p-6 sm:p-10 border-t-8 border-orange-400 overflow-y-auto max-h-[90vh]">
        {sucesso ? (
          /* --- TELA DE SUCESSO CUSTOMIZADA (Substitui o window.alert) --- */
          <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in duration-500 text-center">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <FiCheckCircle size={48} className="text-orange-400" />
            </div>

            <h2 className="text-3xl font-black text-slate-700 uppercase italic mb-2 tracking-tighter">
              Solicitado!
            </h2>

            <p className="text-slate-500 text-sm mb-8 max-w-[250px]">
              O remanejamento foi registrado com sucesso no sistema.
            </p>

            <div className="flex flex-col items-center gap-2 mb-10 w-full">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Número da Ordem
              </span>
              <div className="bg-orange-50 border-2 border-orange-100 rounded-3xl px-10 py-5">
                <span className="text-3xl font-black text-orange-400 tracking-tighter">
                  {osGerada}
                </span>
              </div>
            </div>

            <button
              onClick={fecharFormulario}
              className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              Concluir e Sair
            </button>
          </div>
        ) : (
          /* --- FORMULÁRIO --- */
          <>
            <button
              type="button"
              onClick={fecharFormulario}
              className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-300 rounded-full hover:text-red-400 transition-all hover:rotate-90"
            >
              <FiX size={20} />
            </button>

            <div className="mb-8 text-left">
              <h2 className="text-xl sm:text-2xl font-black text-slate-700 uppercase italic flex flex-col">
                Remanejamento
                <span className="h-1.5 w-12 bg-orange-400 mt-1 rounded-full"></span>
              </h2>

              <div className="flex gap-2 mt-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => modoSetor && alternarModoSetor()}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    !modoSetor
                      ? "bg-white text-orange-400 shadow-sm border border-orange-100"
                      : "text-slate-400"
                  }`}
                >
                  Equipamento
                </button>
                <button
                  type="button"
                  onClick={() => !modoSetor && alternarModoSetor()}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    modoSetor
                      ? "bg-white text-orange-400 shadow-sm border border-orange-100"
                      : "text-slate-400"
                  }`}
                >
                  Setor Inteiro
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Unidade */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Unidade Destino
                </label>
                <div className="relative">
                  <FiHome className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300 z-10" />
                  <select
                    name="unidade"
                    required
                    value={formData.unidade}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-600 appearance-none focus:outline-none transition-all"
                  >
                    <option value="">Selecione a unidade...</option>
                    {unidades.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Equipamento/Patrimônio */}
              <div
                className={`grid gap-4 text-left ${
                  modoSetor ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Equipamento
                  </label>
                  <div className="relative">
                    <FiMonitor className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      name="equipamento"
                      required
                      readOnly={modoSetor}
                      value={formData.equipamento}
                      type="text"
                      placeholder="Ex: Monitor"
                      onChange={handleChange}
                      className={`w-full rounded-2xl py-4 pl-12 text-sm font-bold text-slate-600 focus:outline-none transition-all ${
                        modoSetor
                          ? "bg-slate-100 italic text-slate-400 border-2 border-transparent"
                          : "bg-slate-50 border-2 border-transparent focus:border-orange-200"
                      }`}
                    />
                  </div>
                </div>

                {!modoSetor && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Patrimônio
                      </label>
                      <button
                        type="button"
                        onClick={handleNaoSeiPatrimonio}
                        className={`text-[9px] px-2 py-0.5 rounded font-black transition-all ${
                          naoSeiPatrimonio
                            ? "bg-orange-400 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {naoSeiPatrimonio ? "DIGITAR" : "NÃO SEI"}
                      </button>
                    </div>
                    <div className="relative">
                      <FiHash
                        className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                          naoSeiPatrimonio
                            ? "text-orange-400"
                            : "text-slate-300"
                        }`}
                      />
                      <input
                        name="patrimonio"
                        required
                        readOnly={naoSeiPatrimonio}
                        type="text"
                        value={formData.patrimonio}
                        onChange={handleChange}
                        placeholder={naoSeiPatrimonio ? "S/P" : "Número"}
                        className={`w-full rounded-2xl py-4 pl-12 text-sm font-bold text-slate-600 focus:outline-none transition-all ${
                          naoSeiPatrimonio
                            ? "bg-orange-50 border-2 border-orange-100 text-orange-400"
                            : "bg-slate-50 border-2 border-transparent focus:border-orange-200"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Origem/Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">
                    De: (Origem)
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-red-300" />
                    <input
                      name="setorOrigem"
                      required
                      type="text"
                      placeholder="Setor atual"
                      onChange={handleChange}
                      className="w-full bg-red-50/20 border border-red-100 rounded-2xl py-4 pl-12 text-sm font-bold text-slate-600 focus:outline-none focus:border-red-200"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-green-500 uppercase tracking-widest ml-1">
                    Para: (Destino)
                  </label>
                  <div className="relative">
                    <FiArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" />
                    <input
                      name="setorDestino"
                      required
                      type="text"
                      placeholder="Novo setor"
                      onChange={handleChange}
                      className="w-full bg-green-50/20 border border-green-100 rounded-2xl py-4 pl-12 text-sm font-bold text-slate-600 focus:outline-none focus:border-green-200"
                    />
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Motivo
                </label>
                <div className="relative">
                  <FiFileText className="absolute left-4 top-6 text-slate-300" />
                  <textarea
                    name="descricao"
                    required
                    rows="2"
                    placeholder="Por que realizar essa mudança?"
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-100 rounded-[1.5rem] py-5 pl-12 pr-6 text-sm font-semibold text-slate-600 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-400 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-100 disabled:opacity-50"
              >
                {loading ? (
                  "Processando..."
                ) : (
                  <>
                    <FiSend /> Enviar Remanejamento
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default FormRemanejamento;
