import React, { useState } from "react";
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
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiTruck,
  FiSearch,
  FiArrowLeft,
  FiPackage,
  FiX,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCcw,
  FiPrinter,
  FiCheckCircle,
} from "react-icons/fi";
// IMPORTANTE: Importando a função de impressão que configuramos
import { abrirVisualizacaoTermo } from "../components/ImpressaoTransferencia";

const Transferencia = () => {
  const [patrimonioBusca, setPatrimonioBusca] = useState("");
  const [nomeBusca, setNomeBusca] = useState("");
  const [unidadeFiltro, setUnidadeFiltro] = useState("");
  const [itensEncontrados, setItensEncontrados] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [novoPatrimonioParaSP, setNovoPatrimonioParaSP] = useState("");

  // NOVO: Estado para controlar se o usuário já gerou a impressão
  const [termoVisualizado, setTermoVisualizado] = useState(false);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 12;

  const [dadosSaida, setDadosSaida] = useState({
    novaUnidade: "",
    novoSetor: "",
    motivo: "Transferência",
    responsavelRecebimento: "",
  });

  const unidades = [
    "Hospital Conde",
    "UPA INOÃ",
    "UPA SANTA RITA",
    "SAMU BARROCO",
    "SAMU PONTA NEGRA",
    "SAMU CENTRO",
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

  const limparBusca = () => {
    setPatrimonioBusca("");
    setNomeBusca("");
    setUnidadeFiltro("");
    setItensEncontrados([]);
    setPaginaAtual(1);
    toast.info("Busca resetada");
  };

  const executarBusca = async (tipo) => {
    const termoOriginal = tipo === "patrimonio" ? patrimonioBusca : nomeBusca;
    if (!termoOriginal.trim()) {
      toast.warn(
        `Digite um ${tipo === "patrimonio" ? "patrimônio" : "nome ou setor"}.`
      );
      return;
    }

    setLoading(true);
    try {
      const ativosRef = collection(db, "ativos");
      let listaGeral = [];

      // SE FOR BUSCA POR PATRIMÔNIO: Remove o limite inicial para buscar o registro no escopo completo
      if (tipo === "patrimonio") {
        const qPatrimonio = query(ativosRef);
        const snapPatrimonio = await getDocs(qPatrimonio);
        
        listaGeral = snapPatrimonio.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } else {
        // SE FOR BUSCA POR NOME/SETOR: Aumenta o limite seguro de paginação para evitar que itens sumam
        const qGeral = query(ativosRef, limit(2000));
        const snapGeral = await getDocs(qGeral);
        
        listaGeral = snapGeral.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }

      const termoNorm = normalizarParaComparacao(termoOriginal);
      const unidadeFiltroNorm = normalizarParaComparacao(unidadeFiltro);

      const filtrados = listaGeral.filter((item) => {
        const statusItemNorm = String(item.status || "ativo").toLowerCase().trim();
        if (statusItemNorm !== "ativo") return false;

        const itemUnidadeNorm = normalizarParaComparacao(item.unidade);
        const itemPatrimonioNorm = normalizarParaComparacao(item.patrimonio);
        const itemNomeNorm = normalizarParaComparacao(item.nome);
        const itemSetorNorm = normalizarParaComparacao(item.setor);

        if (unidadeFiltro && itemUnidadeNorm !== unidadeFiltroNorm)
          return false;

        if (tipo === "patrimonio") return itemPatrimonioNorm === termoNorm;
        return (
          itemNomeNorm.includes(termoNorm) ||
          itemSetorNorm.includes(termoNorm) ||
          itemPatrimonioNorm === termoNorm
        );
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
    if (!dadosSaida.novaUnidade || !dadosSaida.novoSetor || !dadosSaida.responsavelRecebimento) {
      toast.warn("Por favor, preencha todos os campos antes de visualizar.");
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

    const dadosCompletosParaTermo = {
      ativoId: itemSelecionado.id,
      patrimonio: patrimonioFinal,
      nomeEquipamento: itemSelecionado.nome,
      unidadeOrigem: itemSelecionado.unidade,
      setorOrigem: itemSelecionado.setor,
      unidadeDestino: dadosSaida.novaUnidade,
      setorDestino: dadosSaida.novoSetor,
      responsavelRecebimento: dadosSaida.responsavelRecebimento,
      motivo: dadosSaida.motivo,
    };

    abrirVisualizacaoTermo(dadosCompletosParaTermo);
    setTermoVisualizado(true);
    toast.info("Documento de conferência aberto na nova aba!");
  };

  const handleSaida = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ativoRef = doc(db, "ativos", itemSelecionado.id);
      const patrimonioFinal =
        normalizarParaComparacao(itemSelecionado.patrimonio) === "sp" &&
        novoPatrimonioParaSP
          ? novoPatrimonioParaSP.toLowerCase()
          : itemSelecionado.patrimonio.toLowerCase();

      await updateDoc(ativoRef, {
        unidade: dadosSaida.novaUnidade,
        setor: dadosSaida.novoSetor.toLowerCase(),
        patrimonio: patrimonioFinal,
        ultimaMovimentacao: serverTimestamp(),
      });

      await addDoc(collection(db, "saidaEquipamento"), {
        ativoId: itemSelecionado.id,
        patrimonio: patrimonioFinal,
        nomeEquipamento: itemSelecionado.nome.toLowerCase(),
        unidadeOrigem: itemSelecionado.unidade,
        setorOrigem: itemSelecionado.setor.toLowerCase(),
        unidadeDestino: dadosSaida.novaUnidade,
        setorDestino: dadosSaida.novoSetor.toLowerCase(),
        responsavelRecebimento: dadosSaida.responsavelRecebimento.toLowerCase(),
        motivo: dadosSaida.motivo,
        dataSaida: serverTimestamp(),
      });

      toast.success("Transferência salva com sucesso no sistema!");
      setShowModal(false);
      setTermoVisualizado(false);
      setItensEncontrados([]);
      setPatrimonioBusca("");
      setNomeBusca("");
      setNovoPatrimonioParaSP("");
      setDadosSaida({
        novaUnidade: "",
        novoSetor: "",
        motivo: "Transferência",
        responsavelRecebimento: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FiTruck className="text-blue-600" /> Transferência de Equipamento
          </h1>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors"
          >
            <FiArrowLeft /> Voltar
          </Link>
        </header>

        {/* BUSCA */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
              <FiFilter /> Unidade Atual
            </label>
            <select
              className="border border-slate-200 p-2 rounded-lg text-sm outline-blue-500 bg-white cursor-pointer"
              value={unidadeFiltro}
              onChange={(e) => setUnidadeFiltro(e.target.value)}
            >
              <option value="">Todas</option>
              {unidades.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase">
              Nº Patrimônio
            </label>
            <div className="flex">
              <input
                type="text"
                className="flex-1 border border-slate-200 p-2 rounded-l-lg text-sm outline-blue-500"
                placeholder="Ex: HMC-001"
                value={patrimonioBusca}
                onChange={(e) => setPatrimonioBusca(e.target.value)}
              />
              <button
                className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700 cursor-pointer"
                onClick={() => executarBusca("patrimonio")}
              >
                <FiSearch />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase">
              Nome ou Setor
            </label>
            <div className="flex">
              <input
                type="text"
                className="flex-1 border border-slate-200 p-2 rounded-l-lg text-sm outline-blue-500"
                placeholder="Ex: Monitor"
                value={nomeBusca}
                onChange={(e) => setNomeBusca(e.target.value)}
              />
              <button
                className="bg-indigo-600 text-white p-2 rounded-r-lg hover:bg-indigo-700 cursor-pointer"
                onClick={() => executarBusca("nome")}
              >
                <FiSearch />
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              className="w-full h-[38px] flex items-center justify-center gap-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200 cursor-pointer"
              onClick={limparBusca}
            >
              <FiRotateCcw /> Limpar
            </button>
          </div>
        </section>

        {/* RESULTADOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {itensExibidos.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setItemSelecionado(item);
                setTermoVisualizado(false);
                setShowModal(true);
              }}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 cursor-pointer transition-all hover:shadow-md group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FiPackage size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{item.nome}</h3>
                  <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">
                    {item.patrimonio}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 text-xs text-slate-500">
                Local:{" "}
                <strong className="text-slate-700">
                  {item.unidade} - {item.setor}
                </strong>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINAÇÃO */}
        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              disabled={paginaAtual === 1}
              onClick={() => setPaginaAtual((prev) => prev - 1)}
              className="p-2 rounded bg-white border disabled:opacity-50 cursor-pointer"
            >
              <FiChevronLeft />
            </button>
            <span className="text-sm font-bold text-slate-600">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <button
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPaginaAtual((prev) => prev + 1)}
              className="p-2 rounded bg-white border disabled:opacity-50 cursor-pointer"
            >
              <FiChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && itemSelecionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
              <h3 className="font-bold text-lg text-slate-800">
                Confirmar Saída
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setTermoVisualizado(false);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm">
              <p className="text-blue-800">
                Item: <strong>{itemSelecionado.nome}</strong>
              </p>
              <p className="text-blue-600 text-xs">
                Origem: {itemSelecionado.unidade} ({itemSelecionado.setor})
              </p>
            </div>

            <form onSubmit={handleSaida} className="space-y-4">
              {normalizarParaComparacao(itemSelecionado.patrimonio) === "sp" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <label className="text-xs font-bold text-amber-700 block mb-1">
                    Atribuir Patrimônio (Era SP)
                  </label>
                  <input
                    type="text"
                    disabled={termoVisualizado}
                    className="w-full p-2 border border-amber-300 rounded outline-none text-slate-700 disabled:bg-slate-100"
                    placeholder="h-0000"
                    value={novoPatrimonioParaSP}
                    onChange={(e) => setNovoPatrimonioParaSP(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Unidade de Destino
                </label>
                <select
                  required
                  disabled={termoVisualizado}
                  value={dadosSaida.novaUnidade}
                  className="w-full border p-2 rounded-lg outline-blue-500 bg-white text-slate-700 cursor-pointer disabled:bg-slate-100"
                  onChange={(e) =>
                    setDadosSaida({
                      ...dadosSaida,
                      novaUnidade: e.target.value,
                    })
                  }
                >
                  <option value="">Selecione...</option>
                  {unidades.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Novo Setor
                </label>
                <input
                  type="text"
                  required
                  disabled={termoVisualizado}
                  value={dadosSaida.novoSetor}
                  className="w-full border p-2 rounded-lg outline-blue-500 text-slate-700 disabled:bg-slate-100"
                  onChange={(e) =>
                    setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Responsável pelo Recebimento
                </label>
                <input
                  type="text"
                  required
                  disabled={termoVisualizado}
                  value={dadosSaida.responsavelRecebimento}
                  className="w-full border p-2 rounded-lg outline-blue-500 text-slate-700 disabled:bg-slate-100"
                  onChange={(e) =>
                    setDadosSaida({
                      ...dadosSaida,
                      responsavelRecebimento: e.target.value,
                    })
                  }
                />
              </div>

              {/* FLUXO DINÂMICO DE BOTÕES */}
              {!termoVisualizado ? (
                <button
                  type="button"
                  onClick={lidarComVisualizacao}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 cursor-pointer"
                >
                  <FiPrinter size={16} /> Visualizar Documento de Impressão
                </button>
              ) : (
                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 cursor-pointer disabled:bg-slate-300"
                  >
                    <FiCheckCircle size={16} /> {loading ? "Gravando..." : "Confirmar e Salvar Transferência"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setTermoVisualizado(false)}
                    className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    ← Editar informações preenchidas
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transferencia;