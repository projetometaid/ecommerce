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

            // 📊 Disparar evento GTM: Pagamento PIX gerado
            gtmService.trackAddPaymentInfo(
                {
                    valor: resultado.pagamento.valor || 5.00,
                    transactionId: resultado.pagamento.transactionId
                },
                {
                    codigo: 'ecpf-a1',
                    nome: 'e-CPF A1 (1 ano)',
                    tipo: 'e-CPF',
                    preco: resultado.pagamento.valor || 5.00
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
            gtmService.trackPixCopied(this.pagamentoAtual?.valor || 5.00);

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

                // Status 3 = Aprovado
                if (status === 3 || status === '3') {
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
                    console.log(`📊 Status atual: ${resultado.statusDescricao}`);
                    alert(`Status do pagamento: ${resultado.statusDescricao}`);
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
    startMonitoring(transactionId) {
        if (!transactionId) {
            console.warn('⚠️ Transaction ID não fornecido');
            return;
        }

        console.log('👀 Iniciando monitoramento do pagamento:', transactionId);

        // Parar monitoramento anterior se existir
        this.stopMonitoring();

        let checkCount = 0;
        const maxChecks = 360; // 30 minutos (360 x 5 segundos)

        this.monitoringInterval = setInterval(async () => {
            checkCount++;

            try {
                const resultado = await this.safe2PayRepository.consultarStatusPagamento(transactionId);

                if (resultado.sucesso) {
                    const status = resultado.status;
                    console.log(`📊 Status (check ${checkCount}): ${resultado.statusDescricao}`);

                    // Status aprovado
                    if (status === 3 || status === '3') {
                        console.log('🎉 Pagamento aprovado!');
                        this.handlePagamentoAprovado();
                        this.stopMonitoring();
                    }
                    // Status expirado/cancelado
                    else if (status === 9 || status === 4) {
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
        }, 5000); // Verificar a cada 5 segundos

        console.log('✅ Monitoramento iniciado (verifica a cada 5s)');
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
    handlePagamentoAprovado() {
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
                preco: this.pagamentoAtual?.valor || 5.00
            },
            valor: this.pagamentoAtual?.valor || 5.00,
            email: clienteEmail,
            telefone: clienteTelefone
        });

        const paymentStatus = document.querySelector('#step-5 .payment-status');
        if (paymentStatus) {
            paymentStatus.innerHTML = `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <div style="color: #155724; font-size: 48px; margin-bottom: 16px;">
                        🎉
                    </div>
                    <div style="color: #155724; font-weight: bold; font-size: 18px; margin-bottom: 8px;">
                        Pagamento Aprovado!
                    </div>
                    <div style="color: #155724; font-size: 14px;">
                        Redirecionando para confirmação...
                    </div>
                </div>
            `;
        }

        // Habilitar botão próximo será tratado pelo main.js
        const btnNext = document.getElementById('btn-step5-next');
        if (btnNext) {
            btnNext.disabled = false;
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
