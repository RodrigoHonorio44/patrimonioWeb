import React from "react";
import { useInventario } from "../hooks/useInventario"; // Ajuste o caminho se necessário
import {
  Search,
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  FilterX,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

// Importação dos componentes do sistema
import Header from "../components/Header";
import Footer from "../components/Footer";
import ModalInventario from "../components/ModalInventario";

const Inventario = () => {
  const {
    itens,
    loading,
    hasSearched,
    unidadeFiltro,
    setUnidadeFiltro,
    setorFiltro,
    setSetorFiltro,
    statusFiltro,
    setStatusFiltro,
    buscaPatrimonio,
    setBuscaPatrimonio,
    paginaAtual,
    setPaginaAtual,
    modalAberto,
    setModalAberto,
    equipamentoSelecionado,
    setEquipamentoSelecionado,
    mostrarDropdownSetor,
    setMostrarDropdownSetor,
    dropdownSetorRef,
    navigate,
    itensFiltrados,
    totalPaginas,
    itensExibidos,
    formatarDataBR,
    carregarDados,
    limparFiltros,
    obterSetoresDisponiveis,
    exportarExcelCompleto,
    lidarComAberturaModal,
  } = useInventario();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-grow p-4 md:p-8">
        <header className="max-w-7xl mx-auto mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors mb-4 group"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Voltar ao Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                <Shield className="text-blue-600" size={28} /> Painel Administrativo
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                Gestão centralizada de ativos.
              </p>
            </div>
            <div>
              <button
                onClick={exportarExcelCompleto}
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg shadow-emerald-100 cursor-pointer"
              >
                <Database size={18} /> Exportar Excel
              </button>
            </div>
          </div>
        </header>

        {/* FILTROS E BOTÕES DE AÇÃO */}
        <div className="max-w-7xl mx-auto bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Unidade
            </label>
            <select
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer h-[48px]"
              value={unidadeFiltro}
              onChange={(e) => {
                setUnidadeFiltro(e.target.value);
                setSetorFiltro("Todos");
              }}
            >
              <option value="Todas">🌍 Todas as Unidades</option>
              <option value="Hospital Conde">Hospital Conde</option>
              <option value="Santa Rita">UPA Santa Rita</option>
              <option value="Inoã">UPA Inoã</option>
              <option value="Barroco">SAMU Barroco</option>
              <option value="Ponta Negra">SAMU Ponta Negra</option>
              <option value="Centro">SAMU Centro</option>
            </select>
          </div>

          <div className="relative" ref={dropdownSetorRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Setor
            </label>
            
            <div className="relative flex items-center">
              <input
                type="text"
                className="w-full bg-slate-50 border-none rounded-xl p-3 pr-10 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 h-[48px]"
                placeholder={unidadeFiltro === "Todas" && itens.length === 0 ? "Carregue os dados..." : "📦 Digite ou selecione..."}
                disabled={unidadeFiltro === "Todas" && itens.length === 0}
                value={setorFiltro === "Todos" ? "" : setorFiltro}
                onFocus={() => setMostrarDropdownSetor(true)}
                onChange={(e) => {
                  setSetorFiltro(e.target.value || "Todos");
                  setMostrarDropdownSetor(true);
                }}
              />
              <button
                type="button"
                disabled={unidadeFiltro === "Todas" && itens.length === 0}
                onClick={() => setMostrarDropdownSetor(!mostrarDropdownSetor)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {mostrarDropdownSetor && (unidadeFiltro !== "Todas" || itens.length > 0) && (
              <div className="absolute left-0 right-0 top-[82px] bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto py-1 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setSetorFiltro("Todos");
                    setMostrarDropdownSetor(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-black uppercase text-blue-600 hover:bg-blue-50 transition-colors border-b border-slate-50"
                >
                  📦 Mostrar Todos os Setores
                </button>
                
                {obterSetoresDisponiveis().length > 0 ? (
                  obterSetoresDisponiveis().map((setor, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSetorFiltro(setor);
                        setMostrarDropdownSetor(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors font-bold uppercase border-b border-slate-50 last:border-none"
                    >
                      {setor}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-xs text-slate-400 text-center font-medium italic">
                    Nenhum setor encontrado para esta busca
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Status
            </label>
            <select
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer h-[48px]"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="Ativo">Ativos</option>
              <option value="Baixado">Inutilizados</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Patrimônio / Nome
            </label>
            <input
              type="text"
              placeholder="Ex: 105 ou Monitor"
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none h-[48px]"
              value={buscaPatrimonio}
              onChange={(e) => setBuscaPatrimonio(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={limparFiltros}
              className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 h-[48px] rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
              title="Limpar filtros"
            >
              <FilterX size={20} />
            </button>

            <button
              onClick={carregarDados}
              className="w-2/3 flex-grow bg-blue-600 hover:bg-blue-700 text-white h-[48px] rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 cursor-pointer whitespace-nowrap"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                <>
                  <Search size={20} /> Consultar
                </>
              )}
            </button>
          </div>
        </div>

        {/* TABELA / RESULTADOS */}
        <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] mb-8">
          {!hasSearched ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-300">
              <Search size={64} className="mb-4 opacity-10" />
              <p className="font-bold text-lg text-slate-400">Pronto para buscar</p>
              <p className="text-sm">Clique em Consultar para carregar os dados.</p>
            </div>
          ) : itensFiltrados.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 text-center p-4">
              <FilterX size={48} className="mb-2 opacity-20" />
              <p className="font-bold">Nenhum item corresponde aos filtros selecionados.</p>
              <p className="text-xs italic">Verifique se o Status, Unidade ou Setor estão corretos.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-4">Patrimônio</th>
                      <th className="p-4">Equipamento</th>
                      <th className="p-4">Unidade / Setor</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {itensExibidos.map((item) => {
                      const statusItemLower = String(item.status || "operante").toLowerCase().trim();
                      const isAtivo = statusItemLower === "ativo" || statusItemLower === "operante";
                      const isBaixado = 
                        statusItemLower === "baixado" || 
                        statusItemLower === "inutilizado" || 
                        statusItemLower === "inutilizados";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-blue-50/50 transition-colors group"
                        >
                          <td className="p-4 font-black text-blue-600 italic">
                            #{item.patrimonio || "S/P"}
                          </td>
                          <td className="p-4 font-bold text-slate-700 uppercase text-sm">
                            {item.nome}
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-500">
                            {item.unidade} <br />
                            <span className="font-normal opacity-60 uppercase">
                              {item.setor}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                                isAtivo
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {isBaixado ? "Inutilizado" : isAtivo ? "Operante" : item.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {isAtivo ? (
                              <button
                                onClick={() => lidarComAberturaModal(item)}
                                className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm border border-red-100"
                              >
                                Baixar
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">
                                Baixado em {formatarDataBR(item.dataBaixa)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-50 flex items-center justify-between border-t border-slate-100 font-bold text-slate-400 text-xs uppercase">
                <span>
                  Página {paginaAtual} de {totalPaginas || 1}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={paginaAtual === 1}
                    onClick={() => setPaginaAtual((p) => p - 1)}
                    className="p-2 bg-white rounded-lg border border-slate-200 disabled:opacity-30 cursor-pointer transition-colors hover:text-blue-600"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    disabled={paginaAtual === totalPaginas}
                    onClick={() => setPaginaAtual((p) => p + 1)}
                    className="p-2 bg-white rounded-lg border border-slate-200 disabled:opacity-30 cursor-pointer transition-colors hover:text-blue-600"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      <ModalInventario
        isOpen={modalAberto}
        equipamento={equipamentoSelecionado}
        onClose={() => {
          setModalAberto(false);
          setEquipamentoSelecionado(null);
        }}
        onAtualizar={carregarDados}
      />
    </div>
  );
};

export default Inventario;