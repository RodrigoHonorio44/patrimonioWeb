import React, { useEffect, useState } from "react";
import { db, auth } from "../api/Firebase";
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
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiPauseCircle,
  FiCheck,
  FiArrowLeftCircle,
  FiRotateCcw,
  FiPlayCircle,
  FiEye,
  FiX,
} from "react-icons/fi";

const PainelAnalista = () => {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);
  const [mostrarModalPausar, setMostrarModalPausar] = useState(false);
  const [mostrarModalVer, setMostrarModalVer] = useState(false);

  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [parecerTecnico, setParecerTecnico] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [motivoPausa, setMotivoPausa] = useState("");

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setUserData(docSnap.data());
    };
    fetchUserData();

    setLoading(true);
    const q = query(collection(db, "chamados"), orderBy("criadoEm", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const lista = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Só adiciona na fila se não estiver fechado
        if (data.status?.toLowerCase() !== "fechado") {
          lista.push({ id: doc.id, ...data });
        }
      });
      setChamados(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const analistaNome =
    userData?.nome ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Analista";

  const handleAssumirChamado = async (chamado) => {
    try {
      await updateDoc(doc(db, "chamados", chamado.id), {
        status: "em atendimento",
        tecnicoResponsavel: analistaNome,
        iniciadoEm: serverTimestamp(),
      });
      toast.info("Você assumiu este chamado!");
    } catch (error) {
      toast.error("Erro ao assumir.");
    }
  };

  const handleDevolverChamado = async (chamado) => {
    try {
      await updateDoc(doc(db, "chamados", chamado.id), {
        status: "aberto",
        tecnicoResponsavel: deleteField(),
        iniciadoEm: deleteField(),
      });
      toast.warning("Chamado devolvido para a fila.");
    } catch (error) {
      toast.error("Erro ao devolver chamado.");
    }
  };

  const handlePausarChamado = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "chamados", chamadoSelecionado.id), {
        status: "pendente",
        motivoPausa: motivoPausa,
        pausadoEm: serverTimestamp(),
      });
      toast.warning("SLA Pausado.");
      setMostrarModalPausar(false);
      setMotivoPausa("");
    } catch (error) {
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
    } catch (error) {
      toast.error("Erro ao retomar.");
    }
  };

  const handleFinalizarChamado = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "chamados", chamadoSelecionado.id), {
        status: "fechado",
        feedbackAnalista: parecerTecnico,
        patrimonio: patrimonio.toUpperCase(),
        finalizadoEm: serverTimestamp(),
      });
      toast.success("Chamado encerrado!");
      setMostrarModalFinalizar(false);
      setParecerTecnico("");
      setPatrimonio("");
    } catch (error) {
      toast.error("Erro ao finalizar.");
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600"></div>
      </div>
    );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <header className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Fila de Trabalho
          </h1>
          <p className="text-slate-500 text-sm">Olá, {analistaNome}</p>
        </div>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-slate-600 font-bold hover:text-blue-600 transition-all"
        >
          <FiArrowLeftCircle /> Dashboard
        </Link>
      </header>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  OS
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Solicitante
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Unidade
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chamados.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-10 text-center text-slate-400 font-medium"
                  >
                    Nenhum chamado pendente na fila.
                  </td>
                </tr>
              ) : (
                chamados.map((item) => {
                  const statusNormalizado = item.status?.toLowerCase().trim();

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-bold text-slate-700 italic">
                          #{item.numeroOs}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {item.criadoEm?.toDate().toLocaleString("pt-BR")}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800">
                          {item.nome}
                        </span>
                        <p className="text-slate-500 text-xs">{item.setor}</p>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-700">
                        {item.unidade}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                            statusNormalizado === "aberto"
                              ? "bg-amber-100 text-amber-600"
                              : statusNormalizado === "pendente"
                              ? "bg-red-100 text-red-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            setChamadoSelecionado(item);
                            setMostrarModalVer(true);
                          }}
                          className="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-slate-200"
                        >
                          <FiEye size={18} />
                        </button>

                        {statusNormalizado === "aberto" && (
                          <button
                            onClick={() => handleAssumirChamado(item)}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                          >
                            Assumir
                          </button>
                        )}

                        {statusNormalizado === "em atendimento" && (
                          <>
                            <button
                              onClick={() => {
                                setChamadoSelecionado(item);
                                setMostrarModalFinalizar(true);
                              }}
                              className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700"
                              title="Finalizar"
                            >
                              <FiCheck size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setChamadoSelecionado(item);
                                setMostrarModalPausar(true);
                              }}
                              className="bg-amber-500 text-white p-2 rounded-lg hover:bg-amber-600"
                              title="Pausar SLA"
                            >
                              <FiPauseCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleDevolverChamado(item)}
                              className="bg-slate-200 text-slate-600 p-2 rounded-lg hover:bg-red-50 hover:text-red-500"
                              title="Devolver"
                            >
                              <FiRotateCcw size={18} />
                            </button>
                          </>
                        )}

                        {statusNormalizado === "pendente" && (
                          <button
                            onClick={() => handleRetomarChamado(item)}
                            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1"
                          >
                            <FiPlayCircle /> Retomar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAIS MANTIDOS (IGUAIS AO SEU CÓDIGO) --- */}
      {/* MODAL VER DETALHES */}
      {mostrarModalVer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setMostrarModalVer(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <FiX size={24} />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4">
              Detalhes da OS #{chamadoSelecionado?.numeroOs}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <p>
                  <strong>Solicitante:</strong> {chamadoSelecionado?.nome}
                </p>
                <p>
                  <strong>Unidade:</strong> {chamadoSelecionado?.unidade}
                </p>
                <p>
                  <strong>Equipamento:</strong>{" "}
                  {chamadoSelecionado?.equipamento}
                </p>
                <p>
                  <strong>Setor:</strong> {chamadoSelecionado?.setor}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border italic text-slate-600">
                "{chamadoSelecionado?.descricao}"
              </div>
              {chamadoSelecionado?.motivoPausa && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-700">
                  <strong>Motivo da Pausa:</strong>{" "}
                  {chamadoSelecionado.motivoPausa}
                </div>
              )}
            </div>
            <button
              onClick={() => setMostrarModalVer(false)}
              className="w-full mt-8 bg-slate-800 text-white font-bold py-3 rounded-xl"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL PAUSAR */}
      {mostrarModalPausar && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-slate-800">
              Pausar SLA
            </h2>
            <form onSubmit={handlePausarChamado} className="space-y-4">
              <textarea
                className="w-full border border-slate-200 p-3 rounded-xl h-24 outline-blue-500"
                value={motivoPausa}
                onChange={(e) => setMotivoPausa(e.target.value)}
                placeholder="Motivo da pausa..."
                required
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 text-white font-bold py-3 rounded-xl"
                >
                  Confirmar Pausa
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModalPausar(false)}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FINALIZAR */}
      {mostrarModalFinalizar && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-slate-800">
              Finalizar Chamado
            </h2>
            <form onSubmit={handleFinalizarChamado} className="space-y-4">
              <input
                type="text"
                className="w-full border border-slate-200 p-3 rounded-xl"
                value={patrimonio}
                onChange={(e) => setPatrimonio(e.target.value)}
                placeholder="Confirmar Patrimônio"
                required
              />
              <textarea
                className="w-full border border-slate-200 p-3 rounded-xl h-32"
                value={parecerTecnico}
                onChange={(e) => setParecerTecnico(e.target.value)}
                placeholder="O que foi resolvido?"
                required
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl"
                >
                  Encerrar Chamado
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModalFinalizar(false)}
                  className="flex-1 bg-slate-100 font-bold py-3 rounded-xl"
                >
                  Sair
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PainelAnalista;
