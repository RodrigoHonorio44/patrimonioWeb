import { useState, useEffect, useRef } from "react";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  query,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { abrirVisualizacaoTermo } from "../components/ImpressaoTransferencia";
// IMPORTANTE: Importando o mapa que você enviou
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores"; 

export const useTransferencia = () => {
  const [patrimonioBusca, setPatrimonioBusca] = useState("");
  const [nomeBusca, setNomeBusca] = useState("");
  const [setorBusca, setSetorBusca] = useState("");
  const [unidadeFiltro, setUnidadeFiltro] = useState("");
  const [itensEncontrados, setItensEncontrados] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [novoPatrimonioParaSP, setNovoPatrimonioParaSP] = useState("");

  // CONTROLES DO DROPDOWN CUSTOMIZADO
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [termoVisualizado, setTermoVisualizado] = useState(false);
  const [dadosParaImpressaoRetirada, setDadosParaImpressaoRetirada] = useState(null);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 12;

  const [dadosSaida, setDadosSaida] = useState({
    novaUnidade: "",
    novoSetor: "",
    motivo: "Transferência",
    responsavelRecebimento: "",
    pacienteEndereco: "",
    pacienteTelefone: "",
    pacienteIdentidade: "",
    pacienteCpf: "",
  });

  const unidades = [
    "Hospital Conde",
    "UPA INOÃ",
    "UPA SANTA RITA",
    "SAMU BARROCO",
    "SAMU PONTA NEGRA",
    "SAMU CENTRO",
    "Residência do Paciente",
  ];

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

  // Fecha o dropdown de setores se clicar fora dele
  useEffect(() => {
    const clicarFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarDropdown(false);
      }
    };
    document.addEventListener("mousedown", clicarFora);
    return () => document.removeEventListener("mousedown", clicarFora);
  }, []);

  const limparBusca = () => {
    setPatrimonioBusca("");
    setNomeBusca("");
    setSetorBusca("");
    setUnidadeFiltro("");
    setItensEncontrados([]);
    setPaginaAtual(1);
    toast.info("Busca resetada");
  };

  // RETORNO DE SETORES COM CUSTO ZERO: Filtrando a partir do seu arquivo estático
  const obterSetoresFiltrados = () => {
    if (!unidadeFiltro) return [];

    // Encontra a chave correta no mapa ignorando maiúsculas/minúsculas
    const chaveUnidade = Object.keys(MAPA_SETORES_POR_UNIDADE).find(
      (key) => normalizarParaComparacao(key) === normalizarParaComparacao(unidadeFiltro)
    );

    const setoresDaUnidade = chaveUnidade ? MAPA_SETORES_POR_UNIDADE[chaveUnidade] : [];
    
    if (!setorBusca.trim()) return setoresDaUnidade;

    const buscaNorm = normalizarParaComparacao(setorBusca);
    return setoresDaUnidade.filter((setor) =>
      normalizarParaComparacao(setor).includes(buscaNorm)
    );
  };

  const ejecutarBusca = async (tipo) => {
    let termoOriginal = "";
    if (tipo === "patrimonio") termoOriginal = patrimonioBusca;
    else if (tipo === "setor") termoOriginal = setorBusca;
    else termoOriginal = nomeBusca;

    if (!termoOriginal.trim() && tipo !== "setor" && !unidadeFiltro) {
      toast.warn("Por favor, selecione um filtro ou preencha um campo de busca.");
      return;
    }

    setLoading(true);
    setMostrarDropdown(false);
    try {
      const ativosRef = collection(db, "ativos");
      let listaGeral = [];

      // Mantemos a busca de ativos, mas sem varrer setores desnecessariamente
      const qGeral = query(ativosRef, limit(2000));
      const snapGeral = await getDocs(qGeral);
      
      listaGeral = snapGeral.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const termoNorm = normalizarParaComparacao(termoOriginal);
      const unidadeFiltroNorm = normalizarParaComparacao(unidadeFiltro);

      const filtrados = listaGeral.filter((item) => {
        const statusItemNorm = String(item.status || "ativo").toLowerCase().trim();
        if (statusItemNorm !== "ativo" && statusItemNorm !== "em_uso_residencial") return false;

        const itemUnidadeNorm = normalizarParaComparacao(item.unidade);
        const itemPatrimonioNorm = normalizarParaComparacao(item.patrimonio);
        const itemNomeNorm = normalizarParaComparacao(item.nome);
        const itemSetorNorm = normalizarParaComparacao(item.setor);

        if (unidadeFiltro && itemUnidadeNorm !== unidadeFiltroNorm)
          return false;

        if (tipo === "patrimonio") {
          return itemPatrimonioNorm === termoNorm;
        } else if (tipo === "setor") {
          return itemSetorNorm.includes(termoNorm);
        } else if (tipo === "nome") {
          return itemNomeNorm.includes(termoNorm);
        }
        return true;
      });

      setItensEncontrados(filtrados);
      setPaginaAtual(1);
      
      if (filtrados.length === 0) {
        toast.error("Nenhum item ativo encontrado.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro na busca.");
    } finally {
      setLoading(false);
    }
  };

  const totalPaginas = Math.ceil(itensEncontrados.length / itensPorPagina);
  const itensExibidos = itensEncontrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const lidarComVisualizacao = () => {
    const isResidencial = dadosSaida.novaUnidade === "Residência do Paciente";
    const isVindoDeResidencial = itemSelecionado?.status === "em_uso_residencial";

    if (!dadosSaida.novaUnidade || !dadosSaida.novoSetor || !dadosSaida.responsavelRecebimento) {
      toast.warn("Por favor, preencha todos os campos obrigatórios antes de visualizar.");
      return;
    }

    if (isResidencial && (!dadosSaida.pacienteEndereco || !dadosSaida.pacienteCpf)) {
      toast.warn("Endereço e CPF do paciente são obrigatórios para uso residencial.");
      return;
    }

    if (normalizarParaComparacao(itemSelecionado.patrimonio) === "sp" && !novoPatrimonioParaSP) {
      toast.warn("Por favor, atribua um novo número de patrimônio.");
      return;
    }

    const patrimonioFinal =
      normalizarParaComparacao(itemSelecionado.patrimonio) === "sp" && novoPatrimonioParaSP
        ? novoPatrimonioParaSP
        : itemSelecionado.patrimonio;

    if (isVindoDeResidencial) {
      setDadosParaImpressaoRetirada({
        patrimonio: patrimonioFinal,
        nomeEquipamento: itemSelecionado.nome,
        unidadeOrigem: itemSelecionado.unidade,
        setorOrigem: itemSelecionado.setor,
        nomePaciente: itemSelecionado.setor,
        unidadeDestino: dadosSaida.novaUnidade,
        setorDestino: dadosSaida.novoSetor,
        responsavelRecebimento: dadosSaida.responsavelRecebimento,
      });

      setTimeout(() => {
        const areaPrint = document.getElementById("area-impressao-retirada");
        if (areaPrint) {
          areaPrint.classList.remove("hidden");
          window.print();
          areaPrint.classList.add("hidden");
          setTermoVisualizado(true);
          toast.success("Termo de Retirada enviado para a impressora!");
        }
      }, 250);
      return;
    }

    const dadosCompletosParaTermo = {
      ativoId: itemSelecionado.id,
      patrimonio: patrimonioFinal,
      nomeEquipamento: itemSelecionado.nome,
      unidadeOrigem: itemSelecionado.unidade,
      setorOrigem: itemSelecionado.setor,
      unidadeDestino: dadosSaida.novaUnidade,
      setorDestino: dadosSaida.novoSetor,
      responsavelRecebimento: dadosSaida.responsavelRecebimento,
      motivo: isResidencial ? "Internação Domiciliar (Home Care)" : dadosSaida.motivo,
      pacienteEndereco: dadosSaida.pacienteEndereco,
      pacienteTelefone: dadosSaida.pacienteTelefone,
      pacienteIdentidade: dadosSaida.pacienteIdentidade,
      pacienteCpf: dadosSaida.pacienteCpf,
      isResidencial: isResidencial
    };

    abrirVisualizacaoTermo(dadosCompletosParaTermo);
    setTermoVisualizado(true);
    toast.info("Documento de transferência aberto na nova aba!");
  };

  const handleSaida = async (e) => {
    e.preventDefault();
    setLoading(true);
    const isResidencial = dadosSaida.novaUnidade === "Residência do Paciente";

    try {
      const ativoRef = doc(db, "ativos", itemSelecionado.id);
      const patrimonioFinal =
        normalizarParaComparacao(itemSelecionado.patrimonio) === "sp" &&
        novoPatrimonioParaSP
          ? novoPatrimonioParaSP
          : itemSelecionado.patrimonio;

      await updateDoc(ativoRef, {
        unidade: dadosSaida.novaUnidade,
        setor: dadosSaida.novoSetor,
        patrimonio: patrimonioFinal,
        status: isResidencial ? "em_uso_residencial" : "ativo",
        ultimaMovimentacao: serverTimestamp(),
      });

      const payloadSaida = {
        ativoId: itemSelecionado.id,
        patrimonio: patrimonioFinal,
        nomeEquipamento: itemSelecionado.nome,
        unidadeOrigem: itemSelecionado.unidade,
        setorOrigem: itemSelecionado.setor,
        unidadeDestino: dadosSaida.novaUnidade,
        setorDestino: dadosSaida.novoSetor,
        responsavelRecebimento: dadosSaida.responsavelRecebimento,
        motivo: isResidencial ? "home care" : dadosSaida.motivo,
        dataSaida: serverTimestamp(),
      };

      if (isResidencial) {
        payloadSaida.pacienteDetails = {
          endereco: dadosSaida.pacienteEndereco,
          telefone: dadosSaida.pacienteTelefone,
          identity: dadosSaida.pacienteIdentidade,
          cpf: dadosSaida.pacienteCpf,
        };
      }

      await addDoc(collection(db, "saidaEquipamento"), payloadSaida);

      if (isResidencial) {
        await addDoc(collection(db, "equipamento_com_paciente"), {
          equipamentoId: itemSelecionado.id,
          equipamentoNome: itemSelecionado.nome,
          patrimonio: patrimonioFinal,
          unidadeOrigem: itemSelecionado.unidade,
          setorOrigem: itemSelecionado.setor,
          dataEntrega: serverTimestamp(),
          statusVinculo: "ativo",
          paciente: {
            nome: dadosSaida.novoSetor,
            endereco: dadosSaida.pacienteEndereco,
            telefone: dadosSaida.pacienteTelefone,
            identidade: dadosSaida.pacienteIdentidade,
            cpf: dadosSaida.pacienteCpf,
            responsavelRecebimento: dadosSaida.responsavelRecebimento
          },
        });
      }

      toast.success("Transferência salva com sucesso no sistema!");
      setShowModal(false);
      setTermoVisualizado(false);
      setItensEncontrados([]);
      setPatrimonioBusca("");
      setNomeBusca("");
      setSetorBusca("");
      setNovoPatrimonioParaSP("");
      setDadosParaImpressaoRetirada(null);
      setDadosSaida({
        novaUnidade: "",
        novoSetor: "",
        motivo: "Transferência",
        responsavelRecebimento: "",
        pacienteEndereco: "",
        pacienteTelefone: "",
        pacienteIdentidade: "",
        pacienteCpf: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar a transferência.");
    } finally {
      setLoading(false);
    }
  };

  return {
    patrimonioBusca,
    setPatrimonioBusca,
    nomeBusca,
    setNomeBusca,
    setorBusca,
    setSetorBusca,
    unidadeFiltro,
    setUnidadeFiltro,
    itensEncontrados,
    itemSelecionado,
    setItemSelecionado,
    showModal,
    setShowModal,
    loading,
    novoPatrimonioParaSP,
    setNovoPatrimonioParaSP,
    mostrarDropdown,
    setMostrarDropdown,
    dropdownRef,
    termoVisualizado,
    setTermoVisualizado,
    dadosParaImpressaoRetirada,
    paginaAtual,
    setPaginaAtual,
    itensPorPagina,
    dadosSaida,
    setDadosSaida,
    unidades,
    normalizarParaComparacao,
    limparBusca,
    obterSetoresFiltrados,
    ejecutarBusca,
    totalPaginas,
    itensExibidos,
    lidarComVisualizacao,
    handleSaida,
  };
};