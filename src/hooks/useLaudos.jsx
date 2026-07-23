import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, query, where, limit, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores"; 

export const useLaudos = () => {
  const [itens, setItens] = useState([]);
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [buscaPatrimonio, setBuscaPatrimonio] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("Todas");
  const [buscaSetor, setBuscaSetor] = useState("Todos");

  const [laudosPendentes, setLaudosPendentes] = useState([]);
  const [loadingLaudos, setLoadingLaudos] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);

  useEffect(() => {
    const inicializarPainel = async () => {
      await carregarUnidades();
      await carregarLaudosPendentes();
    };
    inicializarPainel();
  }, []);

  // Reseta o setor selecionado sempre que alterar a unidade
  useEffect(() => {
    setBuscaSetor("Todos");
  }, [unidadeSelecionada]);

  const normalizarParaComparacao = (texto) => {
    if (!texto) return "";
    return texto
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[/\s._-]/g, "")
      .trim();
  };

  const obterSetoresDaUnidade = (unidade) => {
    if (!unidade || unidade === "Todas") return null;

    const deParaUnidades = {
      "Hospital Conde": "Hospital Conde",
      "Santa Rita": "Upa Santa Rita",
      "Upa Santa Rita": "Upa Santa Rita",
      "UPA Santa Rita": "Upa Santa Rita",
      "Inoã": "Upa Inoã",
      "Upa Inoã": "Upa Inoã",
      "UPA Inoã": "Upa Inoã",
      "Upa Inoa": "Upa Inoã",
      "upa inoa": "Upa Inoã",
      "Barroco": "Samu Barroco",
      "Samu Barroco": "Samu Barroco",
      "Ponta Negra": "Samu Ponta Negra",
      "Samu Ponta Negra": "Samu Ponta Negra",
      "Centro": "Samu Centro",
      "Samu Centro": "Samu Centro"
    };

    // Tenta encontrar a chave mapeada diretamente ou por comparação flexível
    const chaveMapeada = deParaUnidades[unidade] || unidade;
    
    // 1. Tenta pegar do mapa de constantes
    if (MAPA_SETORES_POR_UNIDADE[chaveMapeada]) {
      return [...MAPA_SETORES_POR_UNIDADE[chaveMapeada]].sort();
    }

    const buscaChaveFlexivel = Object.keys(MAPA_SETORES_POR_UNIDADE).find(
      (key) => normalizarParaComparacao(key) === normalizarParaComparacao(unidade)
    );

    if (buscaChaveFlexivel && MAPA_SETORES_POR_UNIDADE[buscaChaveFlexivel]) {
      return [...MAPA_SETORES_POR_UNIDADE[buscaChaveFlexivel]].sort();
    }

    // 2. Se não encontrou nas constantes, extrai dinamicamente dos itens filtrados pela unidade
    const unidadeNorm = normalizarParaComparacao(unidade);
    const setoresUnicos = new Set();
    
    itens.forEach((item) => {
      const itemUnidadeNorm = normalizarParaComparacao(item.unidade || "");
      if (itemUnidadeNorm.includes(unidadeNorm) && item.setor && item.setor.trim() !== "") {
        setoresUnicos.add(item.setor.trim());
      }
    });

    const listaSetores = Array.from(setoresUnicos).sort();
    return listaSetores.length > 0 ? listaSetores : null;
  };

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

  const carregarUnidades = async () => {
    try {
      const q = query(collection(db, "ativos"), limit(500));
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

  const carregarDados = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);
    setHasSearched(true);

    try {
      const querySnapshot = await getDocs(collection(db, "ativos"));
      const todosOsDados = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setItens(todosOsDados);

      if (todosOsDados.length > 0) {
        toast.success(`${todosOsDados.length} itens encontrados.`);
      } else {
        toast.info("Nenhum item encontrado no banco.");
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
      toast.error("Erro ao consultar equipamentos.");
    } finally {
      setLoading(false);
    }
  };

  const handleLimparBusca = () => {
    setBuscaPatrimonio("");
    setBuscaSetor("Todos");
    setUnidadeSelecionada("Todas");
    setItens([]);
    setHasSearched(false);
  };

  const abrirLaudo = (item) => {
    setEquipamentoSelecionado(item);
    setModalAberto(true);
  };

  const itensFiltrados = itens.filter((item) => {
    const statusItemLower = String(item.status || "operante").toLowerCase().trim();
    const statusBloqueados = ["inutilizados", "baixado", "descartado", "baixados", "inutilizado"];
    if (statusBloqueados.includes(statusItemLower)) return false;

    const unidadeItemNorm = normalizarParaComparacao(item.unidade || "");
    const unidadeSelecionadaNorm = normalizarParaComparacao(unidadeSelecionada);
    const matchUnidade =
      unidadeSelecionada === "Todas" ||
      unidadeSelecionada.trim() === "" ||
      unidadeItemNorm.includes(unidadeSelecionadaNorm) ||
      unidadeSelecionadaNorm.includes(unidadeItemNorm);

    const setorItemNorm = normalizarParaComparacao(item.setor || "");
    const setorSelecionadoNorm = normalizarParaComparacao(buscaSetor);
    const matchSetor =
      buscaSetor === "Todos" ||
      buscaSetor === "Todos Os Setores..." ||
      buscaSetor.trim() === "" ||
      setorItemNorm.includes(setorSelecionadoNorm) ||
      setorSelecionadoNorm.includes(setorItemNorm);

    let matchBusca = true;
    if (buscaPatrimonio.trim() !== "") {
      const termoNorm = normalizarParaComparacao(buscaPatrimonio);
      const patItemNorm = normalizarParaComparacao(item.patrimonio || "");
      const nomeItemNorm = normalizarParaComparacao(item.nome || "");
      matchBusca = patItemNorm.includes(termoNorm) || nomeItemNorm.includes(termoNorm);
    }

    return matchUnidade && matchSetor && matchBusca;
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
