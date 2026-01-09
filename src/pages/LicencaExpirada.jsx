import React from "react";
import { FiLock, FiMessageCircle, FiLogOut } from "react-icons/fi";
import { auth } from "../api/Firebase";

const LicencaExpirada = () => {
  const handleRenovacao = () => {
    // Link direto para seu WhatsApp de suporte
    const mensagem = encodeURIComponent(
      "Olá! Meu acesso ao Rodhon System expirou. Gostaria de solicitar a renovação."
    );
    window.open(`https://wa.me/5521999999999?text=${mensagem}`, "_blank");
  };

  const handleSair = async () => {
    try {
      await auth.signOut();
      window.location.href = "/login"; // Garante o redirecionamento limpo
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-100 p-6 text-center font-sans">
      <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-200 flex flex-col items-center max-w-md relative overflow-hidden">
        {/* Faixa de Alerta Superior */}
        <div className="absolute top-0 left-0 w-full h-3 bg-red-600"></div>

        <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner animate-pulse">
          <FiLock size={48} />
        </div>

        <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
          Acesso <span className="text-red-600">Suspenso</span>
        </h2>

        <p className="text-slate-500 mt-6 text-sm font-bold leading-relaxed">
          Identificamos que a licença de uso deste terminal expirou ou foi
          desativada pela administração.
        </p>

        <div className="w-full space-y-3 mt-10">
          <button
            onClick={handleRenovacao}
            className="w-full py-5 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-100 cursor-pointer active:scale-95"
          >
            <FiMessageCircle size={20} /> Solicitar Renovação
          </button>

          <button
            onClick={handleSair}
            className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FiLogOut size={16} /> Sair da Conta
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-50 w-full text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
            Rodhon System v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default LicencaExpirada;
