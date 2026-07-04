// src/components/ImpressaoTransferencia.js

export const abrirVisualizacaoTermo = (dados) => {
    const janelaVisualizacao = window.open('', '_blank');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Captura o endereço base do sistema (ex: http://localhost:5173) para que a nova aba ache a pasta public
    const baseUrl = window.location.origin;

    janelaVisualizacao.document.write(`
        <html>
            <head>
                <title>Termo de Transferência</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; color: #000000; line-height: 1.6; }
                    .documento-container { max-w: 800px; margin: 0 auto; }
                    
                    /* FAIXA OFICIAL DE LOGOS DE PONTA A PONTA (Igual à sua Ordem de Serviço) */
                    .faixa-logos {
                        width: 100%;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-bottom: 16px;
                        margin-bottom: 16px;
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
                    
                    .logo-img { height: 48px; object-fit: contain; display: block; }  /* h-12 */
                    .logo-img-h8 { height: 32px; object-fit: contain; display: block; } /* h-8 */

                    /* CABEÇALHO DO COLO */
                    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 32px; }
                    .header h1 { margin: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; }
                    .header p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.1em; }
                    
                    .content { margin-bottom: 40px; font-size: 15px; text-align: justify; }
                    .table-dados { width: 100%; border-collapse: collapse; margin: 24px 0 40px; }
                    .table-dados th, .table-dados td { border: 1px solid #cbd5e1; padding: 12px; font-size: 14px; }
                    .table-dados th { background-color: #f8fafc; width: 35%; font-weight: bold; text-transform: uppercase; color: #475569; }
                    .table-dados td { font-weight: bold; }
                    .assinaturas { margin-top: 60px; display: flex; justify-content: space-between; }
                    .campo-assinatura { width: 45%; text-align: center; }
                    .linha { border-top: 1px solid #0f172a; margin-bottom: 6px; }
                </style>
            </head>
            <body>
                <div class="documento-container">
                    
                    <!-- FAIXA OFICIAL DE LOGOS DE PONTA A PONTA -->
                    <div class="faixa-logos">
                        <!-- Logo 1: Hospital Conde Modesto Leal -->
                        <div class="logo-box justify-start">
                            <img src="${baseUrl}/Imagem1.png" alt="Hospital Municipal Conde Modesto Leal" class="logo-img" />
                        </div>
                        
                        <!-- Logo 2: Avante Social -->
                        <div class="logo-box justify-center">
                            <img src="${baseUrl}/Imagem2.png" alt="Avante Social" class="logo-img" />
                        </div>
                        
                        <!-- Logo 3: Secretaria de Saúde -->
                        <div class="logo-box justify-center">
                            <img src="${baseUrl}/Imagem3.png" alt="Secretaria de Saúde" class="logo-img-h8" />
                        </div>
                        
                        <!-- Logo 4: Prefeitura de Maricá -->
                        <div class="logo-box justify-end">
                            <img src="${baseUrl}/Imagem4.png" alt="Prefeitura de Maricá" class="logo-img" />
                        </div>
                    </div>

                    <div class="header">
                        <h1>Guia de Transferência de Bens Patrimoniais</h1>
                        <p>Rodhon System • Gestão de Ativos</p>
                    </div>
                    
                    <div class="content">
                        <p>Declaramos para os devidos fins que, na data de <strong>${dataAtual}</strong>, o bem ativo listado abaixo foi transferido de sua respectiva unidade de origem para as dependências da unidade de destino descrita.</p>
                        <table class="table-dados">
                            <tr><th>Descrição do Item</th><td>${dados.nomeEquipamento.toUpperCase()}</td></tr>
                            <tr><th>Nº de Patrimônio</th><td>${dados.patrimonio.toUpperCase()}</td></tr>
                            <tr><th>Unidade de Origem</th><td>${dados.unidadeOrigem.toUpperCase()}</td></tr>
                            <tr><th>Setor de Origem</th><td>${dados.setorOrigem.toUpperCase()}</td></tr>
                            <tr><th>Unidade de Destino</th><td>${dados.unidadeDestino.toUpperCase()}</td></tr>
                            <tr><th>Novo Setor de Destino</th><td>${dados.setorDestino.toUpperCase()}</td></tr>
                            <tr><th>Responsável pelo Recebimento</th><td>${dados.responsavelRecebimento.toUpperCase()}</td></tr>
                        </table>
                    </div>
                    
                    <div class="assinaturas">
                        <div class="campo-assinatura">
                            <div class="linha"></div>
                            <p style="font-weight: bold; text-transform: uppercase; font-size: 12px;">Responsável pela Saída</p>
                        </div>
                        <div class="campo-assinatura">
                            <div class="linha"></div>
                            <p style="font-weight: bold; text-transform: uppercase; font-size: 12px;">${dados.responsavelRecebimento}</p>
                            <p style="font-size: 11px; color: #64748b;">Responsável pelo Recebimento</p>
                        </div>
                    </div>
                </div>
                <script>
                    // Pequeno atraso para garantir o carregamento completo das imagens locais antes de disparar o print
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