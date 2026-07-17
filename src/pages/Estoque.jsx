import React from "react";
import { useEstoque } from "../hooks/useEstoque";
import {
  Box,
  ArrowLeft,
  RefreshCw,
  Truck,
  AlertTriangle,
  Plus,
  Trash2,
  Eye,
  Printer,
  X,
} from "lucide-react";

const Estoque = () => {
  // Destruturação limpa de todos os controles fornecidos pelo hook customizado
  const {
    itensEstoque,
    loading,
    processando,
    loteSaida,
    itemParaAdicionar,
    setItemParaAdicionar,
    patrimonioInput,
    setPatrimonioInput,
    qtdInput,
    setQtdInput,
    mostrarPreview,
    setMostrarPreview,
    naoSabeResponsavel,
    setNaoSabeResponsavel,
    dadosSaida,
    setDadosSaida,
    unidades,
    setoresPorUnidade, // Alimentar o select de setores dinamicamente
    motivosSaida,
    isEstoque,
    carregarEstoque,
    adicionarAoLote,
    removerDoLote,
    efetivarTransferenciaESalvar,
    navigate,
  } = useEstoque();

  // Estado local para controlar se o usuário optou por digitar o setor manualmente
  const [digitarSetorManual, setDigitarSetorManual] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans print:bg-white print:p-0">
      
      {/* INTERFACE NORMAL (Escondida em tempo de impressão via CSS utility 'print:hidden') */}
      <div className="print:hidden">
        <header className="max-w-7xl mx-auto mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors mb-4 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Voltar ao Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                <Box className="text-blue-600" size={28} /> Central do Estoque e Distribuição
              </h1>
            </div>
            <button
              onClick={carregarEstoque}
              className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Atualizar Estoque
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tabela Principal de Itens em Estoque */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-black text-slate-700 uppercase text-xs tracking-wider">Disponíveis no Estoque</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-4">Equipamento</th>
                      <th className="p-4">Patrimônio Base</th>
                      <th className="p-4">Qtd. Disp.</th>
                      <th className="p-4">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="p-10 text-center text-slate-400 font-bold">Carregando...</td>
                      </tr>
                    ) : (
                      itensEstoque.map((item) => (
                        <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-4 font-bold text-slate-700">{item.nome}</td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono text-xs font-bold">
                              {item.patrimonio || "S/P"}
                            </span>
                          </td>
                          <td className="p-4 font-black text-slate-600">{item.quantidade || 1}</td>
                          <td className="p-4">
                            <button
                              onClick={() => {
                                setItemParaAdicionar(item);
                                setQtdInput(1);
                                setPatrimonioInput(item.patrimonio === "S/P" ? "" : item.patrimonio);
                              }}
                              className="bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <Plus size={14} /> Preparar Saída
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Painel de Controle de Destino e Lote */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-black text-slate-800 uppercase text-sm tracking-tight flex items-center gap-2">
                  <Truck size={18} className="text-blue-600" /> Lote de Distribuição
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Unidade Destino</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none"
                    value={dadosSaida.novaUnidade}
                    onChange={(e) => {
                      const selecionado = e.target.value;
                      setDigitarSetorManual(false); // Reseta o modo manual ao mudar de unidade
                      setDadosSaida({ 
                        ...dadosSaida, 
                        novaUnidade: selecionado,
                        novoSetor: "" // Reseta o setor para obrigar a nova seleção
                      });
                    }}
                  >
                    <option value="">Selecione a Unidade...</option>
                    {unidades.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {isEstoque ? "Classificação no Estoque" : "Setor Destino"}
                    </label>
                    {dadosSaida.novaUnidade && !isEstoque && (
                      <button
                        type="button"
                        onClick={() => {
                          setDigitarSetorManual(!digitarSetorManual);
                          setDadosSaida({ ...dadosSaida, novoSetor: "" });
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        {digitarSetorManual ? "Escolher da Lista" : "Não achou? Digitar Setor"}
                      </button>
                    )}
                  </div>

                  {digitarSetorManual || isEstoque ? (
                    <input
                      type="text"
                      placeholder={isEstoque ? "Ex: equipamento usado, reserva" : "Digite o nome do setor manualmente..."}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none border-l-4 border-l-amber-500"
                      value={dadosSaida.novoSetor}
                      onChange={(e) => setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })}
                    />
                  ) : (
                    <select
                      disabled={!dadosSaida.novaUnidade}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      value={dadosSaida.novoSetor}
                      onChange={(e) => {
                        if (e.target.value === "OUTRO_MANUAL") {
                          setDigitarSetorManual(true);
                          setDadosSaida({ ...dadosSaida, novoSetor: "" });
                        } else {
                          setDadosSaida({ ...dadosSaida, novoSetor: e.target.value });
                        }
                      }}
                    >
                      <option value="">
                        {dadosSaida.novaUnidade ? "Selecione o Setor Oficial..." : "Selecione uma unidade primeiro..."}
                      </option>
                      {dadosSaida.novaUnidade && (
                        <>
                          {setoresPorUnidade[dadosSaida.novaUnidade]?.map((setor) => (
                            <option key={setor} value={setor}>
                              {setor}
                            </option>
                          ))}
                          <option value="OUTRO_MANUAL" className="text-blue-600 font-bold">
                            ➕ Outro (Digitar Manualmente...)
                          </option>
                        </>
                      )}
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável pelo Recebimento</label>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-blue-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 focus:ring-blue-500"
                        checked={naoSabeResponsavel}
                        onChange={(e) => {
                          setNaoSabeResponsavel(e.target.checked);
                          if (e.target.checked) {
                            setDadosSaida(prev => ({ ...prev, responsavelRecebimento: "" }));
                          }
                        }}
                      />
                      Deixar em branco
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={naoSabeResponsavel}
                    placeholder={naoSabeResponsavel ? "Assinatura do Responsável (preencher na entrega)" : "Quem vai assinar o documento"}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    value={dadosSaida.responsavelRecebimento}
                    onChange={(e) => setDadosSaida({ ...dadosSaida, responsavelRecebimento: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Motivo da Saída / Troca
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none border-l-4 border-l-blue-500"
                    value={dadosSaida.motivo}
                    onChange={(e) => setDadosSaida({ ...dadosSaida, motivo: e.target.value })}
                  >
                    {motivosSaida.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Seção Interna do Lote de Saída */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Equipamentos no Lote ({loteSaida.length})</h3>
                {loteSaida.length === 0 ? (
                  <div className="text-center p-6 bg-slate-50 rounded-2xl text-xs font-bold text-slate-400 border border-dashed border-slate-200">
                    Nenhum item adicionado ao lote.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
                      {loteSaida.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <p className="text-xs font-bold text-slate-700"> {item.nome}</p>
                            <p className="text-[10px] font-mono font-bold text-blue-600">Pat: {item.patrimonioMapeado}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-md text-xs">x{item.quantidadeMovimentada}</span>
                            <button onClick={() => removerDoLote(index)} className="text-red-500 hover:text-red-700 p-1">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={!dadosSaida.novaUnidade || !dadosSaida.novoSetor || (!naoSabeResponsavel && !dadosSaida.responsavelRecebimento)}
                      onClick={() => setMostrarPreview(true)}
                      className="w-full bg-slate-800 text-white font-bold py-3 rounded-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Eye size={16} /> Visualizar Termo Antes de Salvar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Configuração de Patrimônio Individual */}
      {itemParaAdicionar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800 uppercase text-sm">Configurar Patrimônio</h3>
              <button onClick={() => setItemParaAdicionar(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={adicionarAoLote} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">TAG Patrimônio Final</label>
                  {itemParaAdicionar.patrimonio === "S/P" ? (
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={patrimonioInput}
                      onChange={(e) => setPatrimonioInput(e.target.value)}
                      required
                      placeholder="Insira a Tag"
                    />
                  ) : (
                    <input
                      type="text"
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
                      value={itemParaAdicionar.patrimonio}
                    />
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Qtd</label>
                  <input
                    type="number"
                    min="1"
                    max={itemParaAdicionar.quantidade}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={qtdInput}
                    onChange={(e) => setQtdInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setItemParaAdicionar(null)}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-blue-700 shadow-md"
                >
                  Confirmar no Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Visualização de Impressão do Termo A4 */}
      {mostrarPreview && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center z-50 p-0 md:p-4 overflow-y-auto items-start print:absolute print:inset-0 print:bg-white print:p-0 print:shadow-none">
          <div className="w-full max-w-[840px] flex flex-col my-0 md:my-4 print:my-0">
            
            {/* Header Flutuante de Comando do Modal */}
            <div className="sticky top-0 z-50 flex flex-col sm:flex-row justify-between items-center bg-slate-900 text-white p-4 rounded-b-xl md:rounded-t-3xl border-b border-slate-800 font-sans print:hidden gap-3 shadow-lg">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle size={16} className="shrink-0" /> Modo de Conferência e Conferência Prévia
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setMostrarPreview(false)}
                  className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Voltar e Editar
                </button>
                <button
                  onClick={efetivarTransferenciaESalvar}
                  disabled={processando}
                  className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  {processando ? <RefreshCw className="animate-spin" size={14} /> : <Printer size={14} />}
                  Salvar e Imprimir
                </button>
              </div>
            </div>

            {/* Espelho do Documento Físico Oficial Tipo A4 */}
            <div className="bg-white w-full min-h-[1050px] shadow-2xl p-6 md:p-12 flex flex-col justify-between font-serif text-slate-900 rounded-b-3xl print:rounded-none print:shadow-none print:p-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-200 w-full">
                  <img src="/Imagem1.png" alt="Logo 1" className="h-12 w-auto max-w-[22%] object-contain" />
                  <img src="/Imagem2.png" alt="Logo 2" className="h-12 w-auto max-w-[22%] object-contain" />
                  <img src="/Imagem3.png" alt="Logo 3" className="h-12 w-auto max-w-[22%] object-contain" />
                  <img src="/Imagem4.png" alt="Logo 4" className="h-12 w-auto max-w-[22%] object-contain" />
                </div>

                <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6 mb-8 font-sans">
                  <h2 className="text-xl font-black uppercase tracking-wide">Termo de Transferência e Responsabilidade Patrimonial</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Controle de Distribuição de Insumos e Ativos</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm mb-8 font-sans border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                  <div><strong>Unidade de Origem:</strong> Almoxarifado Central / Patrimônio</div>
                  <div><strong>Unidade de Destino:</strong> {dadosSaida.novaUnidade}</div>
                  <div><strong>{isEstoque ? "Classificação no Estoque:" : "Setor de Destino:"}</strong> {dadosSaida.novoSetor}</div>
                  <div><strong>Data de Emissão:</strong> {new Date().toLocaleDateString("pt-BR")}</div>
                  <div className="sm:col-span-2 border-t border-dashed border-slate-200 pt-2 text-slate-700">
                    <strong>Motivo do Fornecimento:</strong> <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold text-xs uppercase font-sans">{dadosSaida.motivo}</span>
                  </div>
                  <div className="sm:col-span-2 border-t border-slate-200 pt-2">
                    <strong>Responsável pelo Recebimento:</strong> {naoSabeResponsavel ? "Responsável pelo Setor (A preencher no local)" : dadosSaida.responsavelRecebimento}
                  </div>
                </div>

                <div className="text-sm leading-relaxed text-justify mb-8 space-y-4">
                  <p>
                    Declaramos para os devidos fins de controle técnico e administrativo que os itens listados abaixo foram conferidos, testados e transferidos da Central de Estoque para o respectivo setor de destino indicado neste documento.
                  </p>
                  <p>
                    O servidor/responsável abaixo assinado assume total compromisso pela guarda, conservação e zelo dos referidos bens patrimoniais, devendo comunicar imediatamente qualquer avaria, defeito técnico ou necessidade de movimentação futura ao setor de patrimônio.
                  </p>
                </div>

                <table className="w-full text-left border-collapse border border-slate-300 text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 uppercase">
                      <th className="p-3 border border-slate-300">Item / Equipamento</th>
                      <th className="p-3 border border-slate-300 text-center">Nº Patrimônio (TAG)</th>
                      <th className="p-3 border border-slate-300 text-center">Estado</th>
                      <th className="p-3 border border-slate-300 text-center">Qtd.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {loteSaida.map((item, index) => (
                      <tr key={index}>
                        <td className="p-3 border border-slate-300 font-medium">{item.nome}</td>
                        <td className="p-3 border border-slate-300 font-mono text-center">{item.patrimonioMapeado}</td>
                        <td className="p-3 border border-slate-300 text-center">{item.estado}</td>
                        <td className="p-3 border border-slate-300 text-center font-bold">{item.quantidadeMovimentada}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Assinaturas Formais */}
              <div className="mt-20 pt-12 font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-center text-xs">
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-full mx-auto pt-2"></div>
                    <p className="font-bold text-slate-700">Responsável pelo Envio</p>
                    <p className="text-[10px] text-slate-400 uppercase">Setor de Patrimônio</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-full mx-auto pt-2"></div>
                    <p className="font-bold text-slate-700">
                      {naoSabeResponsavel ? "Assinatura do Responsável" : dadosSaida.responsavelRecebimento}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase">
                      {naoSabeResponsavel ? "Recebedor (Nome por Extenso / Matrícula)" : "Assinatura e Carimbo"}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Estoque;