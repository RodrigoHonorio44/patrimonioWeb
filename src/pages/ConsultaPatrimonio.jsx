import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Layers3, 
  MapPin, 
  CheckSquare,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function ConsultaPatrimonio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ativos, setAtivos] = useState([]);
  
  // Estados dos Inputs em tempo real
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("TODAS");
  const [termoPesquisa, setTermoPesquisa] = useState("");

  // Estados dos Filtros Efetivados (Só atualizam ao clicar em Buscar)
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    unidade: "TODAS",
    termo: ""
  });

  // Estado para controlar quais linhas/setores estão expandidos
  const [linhasExpandidas, setLinhasExpandidas] = useState({});

  // 1. ONSNAPSHOT MANTIDO: Conectado em tempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "ativos"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          patrimonio: data.patrimonio || "",
          nome: data.nome?.toLowerCase().trim() || "",
          tipo: data.tipo?.toLowerCase().trim() || "",
          modelo: data.modelo || "", 
          potencia: data.potencia || "", 
          setor: data.setor?.toLowerCase().trim() || "setor não informado",
          unidade: data.unidade?.toLowerCase().trim() || "",
          estado: data.estado || "Não informado",
          status: data.status || "Inativo",
          observacoes: data.observacoes || "",
          quantidade: Number(data.quantidade) || 1,
          criadoEm: data.criadoEm ? data.criadoEm.toDate() : null,
        };
      });
      setAtivos(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. EXTRAI AS UNIDADES ÚNICAS
  const listaUnidades = useMemo(() => {
    const unidades = new Set(ativos.map((e) => e.unidade).filter(Boolean));
    return Array.from(unidades).sort();
  }, [ativos]);

  // Gatilho de execução da busca manual
  const handleBuscar = (e) => {
    if (e) e.preventDefault();
    setFiltrosAplicados({
      unidade: unidadeSelecionada,
      termo: termoPesquisa
    });
    setLinhasExpandidas({}); // Reseta os colapsos ao fazer nova busca
  };

  // Reseta todos os filtros e esvazia a tela
  const handleLimpar = () => {
    setUnidadeSelecionada("TODAS");
    setTermoPesquisa("");
    setFiltrosAplicados({ unidade: "TODAS", termo: "" });
    setLinhasExpandidas({});
  };

  // Alternar colapso de uma linha
  const toggleLinha = (chaveLocalizacao) => {
    setLinhasExpandidas((prev) => ({
      ...prev,
      [chaveLocalizacao]: !prev[chaveLocalizacao]
    }));
  };

  // 3. PROCESSA E AGRUPA BASEADO APENAS NOS FILTROS APLICADOS
  const resultadoConsulta = useMemo(() => {
    const distribuicao = {};
    let totalGeral = 0;

    if (!filtrosAplicados.termo.trim()) {
      return { linhas: [], total: 0, modo: "vazio" };
    }

    const termo = filtrosAplicados.termo.toLowerCase().trim();

    ativos.forEach((item) => {
      if (item.status.toLowerCase() === "ativo") {
        if (item.nome.includes(termo) || item.tipo.includes(termo)) {
          
          if (filtrosAplicados.unidade === "TODAS") {
            const chaveUnidade = item.unidade.toUpperCase();
            if (!distribuicao[chaveUnidade]) {
              distribuicao[chaveUnidade] = { qtd: 0, itens: [] };
            }
            distribuicao[chaveUnidade].qtd += item.quantidade;
            distribuicao[chaveUnidade].itens.push(item);
            totalGeral += item.quantidade;

          } else if (item.unidade === filtrosAplicados.unidade.toLowerCase().trim()) {
            const chaveSetor = item.setor.toUpperCase();
            if (!distribuicao[chaveSetor]) {
              distribuicao[chaveSetor] = { qtd: 0, itens: [] };
            }
            distribuicao[chaveSetor].qtd += item.quantidade;
            distribuicao[chaveSetor].itens.push(item);
            totalGeral += item.quantidade;
          }
        }
      }
    });

    const dadosOrdenados = Object.entries(distribuicao).sort((a, b) => b[1].qtd - a[1].qtd);

    return {
      linhas: dadosOrdenados,
      total: totalGeral,
      modo: filtrosAplicados.unidade === "TODAS" ? "global" : "interno"
    };
  }, [ativos, filtrosAplicados]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">
            CONSOLIDANDO ATIVOS COM LEITURA ÚNICA...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-12 font-sans antialiased text-slate-900">
      <div className="max-w-3xl mx-auto">
        
        {/* BOTÃO VOLTAR E TÍTULO */}
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 shadow-2xs cursor-pointer transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">ESTRUTURA MESTRA</h2>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">PAINEL DE CONSULTA</h1>
          </div>
        </div>

        {/* INPUTS DE FILTRO COM FORM DE SUBMIT */}
        <form onSubmit={handleBuscar} className="bg-white border border-slate-200/80 rounded-4xl p-6 mb-8 shadow-xs space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">
              Filtro 1: Escolha a Unidade
            </label>
            <div className="relative flex items-center">
              <Filter className="absolute left-4 text-slate-400" size={18} />
              <select
                value={unidadeSelecionada}
                onChange={(e) => setUnidadeSelecionada(e.target.value)}
                className="w-full bg-[#F1F5F9] border border-slate-200 text-slate-700 font-black text-[12px] uppercase tracking-wider pl-12 pr-4 py-4 rounded-2xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="TODAS">🌍 TODAS AS UNIDADES (VISÃO GERAL)</option>
                {listaUnidades.map((u) => (
                  <option key={u} value={u}>
                    🏢 {u.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">
              Filtro 2: O que deseja quantificar?
            </label>
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="EX: CADEIRA DE RODAS, CADEIRA FIXA, MACA, IMPRESSORA..."
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                className="w-full bg-[#F1F5F9] border border-slate-200 text-slate-700 font-black text-[12px] uppercase tracking-wider pl-12 pr-4 py-4 rounded-2xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* BOTÕES DE CONTROLE */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleLimpar}
              className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 size={14} /> Limpar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Search size={14} /> Buscar
            </button>
          </div>
        </form>

        {/* MODO ESPERA */}
        {resultadoConsulta.modo === "vazio" ? (
          <div className="bg-white border border-slate-100 rounded-4xl p-12 text-center shadow-xs">
            <CheckSquare size={40} className="mx-auto text-blue-500/30 mb-3" />
            <p className="text-slate-400 font-black uppercase text-[11px] tracking-widest">
              Insira o nome de um patrimônio acima e clique em buscar.
            </p>
          </div>
        ) : (
          <>
            {/* TOTALIZADOR CENTRAL */}
            <div className="bg-slate-900 text-white rounded-4xl p-8 relative overflow-hidden shadow-lg mb-6">
              <div className="absolute right-6 bottom-4 opacity-5 text-white">
                <Layers3 size={140} />
              </div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    {resultadoConsulta.modo === "global" 
                      ? "QUANTIDADE TOTAL EM TODA A REDE" 
                      : `SOMA INTERNA EM: ${filtrosAplicados.unidade.toUpperCase()}`}
                  </span>
                  <h2 className="text-xl font-black italic uppercase mt-1">
                    {filtrosAplicados.termo.toUpperCase()}
                  </h2>
                </div>
              </div>
              <h3 className="text-6xl font-black tracking-tight">
                {resultadoConsulta.total.toString().padStart(3, "0")}
              </h3>
            </div>

            {/* LISTA E GRUPOS COLAPSÁVEIS */}
            <div className="bg-white border border-slate-100 rounded-4xl p-6 shadow-xs">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText size={14} className="text-blue-600" />
                {resultadoConsulta.modo === "global" 
                  ? "DISTRIBUIÇÃO POR UNIDADE HOSPITALAR" 
                  : "LOCALIZAÇÃO DETALHADA POR SETOR / SALA"}
              </p>

              {resultadoConsulta.linhas.length === 0 ? (
                <p className="text-center py-8 text-slate-400 font-bold text-xs uppercase">
                  Nenhum ativo correspondente localizado.
                </p>
              ) : (
                <div className="space-y-3">
                  {resultadoConsulta.linhas.map(([localizacao, container]) => {
                    const aberto = !!linhasExpandidas[localizacao];

                    return (
                      <div key={localizacao} className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                        
                        {/* Linha Cabeçalho do Grupo */}
                        <div 
                          onClick={() => toggleLinha(localizacao)}
                          className="flex items-center justify-between p-4 bg-[#F1F5F9]/50 hover:bg-[#F1F5F9] transition-all cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-blue-600 bg-white p-2 rounded-xl border border-slate-200/50 shadow-3xs">
                              <MapPin size={18} />
                            </div>
                            <span className="font-black text-[12px] uppercase tracking-wider text-slate-800">
                              {localizacao}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="bg-slate-900 text-white font-black text-[11px] px-4 py-1.5 rounded-xl">
                              {container.qtd.toString().padStart(2, "0")}
                            </span>
                            {aberto ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                          </div>
                        </div>

                        {/* Bloco Detalhado - Abre somente se clicado */}
                        {aberto && (
                          <div className="p-4 bg-slate-50/50 border-t border-slate-100 overflow-x-auto">
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider">
                                  <th className="pb-2">Patrimônio</th>
                                  <th className="pb-2">Modelo</th>
                                  <th className="pb-2">Potência</th>
                                  <th className="pb-2">Estado</th>
                                  <th className="pb-2">Observações</th>
                                </tr>
                              </thead>
                              <tbody className="text-slate-600 font-bold uppercase">
                                {container.itens.map((item) => (
                                  <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-white transition-all">
                                    <td className="py-2.5 text-blue-600 font-black">{item.patrimonio || "S/P"}</td>
                                    <td className="py-2.5 text-slate-700">{item.modelo || "—"}</td>
                                    <td className="py-2.5 text-slate-700">{item.potencia || "—"}</td>
                                    <td className="py-2.5">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
                                        item.estado.toLowerCase() === "bom" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                      }`}>
                                        {item.estado}
                                      </span>
                                    </td>
                                    <td className="py-2.5 text-slate-400 text-[10px] normal-case max-w-xs truncate" title={item.observacoes}>
                                      {item.observacoes || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}