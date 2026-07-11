import React from "react";

const TermoRetiradaResidencia = ({ dados }) => {
  if (!dados) return null;

  // Formatação automática da data atual
  const dataAtual = new Date();
  const dia = String(dataAtual.getDate()).padStart(2, '0');
  const meses = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
  ];
  const mes = meses[dataAtual.getMonth()];
  const ano = dataAtual.getFullYear();

  return (
    <div
      id="area-impressao-retirada"
      className="hidden print:block p-8 text-black bg-white uppercase print:p-0 font-sans"
    >
      <div className="border-[4px] border-black p-6">
        
        {/* FAIXA OFICIAL DE LOGOS DE PONTA A PONTA */}
        <div className="w-full flex justify-between items-center pb-4 mb-4 border-b-2 border-black/20 select-none print:flex">
          <div className="flex-1 flex justify-start">
            <img 
              src="/Imagem1.png" 
              alt="Hospital Municipal Conde Modesto Leal" 
              className="h-12 object-contain print:block"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          
          <div className="flex-1 flex justify-center">
            <img 
              src="/Imagem2.png" 
              alt="Avante Social" 
              className="h-12 object-contain print:block"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          
          <div className="flex-1 flex justify-center">
            <img 
              src="/Imagem3.png" 
              alt="Secretaria de Saúde" 
              className="h-8 object-contain print:block"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          
          <div className="flex-1 flex justify-end">
            <img 
              src="/Imagem4.png" 
              alt="Prefeitura de Maricá" 
              className="h-12 object-contain print:block"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>

        {/* CABEÇALHO */}
        <div className="text-center border-b-4 border-black pb-4 mb-6">
          <h1 className="text-2xl font-black">
            TERMO DE RETIRADA DE EQUIPAMENTO EM RESIDÊNCIA
          </h1>
          <p className="text-[11px] font-bold mt-1">
            PROCESSO DE DESMOBILIZAÇÃO / RETORNO DE HOME CARE
          </p>
        </div>

        {/* DECLARAÇÃO */}
        <div className="text-[13px] leading-relaxed mb-6 text-justify font-medium">
          <p>
            DECLARAMOS PARA OS DEVIDOS FINS QUE, NESTA DATA, A EQUIPE DE SUPORTE TÉCNICO / PATRIMÔNIO EFETUOU A RETIRADA DO EQUIPAMENTO ABAIXO ESPECIFICADO, QUE SE ENCONTRAVA EM REGIME DE USO DOMICILIAR NA RESIDÊNCIA DO PACIENTE ABAIXO CITADO, RECOLHENDO-O AO ESTOQUE CENTRAL.
          </p>
        </div>

        {/* ORIGEM DO ATIVO (DADOS DO PACIENTE) */}
        <p className="text-[10px] font-black bg-black text-white px-1 w-fit mb-2">
          ORIGEM DO ITEM (PACIENTE):
        </p>
        <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-[12px] font-bold mb-6 border border-black p-4">
          <p className="col-span-2 border-b border-black/10 pb-1">
            PACIENTE: <span className="font-black">{dados.nomePaciente || "__________________________________________________"}</span>
          </p>
          <p className="border-b border-black/10 pb-1">
            UNIDADE ORIGEM: <span className="font-black">{dados.unidadeOrigem || "________________________"}</span>
          </p>
          <p className="border-b border-black/10 pb-1">
            SETOR/BAIRRO ORIGEM: <span className="font-black">{dados.setorOrigem || "____________"}</span>
          </p>
        </div>

        {/* ESPECIFICAÇÕES DO EQUIPAMENTO */}
        <p className="text-[10px] font-black bg-black text-white px-1 w-fit mb-2">
          ESPECIFICAÇÕES DO ATIVO RECOLHIDO:
        </p>
        <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-[12px] font-bold mb-6 border border-black p-4">
          <p className="border-b border-black/10 pb-1">
            EQUIPAMENTO: <span className="font-black">{dados.nomeEquipamento || "________________"}</span>
          </p>
          <p className="border-b border-black/10 pb-1">
            PATRIMÔNIO: <span className="font-black">{dados.patrimonio || "________________"}</span>
          </p>
          <p className="col-span-2 border-b border-black/10 pb-1">
            DESTINO FINAL DO EQUIPAMENTO: <span className="font-black">{dados.unidadeDestino} - {dados.setorDestino}</span>
          </p>
        </div>

        {/* ESTADO DO EQUIPAMENTO E ACESSÓRIOS */}
        <p className="text-[10px] font-black bg-black text-white px-1 w-fit mb-2">
          AVALIAÇÃO FISCO-FUNCIONAL NO ATO DA RETIRADA:
        </p>
        <div className="grid grid-cols-3 gap-y-3 gap-x-2 text-[11px] font-bold mb-6 border border-black p-4">
          <p>( &nbsp; ) EM PERFEITO ESTADO</p>
          <p>( &nbsp; ) NECESSITA HIGIENIZAÇÃO</p>
          <p>( &nbsp; ) AVARIADO / DANIFICADO</p>
          <p>( &nbsp; ) INOPERANTE / COM DEFEITO</p>
          <p>( &nbsp; ) CABOS / FONTES INCLUSOS</p>
          <p className="text-[10px]">RESPONSÁVEL RECEBIMENTO: <span className="font-black">{dados.responsavelRecebimento || "________________"}</span></p>
        </div>

        {/* DATA E LOCAL */}
        <div className="text-[12px] font-bold mb-12 text-right">
          <p>MARICÁ, RJ, {dia} DE {mes} DE {ano}.</p>
        </div>

        {/* ÁREA DE ASSINATURAS PARA COLETAR NO PAPEL */}
        <div className="mt-16 grid grid-cols-2 gap-16">
          <div className="text-center">
            <div className="border-t-2 border-black pt-2">
              <p className="text-[10px] font-black">ASSINATURA DO TÉCNICO RESPONSÁVEL</p>
              <p className="text-[9px] mt-1">TI / PATRIMÔNIO</p>
            </div>
          </div>

          <div className="text-center">
            <div className="border-t-2 border-black pt-2">
              <p className="text-[10px] font-black">
                ASSINATURA DO PACIENTE OU RESPONSÁVEL
              </p>
              <p className="text-[9px] mt-1">CPF / IDENTIDADE: ___________________________</p>
            </div>
          </div>
        </div>

        {/* RODAPÉ DO DOCUMENTO */}
        <div className="mt-12 pt-4 border-t border-dashed border-black/30 flex justify-between text-[8px] font-bold">
          <span>SISTEMA DE GESTÃO DE CHAMADOS - TI</span>
          <span>COMPROVANTE DE ENCERRAMENTO DE CAUTELA E DEVOLUÇÃO PATRIMONIAL</span>
        </div>
      </div>
    </div>
  );
};

export default TermoRetiradaResidencia;