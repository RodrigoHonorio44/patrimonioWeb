import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";
import Barcode from "react-barcode";
import { toast } from "react-toastify";
import { ArrowLeft, Shield, PlusCircle, Printer, Tag, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const TelaEtiquetas = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [proximoPatrimonio, setProximoPatrimonio] = useState("");
  
  // true = Apenas Etiqueta Avulsa (salva em etiquetas_patrimonio)
  // false = Cadastro Completo (salva em ativos E etiquetas_patrimonio)
  const [isAvulsa, setIsAvulsa] = useState(false);
  
  // Estados do formulário
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("Hospital Conde");
  const [setor, setSetor] = useState("");
  const [estado, setEstado] = useState("regular");
  const [observacoes, setObservacoes] = useState("");

  // Estado para armazenar a etiqueta recém-criada pronta para imprimir
  const [etiquetaPronta, setEtiquetaPronta] = useState(null);

  // 1. BUSCA O MAIOR NÚMERO ABSOLUTO EM AMBAS AS COLOÇÕES PARA EVITAR REPETIÇÃO
  const buscarUltimoPatrimonioGeral = async () => {
    try {
      let maiorNumero = 0;

      // Consulta os últimos da coleção 'ativos'
      const qAtivos = query(collection(db, "ativos"), orderBy("patrimonio", "desc"), limit(30));
      const snapAtivos = await getDocs(qAtivos);
      snapAtivos.forEach((doc) => {
        const patStr = doc.data().patrimonio;
        if (patStr && patStr !== "s/p") {
          const num = parseInt(patStr.replace(/\D/g, ""), 10);
          if (!isNaN(num) && num > maiorNumero) maiorNumero = num;
        }
      });

      // Consulta os últimos da coleção 'etiquetas_patrimonio'
      const qEtiquetas = query(collection(db, "etiquetas_patrimonio"), orderBy("patrimonio", "desc"), limit(30));
      const snapEtiquetas = await getDocs(qEtiquetas);
      snapEtiquetas.forEach((doc) => {
        const patStr = doc.data().patrimonio;
        if (patStr && patStr !== "s/p") {
          const num = parseInt(patStr.replace(/\D/g, ""), 10);
          if (!isNaN(num) && num > maiorNumero) maiorNumero = num;
        }
      });

      const proximo = maiorNumero > 0 ? maiorNumero + 1 : 10001;
      setProximoPatrimonio(String(proximo));
    } catch (error) {
      console.error("Erro ao buscar sequencial unificado:", error);
      setProximoPatrimonio("10001");
    }
  };

  useEffect(() => {
    buscarUltimoPatrimonioGeral();
  }, []);

  // 2. SALVA O ATIVO IMPEDINDO DUPLICIDADE NAS DUAS COLECÕES
  const handleCriarAtivoEEtiqueta = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Por favor, digite o nome do equipamento.");
    if (!proximoPatrimonio) return toast.error("Erro ao gerar número de patrimônio.");

    setLoading(true);

    try {
      // Varredura completa de segurança em tempo de execução nas duas coleções
      const snapAtivosCheck = await getDocs(collection(db, "ativos"));
      const snapEtiquetasCheck = await getDocs(collection(db, "etiquetas_patrimonio"));

      const existeEmAtivos = snapAtivosCheck.docs.some(doc => String(doc.data().patrimonio).trim() === String(proximoPatrimonio).trim());
      const existeEmEtiquetas = snapEtiquetasCheck.docs.some(doc => String(doc.data().patrimonio).trim() === String(proximoPatrimonio).trim());

      if (existeEmAtivos || existeEmEtiquetas) {
        toast.warn("Esse número acabou de ser ocupado. Atualizando para o próximo disponível...");
        await buscarUltimoPatrimonioGeral();
        setLoading(false);
        return;
      }

      // Montagem do objeto padronizado com os textos em caixa baixa
      const novoRegistro = {
        criadoEm: serverTimestamp(),
        estado: estado.toLowerCase().trim(),
        nome: nome.toLowerCase().trim(),
        observacoes: observacoes.toLowerCase().trim() || (isAvulsa ? "etiqueta avulsa gerada para item ja existente" : ""),
        patrimonio: String(proximoPatrimonio).trim(),
        quantidade: 1,
        setor: setor.toLowerCase().trim() || "nao informado",
        status: "ativo",
        tipo: "equipamento",
        unidade: unidade.toLowerCase().trim(),
        modoEmissao: isAvulsa ? "avulsa" : "cadastro_completo"
      };

      if (isAvulsa) {
        // Salva estritamente na coleção de etiquetas_patrimonio
        await addDoc(collection(db, "etiquetas_patrimonio"), novoRegistro);
        toast.success(`Etiqueta Avulsa #${proximoPatrimonio} criada com sucesso!`);
      } else {
        // Salva simultaneamente nas duas coleções
        await addDoc(collection(db, "ativos"), novoRegistro);
        await addDoc(collection(db, "etiquetas_patrimonio"), novoRegistro);
        toast.success(`Patrimônio #${proximoPatrimonio} cadastrado em Ativos e Etiquetas!`);
      }
      
      // Define a etiqueta na tela para o usuário poder imprimir imediatamente
      setEtiquetaPronta({
        patrimonio: proximoPatrimonio,
        nome: nome.toUpperCase(),
        unidade: unidade.toUpperCase()
      });

      // Limpa formulário e atualiza o sequencial
      setNome("");
      setSetor("");
      setObservacoes("");
      buscarUltimoPatrimonioGeral();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao registrar o patrimônio.");
    } finally {
      setLoading(false);
    }
  };

  const dispararImpressao = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto">
        <header className="mb-6 no-print">
          <button
            onClick={() => navigate("/inventario")}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors mb-4 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Voltar ao Inventário
          </button>
          
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <Shield className="text-blue-600" size={28} /> Cadastro & Emissão de Etiquetas
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            O sistema gera números automáticos sequenciais impedindo qualquer risco de duplicidade entre coleções.
          </p>
        </header>

        {/* ALTERNADOR DE MODO NO TOPO */}
        <div className="mb-6 max-w-xl no-print bg-white border border-slate-200 p-2.5 rounded-2xl flex gap-2 shadow-sm">
          <button
            type="button"
            onClick={() => { setIsAvulsa(false); setEtiquetaPronta(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${!isAvulsa ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Layers size={14} /> Cadastro Completo (+Ativo e Etiqueta)
          </button>
          <button
            type="button"
            onClick={() => { setIsAvulsa(true); setEtiquetaPronta(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${isAvulsa ? 'bg-amber-600 text-white shadow-md shadow-amber-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Tag size={14} /> Apenas Etiqueta Avulsa
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* FORMULÁRIO DE CADASTRO (ESQUERDA) */}
          <form 
            onSubmit={handleCriarAtivoEEtiqueta}
            className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 no-print"
          >
            <div className={`md:col-span-2 p-4 rounded-2xl border flex justify-between items-center transition-colors ${isAvulsa ? 'bg-amber-50 border-amber-200' : 'bg-blue-50/50 border-blue-100'}`}>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${isAvulsa ? 'text-amber-700' : 'text-blue-600'}`}>
                  {isAvulsa ? "Modo: Apenas Etiqueta Avulsa" : "Modo: Número de Patrimônio Garantido"}
                </p>
                <p className="text-2xl font-black text-slate-800 italic">#{proximoPatrimonio || "Carregando..."}</p>
              </div>
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg text-white ${isAvulsa ? 'bg-amber-600' : 'bg-blue-600'}`}>
                Bloqueio Unificado Ativo
              </span>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome do Equipamento</label>
              <input
                type="text"
                placeholder="Ex: Frigobar Consul 120L"
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Unidade Destino</label>
              <select
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
              >
                <option value="Hospital Conde">Hospital Conde</option>
                <option value="SAMU Ponta Negra">SAMU Ponta Negra</option>
                <option value="SAMU Barroco">SAMU Barroco</option>
                <option value="SAMU Centro">SAMU Centro</option>
                <option value="UPA Inoã">UPA Inoã</option>
                <option value="UPA Santa Rita">UPA Santa Rita</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Setor Interno</label>
              <input
                type="text"
                placeholder="Ex: CAF, Triagem, Sala 2"
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Estado de Conservação</label>
              <select
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="novo">Novo</option>
                <option value="excelente">Excelente</option>
                <option value="bom">Bom</option>
                <option value="regular">Regular</option>
                <option value="ruim">Ruim</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Observações (Opcional)</label>
              <textarea
                rows={2}
                placeholder="Detalhes adicionais..."
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`md:col-span-2 disabled:opacity-50 text-white p-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer mt-2 ${isAvulsa ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
            >
              <PlusCircle size={20} />
              {loading ? "Registrando no Firestore..." : isAvulsa ? "Gerar Código & Criar Etiqueta Avulsa" : "Gerar Patrimônio & Criar Etiqueta"}
            </button>
          </form>

          {/* VISUALIZAÇÃO DA ETIQUETA GERADA (DIREITA / IMPRESSÃO) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[320px] relative print-area">
            {etiquetaPronta ? (
              <>
                <div className="no-print text-center mb-4">
                  <p className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">
                    Etiqueta Pronta!
                  </p>
                </div>

                {/* ETIQUETA NO PADRÃO INDUSTRIAL */}
                <div 
                  className="bg-white border border-slate-400 rounded-[12px] p-4 flex flex-col items-center justify-between shadow-sm overflow-hidden ticket-capture"
                  style={{
                    width: "90mm",
                    height: "45mm",
                    boxSizing: "border-box",
                    fontFamily: "'Arial', sans-serif"
                  }}
                >
                  <div className="text-center w-full">
                    <h2 className="text-slate-800 font-black tracking-[4px] text-sm uppercase m-0 p-0">
                      PATRIMÔNIO
                    </h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate mt-0.5">
                      {etiquetaPronta.unidade}
                    </p>
                  </div>

                  <div className="flex items-center justify-center w-full my-auto scale-105">
                    <Barcode 
                      value={etiquetaPronta.patrimonio}
                      format="CODE128"
                      width={1.7}
                      height={42}
                      displayValue={true}
                      font="Arial"
                      fontSize={15}
                      fontOptions="bold"
                      textMargin={4}
                      lineColor="#0f172a"
                    />
                  </div>

                  <div className="w-full text-center border-t border-slate-100 pt-1">
                    <p className="text-[8px] font-black text-slate-500 uppercase truncate m-0">
                      {etiquetaPronta.nome}
                    </p>
                  </div>
                </div>

                <button
                  onClick={dispararImpressao}
                  className="no-print mt-6 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Printer size={18} /> Imprimir Etiqueta
                </button>
              </>
            ) : (
              <div className="text-center text-slate-300 p-4 no-print">
                <Printer size={48} className="mx-auto mb-2 opacity-20" />
                <p className="font-bold text-slate-400 text-sm">Nenhuma etiqueta gerada</p>
                <p className="text-xs max-w-[200px] mx-auto mt-1">
                  Preencha o formulário ao lado para emitir a etiqueta com código de barras.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer className="no-print" />

      {/* CSS DE IMPRESSÃO EXCLUSIVO */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area .ticket-capture, .print-area .ticket-capture * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TelaEtiquetas;