import { useState, useEffect, useRef } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores";

export const useInventario = () => {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Estados dos Filtros
  const [unidadeFiltro, setUnidadeFiltro] = useState("Todas");
  const [setorFiltro, setSetorFiltro] = useState("Todos");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [buscaPatrimonio, setBuscaPatrimonio] = useState("");

  const [paginaAtual, setPaginaAtual] = useState(1);
  
  // Estado para controlar o Novo Modal de etapas
  const [modalAberto, setModalAberto] = useState(false);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);

  // CONTROLE DO DROPDOWN CUSTOMIZADO DE SETORES
  const [mostrarDropdownSetor, setMostrarDropdownSetor] = useState(false);
  const dropdownSetorRef = useRef(null);

  const navigate = useNavigate();
  const itensPorPagina = 15;
  const WEBAPP_URL_SHEETS =
    "https://script.google.com/macros/s/AKfycbxR6EGGtOkeZCUMXA4y2hggPXNPUZL80L4acj9CP9MxVxqSbOrYcsyQ2OY2aFpYabsAEA/exec";

  // Função de normalização para busca e filtros
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

  // Fecha o dropdown se o usuário clicar em qualquer outro lugar da tela
  useEffect(() => {
    const clicarFora = (e) => {
      if (dropdownSetorRef.current && !dropdownSetorRef.current.contains(e.target)) {
        setMostrarDropdownSetor(false);
      }
    };
    document.addEventListener("mousedown", clicarFora);
    return () => document.removeEventListener("mousedown", clicarFora);
  }, []);

  const carregarDados = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);
    setHasSearched(true);
    setPaginaAtual(1);

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
      toast.error("Erro ao consultar dados.");
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setBuscaPatrimonio("");
    setUnidadeFiltro("Todas");
    setSetorFiltro("Todos");
    setItens([]);
    setHasSearched(false);
  };

  const obterSetoresDisponiveis = () => {
    const deParaUnidades = {
      "Hospital Conde": "Hospital Conde",
      "Santa Rita": "Upa Santa Rita",
      "Inoã": "Upa Inoã",
      "Barroco": "Samu Barroco",
      "Ponta Negra": "Samu Ponta Negra",
      "Centro": "Samu Centro"
    };

    const chaveUnidade = deParaUnidades[unidadeFiltro];
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

    if (setorFiltro !== "Todos" && setorFiltro.trim() !== "") {
      const termoNorm = normalizarParaComparacao(setorFiltro);
      return listaSetores.filter(setor => 
        normalizarParaComparacao(setor).includes(termoNorm)
      );
    }

    return listaSetores;
  };

  const itensFiltrados = itens.filter((item) => {
    const unidadeItemNorm = normalizarParaComparacao(item.unidade || "");
    const unidadeSelecionadaNorm = normalizarParaComparacao(unidadeFiltro);
    const matchUnidade =
      unidadeFiltro === "Todas" ||
      unidadeItemNorm.includes(unidadeSelecionadaNorm);

    const setorItemNorm = normalizarParaComparacao(item.setor || "");
    const setorSelecionadoNorm = normalizarParaComparacao(setorFiltro);
    const matchSetor =
      setorFiltro === "Todos" ||
      setorFiltro.trim() === "" ||
      setorItemNorm === setorSelecionadoNorm;

    const statusItemLower = String(item.status || "operante").toLowerCase().trim();
    let matchStatus = false;
    if (statusFiltro === "Todos") {
      matchStatus = true;
    } else if (statusFiltro === "Ativo") {
      matchStatus = statusItemLower === "ativo" || statusItemLower === "operante";
    } else if (statusFiltro === "Baixado") {
      matchStatus = 
        statusItemLower === "baixado" || 
        statusItemLower === "inutilizado" || 
        statusItemLower === "inutilizados";
    }

    let matchBusca = true;
    if (buscaPatrimonio.trim() !== "") {
      const termoNorm = normalizarParaComparacao(buscaPatrimonio);
      const patItemNorm = normalizarParaComparacao(item.patrimonio || "");
      const nomeItemNorm = normalizarParaComparacao(item.nome || "");
      matchBusca =
        patItemNorm.includes(termoNorm) || nomeItemNorm.includes(termoNorm);
    }

    return matchUnidade && matchSetor && matchStatus && matchBusca;
  });

  const totalPaginas = Math.ceil(itensFiltrados.length / itensPorPagina);
  const itensExibidos = itensFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const formatarDataBR = (timestamp) => {
    if (!timestamp) return "---";
    try {
      const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Data inválida";
    }
  };

  const exportarExcelCompleto = async () => {
    if (itensFiltrados.length === 0)
      return toast.error("Não há dados para exportar.");
    
    toast.info("Sincronizando e gerando arquivos...");
    
    try {
      const dadosParaEnviar = itensFiltrados.map((i) => ({
        patrimonio: i.patrimonio?.toString() || "S/P",
        nome: i.nome || "Sem Nome",
        unidade: i.unidade || "",
        setor: i.setor || "",
        estado: i.estado || "Bom",
        quantidade: i.quantidade || 1,
        observacoes: i.observacoes || "",
        status: i.status || "Ativo",
        tipo: i.tipo || "N/A",
        dataBaixa: i.dataBaixa ? formatarDataBR(i.dataBaixa) : ""
      }));

      const ws = XLSX.utils.json_to_sheet(dadosParaEnviar);
      const wb = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(wb, ws, "Inventario");
      XLSX.writeFile(wb, `Inventario_${unidadeFiltro}.xlsx`);

      await fetch(WEBAPP_URL_SHEETS, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      toast.success("Exportação local concluída e Google Sheets atualizado!");
    } catch (error) {
      console.error("Erro na sincronização:", error);
      toast.error("Erro ao atualizar a planilha online.");
    }
  };

  const lidarComAberturaModal = (item) => {
    setEquipamentoSelecionado(item);
    setModalAberto(true);
  };

  return {
    itens,
    loading,
    hasSearched,
    unidadeFiltro,
    setUnidadeFiltro,
    setorFiltro,
    setSetorFiltro,
    statusFiltro,
    setStatusFiltro,
    buscaPatrimonio,
    setBuscaPatrimonio,
    paginaAtual,
    setPaginaAtual,
    modalAberto,
    setModalAberto,
    equipamentoSelecionado,
    setEquipamentoSelecionado,
    mostrarDropdownSetor,
    setMostrarDropdownSetor,
    dropdownSetorRef,
    navigate,
    itensFiltrados,
    totalPaginas,
    itensExibidos,
    formatarDataBR,
    carregarDados,
    limparFiltros,
    obterSetoresDisponiveis,
    exportarExcelCompleto,
    lidarComAberturaModal,
  };
};