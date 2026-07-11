export const abrirVisualizacaoRetirada = (dados) => {
  const janelaPrint = window.open("", "_blank");

  janelaPrint.document.write(`
    <html>
      <head>
        <title>Termo de Retirada de Equipamento Residencial</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body class="bg-white p-8 text-black uppercase font-sans">
        <div class="no-print mb-6 text-center">
          <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-blue-700 cursor-pointer">
            IMPRIMIR TERMO
          </button>
        </div>

        <div class="border-[4px] border-black p-6">
          <!-- FAIXA OFICIAL DE LOGOS -->
          <div class="w-full flex justify-between items-center pb-4 mb-4 border-b-2 border-black/20">
            <div class="flex-1 flex justify-start"><img src="/Imagem1.png" class="h-12 object-contain" /></div>
            <div class="flex-1 flex justify-center"><img src="/Imagem2.png" class="h-12 object-contain" /></div>
            <div class="flex-1 flex justify-center"><img src="/Imagem3.png" class="h-8 object-contain" /></div>
            <div class="flex-1 flex justify-end"><img src="/Imagem4.png" class="h-12 object-contain" /></div>
          </div>

          <!-- CABEÇALHO -->
          <div class="text-center border-b-4 border-black pb-4 mb-6">
            <h1 class="text-2xl font-black">TERMO DE RETIRADA DE EQUIPAMENTO EM RESIDÊNCIA</h1>
            <p class="text-[11px] font-bold mt-1">PROCESSO DE DESMOBILIZAÇÃO / RETORNO DE HOME CARE</p>
          </div>

          <div class="text-[13px] leading-relaxed mb-6 text-justify">
            <p>
              DECLARAMOS QUE EFETUAMOS NESTA DATA A RETIRADA DO EQUIPAMENTO ABAIXO DESCRITO DA RESIDÊNCIA DO PACIENTE, RECOLHENDO-O AO PATRIMÔNIO CENTRAL PARA DEVIDA REVISÃO, HIGIENIZAÇÃO E RETORNO AO ESTOQUE ATIVO DA INSTITUIÇÃO.
            </p>
          </div>

          <!-- DADOS DO PACIENTE -->
          <p class="text-[10px] font-black bg-black text-white px-1 w-fit mb-2">ORIGEM DO ITEM (PACIENTE):</p>
          <div class="grid grid-cols-2 gap-y-2 gap-x-8 text-[12px] font-bold mb-6 border border-black p-4">
            <p class="col-span-2 border-b border-black/10 pb-1">PACIENTE: <span class="font-black">${dados.nomePaciente}</span></p>
            <p class="border-b border-black/10 pb-1">UNIDADE ORIGEM: <span class="font-black">${dados.unidadeOrigem}</span></p>
            <p class="border-b border-black/10 pb-1">SETOR ORIGEM: <span class="font-black">${dados.setorOrigem}</span></p>
          </div>

          <!-- DADOS DO EQUIPAMENTO -->
          <p class="text-[10px] font-black bg-black text-white px-1 w-fit mb-2">ESPECIFICAÇÕES DO ATIVO RECOLHIDO:</p>
          <div class="grid grid-cols-2 gap-y-2 gap-x-8 text-[12px] font-bold mb-6 border border-black p-4">
            <p class="border-b border-black/10 pb-1">EQUIPAMENTO: <span class="font-black">${dados.nomeEquipamento}</span></p>
            <p class="border-b border-black/10 pb-1">PATRIMÔNIO: <span class="font-black">${dados.patrimonio}</span></p>
            <p class="col-span-2 border-b border-black/10 pb-1">DESTINO FINAL: <span class="font-black">${dados.unidadeDestino} - ${dados.setorDestino}</span></p>
          </div>

          <!-- ESTADO DE DEVOLUÇÃO -->
          <p class="text-[10px] font-black bg-black text-white px-1 w-fit mb-2">AVALIAÇÃO FISCO-FUNCIONAL NO ATO DA RETIRADA:</p>
          <div class="grid grid-cols-3 gap-2 text-[11px] font-bold mb-6 border border-black p-4">
            <p>(  ) EM PERFEITO ESTADO</p>
            <p>(  ) NECESSITA HIGIENIZAÇÃO</p>
            <p>(  ) AVARIADO / DANIFICADO</p>
            <p>(  ) INOPERANTE / COM DEFEITO</p>
            <p>(  ) CABOS/FONTES INCLUSOS</p>
            <p>RESP. ENTREGA: ${dados.responsavelRecebimento}</p>
          </div>

          <!-- LOCAL E DATA -->
          <div class="text-[12px] font-bold mb-16 text-right">
            <p>MARICÁ, RJ, ${new Date().toLocaleDateString("pt-BR")}.</p>
          </div>

          <!-- ASSINATURAS -->
          <div class="grid grid-cols-2 gap-16 mt-20">
            <div class="text-center">
              <div class="border-t-2 border-black pt-2">
                <p class="text-[10px] font-black">ASSINATURA DO TÉCNICO RESPONSÁVEL</p>
              </div>
            </div>
            <div class="text-center">
              <div class="border-t-2 border-black pt-2">
                <p class="text-[10px] font-black">ASSINATURA DO PACIENTE / RESPONSÁVEL NO LOCAL</p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  janelaPrint.document.close();
};