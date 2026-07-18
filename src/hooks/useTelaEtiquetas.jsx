import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";

export const useTelaEtiquetas = () => {
  const [loading, setLoading] = useState(false);
  const [proximoPatrimonio, setProximoPatrimonio] = useState("");
  
  // true = Apenas Etiqueta Avulsa, false = Cadastro Completo
  const [isAvulsa, setIsAvulsa] = useState(false);
  
  // Estados do formulário
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("Hospital Conde");
  const [setor, setSetor] = useState("");
  const [estado, setEstado] = useState("regular");
  const [observacoes, setObservacoes] = useState("");

  // Estados para a inteligência do Setor
  const [modoEdicaoSetor, setModoEdicaoSetor] = useState(false);
  const [etiquetaPronta, setEtiquetaPronta] = useState(null);

  // 1. BUSCA O MAIOR NÚMERO ABSOLUTO
  const buscarUltimoPatrimonioGeral = async () => {
    try {
      let maiorNumero = 0;
      const qAtivos = query(collection(db, "ativos"), orderBy("patrimonio", "desc"), limit(30));
      const qEtiquetas = query(collection(db, "etiquetas_patrimonio"), orderBy("patrimonio", "desc"), limit(30));
      
      const [snapAtivos, snapEtiquetas] = await Promise.all([getDocs(qAtivos), getDocs(qEtiquetas)]);
      
      [...snapAtivos.docs, ...snapEtiquetas.docs].forEach((doc) => {
        const patStr = doc.data().patrimonio;
        if (patStr && patStr !== "s/p") {
          const num = parseInt(patStr.replace(/\D/g, ""), 10);
          if (!isNaN(num) && num > maiorNumero) maiorNumero = num;
        }
      });

      const proximo = maiorNumero > 0 ? maiorNumero + 1 : 10001;
      setProximoPatrimonio(String(proximo));
    } catch (error) {
      console.error("Erro ao buscar sequencial unificado:", error);
      setProximoPatrimonio("10001");
    }
  };

  useEffect(() => {
    buscarUltimoPatrimonioGeral();
  }, []);

  // Função para mudar unidade e resetar setor
  const handleMudarUnidade = (novaUnidade) => {
    setUnidade(novaUnidade);
    setSetor("");
    setModoEdicaoSetor(false);
  };

  // 2. SALVA O ATIVO
  const handleCriarAtivoEEtiqueta = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Por favor, digite o nome do equipamento.");
    if (!proximoPatrimonio) return toast.error("Erro ao gerar número de patrimônio.");

    setLoading(true);

    try {
      const snapAtivosCheck = await getDocs(collection(db, "ativos"));
      const snapEtiquetasCheck = await getDocs(collection(db, "etiquetas_patrimonio"));

      const existe = [...snapAtivosCheck.docs, ...snapEtiquetasCheck.docs].some(
        doc => String(doc.data().patrimonio).trim() === String(proximoPatrimonio).trim()
      );

      if (existe) {
        toast.warn("Esse número acabou de ser ocupado. Atualizando...");
        await buscarUltimoPatrimonioGeral();
        setLoading(false);
        return;
      }

      const novoRegistro = {
        criadoEm: serverTimestamp(),
        estado: estado.toLowerCase().trim(),
        nome: nome.toLowerCase().trim(),
        observacoes: observacoes.toLowerCase().trim() || (isAvulsa ? "etiqueta avulsa gerada" : ""),
        patrimonio: String(proximoPatrimonio).trim(),
        quantidade: 1,
        setor: setor.toLowerCase().trim() || "nao informado",
        status: "ativo",
        tipo: "equipamento",
        unidade: unidade.toLowerCase().trim(),
        modoEmissao: isAvulsa ? "avulsa" : "cadastro_completo"
      };

      if (isAvulsa) {
        await addDoc(collection(db, "etiquetas_patrimonio"), novoRegistro);
        toast.success(`Etiqueta Avulsa #${proximoPatrimonio} criada!`);
      } else {
        await addDoc(collection(db, "ativos"), novoRegistro);
        await addDoc(collection(db, "etiquetas_patrimonio"), novoRegistro);
        toast.success(`Patrimônio #${proximoPatrimonio} cadastrado!`);
      }
      
      setEtiquetaPronta({
        patrimonio: proximoPatrimonio,
        nome: nome.toUpperCase(),
        unidade: unidade.toUpperCase()
      });

      setNome("");
      setSetor("");
      setObservacoes("");
      buscarUltimoPatrimonioGeral();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao registrar o patrimônio.");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    proximoPatrimonio,
    isAvulsa,
    setIsAvulsa,
    nome,
    setNome,
    unidade,
    setUnidade: handleMudarUnidade, // Use este no onChange do select de unidade
    setSetor,
    setor,
    estado,
    setEstado,
    observacoes,
    setObservacoes,
    etiquetaPronta,
    setEtiquetaPronta,
    handleCriarAtivoEEtiqueta,
    dispararImpressao: () => window.print(),
    buscarUltimoPatrimonioGeral,
    modoEdicaoSetor,
    setModoEdicaoSetor
  };
};