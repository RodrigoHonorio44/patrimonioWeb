import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, query, where, limit, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores"; 

export const useLaudos = () => {
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
  const [processandoAcao, setProcessandoAcao] = useState(null);

  // Estados dos Modais
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

  // Função auxiliar para encontrar os setores de forma insensível a maiúsculas/minúsculas
  const obterSetoresDaUnidade = (unidade) => {
    if (!unidade) return null;
    const chaveEncontrada = Object.keys(MAPA_SETORES_POR_UNIDADE).find(
      (key) => key.toLowerCase() === unidade.toLowerCase().trim()
    );
    return chaveEncontrada ? MAPA_SETORES_POR_UNIDADE[chaveEncontrada] : null;
  };

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
        ...doc.data(),
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
      const laudoRef = doc(db, "laudos", laudoId);
      await updateDoc(laudoRef, {
        status: "aprovado",
        dataDecisao: serverTimestamp(),
      });

      if (equipamentoId) {
        const ativoRef = doc(db, "ativos", equipamentoId);
        await updateDoc(ativoRef, {
          status: "inutilizados",
          dataBaixa: serverTimestamp(),
          ultimaMovimentacao: serverTimestamp(),
        });
      }

      toast.success("Laudo aprovado e ativo movido para Inutilizados! 🎉");
      await carregarLaudosPendentes();
      if (hasSearched) carregarDados();
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
      const laudoRef = doc(db, "laudos", laudoId);
      await updateDoc(laudoRef, {
        status: "cancelado",
        dataDecisao: serverTimestamp(),
      });

      if (equipamentoId) {
        const ativoRef = doc(db, "ativos", equipamentoId);
        await updateDoc(ativoRef, {
          status: "operante",
          ultimaMovimentacao: serverTimestamp(),
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

  // Carrega a listagem do select de unidades do banco
  const carregarUnidades = async () => {
    try {
      const q = query(collection(db, "ativos"), limit(100));
      const querySnapshot = await getDocs(q);
      const dados = querySnapshot.docs.map((doc) => doc.data());

      const listaUnidades = Array.from(
        new Set(
          dados
            .map((item) => item.unidade?.trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));

      setUnidadesDisponiveis(listaUnidades);
    } catch (error) {
      console.error("Erro ao pré-carregar unidades:", error);
    }
  };

  // CORREÇÃO AQUI: Consulta otimizada híbrida para evitar erros de índice composto do Firestore
  const carregarDados = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);

    try {
      let q = collection(db, "ativos");
      const restricoes = [];

      // Filtramos apenas por Unidade no Firestore (Garante performance sem quebrar por falta de índice composto)
      if (unidadeSelecionada) {
        restricoes.push(where("unidade", "==", unidadeSelecionada.trim()));
      }

      // Trazemos uma quantidade razoável de registros para filtrar o resto na memória local
      restricoes.push(limit(250));

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

  // CORREÇÃO AQUI: Filtragem local unificada (Filtra Setor E Patrimônio/Nome dinamicamente na memória)
  const itensFiltrados = itens.filter((item) => {
    // 1. Validar Filtro de Setor (Insensível a maiúsculas/minúsculas e espaços)
    if (buscaSetor.trim()) {
      const setorItem = item.setor ? String(item.setor).trim().toLowerCase() : "";
      const setorBusca = buscaSetor.trim().toLowerCase();
      if (setorItem !== setorBusca) return false;
    }

    // 2. Validar Filtro de Equipamento (Patrimônio ou Nome)
    const termo = buscaPatrimonio.trim().toLowerCase();
    if (!termo) return true; 

    if (!isNaN(termo)) {
      // Se digitou número, procura no patrimônio
      return item.patrimonio && String(item.patrimonio).toLowerCase().includes(termo);
    }
    
    // Se digitou texto, procura no nome do equipamento
    return item.nome && item.nome.toLowerCase().includes(termo);
  });

  return {
    itensFiltrados,
    unidadesDisponiveis,
    setoresDaUnidadeAtual: obterSetoresDaUnidade(unidadeSelecionada),
    loading,
    hasSearched,
    buscaPatrimonio,
    setBuscaPatrimonio,
    unidadeSelecionada,
    setUnidadeSelecionada,
    buscaSetor,
    setBuscaSetor,
    laudosPendentes,
    loadingLaudos,
    processandoAcao,
    modalAberto,
    setModalAberto,
    equipamentoSelecionado,
    setEquipamentoSelecionado,
    carregarLaudosPendentes,
    carregarDados,
    handleAprovarLaudo,
    handleCancelarLaudo,
    handleLimparBusca,
    abrirLaudo,
  };
};