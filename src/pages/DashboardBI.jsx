import React from "react";
import { useDashboardBI } from "../hooks/useDashboardBI";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  FiActivity,
  FiRefreshCw,
  FiArrowLeft,
  FiLayers,
  FiFilter,
  FiCalendar,
  FiTrash2,
  FiTrendingUp,
  FiClock,
  FiChevronDown,
  FiChevronUp,
  FiBarChart2,
  FiFileText,
  FiUsers,
} from "react-icons/fi";

const DashboardBI = () => {
  const {
    navigate,
    stats,
    dadosSetores,
    dadosEvolucao,
    dadosSlaEquipes, // 1. ATUALIZADO: Importando a nova variável do hook
    listaBaixas,
    top10Baixas,
    unidadesDisponiveis,
    filtroUnidade,
    setFiltroUnidade,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    loading,
    showTop10,
    setShowTop10,
    showDetalhes,
    setShowDetalhes,
    processarDados,
    carregarDadosSheets,
  } = useDashboardBI();

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <FiRefreshCw className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-slate-600 font-bold animate-pulse">
          Sincronizando BI Patrimonial...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2 font-medium"
          >
            <FiArrowLeft /> Voltar ao Sistema
          </button>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <FiBarChart2 className="text-blue-600" /> Painel Analytics
          </h1>
        </div>
        <button
          onClick={carregarDadosSheets}
          className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-slate-700"
        >
          <FiRefreshCw /> Sincronizar
        </button>
      </header>

      {/* Filtros */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-2">
            <FiFilter /> Unidade
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-200 p-3 h-[48px] rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
            value={filtroUnidade}
            onChange={(e) => {
              setFiltroUnidade(e.target.value);
              setTimeout(() => processarDados(), 0);
            }}
          >
            {unidadesDisponiveis.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-2">
            <FiCalendar /> Período
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 bg-slate-50 border border-slate-200 p-3 h-[48px] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
            <input
              type="date"
              className="flex-1 bg-slate-50 border border-slate-200 p-3 h-[48px] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-end">
          <button
            className="w-full bg-blue-600 text-white h-[48px] rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-[0.98]"
            onClick={() => processarDados()}
          >
            Aplicar Análise
          </button>
        </div>
      </section>

      {/* Cards de Métricas */}
      <section className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <MetricCard label="Total de Chamados" value={stats.total} color="blue" icon={FiLayers} />
        <MetricCard label="Concluídos" value={stats.fechados} color="emerald" icon={FiActivity} />
        <MetricCard label="Média SLA" value={stats.slaMedio} color="amber" icon={FiClock} />
        <MetricCard label="Itens Inutilizados" value={stats.baixas} color="rose" icon={FiTrash2} />
      </section>

      {/* Gráficos */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Chamados por Unidade */}
        <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2">
            <FiLayers className="text-blue-500" /> Chamados por Unidade
          </h3>
          <div className="h-80 w-full flex items-center justify-center" style={{ minWidth: 0, minHeight: 320 }}>
            {dadosSetores.length === 0 ? (
              <p className="text-sm font-medium text-slate-400 italic">Nenhum dado registrado para esta unidade.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosSetores} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} precision={0} />
                  <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                    {dadosSetores.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#1d4ed8" : "#60a5fa"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. ATUALIZADO: Novo Gráfico de Média de SLA por Equipe Técnica */}
        <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2">
            <FiUsers className="text-emerald-500" /> Média SLA por Equipe (Horas)
          </h3>
          <div className="h-80 w-full flex items-center justify-center" style={{ minWidth: 0, minHeight: 320 }}>
            {dadosSlaEquipes.length === 0 ? (
              <p className="text-sm font-medium text-slate-400 italic">Sem registros de fechamento com equipe definida.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosSlaEquipes} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} unit="h" />
                  <Tooltip 
                    cursor={{ fill: "#f8fafc" }} 
                    formatter={(value) => [`${value} horas`, "Média de Atendimento"]}
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} 
                  />
                  <Bar dataKey="mediaSLA" fill="#10b981" radius={[6, 6, 0, 0]}>
                    {dadosSlaEquipes.map((_, index) => (
                      <Cell key={`cell-sla-${index}`} fill={index === 0 ? "#047857" : "#34d399"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fluxo Diário */}
        <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm flex flex-col lg:col-span-2">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2">
            <FiTrendingUp className="text-amber-500" /> Fluxo Diário
          </h3>
          <div className="h-80 w-full flex items-center justify-center" style={{ minWidth: 0, minHeight: 320 }}>
            {dadosEvolucao.length === 0 ? (
              <p className="text-sm font-medium text-slate-400 italic">Sem movimentações no período selecionado.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosEvolucao} margin={{ right: 20, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="data" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} precision={0} />
                  <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                  <Line type="monotone" dataKey="qtd" stroke="#f59e0b" strokeWidth={4} dot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* Listas Detalhadas */}
      <section className="max-w-7xl mx-auto space-y-4">
        {/* Ranking: Top 10 Recorrência */}
        <ExpandableTable title="Ranking: Top 10 Recorrência de Baixas" icon={FiTrendingUp} isOpen={showTop10} toggle={() => setShowTop10(!showTop10)} color="text-amber-600">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-100">
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Posição</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Equipamento</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Unidade</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Setor</th>
                <th className="p-4 text-right text-[10px] uppercase font-black text-slate-400">Total</th>
              </tr>
            </thead>
            <tbody>
              {top10Baixas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-slate-400 text-sm italic">Nenhum registro de baixa encontrado.</td>
                </tr>
              ) : (
                top10Baixas.map((item, index) => (
                  <tr key={index} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-black text-slate-400">#{index + 1}</td>
                    <td className="p-4 font-bold">{item.nome}</td>
                    <td className="p-4 text-slate-500 text-sm">{item.unidade}</td>
                    <td className="p-4 text-slate-500 text-sm">{item.setor}</td>
                    <td className="p-4 text-right font-black text-amber-600">{item.total} un.</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ExpandableTable>

        {/* Detalhamento Individual */}
        <ExpandableTable title="Detalhamento Individual de Baixas" icon={FiTrash2} isOpen={showDetalhes} toggle={() => setShowDetalhes(!showDetalhes)}>
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-100">
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Equipamento</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Unidade</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Setor</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400 flex items-center gap-1"><FiFileText /> Parecer Técnico</th>
                <th className="p-4 text-right text-[10px] uppercase font-black text-slate-400">Data Baixa</th>
              </tr>
            </thead>
            <tbody>
              {listaBaixas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-slate-400 text-sm italic">
                    Nenhum detalhe de baixa disponível.
                  </td>
                </tr>
              ) : (
                listaBaixas.map((item, index) => (
                  <tr key={index} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold">{item.equipamento}</td>
                    <td className="p-4 text-slate-500 text-sm">{item.unidade}</td>
                    <td className="p-4 text-slate-500 text-sm">{item.setor}</td>
                    <td className="p-4 text-slate-600 text-xs italic max-w-xs truncate" title={item.parecerTecnico}>
                      {item.parecerTecnico}
                    </td>
                    <td className="p-4 text-right text-slate-400 text-xs font-mono">{item.data}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ExpandableTable>
      </section>
    </div>
  );
};

const MetricCard = ({ label, value, color, icon: Icon }) => {
  const variants = {
    blue: "bg-blue-600 shadow-blue-100",
    emerald: "bg-emerald-600 shadow-emerald-100",
    amber: "bg-amber-500 shadow-amber-100",
    rose: "bg-rose-500 shadow-rose-100",
  };
  return (
    <div className={`${variants[color]} p-6 rounded-3xl text-white shadow-xl transition-transform hover:scale-[1.02] duration-200`}>
      <div className="flex justify-between items-start mb-2 opacity-80">
        <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
        <Icon size={18} />
      </div>
      <div className="text-3xl font-black">{value}</div>
    </div>
  );
};

const ExpandableTable = ({ title, icon: Icon, isOpen, toggle, children, color = "text-slate-800" }) => (
  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm transition-all">
    <button onClick={toggle} className="w-full p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
      <h3 className={`font-black flex items-center gap-3 ${color}`}><Icon size={20} /> {title}</h3>
      {isOpen ? <FiChevronUp /> : <FiChevronDown />}
    </button>
    {isOpen && <div className="p-6 pt-0 overflow-x-auto animate-in fade-in slide-in-from-top-4 duration-300">{children}</div>}
  </div>
);

export default DashboardBI;