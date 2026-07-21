import { useState, useEffect, useRef } from "react";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { abrirVisualizacaoTermo } from "../components/ImpressaoTransferencia";
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
    quantidadeRetirada: 1,
  });

  const unidades = [
    "Estoque Patrimônio",
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

  const obterSetoresFiltrados = () => {
    if (!unidadeFiltro) return [];

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

  const ejecutarBusca = async (tipo, valorForcadoSetor = null) => {
    let termoOriginal = "";
    if (tipo === "patrimonio") termoOriginal = patrimonioBusca;
    else if (tipo === "setor") termoOriginal = valorForcadoSetor || setorBusca;
    else termoOriginal = nomeBusca;

    if (!termoOriginal.trim() && !unidadeFiltro && tipo !== "setor") {
      toast.warn("Por favor, selecione um filtro ou preencha um campo de busca.");
      return;
    }

    setLoading(true);
    setMostrarDropdown(false);
    try {
      const unidadeFiltroNorm = normalizarParaComparacao(unidadeFiltro);
      const ehOrigemResidencial = unidadeFiltroNorm.includes("residencia") || unidadeFiltroNorm.includes("paciente");

      let listaGeral = [];

      if (ehOrigemResidencial) {
        const snapPacientes = await getDocs(collection(db, "equipamento_com_paciente"));
        listaGeral = snapPacientes.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: data.equipamentoId || docSnap.id,
            _docPacienteId: docSnap.id,
            nome: data.equipamentoNome || data.nome,
            patrimonio: data.patrimonio,
            unidade: "Residência do Paciente",
            setor: data.paciente?.nome ? `Residência do Paciente - ${data.paciente.nome}` : "Residência",
            status: "em_uso_residencial",
            _colecaoOrigem: "ativos",
          };
        });
      } else {
        const snapGeral = await getDocs(query(collection(db, "ativos"), limit(2000)));
        listaGeral = snapGeral.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          _colecaoOrigem: "ativos",
        }));
      }

      const termoNorm = normalizarParaComparacao(termoOriginal);
      const setorBuscaNorm = normalizarParaComparacao(setorBusca);

      const filtrados = listaGeral.filter((item) => {
        const statusItemNorm = String(item.status || "ativo").toLowerCase().trim();
        if (
          statusItemNorm !== "ativo" && 
          statusItemNorm !== "em_uso_residencial" && 
          statusItemNorm !== "operante"
        ) {
          return false;
        }

        const itemUnidadeNorm = normalizarParaComparacao(item.unidade || "");
        const itemPatrimonioNorm = normalizarParaComparacao(item.patrimonio || "");
        const itemNomeNorm = normalizarParaComparacao(item.nome || "");
        const itemSetorNorm = normalizarParaComparacao(item.setor || "");

        // Se o usuário buscou diretamente por patrimônio, acha em qualquer lugar (como o inventário faz)
        if (tipo === "patrimonio" && termoNorm !== "") {
          return itemPatrimonioNorm.includes(termoNorm);
        }

        // Valida Unidade se informada
        const matchUnidade = !unidadeFiltro || ehOrigemResidencial || itemUnidadeNorm.includes(unidadeFiltroNorm);
        if (!matchUnidade) return false;

        // Valida Setor de forma flexível igual ao inventário
        if (setorBusca && setorBusca.trim() !== "") {
          const matchSetor = itemSetorNorm === setorBuscaNorm || itemSetorNorm.includes(setorBuscaNorm);
          if (!matchSetor) return false;
        }

        if (tipo === "patrimonio") {
          return itemPatrimonioNorm.includes(termoNorm);
        } else if (tipo === "setor") {
          if (!termoNorm) return true;
          return itemSetorNorm.includes(termoNorm);
        } else if (tipo === "nome") {
          return itemNomeNorm.includes(termoNorm);
        }
        return true;
      });

      setItensEncontrados(filtrados);
      setPaginaAtual(1);
      
      if (filtrados.length === 0) {
        toast.error("Nenhum item encontrado com os filtros informados.");
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
    const isVindoDeResidencial = itemSelecionado?.status === "em_uso_residencial" || itemSelecionado?.unidade === "Residência do Paciente";

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
    const destinoEhEstoque = normalizarParaComparacao(dadosSaida.novaUnidade).includes("estoque");

    try {
      const patrimonioFinal =
        normalizarParaComparacao(itemSelecionado.patrimonio) === "sp" &&
        novoPatrimonioParaSP
          ? novoPatrimonioParaSP
          : itemSelecionado.patrimonio;

      if (itemSelecionado.status === "em_uso_residencial" || itemSelecionado._docPacienteId) {
        if (itemSelecionado._docPacienteId) {
          await deleteDoc(doc(db, "equipamento_com_paciente", itemSelecionado._docPacienteId));
        } else {
          const qPaciente = query(collection(db, "equipamento_com_paciente"), where("equipamentoId", "==", itemSelecionado.id));
          const snapPaciente = await getDocs(qPaciente);
          snapPaciente.forEach(async (docP) => {
            await deleteDoc(doc(db, "equipamento_com_paciente", docP.id));
          });
        }

        const ativoRef = doc(db, "ativos", itemSelecionado.id);
        const ativoSnap = await getDoc(ativoRef);

        if (ativoSnap.exists()) {
          await updateDoc(ativoRef, {
            unidade: dadosSaida.novaUnidade,
            setor: dadosSaida.novoSetor,
            patrimonio: patrimonioFinal,
            status: "ativo",
            ultimaMovimentacao: serverTimestamp(),
          });
        } else {
          await addDoc(collection(db, "ativos"), {
            nome: itemSelecionado.nome,
            patrimonio: patrimonioFinal,
            unidade: dadosSaida.novaUnidade,
            setor: dadosSaida.novoSetor,
            status: "ativo",
            ultimaMovimentacao: serverTimestamp(),
          });
        }

        if (destinoEhEstoque) {
          const estoqueRef = collection(db, "estoque");
          const qEstoque = query(estoqueRef, where("patrimonio", "==", patrimonioFinal));
          const snapEstoque = await getDocs(qEstoque);

          if (!snapEstoque.empty) {
            const docEstoque = snapEstoque.docs[0];
            const qtdAtual = Number(docEstoque.data().quantidade) || 0;
            await updateDoc(doc(db, "estoque", docEstoque.id), {
              quantidade: qtdAtual + 1,
              ultimaMovimentacao: serverTimestamp(),
            });
          } else {
            await addDoc(estoqueRef, {
              nome: itemSelecionado.nome,
              patrimonio: patrimonioFinal,
              quantidade: 1,
              unidade: "Estoque Patrimônio",
              setor: dadosSaida.novoSetor,
              status: "ativo",
              ultimaMovimentacao: serverTimestamp(),
            });
          }
        }
      } else {
        const itemRef = doc(db, "ativos", itemSelecionado.id);
        const itemSnap = await getDoc(itemRef);

        if (itemSnap.exists()) {
          await updateDoc(itemRef, {
            unidade: dadosSaida.novaUnidade,
            setor: dadosSaida.novoSetor,
            patrimonio: patrimonioFinal,
            status: isResidencial ? "em_uso_residencial" : "operante",
            ultimaMovimentacao: serverTimestamp(),
          });
        }
      }

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
        quantidadeTransferida: Number(dadosSaida.quantidadeRetirada) || 1,
        dataSaida: serverTimestamp(),
      };

      if (isResidencial) {
        payloadSaida.pacienteDetails = {
          endereco: dadosSaida.pacienteEndereco,
          telefone: dadosSaida.pacienteTelefone,
          identity: dadosSaida.pacienteIdentidade,
          cpf: dadosSaida.pacienteCpf,
        };

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

      await addDoc(collection(db, "saidaEquipamento"), payloadSaida);

      toast.success("Transferência realizada com sucesso!");
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
        quantidadeRetirada: 1,
      });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao concluir a transferência.");
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
