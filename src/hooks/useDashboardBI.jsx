import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";

export const useDashboardBI = () => {
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
  const [dadosSlaEquipes, setDadosSlaEquipes] = useState([]); // ADICIONADO: Novo estado para SLA por Equipe
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
    (chamados = dadosBrutos.chamados, baixados = dadosBrutos.baixas) => {
      const dInicio = dataInicio ? parseDataComp(dataInicio) : null;
      if (dInicio) dInicio.setHours(0, 0, 0, 0);

      const dFim = dataFim ? parseDataComp(dataFim) : null;
      if (dFim) dFim.setHours(23, 59, 59, 999);

      const chamadosFiltrados = (chamados || []).filter((item) => {
        const u = item["Unidade"] || item["unidade"] || getVal(item, "unidade");
        const matchUnidade =
          filtroUnidade === "TODAS" ||
          normalizar(u) === normalizar(filtroUnidade);

        const dataCrua = item["Data"] || item["data"] || item["Finalizado_Em"] || item["finalizado_em"] || getVal(item, "Data") || getVal(item, "Finalizado");
        const dObj = parseDataComp(dataCrua);
        
        let matchData = true;
        if (dObj) {
          dObj.setHours(12, 0, 0, 0);
          if (dInicio && dObj.getTime() < dInicio.getTime()) matchData = false;
          if (dFim && dObj.getTime() > dFim.getTime()) matchData = false;
        } else if (dInicio || dFim) {
          matchData = false;
        }
        
        return matchUnidade && matchData;
      });

      const baixasFiltradas = (baixados || []).filter((item) => {
        const u = item["Unidade"] || item["unidade"] || getVal(item, "unidade");
        const matchUnidade =
          filtroUnidade === "TODAS" ||
          normalizar(u) === normalizar(filtroUnidade);

        const valorData = item["Data da Baixa"] || item["data da baixa"] || item["Data"] || item["Finalizado_Em"] || getVal(item, "Data da Baixa");
        const dObj = parseDataComp(valorData);
        
        let matchData = true;
        if (dObj) {
          dObj.setHours(12, 0, 0, 0);
          if (dInicio && dObj.getTime() < dInicio.getTime()) matchData = false;
          if (dFim && dObj.getTime() > dFim.getTime()) matchData = false;
        } else if (dInicio || dFim) {
          matchData = false;
        }
        return matchUnidade && matchData;
      });

      const chamadosFechados = chamadosFiltrados.filter((c) => {
        const status = c["Status"] || c["status"] || getVal(c, "status");
        return normalizar(status).includes("FECHADO");
      });

      // Estrutura dinâmica para agrupar as métricas por equipe
      const equipesSlaMap = {};

      let totalSLAEmMinutos = 0;
      let chamadosComSLAValido = 0;

      chamadosFechados.forEach((c) => {
        const dataAberturaStr = c["Data"] || getVal(c, "Data") || c["Finalizado_Em"]; 
        const dataFechamentoStr = c["Finalizado_Em"] || getVal(c, "Finalizado_Em");
        const equipeNome = c["Equipe"] || getVal(c, "Equipe") || "NÃO INFORMADA";
        const equipeChave = equipeNome.trim().toUpperCase();

        if (dataAberturaStr && dataFechamentoStr && dataFechamentoStr !== "N/A" && dataFechamentoStr.trim() !== "") {
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
            const minutosGerais = Math.floor(diferencaMilissegundos / 1000 / 60);
            
            // 1. Acumuladores globais para o KPI geral do Dashboard
            totalSLAEmMinutos += minutosGerais;
            chamadosComSLAValido++;

            // 2. Acumuladores específicos por Equipe (Diferença convertida em horas)
            const diferencaHoras = diferencaMilissegundos / (1000 * 60 * 60);
            if (!equipesSlaMap[equipeChave]) {
              equipesSlaMap[equipeChave] = { totalHoras: 0, totalChamados: 0 };
            }
            equipesSlaMap[equipeChave].totalHoras += diferencaHoras;
            equipesSlaMap[equipeChave].totalChamados += 1;
          }
        }
      });

      // Formata e gera o array de SLA por Equipes para os gráficos
      const dadosEquipesFormatados = Object.keys(equipesSlaMap).map((nome) => {
        const item = equipesSlaMap[nome];
        const media = item.totalHoras / item.totalChamados;
        return {
          name: nome,
          mediaSLA: parseFloat(media.toFixed(2)), // Média em horas (ex: 2.35)
          total: item.totalChamados,
        };
      }).sort((a, b) => b.mediaSLA - a.mediaSLA); // Ordena do maior SLA para o menor

      setDadosSlaEquipes(dadosEquipesFormatados);

      let slaFormatado = "00h 00m";
      if (chamadosComSLAValido > 0 && totalSLAEmMinutos > 0) {
        const mediaMinutos = Math.floor(totalSLAEmMinutos / chamadosComSLAValido);
        const horas = Math.floor(mediaMinutos / 60);
        const minutos = mediaMinutos % 60;
        slaFormatado = `${horas.toString().padStart(2, "0")}h ${minutos.toString().padStart(2, "0")}m`;
      }

      setStats({
        total: chamadosFiltrados.length,
        abertos: chamadosFiltrados.length - chamadosFechados.length,
        fechados: chamadosFechados.length,
        baixas: baixasFiltradas.length,
        slaMedio: slaFormatado,
      });

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

      const porDia = chamadosFiltrados.reduce((acc, c) => {
        const dataCrua = c["Data"] || c["data"] || c["Finalizado_Em"] || getVal(c, "Data");
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

      const contagemRanking = baixasFiltradas.reduce((acc, b) => {
        const eq = b["Equipamento"] || b["equipamento"] || getVal(b, "equipamento") || "N/A";
        const un = b["Unidade"] || b["unidade"] || getVal(b, "unidade") || "N/A";
        const st = b["Setor"] || b["setor"] || getVal(b, "setor") || "N/A";
        
        const chave = `${eq}|${un}|${st}`;
        if (!acc[chave]) acc[chave] = { nome: eq, unidade: un, setor: st, total: 0 };
        acc[chave].total += 1;
        return acc;
      }, {});

      const rankingFormatado = Object.values(contagemRanking)
        .map((item) => ({
          nome: item.nome,
          unidade: item.unidade,
          setor: item.setor,
          total: item.total
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      setTop10Baixas(rankingFormatado);

      setListaBaixas(
        baixasFiltradas.map((b) => ({
          equipamento: b["Equipamento"] || b["equipamento"] || getVal(b, "equipamento") || "N/A",
          unidade: b["Unidade"] || b["unidade"] || getVal(b, "unidade") || "N/A",
          setor: b["Setor"] || b["setor"] || getVal(b, "setor") || "N/A",
          data: b["Data da Baixa"] || b["data da baixa"] || b["Finalizado_Em"] || getVal(b, "Data da Baixa") || "N/A",
          parecerTecnico: b["Parecer_Tecnico"] || b["parecer_tecnico"] || getVal(b, "Parecer_Tecnico") || b["Parecer Técnico"] || "N/A",
        }))
      );
    },
    [dadosBrutos, dataInicio, dataFim, filtroUnidade, getVal, normalizar]
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

      processarDados(todosChamados, todasBaixas);
    } catch (e) {
      console.error("Erro crítico no processamento:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosSheets();
  }, []);

  return {
    navigate,
    stats,
    dadosSetores,
    dadosEvolucao,
    dadosSlaEquipes, // RETORNADO: Nova lista com as médias de SLA por Equipe prontas
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
    dadosBrutos,
    showTop10,
    setShowTop10,
    showDetalhes,
    setShowDetalhes,
    processarDados,
    carregarDadosSheets,
  };
};