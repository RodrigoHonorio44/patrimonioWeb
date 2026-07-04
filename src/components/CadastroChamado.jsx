import React, { useState } from "react";
import {
  X,
  Send,
  Loader2,
  Building2,
  Monitor,
  Hash,
  MapPin,
  FileText,
  BarChart,
  CheckCircle2,
  Users,
  Search,
  RotateCcw,
} from "lucide-react";
import { auth, db } from "../services/firebase";
import { addDoc, collection, serverTimestamp, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function CadastroChamado({ isOpen = true, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [buscandoAtivo, setBuscandoAtivo] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState("");

  const [unidade, setUnidade] = useState("");
  const [equipe, setEquipe] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [setor, setSetor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("média");
  const [naoSeiPatrimonio, setNaoSeiPatrimonio] = useState(false);

  if (onClose && !isOpen) return null;

  const handleFechar = () => {
    setSucesso(false);
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const handleLimparCampos = () => {
    setPatrimonio("");
    setUnidade("");
    setEquipamento("");
    setSetor("");
    setNaoSeiPatrimonio(false);
    toast.success("Campos limpos com sucesso!");
  };

  const toggleNaoSei = () => {
    const novoEstado = !naoSeiPatrimonio;
    setNaoSeiPatrimonio(novoEstado);
    setPatrimonio(novoEstado ? "s/p" : "");
    if (novoEstado) {
      setUnidade("");
      setEquipamento("");
      setSetor("");
    }
  };

  const handleBotaoBusca = async (e) => {
    if (e) e.preventDefault();

    const tagOriginal = patrimonio.trim();
    if (!tagOriginal || tagOriginal.toLowerCase() === "s/p") return;

    setBuscandoAtivo(true);
    try {
      const ativosRef = collection(db, "ativos");
      
      // Cria um array para termos de busca contendo a string em minúsculo
      const termosBusca = [tagOriginal.toLowerCase()];
      
      // Se for puramente numérico, insere também a versão do tipo Number no array
      if (!isNaN(tagOriginal)) {
        termosBusca.push(Number(tagOriginal));
      }

      // Procura registros onde o patrimônio seja igual a qualquer um dos termos mapeados
      const q = query(ativosRef, where("patrimonio", "in", termosBusca));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const dados = querySnapshot.docs[0].data();

        setEquipamento(dados.nome || "");
        setSetor(dados.setor || "");

        const unidadeBanco = dados.unidade || "";
        if (unidadeBanco.toLowerCase() === "hospital conde") {
          setUnidade("Hospital Conde");
        } else {
          setUnidade(unidadeBanco.toUpperCase());
        }
        toast.success("equipamento cadastrado");
      } else {
        toast.error("equipamento nao cadastrado");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do patrimônio:", error);
      toast.error("Erro ao consultar o banco de dados.");
    } finally {
      setBuscandoAtivo(false);
    }
  };

  const handleNovoChamado = async (e) => {
    e.preventDefault();
    if (!unidade || !equipe) return;
    setLoading(true);

    const novaOs = `${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    try {
      const uidExibicao = auth.currentUser.uid;
      let nomeParaSalvar = auth.currentUser.email.split("@")[0].toLowerCase();

      const userDocRef = doc(db, "usuarios", uidExibicao);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const dadosUsuario = userDocSnap.data();
        if (dadosUsuario.nome) {
          const partesNome = dadosUsuario.nome.trim().split(/\s+/);
          if (partesNome.length > 1) {
            nomeParaSalvar = `${partesNome[0]} ${partesNome[partesNome.length - 1]}`.toLowerCase();
          } else {
            nomeParaSalvar = partesNome[0].toLowerCase();
          }
        }
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
      toast.success("Chamado registrado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar chamado técnico.");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle =
    "fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md transition-all";

  return (
    <div className={containerStyle}>
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
        {sucesso ? (
          <div className="p-10 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">
              Protocolo Gerado!
            </h2>
            <p className="text-slate-500 mb-8 italic text-xl font-bold">
              #{protocoloGerado}
            </p>
            <button
              onClick={handleFechar}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all uppercase text-xs"
            >
              Concluir e Voltar
            </button>
          </div>
        ) : (
          <div className="p-6 sm:p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">
                Novo Chamado
              </h2>
              <button
                onClick={handleFechar}
                className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleNovoChamado} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1 px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Patrimônio / Tag
                  </label>
                  <button
                    type="button"
                    onClick={toggleNaoSei}
                    className={`text-[9px] font-black px-2 py-1 rounded-lg transition-all ${
                      naoSeiPatrimonio ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {naoSeiPatrimonio ? "DIGITAR" : "NÃO SEI TAG"}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      required
                      dynamic-input="true"
                      readOnly={naoSeiPatrimonio}
                      value={patrimonio}
                      onChange={(e) => setPatrimonio(e.target.value)}
                      placeholder="Ex: 25779"
                      className={`w-full p-4 pl-11 border-2 rounded-2xl outline-none text-sm font-bold ${
                        naoSeiPatrimonio
                          ? "bg-amber-50 border-amber-200 text-slate-700"
                          : "bg-slate-50 border-slate-50 focus:border-blue-600 text-slate-700"
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={buscandoAtivo || naoSeiPatrimonio}
                    onClick={handleBotaoBusca}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 min-w-[52px]"
                  >
                    {buscandoAtivo ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  </button>

                  <button
                    type="button"
                    onClick={handleLimparCampos}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-4 rounded-2xl flex items-center justify-center transition-all min-w-[52px]"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                  Unidade
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    required
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 appearance-none text-sm font-bold text-slate-700 transition-all"
                  >
                    <option value="">Onde você está?</option>
                    <option value="Hospital Conde">Hospital Conde</option>
                    <option value="UPA INOÃ">UPA INOÃ</option>
                    <option value="UPA SANTA RITA">UPA SANTA RITA</option>
                    <option value="SAMU BARROCO">SAMU BARROCO</option>
                    <option value="SAMU CENTRO">SAMU CENTRO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                  Equipe Responsável
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    required
                    value={equipe}
                    onChange={(e) => setEquipe(e.target.value)}
                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 appearance-none text-sm font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    <option value="">Para qual equipe é o chamado?</option>
                    <option value="refrigeracao">Refrigeração</option>
                    <option value="Patrimonio">Patrimônio</option>
                    <option value="ti computadores impressoras">TI Computadores e Impressoras</option>
                    <option value="ti sistema e redes">TI Sistema e Redes</option>
                    <option value="manutencao predial">Manutenção Predial</option>
                    <option value="engenharia clinica">Engenharia Clínica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                    Equipamento
                  </label>
                  <div className="relative">
                    <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      required
                      value={equipamento}
                      onChange={(e) => setEquipamento(e.target.value)}
                      placeholder="Ex: Frigobar"
                      className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 text-sm font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                    Setor
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      value={setor}
                      onChange={(e) => setSetor(e.target.value)}
                      placeholder="Ex: Sala de Medicação"
                      className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 text-sm font-bold text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                  Prioridade
                </label>
                <div className="relative">
                  <BarChart className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value)}
                    className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 appearance-none text-sm font-bold text-slate-700"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="média">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                  Descrição do Problema
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
                  <textarea
                    required
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o problema detalhadamente..."
                    rows="3"
                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-blue-600 text-sm font-medium text-slate-700 resize-none"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 uppercase text-xs active:scale-95 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Send size={16} /> Enviar Chamado
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}