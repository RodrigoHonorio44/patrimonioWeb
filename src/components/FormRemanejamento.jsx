import React, { useState, useEffect } from "react";
import { db, auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { toast } from "react-toastify";
import {
  FiX,
  FiSend,
  FiMonitor,
  FiHash,
  FiFileText,
  FiArrowRight,
  FiMapPin,
  FiHome,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiUsers,
} from "react-icons/fi";

const FormRemanejamento = ({ onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingAtivo, setLoadingAtivo] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [osGerada, setOsGerada] = useState("");
  const [modoSetor, setModoSetor] = useState(false);
  const [naoSeiPatrimonio, setNaoSeiPatrimonio] = useState(false);
  const [userName, setUserName] = useState("Usuário");

  const [formData, setFormData] = useState({
    unidade: "",
    equipamento: "",
    patrimonio: "",
    setorOrigem: "",
    setorDestino: "",
    descricao: "",
    prioridade: "baixa",
    equipe: "", 
  });

  const unidades = [
    "Hospital Conde",
    "Upa Inoã",
    "Upa Santa Rita",
    "Samu Centro",
    "Samu Barroco",
    "Samu Ponta Negra",
  ];

  // OPÇÕES DE EQUIPES EXATAS DO SEU SELECT
  const equipesDisponiveis = [
    { value: "manutencao predial", label: "Manutenção Predial" },
    { value: "engenharia clinica", label: "Engenharia Clínica" },
    { value: "patrimonio", label: "Patrimônio" },
    { value: "ti malta", label: "Ti Malta" },
    { value: "sistema e redes", label: "Sistema e Redes" },
    { value: "refrigeracao", label: "Refrigeração" },
  ];

  const handleExit = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/dashboard");
    }
  };

  // Carrega dados do usuário (Nome e Equipe Padrão)
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "usuarios", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(data.nome || "Usuário");
            
            // Define a equipe padrão do usuário logado se corresponder a uma das opções
            if (data.equipe) {
              const equipeUser = data.equipe.toLowerCase();
              const existeEquipe = equipesDisponiveis.some(e => e.value === equipeUser);
              if (existeEquipe) {
                setFormData((prev) => ({ ...prev, equipe: equipeUser }));
              }
            }
          } else {
            setUserName(user.displayName || user.email.split("@")[0]);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    const formattedValue = e.target.type === "text" || e.target.tagName === "TEXTAREA" 
      ? value.toLowerCase() 
      : value;

    setFormData({ ...formData, [e.target.name]: formattedValue });
  };

  const handleNaoSeiPatrimonio = () => {
    const novoEstado = !naoSeiPatrimonio;
    setNaoSeiPatrimonio(novoEstado);
    setFormData({ ...formData, patrimonio: novoEstado ? "S/P" : "" });
  };

  const alternarModoSetor = () => {
    const novoModo = !modoSetor;
    setModoSetor(novoModo);
    setFormData({
      ...formData,
      equipamento: novoModo ? "setor inteiro" : "",
      patrimonio: novoModo ? "S/P" : "",
    });
    setNaoSeiPatrimonio(false);
  };

  // BUSCA DE ATIVO NA COLEÇÃO "ativos"
  const buscarAtivoNoFirestore = async () => {
    const nPatrimonio = formData.patrimonio.trim().toLowerCase();
    if (!nPatrimonio || nPatrimonio === "s/p") {
      toast.info("Insira um número de patrimônio válido para buscar.");
      return;
    }

    setLoadingAtivo(true);
    try {
      const ativosRef = collection(db, "ativos");
      const q = query(ativosRef, where("patrimonio", "==", nPatrimonio));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const ativoEncontrado = querySnapshot.docs[0].data();
        
        // Faz correspondência sem distinção de maiúsculas/minúsculas para a Unidade
        const unidadeAtivo = ativoEncontrado.unidade || "";
        const unidadeCorrespondente = unidades.find(
          (u) => u.toLowerCase() === unidadeAtivo.toLowerCase()
        ) || ""; 

        setFormData((prev) => ({
          ...prev,
          equipamento: (ativoEncontrado.nome || ativoEncontrado.equipamento || "").toLowerCase(),
          setorOrigem: (ativoEncontrado.setor || "").toLowerCase(),
          unidade: unidadeCorrespondente, 
        }));

        toast.success("Ativo localizado! Campos preenchidos.");
      } else {
        toast.warning("Nenhum ativo localizado com este patrimônio.");
      }
    } catch (error) {
      console.error("Erro ao buscar ativo:", error);
      toast.error("Erro ao realizar a busca de ativos.");
    } finally {
      setLoadingAtivo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    if (!formData.equipe) return toast.error("Selecione a equipe responsável.");

    setLoading(true);
    try {
      const numeroOS = `#REM-${new Date().getFullYear()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const novoRemanejamento = {
        numeroOs: numeroOS,
        tipo: modoSetor
          ? "Remanejamento de Setor"
          : "Remanejamento de Equipamento",
        status: "aberto",
        nome: userName.toLowerCase(),
        quemSolicitou: userName.toLowerCase(),
        userId: user.uid,
        userEmail: user.email,
        ...formData,
        criadoEm: serverTimestamp(),
      };

      // 1. Grava na fila de chamados (OS principal)
      await addDoc(collection(db, "chamados"), novoRemanejamento);

      // 2. Grava de forma independente na coleção "remanejamento" para histórico
      await addDoc(collection(db, "remanejamentos"), {
        ...novoRemanejamento,
        historicoEm: serverTimestamp(),
      });

      setOsGerada(numeroOS);
      setSucesso(true);
      toast.success("Solicitação enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Ocorreu um erro ao processar o envio.");
    } finally {
      setLoading(false);
    }
  };

  const getPrioridadeColor = () => {
    if (formData.prioridade === "urgente")
      return "text-red-500 border-red-200 bg-red-50";
    if (formData.prioridade === "media")
      return "text-amber-500 border-amber-200 bg-amber-50";
    return "text-emerald-500 border-emerald-200 bg-emerald-50";
  };

  return (
    <div className="fixed inset-0 z-10001 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-137.5 rounded-[2.5rem] shadow-2xl relative p-6 sm:p-10 border-t-8 border-orange-400 overflow-y-auto max-h-[90vh]">
        {sucesso ? (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <FiCheckCircle size={48} className="text-orange-400" />
            </div>
            <h2 className="text-3xl font-black text-slate-700 uppercase italic mb-2 tracking-tighter">
              Solicitado!
            </h2>
            <div className="bg-orange-50 border-2 border-orange-100 rounded-3xl px-10 py-5 mb-8">
              <span className="text-3xl font-black text-orange-400 tracking-tighter">
                {osGerada}
              </span>
            </div>
            <button
              type="button"
              onClick={handleExit}
              className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black text-xs uppercase hover:bg-slate-900 transition-all"
            >
              Concluir e Sair
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleExit}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-400 transition-all"
            >
              <FiX size={20} />
            </button>

            <div className="mb-8 text-left">
              <h2 className="text-xl sm:text-2xl font-black text-slate-700 uppercase italic flex flex-col">
                Remanejamento{" "}
                <span className="h-1.5 w-12 bg-orange-400 mt-1 rounded-full"></span>
              </h2>

              <div className="flex gap-2 mt-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => modoSetor && alternarModoSetor()}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                    !modoSetor
                      ? "bg-white text-orange-400 shadow-sm border border-orange-100"
                      : "text-slate-400"
                  }`}
                >
                  Equipamento
                </button>
                <button
                  type="button"
                  onClick={() => !modoSetor && alternarModoSetor()}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                    modoSetor
                      ? "bg-white text-orange-400 shadow-sm border border-orange-100"
                      : "text-slate-400"
                  }`}
                >
                  Setor Inteiro
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Prioridade */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Prioridade
                </label>
                <div className="relative">
                  <FiAlertCircle
                    className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 ${getPrioridadeColor()}`}
                  />
                  <select
                    name="prioridade"
                    value={formData.prioridade}
                    onChange={handleChange}
                    className={`w-full border-2 rounded-2xl py-4 pl-12 pr-4 text-sm font-black appearance-none focus:outline-none transition-all ${getPrioridadeColor()}`}
                  >
                    <option value="baixa">BAIXA (PLANEJADO)</option>
                    <option value="media">MÉDIA (EM BREVE)</option>
                    <option value="urgente">URGENTE (IMEDIATO)</option>
                  </select>
                </div>
              </div>

              {/* Equipe Responsável */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Equipe Responsável
                </label>
                <div className="relative">
                  <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300 z-10" />
                  <select
                    name="equipe"
                    required
                    value={formData.equipe}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold appearance-none focus:outline-none transition-all"
                  >
                    <option value="" disabled hidden>Selecione a equipe</option>
                    {equipesDisponiveis.map((eq) => (
                      <option key={eq.value} value={eq.value}>
                        {eq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unidade Destino */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Unidade Destino
                </label>
                <div className="relative">
                  <FiHome className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300 z-10" />
                  <select
                    name="unidade"
                    required
                    value={formData.unidade}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold appearance-none focus:outline-none transition-all"
                  >
                    <option value="">Selecione a unidade...</option>
                    {unidades.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Equipamento / Patrimônio */}
              <div
                className={`grid gap-4 text-left ${
                  modoSetor ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {!modoSetor && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">
                        Patrimônio
                      </label>
                      <button
                        type="button"
                        onClick={handleNaoSeiPatrimonio}
                        className={`text-[9px] px-2 py-0.5 rounded font-black ${
                          naoSeiPatrimonio
                            ? "bg-orange-400 text-white"
                            : "bg-slate-200"
                        }`}
                      >
                        {naoSeiPatrimonio ? "DIGITAR" : "NÃO SEI"}
                      </button>
                    </div>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <FiHash
                          className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                            naoSeiPatrimonio
                              ? "text-orange-400"
                              : "text-slate-300"
                          }`}
                        />
                        <input
                          name="patrimonio"
                          required
                          readOnly={naoSeiPatrimonio}
                          type="text"
                          value={formData.patrimonio}
                          onChange={handleChange}
                          placeholder={naoSeiPatrimonio ? "S/P" : "Número"}
                          className={`w-full rounded-2xl py-4 pl-12 text-sm font-bold focus:outline-none ${
                            naoSeiPatrimonio
                              ? "bg-orange-50 border-2 border-orange-100 text-orange-400"
                              : "bg-slate-50 border-2 border-transparent focus:border-orange-200"
                          }`}
                        />
                      </div>
                      {!naoSeiPatrimonio && (
                        <button
                          type="button"
                          disabled={loadingAtivo}
                          onClick={buscarAtivoNoFirestore}
                          className="bg-orange-400 hover:bg-orange-500 text-white px-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                          title="Buscar ativo"
                        >
                          {loadingAtivo ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiSearch size={18} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Equipamento
                  </label>
                  <div className="relative">
                    <FiMonitor className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      name="equipamento"
                      required
                      readOnly={modoSetor}
                      value={formData.equipamento}
                      type="text"
                      placeholder="Ex: Monitor"
                      onChange={handleChange}
                      className={`w-full rounded-2xl py-4 pl-12 text-sm font-bold text-slate-600 focus:outline-none ${
                        modoSetor
                          ? "bg-slate-100 italic"
                          : "bg-slate-50 border-2 border-transparent focus:border-orange-200"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Origem e Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-red-400 uppercase ml-1">
                    De: (Origem)
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-red-300" />
                    <input
                      name="setorOrigem"
                      required
                      value={formData.setorOrigem}
                      type="text"
                      placeholder="Setor atual"
                      onChange={handleChange}
                      className="w-full bg-red-50/20 border border-red-100 rounded-2xl py-4 pl-12 text-sm font-bold focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-green-500 uppercase ml-1">
                    Para: (Destino)
                  </label>
                  <div className="relative">
                    <FiArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" />
                    <input
                      name="setorDestino"
                      required
                      value={formData.setorDestino}
                      type="text"
                      placeholder="Novo setor"
                      onChange={handleChange}
                      className="w-full bg-green-50/20 border border-green-100 rounded-2xl py-4 pl-12 text-sm font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Motivo */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  Motivo
                </label>
                <div className="relative">
                  <FiFileText className="absolute left-4 top-6 text-slate-300" />
                  <textarea
                    name="descricao"
                    required
                    rows="2"
                    value={formData.descricao}
                    placeholder="Por que realizar essa mudança?"
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-100 rounded-3xl py-5 pl-12 pr-6 text-sm font-semibold focus:outline-none resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-400 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-100"
              >
                {loading ? (
                  "Processando..."
                ) : (
                  <>
                    <FiSend /> Enviar Remanejamento
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default FormRemanejamento;