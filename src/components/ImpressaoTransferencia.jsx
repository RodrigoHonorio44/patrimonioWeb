export const abrirVisualizacaoTermo = (dados) => {
    const janelaVisualizacao = window.open('', '_blank');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Captura o endereço base do sistema (ex: http://localhost:5173) para que a nova aba ache a pasta public
    const baseUrl = window.location.origin;

    // Identifica se o destino é a residência de um paciente (valida por texto ou flag)
    const deParaPaciente = !!(dados.unidadeDestino?.toUpperCase().includes('PACIENTE') || dados.isResidencial);

    // --- CONFIGURAÇÃO DINÂMICA DO TEXTO E TÍTULOS ---
    let tituloDocumento = "Guia de Transferência de Bens Patrimoniais";
    let textoIntroducao = `Declaramos para os devidos fins que, na data de <strong>${dataAtual}</strong>, o bem ativo listado abaixo foi transferido de sua respectiva unidade de origem para as dependências da unidade de destino descrita.`;
    let labelSetorDestino = "Novo Setor de Destino";
    let labelRecebedor = "Responsável pelo Recebimento";
    let labelAssinaturaRecebedor = "Responsável pelo Recebimento";
    let clausulasAdicionais = "";

    if (deParaPaciente) {
        tituloDocumento = "Termo de Responsabilidade, Guarda e Uso Temporário de Equipamento";
        textoIntroducao = `Pelo presente instrumento, declaramos que na data de <strong>${dataAtual}</strong>, o equipamento médico/hospitalar de propriedade municipal abaixo especificado é entregue em regime de <strong>Cessão de Uso Temporário e Guarda Doméstica</strong> para a continuidade do tratamento do paciente identificado, sob total responsabilidade do recebedor qualificado neste termo.`;
        labelSetorDestino = "Nome do Paciente / Beneficiário";
        labelRecebedor = "Responsável Legal / Cuidador";
        labelAssinaturaRecebedor = "Responsável Legal (Detentor da Guarda)";

        // Cláusulas obrigatórias ajustadas para economizar espaço vertical
        clausulasAdicionais = `
            <div style="margin-top: 12px; font-size: 11px; text-align: justify; background-color: #f8fafc; padding: 10px 14px; border: 1px dashed #cbd5e1; border-radius: 4px;">
                <p style="margin: 0 0 4px 0; font-weight: bold; text-transform: uppercase; color: #475569; font-size: 11px;">Cláusulas de Responsabilidade e Obrigações:</p>
                <ol style="padding-left: 18px; margin: 0; line-height: 1.4;">
                    <li style="margin-bottom: 2px;">O responsável assume a total guarda, zelo e conservação do equipamento acima descrito, utilizando-o única e exclusivamente para o fim terapêutico do paciente.</li>
                    <li style="margin-bottom: 2px;">É expressamente proibida a transferência, empréstimo, locação, doação ou cessão deste item a terceiros sob qualquer pretexto.</li>
                    <li style="margin-bottom: 2px;">Em caso de defeitos técnicos, o responsável comunicará imediatamente a Engenharia Clínica ou Patrimônio do hospital de origem, sendo vedada manutenção não autorizada.</li>
                    <li style="margin-bottom: 0;"><strong>Da Devolução Obrigatória:</strong> O responsável compromete-se a efetuar a devolução imediata do equipamento à unidade hospitalar assim que cessada a necessidade de uso (por alta médica, internação ou óbito).</li>
                </ol>
            </div>
        `;
    }

    janelaVisualizacao.document.write(`
        <html>
            <head>
                <title>${tituloDocumento}</title>
                <style>
                    /* Ajuste de margens da página para maximizar área útil em uma única folha */
                    @page { size: A4; margin: 12mm 15mm; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000000; line-height: 1.4; font-size: 13px; }
                    .documento-container { max-w: 800px; margin: 0 auto; }
                    
                    /* FAIXA OFICIAL DE LOGOS DE PONTA A PONTA */
                    .faixa-logos {
                        width: 100%;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-bottom: 10px;
                        margin-bottom: 10px;
                        border-bottom: 2px solid rgba(0, 0, 0, 0.2);
                        user-select: none;
                    }
                    .logo-box {
                        flex: 1;
                        display: flex;
                    }
                    .justify-start { justify-content: flex-start; }
                    .justify-center { justify-content: center; }
                    .justify-end { justify-content: flex-end; }
                    
                    .logo-img { height: 42px; object-fit: contain; display: block; }
                    .logo-img-h8 { height: 28px; object-fit: contain; display: block; }

                    /* CABEÇALHO DO DOCUMENTO */
                    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 14px; }
                    .header h1 { margin: 0; font-size: 18px; font-weight: 900; text-transform: uppercase; }
                    .header p { margin: 2px 0 0 0; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.1em; }
                    
                    .content { margin-bottom: 15px; font-size: 13px; text-align: justify; }
                    
                    /* Tabela compactada para garantir folha única */
                    .table-dados { width: 100%; border-collapse: collapse; margin: 12px 0; }
                    .table-dados th, .table-dados td { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 12px; }
                    .table-dados th { background-color: #f8fafc; width: 32%; font-weight: bold; text-transform: uppercase; color: #475569; text-align: left; }
                    .table-dados td { font-weight: bold; }
                    
                    /* Seção de assinaturas posicionada com margem reduzida */
                    .assinaturas { margin-top: 35px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                    .campo-assinatura { width: 45%; text-align: center; }
                    .linha { border-top: 1px solid #0f172a; margin-bottom: 4px; }
                </style>
            </head>
            <body>
                <div class="documento-container">
                    
                    <!-- FAIXA OFICIAL DE LOGOS DE PONTA A PONTA -->
                    <div class="faixa-logos">
                        <div class="logo-box justify-start">
                            <img src="${baseUrl}/Imagem1.png" alt="Hospital Municipal Conde Modesto Leal" class="logo-img" />
                        </div>
                        <div class="logo-box justify-center">
                            <img src="${baseUrl}/Imagem2.png" alt="Avante Social" class="logo-img" />
                        </div>
                        <div class="logo-box justify-center">
                            <img src="${baseUrl}/Imagem3.png" alt="Secretaria de Saúde" class="logo-img-h8" />
                        </div>
                        <div class="logo-box justify-end">
                            <img src="${baseUrl}/Imagem4.png" alt="Prefeitura de Maricá" class="logo-img" />
                        </div>
                    </div>

                    <div class="header">
                        <h1>${tituloDocumento}</h1>
                        <p>Rodhon System • Gestão de Ativos</p>
                    </div>
                    
                    <div class="content">
                        <p style="margin: 0;">${textoIntroducao}</p>
                        <table class="table-dados">
                            <tr><th>Descrição do Item</th><td>${dados.nomeEquipamento ? dados.nomeEquipamento.toUpperCase() : ''}</td></tr>
                            <tr><th>Nº de Patrimônio</th><td>${dados.patrimonio ? dados.patrimonio.toUpperCase() : ''}</td></tr>
                            <tr><th>Unidade de Origem</th><td>${dados.unidadeOrigem ? dados.unidadeOrigem.toUpperCase() : ''}</td></tr>
                            <tr><th>Setor de Origem</th><td>${dados.setorOrigem ? dados.setorOrigem.toUpperCase() : ''}</td></tr>
                            <tr><th>Unidade de Destino</th><td>${dados.unidadeDestino ? dados.unidadeDestino.toUpperCase() : ''}</td></tr>
                            <tr><th>${labelSetorDestino}</th><td>${dados.setorDestino ? dados.setorDestino.toUpperCase() : ''}</td></tr>
                            
                            ${deParaPaciente && dados.pacienteEndereco ? `<tr><th>Endereço do Paciente</th><td>${dados.pacienteEndereco.toUpperCase()}</td></tr>` : ''}
                            ${deParaPaciente && dados.pacienteCpf ? `<tr><th>Documentos (CPF/RG)</th><td>${dados.pacienteCpf.toUpperCase()}</td></tr>` : ''}

                            <tr><th>${labelRecebedor}</th><td>${dados.responsavelRecebimento ? dados.responsavelRecebimento.toUpperCase() : ''}</td></tr>
                        </table>

                        <!-- Renderização das cláusulas se for para paciente -->
                        ${clausulasAdicionais}
                    </div>
                    
                    <div class="assinaturas">
                        <div class="campo-assinatura">
                            <div class="linha"></div>
                            <p style="font-weight: bold; text-transform: uppercase; font-size: 11px; margin: 0;">Responsável pela Saída</p>
                            <p style="font-size: 10px; color: #64748b; margin: 1px 0 0 0;">Patrimônio / Engenharia Clínica</p>
                        </div>
                        <div class="campo-assinatura">
                            <div class="linha"></div>
                            <p style="font-weight: bold; text-transform: uppercase; font-size: 11px; margin: 0;">${dados.responsavelRecebimento ? dados.responsavelRecebimento.toUpperCase() : ''}</p>
                            <p style="font-size: 10px; color: #64748b; margin: 1px 0 0 0;">${labelAssinaturaRecebedor}</p>
                        </div>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 300);
                    }
                </script>
            </body>
        </html>
    `);
    janelaVisualizacao.document.close();
};