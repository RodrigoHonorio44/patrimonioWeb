import React from "react";
import { FiX, FiPrinter, FiCheckCircle } from "react-icons/fi";

const ModalTransferencia = ({
  isOpen,
  onClose,
  itemSelecionado,
  dadosSaida,
  setDadosSaida,
  novoPatrimonioParaSP,
  setNovoPatrimonioParaSP,
  termoVisualizado,
  setTermoVisualizado,
  lidarComVisualizacao,
  handleSaida,
  loading,
  unidades,
  normalizarParaComparacao
}) => {
  if (!isOpen || !itemSelecionado) return null;

  const isResidencial = dadosSaida.novaUnidade === "Residência do Paciente";
  const isEstoque = dadosSaida.novaUnidade === "Estoque Patrimônio";

  // Máscaras aplicadas estritamente com base em números
  const aplicarMascaraTelefone = (valor) => {
    const digitos = valor.replace(/\D/g, "");
    if (digitos.length <= 11) {
      return digitos
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return valor;
  };

  const aplicarMascaraCpf = (valor) => {
    return valor
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .substring(0, 14);
  };

  const aplicarMascaraRG = (valor) => {
    return valor.replace(/\D/g, "").substring(0, 12);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h3 className="font-bold text-lg text-slate-800">
            Confirmar Saída
          </h3>
          <button
            type="button"
            onClick={onClose}
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
              onChange={(e) => {
                const selecionado = e.target.value;
                setDadosSaida({
                  ...dadosSaida,
                  novaUnidade: selecionado,
                  // Sugere automaticamente "equipamento usado" se o destino for o estoque
                  novoSetor: selecionado === "Estoque Patrimônio" ? "equipamento usado" : "", 
                });
              }}
            >
              <option value="">Selecione...</option>
              <option value="Estoque Patrimônio">Estoque Patrimônio</option>
              {unidades
                .filter((u) => u !== "Estoque Patrimônio" && u !== "Estoque Central")
                .map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
            </select>
          </div>

          {isResidencial ? (
            <div className="space-y-3 bg-slate-50 border border-slate-200 p-3 rounded-xl animate-in fade-in duration-200">
              <div>
                <label className="text-xs font-bold text-blue-700 uppercase">
                  Nome Completo do Paciente
                </label>
                <input
                  type="text"
                  required
                  disabled={termoVisualizado}
                  placeholder="Digite o nome do paciente"
                  className="w-full border p-2 rounded-lg outline-blue-500 bg-white text-slate-700 disabled:bg-slate-100"
                  value={dadosSaida.novoSetor}
                  onChange={(e) =>
                    setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Endereço Completo de Instalação
                </label>
                <input
                  type="text"
                  required
                  disabled={termoVisualizado}
                  placeholder="Rua, número, bairro..."
                  className="w-full border p-2 rounded-lg outline-blue-500 bg-white text-slate-700 disabled:bg-slate-100"
                  value={dadosSaida.pacienteEndereco}
                  onChange={(e) =>
                    setDadosSaida({ ...dadosSaida, pacienteEndereco: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">
                    Telefone Celular
                  </label>
                  <input
                    type="text"
                    required
                    disabled={termoVisualizado}
                    placeholder="(00) 00000-0000"
                    className="w-full border p-2 rounded-lg outline-blue-500 bg-white text-slate-700 disabled:bg-slate-100"
                    value={dadosSaida.pacienteTelefone}
                    onChange={(e) =>
                      setDadosSaida({
                        ...dadosSaida,
                        pacienteTelefone: aplicarMascaraTelefone(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">
                    Identidade (RG)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={termoVisualizado}
                    placeholder="Apenas números"
                    className="w-full border p-2 rounded-lg outline-blue-500 bg-white text-slate-700 disabled:bg-slate-100"
                    value={dadosSaida.pacienteIdentidade}
                    onChange={(e) =>
                      setDadosSaida({
                        ...dadosSaida,
                        pacienteIdentidade: aplicarMascaraRG(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  CPF do Paciente ou Responsável
                </label>
                <input
                  type="text"
                  required
                  disabled={termoVisualizado}
                  placeholder="Apenas números"
                  className="w-full border p-2 rounded-lg outline-blue-500 bg-white text-slate-700 disabled:bg-slate-100"
                  value={dadosSaida.pacienteCpf}
                  onChange={(e) =>
                    setDadosSaida({
                      ...dadosSaida,
                      pacienteCpf: aplicarMascaraCpf(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                {isEstoque ? "Classificação no Estoque" : "Novo Setor"}
              </label>
              <input
                type="text"
                required
                disabled={termoVisualizado}
                placeholder={isEstoque ? "Ex: equipamento usado, reserva" : "Digite o setor"}
                value={dadosSaida.novoSetor}
                className="w-full border p-2 rounded-lg outline-blue-500 text-slate-700 disabled:bg-slate-100"
                onChange={(e) =>
                  setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })
                }
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              {isResidencial
                ? "Familiar / Responsável pelo Recebimento"
                : "Responsável pelo Recebimento"}
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
  );
};

export default ModalTransferencia;