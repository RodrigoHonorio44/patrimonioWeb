import React, { useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { Search, Wrench, RefreshCw, FileText, FilterX } from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ModalLaudoTecnico from "../components/ModalLaudoTecnico";

const Laudos = () => {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [buscaPatrimonio, setBuscaPatrimonio] = useState("");
  
  // Controle do Modal do Laudo
  const [modalAberto, setModalAberto] = useState(false);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);

  const carregarDados = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);

    try {
      // Puxa os ativos cadastrados para que você escolha qual receberá o laudo
      const querySnapshot = await getDocs(collection(db, "ativos"));
      const dados = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItens(dados);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar equipamentos.");
    } finally {
      setLoading(false);
    }
  };

  const abrirLaudo = (item) => {
    setEquipamentoSelecionado(item);
    setModalAberto(true);
  };

  // Filtro básico por número ou nome
  const itensFiltrados = itens.filter((item) => {
    if (!buscaPatrimonio.trim()) return true;
    const termo = buscaPatrimonio.toLowerCase();
    return (
      (item.patrimonio && item.patrimonio.toString().includes(termo)) ||
      (item.nome && item.nome.toLowerCase().includes(termo))
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <FileText className="text-blue-600" size={28} /> Engenharia Clínica e Laudos
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Emissão de laudos de inviabilidade técnica e substituição de ativos.
          </p>
        </header>

        {/* Filtro de Busca */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Buscar Equipamento (Patrimônio ou Nome)
            </label>
            <input
              type="text"
              placeholder="Ex: Monitor ou #105"
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              value={buscaPatrimonio}
              onChange={(e) => setBuscaPatrimonio(e.target.value)}
            />
          </div>
          <button
            onClick={carregarDados}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-100"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
            Consultar
          </button>
        </div>

        {/* Listagem */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[300px]">
          {!hasSearched ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-slate-300">
              <Wrench size={48} className="mb-2 opacity-20" />
              <p className="font-bold text-slate-400">Consulte os ativos para emitir pareceres.</p>
            </div>
          ) : itensFiltrados.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
              <FilterX size={48} className="mb-2 opacity-20" />
              <p className="font-bold">Nenhum equipamento localizado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4">Patrimônio</th>
                    <th className="p-4">Equipamento</th>
                    <th className="p-4">Unidade / Setor</th>
                    <th className="p-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {itensFiltrados.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-4 font-black text-blue-600">#{item.patrimonio || "S/P"}</td>
                      <td className="p-4 font-bold text-slate-700 uppercase text-sm">{item.nome}</td>
                      <td className="p-4 text-xs font-bold text-slate-500">
                        {item.unidade} <br />
                        <span className="font-normal opacity-60 uppercase">{item.setor}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => abrirLaudo(item)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm border border-blue-100"
                        >
                          Emitir Laudo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Chamada do Modal Técnico */}
      <ModalLaudoTecnico
        isOpen={modalAberto}
        equipamento={equipamentoSelecionado}
        onClose={() => {
          setModalAberto(false);
          setEquipamentoSelecionado(null);
        }}
        onAtualizar={carregarDados}
      />
    </div>
  );
};

export default Laudos;