import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, query, where, limit, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { 
  Search, 
  Wrench, 
  RefreshCw, 
  FileText, 
  FilterX, 
  MapPin, 
  Layers, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ModalLaudoTecnico from "../components/ModalLaudoTecnico";

const Laudos = () => {
  // Estados para busca de Ativos Operantes
  const [itens, setItens] = useState([]);
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [buscaPatrimonio, setBuscaPatrimonio] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [buscaSetor, setBuscaSetor] = useState(""); 

  // Estados para a seção de Laudos Gerados esperando Decisão de Baixa
  const [laudosPendentes, setLaudosPendentes] = useState([]);
  const [loadingLaudos, setLoadingLaudos] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(null); // Armazena o ID do laudo em alteração
  
  const [modalAberto, setModalAberto] = useState(false);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);

  // Inicializa os dados essenciais da tela
  useEffect(() => {
    const inicializarPainel = async () => {
      await carregarUnidades();
      await carregarLaudosPendentes();
    };
    inicializarPainel();
  }, []);

  // Busca os laudos gerados com status "pendente"
  const carregarLaudosPendentes = async () => {
    setLoadingLaudos(true);
    try {
      const q = query(
        collection(db, "laudos"),
        where("status", "==", "pendente"),
        limit(25)
      );
      const querySnapshot = await getDocs(q);
      const listaLaudos = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setLaudosPendentes(listaLaudos);
    } catch (error) {
      console.error("Erro ao carregar laudos pendentes:", error);
    } finally {
      setLoadingLaudos(false);
    }
  };

  // Função para Aprovar a Baixa do Laudo e Atualizar o Ativo no Firebase
  const handleAprovarLaudo = async (laudoId, equipamentoId) => {
    setProcessandoAcao(laudoId);
    try {
      // 1. Atualiza o status do Laudo para aprovado
      const laudoRef = doc(db, "laudos", laudoId);
      await updateDoc(laudoRef, {
        status: "aprovado",
        dataDecisao: serverTimestamp()
      });
      
      // 2. CORREÇÃO: Atualiza o Ativo original para "inutilizados" com data de baixa
      if (equipamentoId) {
        const ativoRef = doc(db, "ativos", equipamentoId);
        await updateDoc(ativoRef, {
          status: "inutilizados",
          dataBaixa: serverTimestamp(),
          ultimaMovimentacao: serverTimestamp()
        });
      }
      
      toast.success("Laudo aprovado e ativo movido para Inutilizados! 🎉");
      await carregarLaudosPendentes();
      if (hasSearched) carregarDados(); // Atualiza a tabela de cima se já tiver buscado
    } catch (error) {
      console.error("Erro ao aprovar laudo:", error);
      toast.error("Erro ao aprovar o laudo.");
    } finally {
      setProcessandoAcao(null);
    }
  };

  // Função para Cancelar/Rejeitar o Laudo e Restaurar o Ativo
  const handleCancelarLaudo = async (laudoId, equipamentoId) => {
    setProcessandoAcao(laudoId);
    try {
      // 1. Atualiza o status do laudo para cancelado
      const laudoRef = doc(db, "laudos", laudoId);
      await updateDoc(laudoRef, {
        status: "cancelado",
        dataDecisao: serverTimestamp()
      });

      // 2. CORREÇÃO: Restaura o status do ativo original para "operante"
      if (equipamentoId) {
        const ativoRef = doc(db, "ativos", equipamentoId);
        await updateDoc(ativoRef, {
          status: "operante",
          ultimaMovimentacao: serverTimestamp()
        });
      }

      toast.info("Laudo técnico cancelado e ativo restaurado para operante.");
      await carregarLaudosPendentes();
      if (hasSearched) carregarDados();
    } catch (error) {
      console.error("Erro ao cancelar laudo:", error);
      toast.error("Erro ao cancelar o laudo.");
    } finally {
      setProcessandoAcao(null);
    }
  };

  // Carrega a listagem do select limitando o consumo inicial do banco
  const carregarUnidades = async () => {
    try {
      const q = query(collection(db, "ativos"), limit(100));
      const querySnapshot = await getDocs(q);
      const dados = querySnapshot.docs.map((doc) => doc.data());
      
      const listaUnidades = Array.from(
        new Set(
          dados
            .map((item) => item.unidade?.trim().toLowerCase())
            .filter(Boolean)
        )
      ).sort();

      setUnidadesDisponiveis(listaUnidades);
    } catch (error) {
      console.error("Erro ao pré-carregar unidades:", error);
    }
  };

  // Consulta Avançada Otimizada (Filtros no servidor)
  const carregarDados = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);

    try {
      let q = collection(db, "ativos");
      const restricoes = [];

      if (unidadeSelecionada) {
        restricoes.push(where("unidade", "==", unidadeSelecionada.toLowerCase().trim()));
      }

      if (buscaSetor.trim()) {
        restricoes.push(where("setor", "==", buscaSetor.toLowerCase().trim()));
      }

      if (buscaPatrimonio.trim() && !isNaN(buscaPatrimonio)) {
        restricoes.push(where("patrimonio", "==", buscaPatrimonio.trim().toLowerCase()));
      }

      restricoes.push(limit(30));

      const queryOtimizada = query(q, ...restricoes);
      const querySnapshot = await getDocs(queryOtimizada);
      
      const dados = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItens(dados);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao consultar equipamentos.");
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar os filtros e resetar o estado da tabela de busca
  const handleLimparBusca = () => {
    setBuscaPatrimonio("");
    setBuscaSetor("");
    setUnidadeSelecionada("");
    setItens([]);
    setHasSearched(false);
  };

  const abrirLaudo = (item) => {
    setEquipamentoSelecionado(item);
    setModalAberto(true);
  };

  // Filtro local para buscas textuais parciais no nome do item
  const itensFiltrados = itens.filter((item) => {
    if (!buscaPatrimonio.trim() || !isNaN(buscaPatrimonio)) return true;
    const termo = buscaPatrimonio.toLowerCase();
    return item.nome && item.nome.toLowerCase().includes(termo);
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        <header className="text-center md:text-left">
          <h1 className="text-2xl font-black text-slate-800 flex flex-col md:flex-row items-center gap-2 uppercase tracking-tight justify-center md:justify-start">
            <FileText className="text-blue-600 hidden md:block" size={28} /> 
            Painel de Controle e Emissão de Laudos
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">
            Setor de Patrimônio
          </p>
        </header>

        {/* Bloco de Filtros Inteligentes */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow w-full md:w-auto">
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

          <div className="w-full md:w-56">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Layers size={12} className="text-blue-500" /> Setor Comercial / Técnico
            </label>
            <input
              type="text"
              placeholder="Ex: emergencia"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              value={buscaSetor}
              onChange={(e) => setBuscaSetor(e.target.value)}
            />
          </div>

          <div className="w-full md:w-56">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <MapPin size={12} className="text-blue-500" /> Unidade Atual
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer capitalize"
              value={unidadeSelecionada}
              onChange={(e) => setUnidadeSelecionada(e.target.value)}
            >
              <option value="">Todas as Unidades...</option>
              {unidadesDisponiveis.map((unidade, index) => (
                <option key={index} value={unidade}>
                  {unidade}
                </option>
              ))}
            </select>
          </div>

          {/* Wrapper de botões para manter consistência no mobile e desktop */}
          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={handleLimparBusca}
              className="w-1/3 md:w-auto bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
              title="Limpar filtros"
            >
              <FilterX size={20} />
              <span className="md:hidden lg:inline">Limpar</span>
            </button>

            <button
              onClick={carregarDados}
              className="w-2/3 md:w-auto flex-grow bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-100 whitespace-nowrap"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
              Consultar
            </button>
          </div>
        </div>

        {/* Tabela 1: Ativos Localizados para Novo Laudo */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50/60 border-b border-slate-100">
            <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider">Ativos Disponíveis para Emissão</h2>
          </div>
          {!hasSearched ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-slate-300">
              <Wrench size={40} className="mb-2 opacity-20" />
              <p className="font-bold text-xs text-slate-400">Use os filtros acima para pesquisar os bens operantes.</p>
            </div>
          ) : itensFiltrados.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-slate-400">
              <FilterX size={40} className="mb-2 opacity-20" />
              <p className="font-bold text-xs">Nenhum equipamento localizado para esta pesquisa.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/40 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4">Patrimônio</th>
                    <th className="p-4">Equipamento</th>
                    <th className="p-4">Unidade / Setor</th>
                    <th className="p-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {itensFiltrados.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-4 font-black text-blue-600">#{item.patrimonio || "S/P"}</td>
                      <td className="p-4 font-bold text-slate-700 uppercase text-xs">{item.nome}</td>
                      <td className="p-4 text-xs font-bold text-slate-500">
                        <span className="capitalize">{item.unidade}</span> <br />
                        <span className="font-normal opacity-70 uppercase text-[10px]">{item.setor}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => abrirLaudo(item)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-blue-100"
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

        {/* Tabela 2: Seção de Laudos Gerados Aguardando Decisão / Baixa */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-amber-50/50 border-b border-amber-100/60 flex items-center gap-2">
            <Clock size={16} className="text-amber-600" />
            <h2 className="text-xs font-black uppercase text-amber-800 tracking-wider">
              Laudos Técnicos Emitidos (Aguardando Decisão / Baixa)
            </h2>
          </div>

          {loadingLaudos ? (
            <div className="h-[180px] flex items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="animate-spin text-amber-500" size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Carregando seus registros pendentes...</span>
            </div>
          ) : laudosPendentes.length === 0 ? (
            <div className="h-[180px] flex flex-col items-center justify-center text-slate-400">
              <AlertCircle size={36} className="mb-1 opacity-20" />
              <p className="font-bold text-xs">Nenhum laudo aguardando a sua aprovação ou decisão de baixa.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="p-4">Patrimônio</th>
                    <th className="p-4">Equipamento</th>
                    <th className="p-4">Unidade / Setor</th>
                    <th className="p-4">Diagnóstico Curto</th>
                    <th className="p-4 text-center">Status Interno</th>
                    <th className="p-4 text-center">Decisão / Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {laudosPendentes.map((laudo) => (
                    <tr key={laudo.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-700 uppercase">#{laudo.patrimonio || "S/P"}</td>
                      <td className="p-4 font-bold text-slate-800 uppercase text-xs">{laudo.nomeEquipamento}</td>
                      <td className="p-4 text-xs font-medium text-slate-500">
                        <span className="capitalize font-bold">{laudo.unidade}</span> <br />
                        <span className="uppercase text-[10px] opacity-70">{laudo.setor}</span>
                      </td>
                      <td className="p-4 text-xs italic text-slate-600 max-w-xs truncate">
                        {laudo.diagnosticoDefeito}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-amber-100 text-amber-800 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-200">
                          {laudo.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={processandoAcao !== null}
                            onClick={() => handleAprovarLaudo(laudo.id, laudo.equipamentoId)}
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-100 flex items-center gap-1 disabled:opacity-50"
                            title="Aprovar e Dar Baixa"
                          >
                            <CheckCircle size={14} />
                            <span className="hidden lg:inline">Aprovar</span>
                          </button>
                          
                          <button
                            disabled={processandoAcao !== null}
                            onClick={() => handleCancelarLaudo(laudo.id, laudo.equipamentoId)}
                            className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-rose-100 flex items-center gap-1 disabled:opacity-50"
                            title="Cancelar Laudo"
                          >
                            <XCircle size={14} />
                            <span className="hidden lg:inline">Cancelar</span>
                          </button>
                        </div>
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

      <ModalLaudoTecnico
        isOpen={modalAberto}
        equipamento={equipamentoSelecionado}
        onClose={() => {
          setModalAberto(false);
          setEquipamentoSelecionado(null);
          carregarLaudosPendentes(); 
        }}
        onAtualizar={carregarDados}
      />
    </div>
  );
};

export default Laudos;