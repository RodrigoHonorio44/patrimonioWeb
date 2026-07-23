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

    const chaveUnidade = deParaUnidades[unidade] || unidade;
    let listaSetores = [];

    if (chaveUnidade && MAPA_SETORES_POR_UNIDADE[chaveUnidade]) {
      listaSetores = [...MAPA_SETORES_POR_UNIDADE[chaveUnidade]];
    } else {
      const setoresUnicos = new Set();
      itens.forEach((item) => {
        if (item.setor && item.setor.trim() !== "") {
          setoresUnicos.add(item.setor.trim());
        }
      });
      listaSetores = Array.from(setoresUnicos);
    }

    listaSetores.sort();
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
      const querySnapshot = await getDocs(collection(db, "ativos"));
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
    // 1. Ocultar apenas itens que já foram desativados/baixados/inutilizados
    const statusItemLower = String(item.status || "operante").toLowerCase().trim();
    const statusBloqueados = ["inutilizados", "baixado", "descartado", "baixados", "inutilizado"];
    if (statusBloqueados.includes(statusItemLower)) return false;

    // 2. Filtro por Unidade (compara de forma flexível)
    const unidadeItemNorm = normalizarParaComparacao(item.unidade || "");
    const unidadeSelecionadaNorm = normalizarParaComparacao(unidadeSelecionada);
    const matchUnidade =
      unidadeSelecionada === "Todas" ||
      unidadeSelecionada.trim() === "" ||
      unidadeItemNorm.includes(unidadeSelecionadaNorm) ||
      unidadeSelecionadaNorm.includes(unidadeItemNorm);

    // 3. Filtro por Setor
    const setorItemNorm = normalizarParaComparacao(item.setor || "");
    const setorSelecionadoNorm = normalizarParaComparacao(buscaSetor);
    const matchSetor =
      buscaSetor === "Todos" ||
      buscaSetor === "Todos Os Setores..." ||
      buscaSetor.trim() === "" ||
      setorItemNorm.includes(setorSelecionadoNorm) ||
      setorSelecionadoNorm.includes(setorItemNorm);

    // 4. Filtro por Patrimônio / Nome
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
