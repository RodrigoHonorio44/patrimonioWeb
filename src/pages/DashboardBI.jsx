import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
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
} from "react-icons/fi";

const DashboardBI = () => {
  const navigate = useNavigate();

  // Estados de Dados
  const [stats, setStats] = useState({
    total: 0,
    abertos: 0,
    fechados: 0,
    baixas: 0,
    slaMedio: "00h 00m",
  });
  const [dadosSetores, setDadosSetores] = useState([]);
  const [dadosEvolucao, setDadosEvolucao] = useState([]);
  const [listaBaixas, setListaBaixas] = useState([]);
  const [top10Baixas, setTop10Baixas] = useState([]);
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]);

  // Estados de Filtro
  const [filtroUnidade, setFiltroUnidade] = useState("TODAS");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [loading, setLoading] = useState(true);
  const [dadosBrutos, setDadosBrutos] = useState({ chamados: [], baixas: [] });

  // Estados de UI
  const [showTop10, setShowTop10] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);

  // Removido o Proxy instável e puxando direto do Google Docs
  const ID_DOC = "1L-TNSA0e-YAjzK_HU_vWGAJFZVqk6t2L3lIQeEDPcMI";
  const BASE_CSV = `https://docs.google.com/spreadsheets/d/${ID_DOC}/export?format=csv`;

  const LINKS = {
    CHAMADOS_GERAL: `${BASE_CSV}&gid=0`,
    HOSPITAL_CONDE: `${BASE_CSV}&gid=583741098`,
    UPA_SANTA_RITA: `${BASE_CSV}&gid=1257274751`,
    UPA_INOA: `${BASE_CSV}&gid=339251774`,
    BAIXADOS: `${BASE_CSV}&gid=416525153`,
  };

  const normalizar = useCallback(
    (texto = "") =>
      texto
        ?.toString()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim() || "",
    []
  );

  const getVal = useCallback(
    (obj, term) => {
      if (!obj) return "";
      if (obj[term] !== undefined) return String(obj[term]).trim();
      
      const key = Object.keys(obj).find((k) =>
        normalizar(k).includes(normalizar(term))
      );
      return key ? String(obj[key] || "").trim() : "";
    },
    [normalizar]
  );

  const parseDataComp = (dataStr) => {
    if (!dataStr || dataStr === "N/A") return null;
    try {
      const stringLimpa = dataStr.trim();
      if (stringLimpa.includes("/")) {
        const apenasData = stringLimpa.split(",")[0].trim();
        const [d, m, a] = apenasData.split("/");
        const anoFull = a.length === 2 ? `20${a}` : a;
        return new Date(Number(anoFull), Number(m) - 1, Number(d), 12, 0, 0);
      }
      if (stringLimpa.includes("-")) {
        const partes = stringLimpa.split("T")[0].split("-");
        return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 12, 0, 0);
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const processarDados = useCallback(
    (chamados, baixados, unidadeFiltro, inicio, fim) => {
      const dInicio = inicio ? parseDataComp(inicio) : null;
      if (dInicio) dInicio.setHours(0, 0, 0, 0);

      const dFim = fim ? parseDataComp(fim) : null;
      if (dFim) dFim.setHours(23, 59, 59, 999);

      // Filtro de Chamados
      const chamadosFiltrados = (chamados || []).filter((item) => {
        const u = item["Unidade"] || item["unidade"] || getVal(item, "unidade");
        const matchUnidade =
          unidadeFiltro === "TODAS" ||
          normalizar(u) === normalizar(unidadeFiltro);

        const dataCrua = item["Data"] || item["data"] || getVal(item, "Data");
        const dObj = parseDataComp(dataCrua);
        
        let matchData = true;
        if (dObj) {
          dObj.setHours(12, 0, 0, 0);
          if (dInicio && dObj < dInicio) matchData = false;
          if (dFim && dObj > dFim) matchData = false;
        } else if (dInicio || dFim) {
          matchData = false;
        }
        
        return matchUnidade && matchData;
      });

      // Filtro de Baixas
      const baixasFiltradas = (baixados || []).filter((item) => {
        const u = item["Unidade"] || item["unidade"] || getVal(item, "unidade");
        const matchUnidade =
          unidadeFiltro === "TODAS" ||
          normalizar(u) === normalizar(unidadeFiltro);

        const valorData = item["Data da Baixa"] || item["data da baixa"] || getVal(item, "Data da Baixa") || item["Data"];
        const dObj = parseDataComp(valorData);
        
        let matchData = true;
        if (dObj) {
          dObj.setHours(12, 0, 0, 0);
          if (dInicio && dObj < dInicio) matchData = false;
          if (dFim && dObj > dFim) matchData = false;
        } else if (dInicio || dFim) {
          matchData = false;
        }
        return matchUnidade && matchData;
      });

      // --- CÁLCULO DINÂMICO DO SLA REAL ---
      const chamadosFechados = chamadosFiltrados.filter((c) => {
        const status = c["Status"] || c["status"] || getVal(c, "status");
        return normalizar(status).includes("FECHADO");
      });

      let totalSLAEmMinutos = 0;
      let chamadosComSLAValido = 0;

      chamadosFechados.forEach((c) => {
        const dataAberturaStr = c["Data"] || getVal(c, "Data");
        const dataFechamentoStr = c["Finalizado_Em"] || getVal(c, "Finalizado_Em");

        if (dataAberturaStr && dataFechamentoStr && dataFechamentoStr !== "N/A" && dataFechamentoStr.trim() !== "") {
          
          // Função interna para destrinchar a string "DD/MM/AAAA, HH:MM:SS"
          const formatarDataHora = (str) => {
            if (!str.includes(",")) return null;
            const [dataPart, horaPart] = str.split(",");
            if (!dataPart || !horaPart) return null;
            
            const [d, m, a] = dataPart.trim().split("/");
            const [h, min, s] = horaPart.trim().split(":");
            const anoFull = a.trim().length === 2 ? `20${a.trim()}` : a.trim();
            
            return new Date(Number(anoFull), Number(m) - 1, Number(d), Number(h), Number(min), Number(s || 0));
          };

          const dateAbertura = formatarDataHora(dataAberturaStr);
          const dateFechamento = formatarDataHora(dataFechamentoStr);

          if (dateAbertura && dateFechamento && dateFechamento >= dateAbertura) {
            const diferencaMilissegundos = dateFechamento - dateAbertura;
            totalSLAEmMinutos += Math.floor(diferencaMilissegundos / 1000 / 60);
            chamadosComSLAValido++;
          }
        }
      });

      let slaFormatado = "00h 00m";
      if (chamadosComSLAValido > 0) {
        const mediaMinutos = Math.floor(totalSLAEmMinutos / chamadosComSLAValido);
        const horas = Math.floor(mediaMinutos / 60);
        const minutos = mediaMinutos % 60;
        slaFormatado = `${horas.toString().padStart(2, "0")}h ${minutos.toString().padStart(2, "0")}m`;
      }
      // -------------------------------------

      setStats({
        total: chamadosFiltrados.length,
        abertos: chamadosFiltrados.length - chamadosFechados.length,
        fechados: chamadosFechados.length,
        baixas: baixasFiltradas.length,
        slaMedio: slaFormatado,
      });

      // Gráfico por Unidade
      const porUnidade = chamadosFiltrados.reduce((acc, c) => {
        const u = c["Unidade"] || c["unidade"] || getVal(c, "unidade") || "N/A";
        acc[u] = (acc[u] || 0) + 1;
        return acc;
      }, {});
      
      setDadosSetores(
        Object.keys(porUnidade)
          .map((k) => ({ name: k, total: porUnidade[k] }))
          .sort((a, b) => b.total - a.total)
      );

      // Gráfico Evolução Diária
      const porDia = chamadosFiltrados.reduce((acc, c) => {
        const dataCrua = c["Data"] || c["data"] || getVal(c, "Data");
        const dStr = dataCrua ? dataCrua.split(",")[0].split(/[\s]+/)[0] : null;
        if (dStr) acc[dStr] = (acc[dStr] || 0) + 1;
        return acc;
      }, {});

      setDadosEvolucao(
        Object.keys(porDia)
          .map((k) => ({ data: k, dataObj: parseDataComp(k), qtd: porDia[k] }))
          .sort((a, b) => (a.dataObj && b.dataObj ? a.dataObj - b.dataObj : 0))
          .slice(-15)
      );

      // Listagem de Baixas
      const contagemRanking = baixasFiltradas.reduce((acc, b) => {
        const eq = b["Equipamento"] || b["equipamento"] || getVal(b, "equipamento") || "N/A";
        const un = b["Unidade"] || b["unidade"] || getVal(b, "unidade") || "N/A";
        const st = b["Setor"] || b["setor"] || getVal(b, "setor") || "N/A";
        const chave = `${eq}|${un}|${st}`;
        if (!acc[chave]) acc[chave] = { nome: eq, unidade: un, setor: st, total: 0 };
        acc[chave].total += 1;
        return acc;
      }, {});

      setTop10Baixas(Object.values(contagemRanking).sort((a, b) => b.total - a.total).slice(0, 10));
      setListaBaixas(
        baixasFiltradas.map((b) => ({
          equipamento: b["Equipamento"] || b["equipamento"] || getVal(b, "equipamento") || "N/A",
          unidade: b["Unidade"] || b["unidade"] || getVal(b, "unidade") || "N/A",
          setor: b["Setor"] || b["setor"] || getVal(b, "setor") || "N/A",
          data: b["Data da Baixa"] || b["data da baixa"] || getVal(b, "Data da Baixa") || "N/A",
        }))
      );
    },
    [getVal, normalizar]
  );

  const carregarDadosSheets = async () => {
    setLoading(true);
    try {
      const respostas = await Promise.all(
        Object.values(LINKS).map((url) =>
          fetch(url)
            .then((r) => r.text())
            .catch(() => "")
        )
      );

      const datasets = respostas.map((csv) => {
        if (!csv || csv.includes("<!DOCTYPE html>")) {
          console.warn("Aviso: Uma aba retornou HTML ou está protegida/privada.");
          return [];
        }
        return Papa.parse(csv, { 
          header: true, 
          skipEmptyLines: "greedy",
          transformHeader: (h) => h.replace(/^\uFEFF/, "").trim()
        }).data;
      });

      const filtrarValidos = (data) => {
        if (!Array.isArray(data)) return [];
        return data.filter((item) => {
          const osVal = item["OS"] || item["os"] || item["Os"] || getVal(item, "OS");
          return osVal && String(osVal).trim() !== "";
        });
      };

      const todosChamados = [
        ...filtrarValidos(datasets[0]),
        ...filtrarValidos(datasets[1]),
        ...filtrarValidos(datasets[2]),
        ...filtrarValidos(datasets[3]),
      ];

      const todasBaixas = Array.isArray(datasets[4])
        ? datasets[4].filter((b) => {
            const patrimonio = b["Patrimonio"] || b["patrimonio"] || getVal(b, "patrimonio");
            const equipamento = b["Equipamento"] || b["equipamento"] || getVal(b, "equipamento");
            return (patrimonio && String(patrimonio).trim() !== "") || 
                   (equipamento && String(equipamento).trim() !== "");
          })
        : [];

      setDadosBrutos({ chamados: todosChamados, baixas: todasBaixas });
      
      const listaUnidades = todosChamados
        .map((c) => c["Unidade"] || c["unidade"] || getVal(c, "unidade"))
        .map((u) => String(u || "").trim())
        .filter(Boolean);
        
      const unidadesUnicas = ["TODAS", ...new Set(listaUnidades)];
      setUnidadesDisponiveis(unidadesUnicas);

      processarDados(todosChamados, todasBaixas, "TODAS", "", "");
    } catch (e) {
      console.error("Erro crítico no processamento:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosSheets();
  }, []);

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
            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
            value={filtroUnidade}
            onChange={(e) => setFiltroUnidade(e.target.value)}
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
              className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
            <input
              type="date"
              className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-end">
          <button
            className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            onClick={() =>
              processarDados(
                dadosBrutos.chamados,
                dadosBrutos.baixas,
                filtroUnidade,
                dataInicio,
                dataFim
              )
            }
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
        <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2">
            <FiLayers className="text-blue-500" /> Chamados por Unidade
          </h3>
          <div className="h-80 w-full" style={{ minWidth: 0, minHeight: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosSetores}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {dadosSetores.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#1d4ed8" : "#60a5fa"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2">
            <FiTrendingUp className="text-amber-500" /> Fluxo Diário
          </h3>
          <div className="h-80 w-full" style={{ minWidth: 0, minHeight: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosEvolucao}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="data" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                <Line type="monotone" dataKey="qtd" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6, fill: "#f59e0b", strokeWidth: 3, stroke: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Listas Detalhadas */}
      <section className="max-w-7xl mx-auto space-y-4">
        <ExpandableTable title="Ranking: Top 10 Recorrência de Baixas" icon={FiTrendingUp} isOpen={showTop10} toggle={() => setShowTop10(!showTop10)} color="text-amber-600">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-100">
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Posição</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Equipamento</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Unidade</th>
                <th className="p-4 text-right text-[10px] uppercase font-black text-slate-400">Total</th>
              </tr>
            </thead>
            <tbody>
              {top10Baixas.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-slate-400 text-sm italic">Nenhum registro de baixa encontrado.</td>
                </tr>
              ) : (
                top10Baixas.map((item, index) => (
                  <tr key={index} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-black text-slate-400">#{index + 1}</td>
                    <td className="p-4 font-bold">{item.nome}</td>
                    <td className="p-4 text-slate-500 text-sm">{item.unidade}</td>
                    <td className="p-4 text-right font-black text-amber-600">{item.total} un.</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ExpandableTable>

        <ExpandableTable title="Detalhamento Individual de Baixas" icon={FiTrash2} isOpen={showDetalhes} toggle={() => setShowDetalhes(!showDetalhes)}>
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-100">
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Equipamento</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Unidade</th>
                <th className="p-4 text-right text-[10px] uppercase font-black text-slate-400">Data Baixa</th>
              </tr>
            </thead>
            <tbody>
              {returnListaBaixas()}
            </tbody>
          </table>
        </ExpandableTable>
      </section>
    </div>
  );

  function returnListaBaixas() {
    return listaBaixas.length === 0 ? (
      <tr>
        <td colSpan="3" className="p-4 text-center text-slate-400 text-sm italic">Nenhum detalhe de baixa disponível.</td>
      </tr>
    ) : (
      listaBaixas.map((item, index) => (
        <tr key={index} className="border-b border-slate-50">
          <td className="p-4 font-bold">{item.equipamento}</td>
          <td className="p-4 text-slate-500 text-sm">{item.unidade}</td>
          <td className="p-4 text-right text-slate-400 text-xs font-mono">{item.data}</td>
        </tr>
      ))
    );
  }
};

const MetricCard = ({ label, value, color, icon: Icon }) => {
  const variants = {
    blue: "bg-blue-600 shadow-blue-100",
    emerald: "bg-emerald-600 shadow-emerald-100",
    amber: "bg-amber-500 shadow-amber-100",
    rose: "bg-rose-500 shadow-rose-100",
  };
  return (
    <div className={`${variants[color]} p-6 rounded-3xl text-white shadow-xl`}>
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
    <button onClick={toggle} className="w-full p-6 flex justify-between items-center hover:bg-slate-50">
      <h3 className={`font-black flex items-center gap-3 ${color}`}><Icon size={20} /> {title}</h3>
      {isOpen ? <FiChevronUp /> : <FiChevronDown />}
    </button>
    {isOpen && <div className="p-6 pt-0 overflow-x-auto animate-in fade-in slide-in-from-top-4 duration-300">{children}</div>}
  </div>
);

export default DashboardBI;