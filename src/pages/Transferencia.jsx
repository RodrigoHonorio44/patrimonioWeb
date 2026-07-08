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
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCcw,
} from "react-icons/fi";
// IMPORTANTE: Importando a função de impressão que configuramos
import { abrirVisualizacaoTermo } from "../components/ImpressaoTransferencia";
// Importando o novo Modal separado
import ModalTransferencia from "../components/ModalTransferencia";

const Transferencia = () => {
  const [patrimonioBusca, setPatrimonioBusca] = useState("");
  const [nomeBusca, setNomeBusca] = useState("");
  const [unidadeFiltro, setUnidadeFiltro] = useState("");
  const [itensEncontrados, setItensEncontrados] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [novoPatrimonioParaSP, setNovoPatrimonioParaSP] = useState("");

  // Estado para controlar se o usuário já gerou a impressão
  const [termoVisualizado, setTermoVisualizado] = useState(false);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 12;

  const [dadosSaida, setDadosSaida] = useState({
    novaUnidade: "",
    novoSetor: "", // Representará o Nome do Paciente se for residencial
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

      if (tipo === "patrimonio") {
        const qPatrimonio = query(ativosRef);
        const snapPatrimonio = await getDocs(qPatrimonio);
        
        listaGeral = snapPatrimonio.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } else {
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
        if (statusItemNorm !== "ativo" && statusItemNorm !== "em_uso_residencial") return false;

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
    const isResidencial = dadosSaida.novaUnidade === "Residência do Paciente";

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
    toast.info("Documento de conferência aberto na nova aba!");
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
          ? novoPatrimonioParaSP.toLowerCase()
          : itemSelecionado.patrimonio.toLowerCase();

      // 1. Atualizar documento original na coleção "ativos"
      await updateDoc(ativoRef, {
        unidade: dadosSaida.novaUnidade,
        setor: dadosSaida.novoSetor.toLowerCase(),
        patrimonio: patrimonioFinal,
        status: isResidencial ? "em_uso_residencial" : "ativo",
        ultimaMovimentacao: serverTimestamp(),
      });

      // 2. Adicionar histórico de movimentação em "saidaEquipamento"
      const payloadSaida = {
        ativoId: itemSelecionado.id,
        patrimonio: patrimonioFinal,
        nomeEquipamento: itemSelecionado.nome.toLowerCase(),
        unidadeOrigem: itemSelecionado.unidade,
        setorOrigem: itemSelecionado.setor.toLowerCase(),
        unidadeDestino: dadosSaida.novaUnidade,
        setorDestino: dadosSaida.novoSetor.toLowerCase(),
        responsavelRecebimento: dadosSaida.responsavelRecebimento.toLowerCase(),
        motivo: isResidencial ? "home care" : dadosSaida.motivo.toLowerCase(),
        dataSaida: serverTimestamp(),
      };

      if (isResidencial) {
        payloadSaida.pacienteDetails = {
          endereco: dadosSaida.pacienteEndereco.toLowerCase(),
          telefone: dadosSaida.pacienteTelefone,
          identidade: dadosSaida.pacienteIdentidade,
          cpf: dadosSaida.pacienteCpf,
        };
      }

      await addDoc(collection(db, "saidaEquipamento"), payloadSaida);

      // 3. Se for residencial, salvar também na coleção dedicada "equipamento_com_paciente"
      if (isResidencial) {
        await addDoc(collection(db, "equipamento_com_paciente"), {
          equipamentoId: itemSelecionado.id,
          equipamentoNome: itemSelecionado.nome.toLowerCase(),
          patrimonio: patrimonioFinal,
          unidadeOrigem: itemSelecionado.unidade,
          setorOrigem: itemSelecionado.setor.toLowerCase(),
          dataEntrega: serverTimestamp(),
          statusVinculo: "ativo",
          paciente: {
            nome: dadosSaida.novoSetor.toLowerCase(),
            endereco: dadosSaida.pacienteEndereco.toLowerCase(),
            telefone: dadosSaida.pacienteTelefone,
            identidade: dadosSaida.pacienteIdentidade,
            cpf: dadosSaida.pacienteCpf,
            responsavelRecebimento: dadosSaida.responsavelRecebimento.toLowerCase()
          },
        });
      }

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
                  {item.status === "em_uso_residencial" && (
                    <span className="ml-2 text-[10px] font-black bg-amber-100 px-2 py-0.5 rounded text-amber-700 uppercase">
                      Home Care
                    </span>
                  )}
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

      {/* COMPONENTE DO MODAL EXTERNALIZADO */}
      <ModalTransferencia
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setTermoVisualizado(false);
        }}
        itemSelecionado={itemSelecionado}
        dadosSaida={dadosSaida}
        setDadosSaida={setDadosSaida}
        novoPatrimonioParaSP={novoPatrimonioParaSP}
        setNovoPatrimonioParaSP={setNovoPatrimonioParaSP}
        termoVisualizado={termoVisualizado}
        setTermoVisualizado={setTermoVisualizado}
        lidarComVisualizacao={lidarComVisualizacao}
        handleSaida={handleSaida}
        loading={loading}
        unidades={unidades}
        normalizarParaComparacao={normalizarParaComparacao}
      />
    </div>
  );
};

export default Transferencia;