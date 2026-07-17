import React from "react";
import { Link } from "react-router-dom";
import {
  FiTruck,
  FiSearch,
  FiArrowLeft,
  FiPackage,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCcw,
  FiChevronDown,
} from "react-icons/fi";
import { useTransferencia } from "../hooks/useTransferencia"; // Ajuste o caminho do seu hook aqui
import ModalTransferencia from "../components/ModalTransferencia";
import TermoRetiradaResidencia from "../components/TermoRetiradaResidencia";

const Transferencia = () => {
  const {
    patrimonioBusca,
    setPatrimonioBusca,
    nomeBusca,
    setNomeBusca,
    setorBusca,
    setSetorBusca,
    unidadeFiltro,
    setUnidadeFiltro,
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
  } = useTransferencia();

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

        {/* ÁREA DE FILTROS */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          
          {/* 1. FILTRO: UNIDADE ATUAL */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
              <FiFilter /> Unidade Atual
            </label>
            <select
              className="border border-slate-200 p-2 rounded-lg text-sm outline-blue-500 bg-white cursor-pointer h-[38px]"
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

          {/* 2. FILTRO: SETOR ATUAL (CUSTOMIZADO) */}
          <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
            <label className="text-xs font-bold text-slate-400 uppercase">
              Setor Atual
            </label>
            <div className="flex">
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  className="w-full border border-slate-200 p-2 pr-8 rounded-l-lg text-sm outline-blue-500 h-[38px]"
                  placeholder="Ex: Emergência, UTI..."
                  value={setorBusca}
                  onFocus={() => setMostrarDropdown(true)}
                  onChange={(e) => {
                    setSetorBusca(e.target.value);
                    setMostrarDropdown(true);
                  }}
                />
                <button 
                  type="button"
                  onClick={() => setMostrarDropdown(!mostrarDropdown)}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <FiChevronDown size={16} />
                </button>
              </div>
              <button
                className="bg-indigo-600 text-white p-2 rounded-r-lg hover:bg-indigo-700 cursor-pointer h-[38px] w-10 flex items-center justify-center"
                onClick={() => ejecutarBusca("setor")}
              >
                <FiSearch />
              </button>
            </div>

            {/* DROPDOWN CUSTOMIZADO */}
            {mostrarDropdown && (
              <div className="absolute left-0 right-0 top-[62px] bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto animate-fadeIn">
                {obterSetoresFiltrados().length > 0 ? (
                  obterSetoresFiltrados().map((setor, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSetorBusca(setor);
                        setMostrarDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 border-b border-slate-50 last:border-0 transition-colors font-medium flex items-center justify-between"
                    >
                      {setor}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-xs text-slate-400 text-center font-medium">
                    Nenhum setor disponível para seleção
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. FILTRO: NÚMERO DO PATRIMÔNIO */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase">
              Nº Patrimônio
            </label>
            <div className="flex">
              <input
                type="text"
                className="flex-1 border border-slate-200 p-2 rounded-l-lg text-sm outline-blue-500 h-[38px]"
                placeholder="Ex: HMC-001"
                value={patrimonioBusca}
                onChange={(e) => setPatrimonioBusca(e.target.value)}
              />
              <button
                className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700 cursor-pointer h-[38px] w-10 flex items-center justify-center"
                onClick={() => ejecutarBusca("patrimonio")}
              >
                <FiSearch />
              </button>
            </div>
          </div>

          {/* 4. FILTRO: NOME DO EQUIPAMENTO */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase">
              Nome do Equipamento
            </label>
            <div className="flex">
              <input
                type="text"
                className="flex-1 border border-slate-200 p-2 rounded-l-lg text-sm outline-blue-500 h-[38px]"
                placeholder="Ex: Monitor, Ventilador..."
                value={nomeBusca}
                onChange={(e) => setNomeBusca(e.target.value)}
              />
              <button
                className="bg-sky-600 text-white p-2 rounded-r-lg hover:bg-sky-700 cursor-pointer h-[38px] w-10 flex items-center justify-center"
                onClick={() => ejecutarBusca("nome")}
              >
                <FiSearch />
              </button>
            </div>
          </div>

          {/* 5. AÇÃO: LIMPAR TUDO */}
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

      <TermoRetiradaResidencia dados={dadosParaImpressaoRetirada} />
    </div>
  );
};

export default Transferencia;