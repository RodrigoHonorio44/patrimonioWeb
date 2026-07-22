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
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [buscaSetor, setBuscaSetor] = useState("");

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

    // 1. Força o reconhecimento imediato de qualquer variação escrita da UPA Inoã
    const unidadeLimpa = unidade.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (unidadeLimpa.includes("inoan") || unidadeLimpa.includes("inoa") || unidadeLimpa === "upainoa") {
      if (MAPA_SETORES_POR_UNIDADE["Upa Inoã"]) {
        return MAPA_SETORES_POR_UNIDADE["Upa Inoã"];
      }
    }

    // 2. Dicionário padrão para as demais unidades
    const deParaUnidades = {
      "Hospital Conde": "Hospital Conde",
      "Santa Rita": "Upa Santa Rita",
      "Inoã": "Upa Inoã",
      "Upa Inoa": "Upa Inoã",
      "Barroco": "Samu Barroco",
      "Ponta Negra": "Samu Ponta Negra",
      "Centro": "Samu Centro"
    };

    let chaveUnidade = deParaUnidades[unidade];

    if (!chaveUnidade) {
      const unidadeNorm = normalizarParaComparacao(unidade);
      chaveUnidade = Object.keys(MAPA_SETORES_POR_UNIDADE).find(k => {
        const kNorm = normalizarParaComparacao(k);
        return kNorm === unidadeNorm || kNorm.includes(unidadeNorm) || unidadeNorm.includes(kNorm);
      });
    }

    if (chaveUnidade && MAPA_SETORES_POR_UNIDADE[chaveUnidade]) {
      return MAPA_SETORES_POR_UNIDADE[chaveUnidade];
    }

    // 3. Fallback extraindo dos itens carregados no banco
    const setoresUnicos = new Set();
    itens.forEach((item) => {
      const itemUnidadeNorm = normalizarParaComparacao(item.unidade || "");
      const unidadeSelecionadaNorm = normalizarParaComparacao(unidade);
      if (itemUnidadeNorm.includes(unidadeSelecionadaNorm) && item.setor && item.setor.trim() !== "") {
        setoresUnicos.add(item.setor.trim());
      }
    });

    const listaFallback = Array.from(setoresUnicos).sort();
    return listaFallback.length > 0 ? listaFallback : null;
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
    setLoading(true);
    setHasSearched(true);

    try {
      const q = query(collection(db, "ativos"), limit(1000));
      const querySnapshot = await getDocs(q);

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

  const itensFiltrados = itens.filter((item) => {
    const statusItemLower = String(item.status || "operante").toLowerCase().trim();
    const statusBloqueados = ["inutilizados", "baixado", "descartado", "baixados", "inutilizado"];
    if (statusBloqueados.includes(statusItemLower)) return false;

    const termo = buscaPatrimonio.trim();
    const patrimonioItemNorm = normalizarParaComparacao(item.patrimonio || "");
    const nomeItemNorm = normalizarParaComparacao(item.nome || "");
    const termoNorm = normalizarParaComparacao(termo);

    const eBuscaExataPatrimonio = termo && patrimonioItemNorm.includes(termoNorm);

    if (!eBuscaExataPatrimonio) {
      if (unidadeSelecionada.trim() && unidadeSelecionada !== "Todas") {
        const unidadeItemNorm = normalizarParaComparacao(item.unidade || "");
        const unidadeSelecionadaNorm = normalizarParaComparacao(unidadeSelecionada);
        if (!unidadeItemNorm.includes(unidadeSelecionadaNorm)) return false;
      }

      if (buscaSetor.trim() && buscaSetor !== "Todos") {
        const setorItemNorm = normalizarParaComparacao(item.setor || "");
        const setorBuscaNorm = normalizarParaComparacao(buscaSetor);
        if (!setorItemNorm.includes(setorBuscaNorm)) return false;
      }
    }

    if (!termo) return true; 

    return patrimonioItemNorm.includes(termoNorm) || nomeItemNorm.includes(termoNorm);
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
