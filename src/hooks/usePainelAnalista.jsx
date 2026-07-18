import { useEffect, useState, useMemo, useCallback } from "react";
import { db, auth } from "../services/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  getDoc,
  deleteField,
} from "firebase/firestore";
import { toast } from "react-toastify";

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyGgcYmM7oXjpx0li898F2RCy5M4a6os5Ti9s9t5J6h9BbgO0W8PpOfrQ3TxqIOCNNVpg/exec";

export const usePainelAnalista = () => {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const [inputValue, setInputValue] = useState("");
  const [termoBusca, setTermoBusca] = useState("");

  const [enviandoPlanilha, setEnviandoPlanilha] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 12;

  // CONTROLE DO MODAL UNIFICADO
  const [mostrarModal, setMostrarModal] = useState(false);
  const [tipoModal, setTipoModal] = useState(""); // "visualizar", "finalizar" ou "pausar"
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);

  // ESTADOS DOS CAMPOS DOS MODAIS
  const [equipamento, setEquipamento] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [parecerTecnico, setParecerTecnico] = useState("");
  const [motivoPausa, setMotivoPausa] = useState("");
  const [detalhePausa, setDetalhePausa] = useState("");

  const user = auth.currentUser;

  const isRemaneja = useCallback(
    (item) =>
      item?.tipo?.toLowerCase().includes("remanejamento") ||
      !!item?.setorDestino,
    []
  );

  const analistaNome = useMemo(() => {
    return (
      userData?.nome ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "Analista"
    );
  }, [userData, user]);

  const formatarDataHora = (timestamp) => {
    if (!timestamp) return "n/a";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("pt-BR");
  };

  // CORRIGIDO: Nome da função ajustado de ejecutarBusca para executarBusca
  const executarBusca = () => {
    setTermoBusca(inputValue);
    setPaginaAtual(1);
  };

  const limparBusca = () => {
    setInputValue("");
    setTermoBusca("");
    setPaginaAtual(1);
  };

  // NOVA FUNÇÃO: Calcula dinamicamente o status do SLA baseado em 6h para atendimento e 12h para solução
  const calcularSlaLinha = useCallback((item) => {
    const statusAtual = item?.status?.toLowerCase() || "";

    if (statusAtual === "fechado" || statusAtual === "arquivado") {
      return { texto: "Concluído", estourado: false, classe: "bg-slate-100 text-slate-500 border border-slate-200", bola: "bg-slate-400" };
    }

    const timestampCriado = item?.criadoEm || item?.criatedAt;
    if (!timestampCriado) {
      return { texto: "--", estourado: false, classe: "bg-slate-100 text-slate-400", bola: "bg-slate-300" };
    }

    const dataAbertura = timestampCriado.toDate ? timestampCriado.toDate() : new Date(timestampCriado);
    const agora = new Date();
    const tempoDecorridoHoras = (agora - dataAbertura) / (1000 * 60 * 60);

    // Regra 1: Se o chamado ainda está Aberto, o prazo limite é de 6 horas para assumir
    if (statusAtual === "aberto") {
      const limiteAtendimento = 6;
      if (tempoDecorridoHoras > limiteAtendimento) {
        const atraso = Math.floor(tempoDecorridoHoras - limiteAtendimento);
        return {
          texto: `SLA Atendimento Estourado (+${atraso}h)`,
          estourado: true,
          classe: "bg-red-100 text-red-600 animate-pulse border border-red-200",
          bola: "bg-red-600 animate-ping"
        };
      }
      return {
        texto: "Prazo Atendimento OK",
        estourado: false,
        classe: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        bola: "bg-emerald-500"
      };
    }

    // Regra 2: Se o chamado está em atendimento ou pendente, valida o limite total de solução (12 horas)
    const limiteSolucao = 12;
    if (tempoDecorridoHoras > limiteSolucao) {
      const atraso = Math.floor(tempoDecorridoHoras - limiteSolucao);
      return {
        texto: `SLA Solução Estourado (+${atraso}h)`,
        estourado: true,
        classe: "bg-red-100 text-red-600 animate-pulse border border-red-200",
        bola: "bg-red-600 animate-ping"
      };
    }

    return {
      texto: "Prazo Solução OK",
      estourado: false,
      classe: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      bola: "bg-emerald-500"
    };
  }, []);

  // Carrega os dados do usuário logado
  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "usuarios", user.uid));
        if (docSnap.exists()) setUserData(docSnap.data());
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    };
    fetchUserData();
  }, [user]);

  // Listener em tempo real dos chamados do Firebase
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, "chamados"), orderBy("criadoEm", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChamados(lista);
        setLoading(false);
      },
      (error) => {
        toast.error("Erro na conexão em tempo real.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const handleAssumirChamado = async (chamado) => {
    const jaTemTecnico =
      chamado.status === "em atendimento" || chamado.status === "pendente";

    try {
      await updateDoc(doc(db, "chamados", chamado.id), {
        status: "em atendimento",
        tecnicoResponsavel: analistaNome,
        tecnicoId: user.uid,
        iniciadoEm: serverTimestamp(),
        logSeguranca: jaTemTecnico
          ? `Override realizado por admin: ${analistaNome}`
          : null,
      });
      toast.info(
        jaTemTecnico
          ? `Override realizado na OS #${chamado.numeroOs}`
          : `Você assumiu a OS #${chamado.numeroOs}`
      );
    } catch (err) {
      toast.error("Erro ao assumir.");
    }
  };

  const handleDevolverChamado = async (chamado) => {
    try {
      await updateDoc(doc(db, "chamados", chamado.id), {
        status: "aberto",
        tecnicoResponsavel: deleteField(),
        tecnicoId: deleteField(),
        iniciadoEm: deleteField(),
        motivoPausa: deleteField(),
        detalhePausa: deleteField(),
        pausadoEm: deleteField(),
      });
      toast.warning("Chamado devolvido para a fila.");
    } catch (err) {
      toast.error("Erro ao devolver.");
    }
  };

  const handleFinalizarChamado = async (e) => {
    e.preventDefault();
    if (!patrimonio.trim()) return toast.error("Informe o patrimônio.");

    try {
      const novosDados = {
        status: "fechado",
        feedbackAnalista: parecerTecnico.trim(),
        patrimonio: patrimonio.trim(),
        finalizadoEm: serverTimestamp(),
      };

      if (equipamento.trim()) {
        novosDados.equipamento = equipamento.trim();
      }

      await updateDoc(doc(db, "chamados", chamadoSelecionado.id), novosDados);

      setMostrarModal(false);
      setTipoModal("");
      setParecerTecnico("");
      setPatrimonio("");
      setEquipamento("");
      toast.success("OS Finalizada com sucesso!");
    } catch (err) {
      toast.error("Erro ao finalizar.");
    }
  };

  const handlePausarSLA = async (e) => {
    e.preventDefault();
    if (!motivoPausa) return toast.error("Escolha um motivo.");
    try {
      await updateDoc(doc(db, "chamados", chamadoSelecionado.id), {
        status: "pendente",
        motivoPausa: motivoPausa,
        detalhePausa: detalhePausa.trim(),
        pausadoEm: serverTimestamp(),
      });
      setMostrarModal(false);
      setTipoModal("");
      setMotivoPausa("");
      setDetalhePausa("");
      toast.warning("SLA Pausado.");
    } catch (err) {
      toast.error("Erro ao pausar.");
    }
  };

  const handleRetomarChamado = async (chamado) => {
    try {
      await updateDoc(doc(db, "chamados", chamado.id), {
        status: "em atendimento",
        retomadoEm: serverTimestamp(),
      });
      toast.success("Atendimento retomado!");
    } catch (err) {
      toast.error("Erro ao retomar.");
    }
  };

  const handleEnviarParaPlanilha = async (item) => {
    if (enviandoPlanilha) return;
    setEnviandoPlanilha(item.id);
    const idToast = toast.loading(`Sincronizando OS #${item.numeroOs}...`);
    try {
      const payload = {
        tipo: "CHAMADOS_POWERBI",
        dados: [
          {
            OS: item.numeroOs || "s/n",
            Patrimonio: item.patrimonio || "s/p",
            Unidade: item.unidade || "",
            Setor: item.setor || item.setorOrigem || "",
            Equipamento: item.equipamento || "s/p",
            Status: "FECHADO",
            Descricao: item.problema || item.descricao || "Sem descrição",
            Parecer_Tecnico: item.feedbackAnalista || "Sem parecer",
            Equipe: item.equipe || "",
            Finalizado_Por: item.tecnicoResponsavel || analistaNome,
            Data: formatarDataHora(item.criatedAt || item.criadoEm),
            Finalizado_Em: formatarDataHora(item.finalizadoEm),
          },
        ],
      };
      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload),
      });
      await updateDoc(doc(db, "chamados", item.id), {
        status: "arquivado",
        arquivadoEm: serverTimestamp(),
      });
      toast.update(idToast, {
        render: "Sincronizado e Arquivado!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(idToast, {
        render: "Erro na sincronização.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setEnviandoPlanilha(null);
    }
  };

  const chamadosFiltrados = useMemo(() => {
    const busca = termoBusca.toLowerCase().trim();
    const isAdminOuRoot = ["root", "admin"].includes(
      userData?.role?.toLowerCase()
    );
    const equipeUsuario = userData?.equipe?.toLowerCase().trim();

    return chamados.filter((c) => {
      if (!isAdminOuRoot) {
        const equipeChamado = c.equipe?.toLowerCase().trim();
        if (!equipeUsuario || equipeChamado !== equipeUsuario) {
          return false;
        }
      }

      const matchesBusca =
        c.numeroOs?.toString().includes(busca) ||
        c.nome?.toLowerCase().includes(busca) ||
        c.unidade?.toLowerCase().includes(busca) ||
        c.patrimonio?.toLowerCase().includes(busca) ||
        c.equipamento?.toLowerCase().includes(busca) ||
        c.equipe?.toLowerCase().includes(busca);

      return busca ? matchesBusca : c.status?.toLowerCase() !== "arquivado";
    });
  }, [chamados, termoBusca, userData]);

  const totalPaginas =
    Math.ceil(chamadosFiltrados.length / itensPorPagina) || 1;

  const chamadosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return chamadosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [chamadosFiltrados, paginaAtual]);

  const abrirModalUnificado = (tipo, chamado) => {
    setChamadoSelecionado(chamado);
    setTipoModal(tipo);
    setMostrarModal(true);

    if (tipo === "finalizar") {
      setEquipamento(chamado.equipamento || "");
      setPatrimonio(chamado.patrimonio || "");
      setParecerTecnico(chamado.feedbackAnalista || "");
    } else if (tipo === "pausar") {
      setMotivoPausa(chamado.motivoPausa || "");
      setDetalhePausa(chamado.detalhePausa || "");
    }
  };

  const fecharModalUnificado = () => {
    setMostrarModal(false);
    setTipoModal("");
    setChamadoSelecionado(null);
    setEquipamento("");
    setPatrimonio("");
    setParecerTecnico("");
    setMotivoPausa("");
    setDetalhePausa("");
  };

  return {
    user,
    userData,
    loading,
    inputValue,
    setInputValue,
    paginaAtual,
    setPaginaAtual,
    totalPaginas,
    chamadosPaginados,
    chamadoSelecionado,
    setChamadoSelecionado,
    mostrarModal,
    tipoModal,
    equipamento,
    setEquipamento,
    patrimonio,
    setPatrimonio,
    parecerTecnico,
    setParecerTecnico,
    motivoPausa,
    setMotivoPausa,
    detalhePausa,
    setDetalhePausa,
    enviandoPlanilha,
    isRemaneja,
    analistaNome,
    formatarDataHora,
    executarBusca,
    limparBusca,
    handleAssumirChamado,
    handleDevolverChamado,
    handleFinalizarChamado,
    handlePausarSLA,
    handleRetomarChamado,
    handleEnviarParaPlanilha,
    abrirModalUnificado,
    fecharModalUnificado,
    calcularSlaLinha,
  };
};