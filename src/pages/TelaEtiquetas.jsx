import React from "react";
import Barcode from "react-barcode";
import { ArrowLeft, Shield, PlusCircle, Printer, Tag, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTelaEtiquetas } from "../hooks/useTelaEtiquetas";
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores";

const TelaEtiquetas = () => {
  const navigate = useNavigate();
  
  const {
    loading,
    proximoPatrimonio,
    isAvulsa,
    setIsAvulsa,
    nome,
    setNome,
    unidade,
    setUnidade,
    setor,
    setSetor,
    estado,
    setEstado,
    observacoes,
    setObservacoes,
    etiquetaPronta,
    setEtiquetaPronta,
    handleCriarAtivoEEtiqueta,
    dispararImpressao,
    modoEdicaoSetor,
    setModoEdicaoSetor
  } = useTelaEtiquetas();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto">
        <header className="mb-6 no-print">
          <button
            onClick={() => navigate("/inventario")}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors mb-4 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Voltar ao Inventário
          </button>
          
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <Shield className="text-blue-600" size={28} /> Cadastro & Emissão de Etiquetas
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            O sistema gera números automáticos sequenciais impedindo qualquer risco de duplicidade entre coleções.
          </p>
        </header>

        {/* ALTERNADOR DE MODO NO TOPO */}
        <div className="mb-6 max-w-xl no-print bg-white border border-slate-200 p-2.5 rounded-2xl flex gap-2 shadow-sm">
          <button
            type="button"
            onClick={() => { setIsAvulsa(false); setEtiquetaPronta(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${!isAvulsa ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Layers size={14} /> Cadastro Completo
          </button>
          <button
            type="button"
            onClick={() => { setIsAvulsa(true); setEtiquetaPronta(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${isAvulsa ? 'bg-amber-600 text-white shadow-md shadow-amber-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Tag size={14} /> Apenas Etiqueta
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <form 
            onSubmit={handleCriarAtivoEEtiqueta}
            className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 no-print"
          >
            <div className={`md:col-span-2 p-4 rounded-2xl border flex justify-between items-center transition-colors ${isAvulsa ? 'bg-amber-50 border-amber-200' : 'bg-blue-50/50 border-blue-100'}`}>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${isAvulsa ? 'text-amber-700' : 'text-blue-600'}`}>
                  {isAvulsa ? "Modo: Etiqueta Avulsa" : "Modo: Cadastro Completo"}
                </p>
                <p className="text-2xl font-black text-slate-800 italic">#{proximoPatrimonio || "..."}</p>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome do Equipamento</label>
              <input type="text" className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Unidade Destino</label>
              <select className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" value={unidade} onChange={(e) => { setUnidade(e.target.value); }}>
                {Object.keys(MAPA_SETORES_POR_UNIDADE).map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* SETOR INTELIGENTE - ALTERNÂNCIA INPUT/SELECT */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor Interno</label>
                <button
                  type="button"
                  onClick={() => { setModoEdicaoSetor(!modoEdicaoSetor); setSetor(""); }}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  {modoEdicaoSetor ? "Voltar à Seleção" : "Não achou? Digitar Setor"}
                </button>
              </div>

              {modoEdicaoSetor ? (
                <input 
                  type="text"
                  placeholder="Digite o setor..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                />
              ) : (
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                >
                  <option value="">Selecione o Setor Oficial...</option>
                  {(MAPA_SETORES_POR_UNIDADE[unidade] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Estado de Conservação</label>
              <select className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="novo">Novo</option>
                <option value="excelente">Excelente</option>
                <option value="bom">Bom</option>
                <option value="regular">Regular</option>
                <option value="ruim">Ruim</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Observações</label>
              <textarea rows={2} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>

            <button type="submit" disabled={loading} className={`md:col-span-2 disabled:opacity-50 text-white p-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer mt-2 ${isAvulsa ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              <PlusCircle size={20} />
              {loading ? "Processando..." : "Gerar Etiqueta"}
            </button>
          </form>

          {/* VISUALIZAÇÃO DA ETIQUETA */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[320px] relative print-area">
            {etiquetaPronta ? (
              <>
                <div className="bg-white border border-slate-400 rounded-[12px] p-4 flex flex-col items-center justify-center ticket-capture" style={{ width: "90mm", height: "45mm" }}>
                  <Barcode value={etiquetaPronta.patrimonio} width={1.7} height={40} fontSize={14} />
                  <p className="text-[8px] font-black text-slate-500 uppercase mt-2">{etiquetaPronta.nome}</p>
                </div>
                <button onClick={dispararImpressao} className="no-print mt-6 bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Printer size={18} /> Imprimir
                </button>
              </>
            ) : (
              <p className="text-slate-400 text-sm">Nenhuma etiqueta gerada.</p>
            )}
          </div>
        </div>
      </main>
      <Footer className="no-print" />
      <style>{`@media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; } .no-print { display: none !important; } }`}</style>
    </div>
  );
};

export default TelaEtiquetas;