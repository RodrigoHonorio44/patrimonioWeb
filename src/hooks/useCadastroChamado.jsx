import { useState } from "react";
import { auth, db } from "../services/firebase";
import { addDoc, collection, serverTimestamp, doc, getDoc, query, where, getDocs } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { MAPA_SETORES_POR_UNIDADE } from "../components/constants/setores";

export const useCadastroChamado = () => {
  const [loading, setLoading] = useState(false);
  const [buscandoAtivo, setBuscandoAtivo] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState("");

  const [unidade, setUnidade] = useState("");
  const [equipe, setEquipe] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [setor, setSetor] = useState("");
  const [setorManual, setSetorManual] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("média");
  const [naoSeiPatrimonio, setNaoSeiPatrimonio] = useState(false);

  const handleUnidadeChange = (valor) => {
    setUnidade(valor);
    setSetor("");
    setSetorManual(false);
  };

  const handleLimparCampos = () => {
    setPatrimonio("");
    setUnidade("");
    setSetor("");
    setEquipamento("");
    setSetorManual(false);
    setNaoSeiPatrimonio(false);
    toast.success("campos limpos com sucesso!");
  };

  const toggleNaoSei = () => {
    const novoEstado = !naoSeiPatrimonio;
    setNaoSeiPatrimonio(novoEstado);
    setPatrimonio(novoEstado ? "s/p" : "");
    if (novoEstado) {
      setUnidade("");
      setEquipamento("");
      setSetor("");
      setSetorManual(false);
    }
  };

  const handleBotaoBusca = async (e) => {
    if (e) e.preventDefault();
    const tagOriginal = patrimonio.trim();
    if (!tagOriginal || tagOriginal.toLowerCase() === "s/p") return;

    setBuscandoAtivo(true);
    try {
      const ativosRef = collection(db, "ativos");
      const termosBusca = [tagOriginal.toLowerCase()];
      if (!isNaN(tagOriginal)) {
        termosBusca.push(Number(tagOriginal));
      }

      const q = query(ativosRef, where("patrimonio", "in", termosBusca));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const dados = querySnapshot.docs[0].data();
        setEquipamento(dados.nome || "");
        setSetor(dados.setor || "");
        setSetorManual(true); // ATIVA O MODO MANUAL PARA PERMITIR EDIÇÃO APÓS BUSCA
        const unidadeBanco = dados.unidade || "";
        setUnidade(unidadeBanco);
        toast.success("equipamento cadastrado");
      } else {
        toast.error("equipamento nao cadastrado");
      }
    } catch (error) {
      console.error("erro ao buscar dados:", error);
      toast.error("erro ao consultar o banco de dados.");
    } finally {
      setBuscandoAtivo(false);
    }
  };

  const handleNovoChamado = async (e) => {
    e.preventDefault();
    if (!unidade || !equipe) return;
    setLoading(true);

    const novaOs = `${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const uidExibicao = auth.currentUser.uid;
      let nomeParaSalvar = auth.currentUser.email.split("@")[0].toLowerCase();
      const userDocSnap = await getDoc(doc(db, "usuarios", uidExibicao));

      if (userDocSnap.exists() && userDocSnap.data().nome) {
        const partesNome = userDocSnap.data().nome.trim().split(/\s+/);
        nomeParaSalvar = partesNome.length > 1 
          ? `${partesNome[0]} ${partesNome[partesNome.length - 1]}`.toLowerCase() 
          : partesNome[0].toLowerCase();
      }

      await addDoc(collection(db, "chamados"), {
        equipe: equipe.toLowerCase(),
        equipamento: equipamento.toLowerCase(),
        patrimonio: patrimonio.trim().toLowerCase(),
        setor: setor.toLowerCase(),
        descricao: descricao.toLowerCase(),
        unidade: unidade.toLowerCase(),
        prioridade: prioridade.toLowerCase(),
        criadoEm: serverTimestamp(),
        emailSolicitante: auth.currentUser.email.toLowerCase(),
        nome: nomeParaSalvar,
        numeroOs: novaOs,
        status: "aberto",
        userId: uidExibicao,
        feedbackAnalista: "",
        tecnicoResponsavel: "",
      });

      setProtocoloGerado(novaOs);
      setSucesso(true);
      toast.success("chamado registrado!");
    } catch (error) {
      console.error(error);
      toast.error("erro ao enviar chamado técnico.");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading, buscandoAtivo, sucesso, setSucesso, protocoloGerado,
    unidade, setUnidade: handleUnidadeChange, 
    equipe, setEquipe, equipamento, setEquipamento,
    patrimonio, setPatrimonio, setor, setSetor, 
    setorManual, setSetorManual,
    descricao, setDescricao,
    prioridade, setPrioridade, naoSeiPatrimonio, handleLimparCampos,
    toggleNaoSei, handleBotaoBusca, handleNovoChamado,
    MAPA_SETORES_POR_UNIDADE
  };
};