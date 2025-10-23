/**
 * 🎮 Controller: Step 5 - Pagamento PIX
 *
 * Gerencia geração e monitoramento de pagamento PIX
 */
import { gtmService } from '../../shared/utils/GTMService.js';

export class Step5Controller {
    constructor(view, gerarPagamentoPIXUseCase, safe2PayRepository) {
        this.view = view;
        this.gerarPagamentoPIXUseCase = gerarPagamentoPIXUseCase;
        this.safe2PayRepository = safe2PayRepository;
        this.monitoringInterval = null;
        this.pagamentoAtual = null;
        this.checkoutData = null; // Armazenar dados do checkout para Enhanced Conversions
    }

    /**
     * Inicializa o step com geração automática do PIX
     */
    async initialize(checkoutData) {
        console.log('🚀 Step5Controller: Inicializando');

        // Armazenar checkoutData para usar no evento purchase
        this.checkoutData = checkoutData;

        // Renderizar view
        this.view.render(null);

        // Configurar eventos
        this.setupEvents();

        // Gerar PIX automaticamente
        await this.gerarPIX(checkoutData);
    }

    /**
     * Gera o pagamento PIX
     */
    async gerarPIX(checkoutData) {
        try {
            this.view.showLoading('Gerando pagamento PIX...');

            console.log('💳 Step5Controller: Gerando PIX...');

            const resultado = await this.gerarPagamentoPIXUseCase.execute(checkoutData);

            if (!resultado.sucesso) {
                throw new Error(resultado.erro || 'Erro ao gerar PIX');
            }

            this.pagamentoAtual = resultado.pagamento;

            console.log('✅ Step5Controller: PIX gerado com sucesso');

            // Exibir pagamento
            this.view.displayPagamento(resultado.pagamento);

            // Re-configurar eventos após renderizar (para pegar o botão de teste)
            this.setupEvents();

            // 📊 Disparar evento GTM: Pagamento PIX gerado
            gtmService.trackAddPaymentInfo(
                {
                    valor: resultado.pagamento.valor || 8.00,
                    transactionId: resultado.pagamento.transactionId
                },
                {
                    codigo: 'ecpf-a1',
                    nome: 'e-CPF A1 (1 ano)',
                    tipo: 'e-CPF',
                    preco: resultado.pagamento.valor || 8.00
                }
            );

            // Iniciar monitoramento automático (se tiver transactionId)
            if (resultado.pagamento.transactionId) {
                this.startMonitoring(resultado.pagamento.transactionId);
            }

            return resultado.pagamento;

        } catch (error) {
            console.error('❌ Step5Controller: Erro ao gerar PIX', error);
            this.view.showError(`Erro: ${error.message}`);
            throw error;
        }
    }

    /**
     * Configura eventos dos botões
     */
    setupEvents() {
        // Botão Copiar PIX
        const btnCopyPix = document.getElementById('btn-copy-pix');
        if (btnCopyPix) {
            btnCopyPix.addEventListener('click', () => this.copyPixCode());
        }

        // Botão Voltar
        const btnBack = document.getElementById('btn-step5-back');
        if (btnBack) {
            btnBack.addEventListener('click', () => this.handleVoltar());
        }

        // Botão Verificar Pagamento
        const btnNext = document.getElementById('btn-step5-next');
        if (btnNext) {
            btnNext.addEventListener('click', () => this.handleVerificarPagamento());
        }

        // Botão de TESTE - Tentar múltiplas vezes até encontrar
        let tentativas = 0;
        const maxTentativas = 10;
        const intervalo = setInterval(() => {
            tentativas++;
            const btnTest = document.getElementById('btn-test-payment');

            if (btnTest) {
                console.log(`✅ Botão de teste encontrado na tentativa ${tentativas}! Configurando evento...`);
                clearInterval(intervalo);

                // Remover listeners antigos (se houver)
                const newBtn = btnTest.cloneNode(true);
                btnTest.parentNode.replaceChild(newBtn, btnTest);

                // Adicionar novo listener
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🧪 TESTE: Botão clicado! Simulando pagamento aprovado...');
                    this.stopMonitoring();
                    this.handlePagamentoAprovado();
                });
            } else if (tentativas >= maxTentativas) {
                console.log(`⚠️ Botão de teste não encontrado após ${tentativas} tentativas`);
                clearInterval(intervalo);
            }
        }, 200);

    }

    /**
     * Copia código PIX para área de transferência
     */
    async copyPixCode() {
        const pixCodeInput = document.getElementById('pix-code');
        if (!pixCodeInput || !pixCodeInput.value) {
            console.error('❌ Código PIX não disponível');
            return;
        }

        try {
            // Usar API moderna se disponível
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(pixCodeInput.value);
            } else {
                // Fallback para método antigo
                pixCodeInput.select();
                document.execCommand('copy');
            }

            // Feedback visual
            const btnCopy = document.getElementById('btn-copy-pix');
            if (btnCopy) {
                this.view.showCopyFeedback(btnCopy);
            }

            // 📊 Disparar evento GTM: Código PIX copiado
            gtmService.trackPixCopied(this.pagamentoAtual?.valor || 8.00);

            console.log('✅ Código PIX copiado');

        } catch (error) {
            console.error('❌ Erro ao copiar código PIX:', error);
            alert('Erro ao copiar código. Tente selecionar e copiar manualmente.');
        }
    }

    /**
     * Trata clique no botão Voltar
     */
    handleVoltar() {
        this.stopMonitoring();
        // A navegação será tratada pelo main.js
    }

    /**
     * Trata clique no botão Verificar Pagamento
     */
    async handleVerificarPagamento() {
        if (!this.pagamentoAtual || !this.pagamentoAtual.transactionId) {
            console.warn('⚠️ Nenhum pagamento para verificar');
            return;
        }

        try {
            console.log('🔍 Verificando status do pagamento...');

            const resultado = await this.safe2PayRepository.consultarStatusPagamento(
                this.pagamentoAtual.transactionId
            );

            if (resultado.sucesso) {
                const status = resultado.status;
                const statusCode = resultado.statusCode;

                // Status 3 = Aprovado - verifica AMBOS statusCode E status (string)
                if (statusCode === 3 || statusCode === '3' || status === 3 || status === '3' ||
                    status?.toLowerCase() === 'autorizado' || status?.toLowerCase() === 'approved' ||
                    status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'pago') {
                    console.log('🎉 Pagamento aprovado!');
                    this.handlePagamentoAprovado();
                }
                // Status 9 = Expirado, 4 = Cancelado
                else if (status === 9 || status === 4) {
                    console.log('⏰ Pagamento expirado/cancelado');
                    alert('Pagamento expirado ou cancelado. Por favor, gere um novo PIX.');
                }
                // Outros status
                else {
                    console.log(`📊 Status atual: ${resultado.statusDescricao || status}`);
                    alert(`Status do pagamento: ${resultado.statusDescricao || status}`);
                }
            }

        } catch (error) {
            console.error('❌ Erro ao verificar pagamento:', error);
            alert('Erro ao verificar pagamento. Tente novamente.');
        }
    }

    /**
     * Inicia monitoramento automático do pagamento
     */
    async startMonitoring(transactionId) {
        if (!transactionId) {
            console.warn('⚠️ Transaction ID não fornecido');
            return;
        }

        console.log('👀 Iniciando monitoramento do pagamento:', transactionId);

        // Parar monitoramento anterior se existir
        this.stopMonitoring();

        // Mostrar indicador de checagem ativa
        const statusIndicator = document.querySelector('.pix-status-indicator');
        if (statusIndicator) {
            statusIndicator.style.display = 'block';
            statusIndicator.textContent = 'Aguardando processamento do PIX...';
        }

        // OTIMIZAÇÃO: Aguardar 5 segundos antes de começar a consultar
        // Safe2Pay precisa de tempo para processar a transação antes de disponibilizar para consulta
        await new Promise(resolve => setTimeout(resolve, 5000));

        let checkCount = 0;
        const maxChecks = 1800; // 30 minutos (1800 x 1 segundo) - OTIMIZADO
        const SHOW_TIMEOUT_ALERT_AFTER = 90; // Mostrar alerta após 90 segundos (1m30s)

        this.monitoringInterval = setInterval(async () => {
            checkCount++;

            // Atualizar contador no texto principal (em segundos)
            const paymentCheckText = document.getElementById('payment-check-text');
            if (paymentCheckText) {
                const segundosTexto = checkCount === 1 ? 'segundo' : 'segundos';
                paymentCheckText.textContent = `Aguardando pagamento (${checkCount} ${segundosTexto})`;
            }

            // Mostrar alerta de timeout após 1m30s
            if (checkCount === SHOW_TIMEOUT_ALERT_AFTER) {
                const timeoutAlert = document.getElementById('payment-timeout-alert');
                if (timeoutAlert) {
                    timeoutAlert.style.display = 'block';
                    console.log('⏱️ Exibindo alerta de timeout (1m30s)');
                }
            }

            try {
                const resultado = await this.safe2PayRepository.consultarStatusPagamento(transactionId);

                if (resultado.sucesso) {
                    const status = resultado.status;
                    const statusCode = resultado.statusCode;
                    console.log(`📊 Status (check ${checkCount}): ${resultado.statusDescricao || status} (código ${statusCode})`);

                    // Converter status para string se for número
                    const statusStr = typeof status === 'string' ? status.toLowerCase() : '';

                    // Status aprovado - verifica AMBOS statusCode E status
                    if (statusCode === 3 || statusCode === '3' || status === 3 || status === '3' ||
                        statusStr === 'autorizado' || statusStr === 'approved' ||
                        statusStr === 'paid' || statusStr === 'pago') {
                        console.log('🎉 Pagamento aprovado!');
                        this.handlePagamentoAprovado();
                        this.stopMonitoring();
                    }
                    // Status expirado/cancelado
                    else if (status === 9 || status === 4 || statusCode === 9 || statusCode === 4) {
                        console.log('⏰ Pagamento expirado/cancelado');
                        this.stopMonitoring();
                    }
                }

                // Parar após máximo de tentativas
                if (checkCount >= maxChecks) {
                    console.log('⏰ Tempo máximo de monitoramento atingido');
                    this.stopMonitoring();
                }

            } catch (error) {
                console.error('❌ Erro ao verificar status:', error.message);
            }
        }, 1000); // OTIMIZADO: Verificar a cada 1 segundo (antes era 3s)

        console.log('✅ Monitoramento iniciado (verifica a cada 1s - OTIMIZADO)');
    }

    /**
     * Para o monitoramento automático
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('⏹️ Monitoramento parado');
        }
    }

    /**
     * Trata pagamento aprovado
     */
    async handlePagamentoAprovado() {
        console.log('✅ Processando pagamento aprovado');

        // Obter email e telefone do cliente
        const clienteEmail = this.checkoutData?.cliente?.email;
        const clienteTelefone = this.checkoutData?.cliente?.telefone;

        // 📊 Disparar evento GTM: Compra finalizada (purchase)
        // Inclui email e telefone para Enhanced Conversions do Google Ads
        gtmService.trackPurchase({
            transactionId: this.pagamentoAtual?.transactionId || 'unknown',
            productData: {
                codigo: 'ecpf-a1',
                nome: 'e-CPF A1 (1 ano)',
                tipo: 'e-CPF',
                preco: this.pagamentoAtual?.valor || 8.00
            },
            valor: this.pagamentoAtual?.valor || 8.00,
            email: clienteEmail,
            telefone: clienteTelefone
        });

        // Esconder seções de QR Code e PIX após pagamento aprovado
        const qrCodeSection = document.querySelector('#step-5 .qr-code-section');
        const pixCopySection = document.querySelector('#step-5 .pix-copy-section');
        if (qrCodeSection) qrCodeSection.style.display = 'none';
        if (pixCopySection) pixCopySection.style.display = 'none';

        const paymentStatus = document.querySelector('#step-5 .payment-status');
        if (paymentStatus) {
            paymentStatus.innerHTML = `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 40px 20px; margin: 60px auto; text-align: center; max-width: 500px;">
                    <div style="margin-bottom: 20px;">
                        <div class="spinner" style="
                            border: 4px solid #c3e6cb;
                            border-top: 4px solid #155724;
                            border-radius: 50%;
                            width: 50px;
                            height: 50px;
                            animation: spin 1s linear infinite;
                            margin: 0 auto;
                        "></div>
                    </div>
                    <div style="color: #155724; font-weight: bold; font-size: 20px; margin-bottom: 12px;">
                        ✓ Pagamento Confirmado!
                    </div>
                    <div id="progress-steps" style="color: #155724; font-size: 14px; margin-top: 20px; text-align: left; max-width: 350px; margin-left: auto; margin-right: auto;">
                        <div style="margin: 8px 0; font-weight: bold !important; transition: all 0.3s ease;">⏳ Liberando seu protocolo...</div>
                        <div style="margin: 8px 0; opacity: 0.5; transition: all 0.3s ease;">⏳ Gerando link de upload...</div>
                        <div style="margin: 8px 0; opacity: 0.5; transition: all 0.3s ease;">⏳ Redirecionando...</div>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
        }

        // Esconder botões de navegação (não pode voltar após pagamento)
        const navigationButtons = document.querySelector('#step-5 .navigation-buttons');
        if (navigationButtons) {
            navigationButtons.style.display = 'none';
        }

        // Chamar API Hope para criar solicitação e obter link de upload
        try {
            // Tentar pegar protocolo de várias fontes
            let protocolo = this.checkoutData?.protocolo;

            // Se não tem no checkoutData, tenta buscar do localStorage
            if (!protocolo) {
                console.log('⚠️ Protocolo não encontrado no checkoutData, buscando no localStorage...');
                const checkoutDataStr = localStorage.getItem('checkoutData');
                if (checkoutDataStr) {
                    const checkoutData = JSON.parse(checkoutDataStr);
                    protocolo = checkoutData?.protocolo;
                    console.log('📦 Dados recuperados do localStorage:', checkoutData);
                }
            }

            if (!protocolo) {
                console.error('❌ Protocolo não encontrado em nenhum lugar!');
                console.error('CheckoutData atual:', this.checkoutData);
                alert('Erro: Protocolo não encontrado. Por favor, reinicie o processo.');
                return;
            }

            console.log('🔄 Chamando API Hope para protocolo:', protocolo);

            // Atualizar primeiro passo com número do protocolo
            const progressSteps = document.querySelectorAll('#progress-steps div');
            if (progressSteps[0]) {
                progressSteps[0].innerHTML = `⏳ Liberando seu protocolo ${protocolo}`;
            }

            // Detectar URL da API (localhost ou produção)
            // IMPORTANTE: Usar o mesmo hostname (localhost ou 127.0.0.1) para evitar CORS
            const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? `http://${window.location.hostname}:8082`
                : '';

            const response = await fetch(`${apiUrl}/api/hope/create-solicitation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ protocol: protocolo })
            });

            const result = await response.json();

            if (result.sucesso && result.uploadUrl) {
                console.log('✅ Solicitação Hope criada com sucesso');
                console.log('📎 URL de upload:', result.uploadUrl);

                // Passo 1: Protocolo liberado (delay 1s para visualização)
                if (progressSteps[0]) {
                    progressSteps[0].innerHTML = `✓ Protocolo ${protocolo} liberado`;
                    progressSteps[0].style.setProperty('font-weight', 'bold', 'important');
                }
                if (progressSteps[1]) {
                    progressSteps[1].innerHTML = '⏳ Gerando link de upload...';
                    progressSteps[1].style.opacity = '1';
                    progressSteps[1].style.setProperty('font-weight', 'bold', 'important');
                }

                // Aguardar 1.5 segundos para visualização
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Passo 2: Link gerado (delay 1.5s para visualização)
                if (progressSteps[1]) {
                    progressSteps[1].innerHTML = '✓ Link gerado com sucesso';
                    progressSteps[1].style.setProperty('font-weight', 'bold', 'important');
                }
                if (progressSteps[2]) {
                    progressSteps[2].innerHTML = '⏳ Redirecionando...';
                    progressSteps[2].style.opacity = '1';
                    progressSteps[2].style.setProperty('font-weight', 'bold', 'important');
                }

                // Aguardar 1.5 segundos para visualização
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Passo 3: Redirecionando
                if (progressSteps[2]) {
                    progressSteps[2].innerHTML = '✓ Redirecionando...';
                }

                // Salvar URL de upload para passar ao Step 6
                this.uploadUrl = result.uploadUrl;

                // Aguardar 800ms antes de redirecionar
                await new Promise(resolve => setTimeout(resolve, 800));

                // Avançar para Step 6
                document.dispatchEvent(new CustomEvent('changeStep', {
                    detail: {
                        step: 6,
                        uploadUrl: result.uploadUrl
                    }
                }));
            } else {
                console.error('❌ Erro ao criar solicitação Hope:', result.erro);
                alert('Erro ao preparar upload de documentos. Por favor, entre em contato com o suporte.');
            }

        } catch (error) {
            console.error('❌ Erro ao chamar API Hope:', error);
            alert('Erro de conexão. Por favor, entre em contato com o suporte.');
        }
    }

    /**
     * Retorna dados do pagamento atual
     */
    getPagamentoData() {
        return this.pagamentoAtual;
    }

    /**
     * Cleanup ao sair do step
     */
    destroy() {
        this.stopMonitoring();
    }
}
