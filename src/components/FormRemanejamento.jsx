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
} from "react-icons/fi";

const FormRemanejamento = ({ fecharFormulario }) => {
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user) {
      alert("Sessão expirada.");
      return;
    }

    setLoading(true);

    try {
      const osGerada = `REM-${new Date().getFullYear()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const novoRemanejamento = {
        numeroOs: osGerada,
        tipo: "Remanejamento",
        status: "Aberto",
        nome: user.displayName || "Usuário",
        userId: user.uid,
        userEmail: user.email,
        ...formData,
        patrimonio: formData.patrimonio || "S/P",
        criadoEm: serverTimestamp(),
        finalizadoEm: null,
        ultimaAcao: "Solicitação de remanejamento enviada",
        // Texto padrão para o remanejamento
        acoesTecnico:
          "Aguardando o técnico realizar a movimentação do equipamento...",
      };

      await addDoc(collection(db, "chamados"), novoRemanejamento);
      alert(`Remanejamento ${osGerada} solicitado!`);
      fecharFormulario();
    } catch (error) {
      console.error("Erro:", error);
      alert("Falha ao registrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[550px] rounded-[2.5rem] shadow-2xl relative p-10 animate-in zoom-in duration-300 max-h-[95vh] overflow-y-auto">
        <button
          type="button"
          onClick={fecharFormulario}
          className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
        >
          <FiX size={20} />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-black text-amber-500 uppercase italic flex flex-col">
            Remanejamento
            <span className="h-1 w-12 bg-amber-500 mt-1 rounded-full"></span>
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Unidade */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1">
              Unidade do Equipamento
            </label>
            <div className="relative">
              <FiHome className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 z-10" />
              <select
                name="unidade"
                required
                value={formData.unidade}
                onChange={handleChange}
                className="w-full bg-white border-2 border-amber-500 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 appearance-none focus:outline-none"
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

          {/* Equipamento e Patrimônio */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Equipamento
              </label>
              <div className="relative">
                <FiMonitor className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="equipamento"
                  required
                  type="text"
                  placeholder="Ex: PC"
                  onChange={handleChange}
                  className="w-full bg-slate-50 rounded-2xl py-4 pl-12 text-sm font-bold text-slate-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Patrimônio
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, patrimonio: "S/P" })
                  }
                  className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black hover:bg-amber-500 hover:text-white transition-all"
                >
                  S/P
                </button>
              </div>
              <div className="relative">
                <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="patrimonio"
                  type="text"
                  value={formData.patrimonio}
                  onChange={handleChange}
                  placeholder="Número"
                  className="w-full bg-slate-50 rounded-2xl py-4 pl-12 text-sm font-bold text-slate-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Setores de Movimentação */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">
                De: (Setor Origem)
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" />
                <input
                  name="setorOrigem"
                  required
                  type="text"
                  placeholder="Ex: TI"
                  onChange={handleChange}
                  className="w-full bg-red-50/20 border border-red-100 rounded-2xl py-4 pl-12 text-sm font-bold text-slate-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1">
                Para: (Setor Destino)
              </label>
              <div className="relative">
                <FiArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
                <input
                  name="setorDestino"
                  required
                  type="text"
                  placeholder="Ex: Triagem"
                  onChange={handleChange}
                  className="w-full bg-green-50/20 border border-green-100 rounded-2xl py-4 pl-12 text-sm font-bold text-slate-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Motivo do Remanejamento
            </label>
            <div className="relative">
              <FiFileText className="absolute left-4 top-6 text-slate-400" />
              <textarea
                name="descricao"
                required
                rows="3"
                placeholder="Descreva o motivo da troca de local..."
                onChange={handleChange}
                className="w-full bg-slate-50 rounded-[2rem] py-5 pl-12 pr-6 text-sm font-semibold text-slate-700 focus:outline-none resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-100"
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
      </div>
    </div>
  );
};

export default FormRemanejamento;
