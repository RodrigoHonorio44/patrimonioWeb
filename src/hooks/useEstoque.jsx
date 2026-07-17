import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  serverTimestamp,
  increment,
  runTransaction,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// 1. IMPORTAR O MAPA REAL DE SETORES
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores"; // <-- Ajuste o caminho se necessário

export const useEstoque = () => {
  const [itensEstoque, setItensEstoque] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);

  const [loteSaida, setLoteSaida] = useState([]);
  const [itemParaAdicionar, setItemParaAdicionar] = useState(null);
  const [patrimonioInput, setPatrimonioInput] = useState("");
  const [qtdInput, setQtdInput] = useState(1);

  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [naoSabeResponsavel, setNaoSabeResponsavel] = useState(false);

  const [dadosSaida, setDadosSaida] = useState({
    novaUnidade: "",
    novoSetor: "",
    responsavelRecebimento: "",
    motivo: "Transferência Regular (Reforço/Expansão)",
  });

  const navigate = useNavigate();

  // 2. CHAVES EXATAMENTE IGUAIS AS DO MAPA ABAIXO
  const unidades = [
    "Estoque Central",
    "Hospital Conde",
    "UPA de Inoã",
    "UPA de Santa Rita",
    "SAMU Barroco",
    "SAMU Ponta Negra",
    "SAMU Centro",
  ];

  // 3. ADICIONE O ESTOQUE CENTRAL NO MAPA PARA EVITAR QUEBRA CASO SEJA SELECIONADO
  const setoresPorUnidade = {
    ...MAPA_SETORES_POR_UNIDADE,
    "Estoque Central": ["Equipamento Usado", "Reserva Técnica", "Inservível / Manutenção"],
    "UPA de Inoã": MAPA_SETORES_POR_UNIDADE["Upa Inoã"] || MAPA_SETORES_POR_UNIDADE["UPA de Inoã"],
    "UPA de Santa Rita": MAPA_SETORES_POR_UNIDADE["Upa Santa Rita"] || MAPA_SETORES_POR_UNIDADE["UPA de Santa Rita"],
    "SAMU Barroco": MAPA_SETORES_POR_UNIDADE["Samu Barroco"] || MAPA_SETORES_POR_UNIDADE["SAMU Barroco"],
    "SAMU Ponta Negra": MAPA_SETORES_POR_UNIDADE["Samu Ponta Negra"] || MAPA_SETORES_POR_UNIDADE["SAMU Ponta Negra"],
    "SAMU Centro": MAPA_SETORES_POR_UNIDADE["Samu Centro"] || MAPA_SETORES_POR_UNIDADE["SAMU Centro"],
  };

  const motivosSaida = [
    { value: "Transferência Regular (Reforço/Expansão)", label: "Transferência Regular (Reforço/Expansão)" },
    { value: "Substituição por Rasgo/Avaria", label: "Substituição por Rasgo/Avaria" },
    { value: "Substituição por Infecção/Contaminação", label: "Substituição por Infecção/Contaminação (Descarte Sanitário)" },
    { value: "Substituição por Defeito Técnico/Mecânico", label: "Substituição por Defeito Técnico/Mecânico" },
    { value: "Empréstimo Temporário", label: "Empréstimo Temporário" },
  ];

  const carregarEstoque = async () => {
    setLoading(true);
    try {
      const estoqueRef = collection(db, "estoque");
      const q = query(estoqueRef, where("status", "==", "ativo"));
      const querySnapshot = await getDocs(q);
      const lista = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItensEstoque(lista);
    } catch (error) {
      console.error("Erro ao carregar estoque:", error);
      toast.error("Erro ao carregar itens do estoque.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEstoque();
  }, []);

  const adicionarAoLote = (e) => {
    e.preventDefault();
    if (!itemParaAdicionar) return;

    const qtdDisponivel = Number(itemParaAdicionar.quantidade || 1);
    const qtdSolicitada = Number(qtdInput);

    if (qtdSolicitada > qtdDisponivel) {
      toast.error(`Quantidade indisponível! Estoque atual: ${qtdDisponivel}`);
      return;
    }

    const patrimonioFinal = itemParaAdicionar.patrimonio === "S/P" 
      ? patrimonioInput.trim() 
      : itemParaAdicionar.patrimonio.trim();

    if (!patrimonioFinal) {
      toast.error("Insira um número de patrimônio válido.");
      return;
    }

    const jaExiste = loteSaida.some(item => item.patrimonioMapeado === patrimonioFinal);
    if (jaExiste) {
      toast.error("Este número de patrimônio já foi adicionado ao lote!");
      return;
    }

    const novoItemLote = {
      ...itemParaAdicionar,
      quantidadeMovimentada: qtdSolicitada,
      patrimonioMapeado: patrimonioFinal,
    };

    setLoteSaida([...loteSaida, novoItemLote]);
    setItemParaAdicionar(null);
    setPatrimonioInput("");
    setQtdInput(1);
    toast.success("Item adicionado ao lote!");
  };

  const removerDoLote = (index) => {
    const novaLista = [...loteSaida];
    novaLista.splice(index, 1);
    setLoteSaida(novaLista);
  };

  const efetivarTransferenciaESalvar = async () => {
    if (loteSaida.length === 0) return;
    setProcessando(true);

    const responsavelFinal = naoSabeResponsavel 
      ? "responsável pelo setor" 
      : dadosSaida.responsavelRecebimento.trim();

    try {
      await runTransaction(db, async (transaction) => {
        for (const item of loteSaida) {
          const estoqueItemRef = doc(db, "estoque", item.id);
          const sfDoc = await transaction.get(estoqueItemRef);
          
          if (!sfDoc.exists()) {
            throw new Error(`O item ${item.nome} não existe mais no estoque.`);
          }

          const dadosOriginais = sfDoc.data();
          const qtdAtual = Number(dadosOriginais.quantidade || 1);
          const qtdSolicitada = item.quantidadeMovimentada;

          if (qtdSolicitada > qtdAtual) {
            throw new Error(`Estoque insuficiente para ${item.nome}!`);
          }

          if (qtdSolicitada < qtdAtual) {
            transaction.update(estoqueItemRef, {
              quantidade: increment(-qtdSolicitada),
              ultimaMovimentacao: serverTimestamp(),
            });
          } else {
            transaction.update(estoqueItemRef, {
              status: "movimentado",
              quantidade: 0,
              ultimaMovimentacao: serverTimestamp(),
            });
          }

          if (item.categoriaItem !== "Bem durável") {
            const novoAtivoRef = doc(collection(db, "ativos"));
            transaction.set(novoAtivoRef, {
              nome: item.nome.trim(),
              categoriaItem: item.categoriaItem || item.tipo || "Mobiliário",
              tipo: item.tipo || "equipamento",
              estado: item.estado,
              observacoes: item.observacoes || "",
              cadastradoPor: item.cadastradoPor || "",
              criadoEm: item.criadoEm || serverTimestamp(),
              id: novoAtivoRef.id,
              quantidade: qtdSolicitada,
              patrimonio: item.patrimonioMapeado,
              unidade: dadosSaida.novaUnidade,
              setor: dadosSaida.novoSetor.trim(),
              status: "Ativo",
              ultimaMovimentacao: serverTimestamp(),
            });
          }

          const logsRef = collection(db, "saidaEquipamento");
          transaction.set(doc(logsRef), {
            estoqueId: item.id,
            patrimonio: item.patrimonioMapeado,
            nomeEquipamento: item.nome.trim(),
            unidadeOrigem: item.unidade || "Almoxarifado Central",
            setorOrigem: item.setor || "Patrimônio",
            unidadeDestino: dadosSaida.novaUnidade,
            setorDestino: dadosSaida.novoSetor.trim(),
            quantidadeRetirada: qtdSolicitada,
            responsavelRecebimento: responsavelFinal,
            motivo: dadosSaida.motivo,
            dataSaida: serverTimestamp(),
          });
        }
      });

      toast.success("Transferência concluída com sucesso!");
      window.print();

      setLoteSaida([]);
      setMostrarPreview(false);
      setNaoSabeResponsavel(false);
      setDadosSaida({
        novaUnidade: "",
        novoSetor: "",
        responsavelRecebimento: "",
        motivo: "Transferência Regular (Reforço/Expansão)",
      });
      carregarEstoque();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessando(false);
    }
  };

  const isEstoque = dadosSaida.novaUnidade === "Estoque Central";

  return {
    itensEstoque,
    loading,
    processando,
    loteSaida,
    itemParaAdicionar,
    setItemParaAdicionar,
    patrimonioInput,
    setPatrimonioInput,
    qtdInput,
    setQtdInput,
    mostrarPreview,
    setMostrarPreview,
    naoSabeResponsavel,
    setNaoSabeResponsavel,
    dadosSaida,
    setDadosSaida,
    unidades,
    setoresPorUnidade, // <-- Exportado para a View usar dinamicamente
    motivosSaida,
    isEstoque,
    carregarEstoque,
    adicionarAoLote,
    removerDoLote,
    efetivarTransferenciaESalvar,
    navigate,
  };
};