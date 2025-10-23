/**
 * 🚀 Main - Bootstrap da Aplicação
 *
 * Inicializa toda a aplicação Clean Architecture
 * Pattern: Dependency Injection Container
 * SOLID: Dependency Inversion - Injeta dependências
 */

// ===== REPOSITORIES =====
import { LocalStorageRepository } from './infrastructure/repositories/LocalStorageRepository.js';
import { SafewebRepository } from './infrastructure/repositories/SafewebRepository.js';
import { CEPRepository } from './infrastructure/repositories/CEPRepository.js';
import { Safe2PayRepository } from './infrastructure/repositories/Safe2PayRepository.js';

// ===== USE CASES =====
import { SelecionarHorarioUseCase } from './domain/use-cases/horarios/SelecionarHorarioUseCase.js';
import { VerificarBiometriaUseCase } from './domain/use-cases/validacao/VerificarBiometriaUseCase.js';
import { ConsultarCPFnaRFBUseCase } from './domain/use-cases/validacao/ConsultarCPFnaRFBUseCase.js';
import { BuscarEnderecoPorCEPUseCase } from './domain/use-cases/validacao/BuscarEnderecoPorCEPUseCase.js';
import { GerarProtocoloUseCase } from './domain/use-cases/protocolo/GerarProtocoloUseCase.js';
import { GerarPagamentoPIXUseCase } from './application/use-cases/GerarPagamentoPIXUseCase.js';

// ===== CONTROLLERS =====
import { Step1Controller } from './presentation/controllers/Step1Controller.js';
import { Step2Controller } from './presentation/controllers/Step2Controller.js';
import { Step3Controller } from './presentation/controllers/Step3Controller.js';
import { Step4Controller } from './presentation/controllers/Step4Controller.js';
import { Step5Controller } from './presentation/controllers/Step5Controller.js';
import { Step6Controller } from './presentation/controllers/Step6Controller.js';

// ===== VIEWS =====
import { Step5View } from './presentation/views/Step5View.js';

// ===== COMPONENTS =====
import { PagadorModal } from './presentation/components/PagadorModal.js';

// ===== ENTITIES =====
import { Certificado } from './domain/entities/Certificado.js';

// ===== UTILS =====
import { MobileUtils } from './shared/utils/MobileUtils.js';

/**
 * 🏗️ Application - Classe principal da aplicação
 */
class Application {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 6;
        this.controllers = {};
        this.repositories = {};
        this.useCases = {};

        // Dados do checkout
        this.checkoutData = {
            certificado: null,
            horario: null,
            cliente: null,
            pagador: null,
            protocolo: null,
            pagamento: null
        };

        console.log('🏗️ Application: Instância criada');
    }

    /**
     * Inicializa a aplicação
     */
    async init() {
        console.log('🚀 Application: Inicializando sistema...');

        try {
            // 1. Configurar Dependency Injection
            this.setupDependencies();

            // 2. Inicializar certificado padrão (e-CPF A1)
            this.initializeCertificado();

            // 3. Carregar progresso salvo (se houver)
            await this.loadProgress();

            // 4. Inicializar step atual
            await this.loadStep(this.currentStep);

            // 5. Configurar eventos globais
            this.setupGlobalEvents();

            console.log('✅ Application: Sistema inicializado com sucesso!');
            console.log('📊 Step atual:', this.currentStep);

        } catch (error) {
            console.error('❌ Application: Erro ao inicializar:', error);
            this.showError('Erro ao inicializar sistema. Recarregue a página.');
        }
    }

    /**
     * Configura Dependency Injection
     * Pattern: Dependency Injection
     */
    setupDependencies() {
        console.log('🔧 Application: Configurando dependências...');

        // Repositories
        this.repositories.localStorage = new LocalStorageRepository();
        this.repositories.safeweb = new SafewebRepository();
        this.repositories.cep = new CEPRepository();
        this.repositories.safe2pay = new Safe2PayRepository();

        // Use Cases
        this.useCases.selecionarHorario = new SelecionarHorarioUseCase(
            this.repositories.localStorage
        );
        this.useCases.verificarBiometria = new VerificarBiometriaUseCase(
            this.repositories.safeweb
        );
        this.useCases.consultarCPF = new ConsultarCPFnaRFBUseCase(
            this.repositories.safeweb
        );
        this.useCases.buscarCEP = new BuscarEnderecoPorCEPUseCase(
            this.repositories.cep
        );
        this.useCases.gerarProtocolo = new GerarProtocoloUseCase(
            this.repositories.safeweb,
            this.repositories.localStorage
        );
        this.useCases.gerarPagamentoPIX = new GerarPagamentoPIXUseCase(
            this.repositories.safe2pay
        );

        console.log('✅ Application: Dependências configuradas');
    }

    /**
     * Inicializa certificado padrão
     */
    initializeCertificado() {
        this.checkoutData.certificado = Certificado.createECPFA1();
        console.log('📦 Application: Certificado e-CPF A1 configurado');
    }

    /**
     * Carrega progresso salvo
     */
    async loadProgress() {
        try {
            const progressData = await this.repositories.localStorage.carregarCheckout();

            if (progressData) {
                console.log('📥 Application: Progresso anterior encontrado');
                // Futuramente: restaurar dados
                // Por enquanto, apenas logamos
            }

            // Carregar horário selecionado via UseCase (não via repository diretamente)
            const horarioSelecionado = await this.useCases.selecionarHorario.carregarHorarioSelecionado();
            if (horarioSelecionado) {
                this.checkoutData.horario = horarioSelecionado;
                console.log('📅 Application: Horário restaurado:', horarioSelecionado.time);
            }
        } catch (error) {
            console.error('❌ Application: Erro ao carregar progresso:', error);
        }
    }

    /**
     * Carrega um step específico
     * @param {number} stepNumber
     */
    async loadStep(stepNumber) {
        console.log(`📍 Application: Carregando Step ${stepNumber}...`);

        // Ocultar todos os steps
        this.hideAllSteps();

        // Mostrar step atual
        const stepElement = document.getElementById(`step-${stepNumber}`);
        if (!stepElement) {
            console.error(`❌ Application: Step ${stepNumber} não encontrado no DOM`);
            return;
        }

        stepElement.classList.add('active');

        // Inicializar controller do step
        await this.initializeStepController(stepNumber);

        this.currentStep = stepNumber;
    }

    /**
     * Inicializa controller de um step específico
     * @param {number} stepNumber
     */
    async initializeStepController(stepNumber) {
        try {
            // Destruir controller anterior (se existir)
            if (this.controllers[`step${stepNumber}`]) {
                this.controllers[`step${stepNumber}`].destroy();
            }

            const stepElement = document.getElementById(`step-${stepNumber}`);

            switch (stepNumber) {
                case 1:
                    // Step 1 - Horários
                    const step1Controller = new Step1Controller(
                        this.useCases.selecionarHorario
                    );
                    await step1Controller.init(stepElement);
                    this.controllers.step1 = step1Controller;
                    break;

                case 2:
                    // Step 2 - Dados do Cliente
                    const step2Controller = new Step2Controller(
                        this.useCases.verificarBiometria,
                        this.useCases.consultarCPF,
                        this.useCases.buscarCEP,
                        this.useCases.gerarProtocolo
                    );
                    await step2Controller.init(stepElement);
                    this.controllers.step2 = step2Controller;
                    break;

                case 3:
                    // Step 3 - Dados do Pagador
                    const step3Controller = new Step3Controller(
                        this.useCases.buscarCEP
                    );
                    await step3Controller.init(stepElement);
                    this.controllers.step3 = step3Controller;
                    break;

                case 4:
                    // Step 4 - Resumo do Pedido
                    // Garantir que o horário está carregado
                    if (!this.checkoutData.horario) {
                        console.warn('⚠️ Application: Horário não encontrado, carregando via UseCase...');
                        const horarioSalvo = await this.useCases.selecionarHorario.carregarHorarioSelecionado();
                        if (horarioSalvo) {
                            this.checkoutData.horario = horarioSalvo;
                            console.log('✅ Application: Horário restaurado:', horarioSalvo);
                        }
                    }
                    const step4Controller = new Step4Controller(this.checkoutData);
                    await step4Controller.init(stepElement);
                    this.controllers.step4 = step4Controller;
                    break;

                case 5:
                    // Step 5 - Pagamento PIX
                    const step5View = new Step5View(stepElement);
                    const step5Controller = new Step5Controller(
                        step5View,
                        this.useCases.gerarPagamentoPIX,
                        this.repositories.safe2pay
                    );
                    await step5Controller.initialize(this.checkoutData);
                    this.controllers.step5 = step5Controller;
                    break;

                case 6:
                    // Step 6 - Upload de Documentos (Hope Integration)
                    const uploadUrl = this.uploadUrl || '';
                    const step6Controller = new Step6Controller(this.checkoutData, uploadUrl);
                    await step6Controller.init(stepElement);
                    this.controllers.step6 = step6Controller;
                    break;

                default:
                    console.warn(`⚠️ Step ${stepNumber} não implementado`);
            }

        } catch (error) {
            console.error(`❌ Application: Erro ao inicializar Step ${stepNumber}:`, error);
        }
    }

    /**
     * Oculta todos os steps
     */
    hideAllSteps() {
        document.querySelectorAll('.step-content').forEach(step => {
            step.classList.remove('active');
        });
    }

    /**
     * Configura eventos globais
     */
    setupGlobalEvents() {
        console.log('🎯 Application: Configurando eventos globais...');

        // Navegação - Botões "Continuar"
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-next')) {
                console.log('🖱️ Application: Clique detectado em btn-next');
                this.handleNext();
            }
            if (e.target.classList.contains('btn-back')) {
                console.log('🖱️ Application: Clique detectado em btn-back');
                this.handleBack();
            }
        });

        // Navegação customizada via evento (ex: voltar de Step 4 para Step 3)
        document.addEventListener('changeStep', async (e) => {
            const targetStep = e.detail.step;
            const uploadUrl = e.detail.uploadUrl;

            console.log(`🔄 Application: Evento changeStep recebido - mudando para Step ${targetStep}`);

            // Se tiver uploadUrl, salvar para usar no Step 6
            if (uploadUrl) {
                this.uploadUrl = uploadUrl;
                console.log('📎 Upload URL recebida:', uploadUrl);
            }

            await this.loadStep(targetStep);
        });

        // Salvar progresso antes de sair
        window.addEventListener('beforeunload', () => {
            this.saveProgress();
        });

        console.log('✅ Application: Eventos globais configurados');
    }

    /**
     * Trata clique em "Continuar"
     */
    async handleNext() {
        console.log(`➡️ Application: Tentando avançar do Step ${this.currentStep}`);
        console.log('📦 Application: checkoutData atual:', this.checkoutData);

        // Validar step atual
        const canProceed = this.validateCurrentStep();
        console.log(`✅ Application: canProceed = ${canProceed}`);

        if (!canProceed) {
            console.warn('⚠️ Application: Validação falhou, não pode avançar');
            return;
        }

        // LÓGICA ESPECIAL: Step 2 gera protocolo e mostra modal de pagador
        if (this.currentStep === 2) {
            const step2Controller = this.controllers.step2;
            if (step2Controller) {
                // Mostrar loading no botão
                const btnNext = document.getElementById('btn-step2-next');
                const originalText = btnNext.textContent;
                btnNext.disabled = true;
                btnNext.innerHTML = '<span class="spinner"></span> Gerando protocolo...';

                const resultado = await step2Controller.gerarProtocolo();

                // Restaurar botão
                btnNext.disabled = false;
                btnNext.textContent = originalText;

                if (!resultado.sucesso) {
                    return; // Não avançar se falhou
                }

                // Salvar protocolo nos dados do checkout
                this.checkoutData.protocolo = resultado.protocolo;
                console.log('📋 Application: Protocolo salvo:', resultado.protocolo);

                // Pequeno delay para transição suave (100ms)
                await new Promise(resolve => setTimeout(resolve, 100));

                // Mostrar modal de confirmação do pagador
                await this.showPagadorModal(resultado.protocolo);
                return; // Modal controla a navegação
            }
        }

        // Salvar dados do step atual
        await this.saveStepData();

        // Avançar para próximo step
        if (this.currentStep < this.totalSteps) {
            await this.loadStep(this.currentStep + 1);
        }
    }

    /**
     * Trata clique em "Voltar"
     */
    async handleBack() {
        console.log(`⬅️ Application: Voltando do Step ${this.currentStep}`);

        if (this.currentStep > 1) {
            await this.loadStep(this.currentStep - 1);
        }
    }

    /**
     * Valida step atual
     * @returns {boolean}
     */
    validateCurrentStep() {
        const controller = this.controllers[`step${this.currentStep}`];

        if (controller && controller.canProceed) {
            return controller.canProceed();
        }

        // Se não tem controller ou método canProceed, permitir
        return true;
    }

    /**
     * Salva dados do step atual
     */
    async saveStepData() {
        const controller = this.controllers[`step${this.currentStep}`];

        // Step 1 - Horário (além de salvar via Use Case, salvar no checkoutData)
        if (this.currentStep === 1 && controller) {
            const horario = controller.getSelectedHorario();
            console.log('📅 Application: Horário obtido do Step1Controller:', horario);
            if (horario) {
                this.checkoutData.horario = horario;
                console.log('✅ Application: Horário salvo no checkoutData:', this.checkoutData.horario);
            } else {
                console.warn('⚠️ Application: Horário é null, tentando carregar via UseCase...');
                // Fallback: carregar via UseCase
                const horarioSalvo = await this.useCases.selecionarHorario.carregarHorarioSelecionado();
                if (horarioSalvo) {
                    this.checkoutData.horario = horarioSalvo;
                    console.log('✅ Application: Horário carregado via UseCase:', horarioSalvo);
                }
            }
        }

        // Step 2 - Dados do cliente
        if (this.currentStep === 2 && controller) {
            this.checkoutData.cliente = controller.getClienteData();
        }

        // Step 3 - Dados do pagador
        if (this.currentStep === 3 && controller) {
            this.checkoutData.pagador = controller.getPagadorData();
        }

        // Step 5 - Dados do pagamento
        if (this.currentStep === 5 && controller) {
            this.checkoutData.pagamento = controller.getPagamentoData();
        }

        console.log(`💾 Application: Dados do Step ${this.currentStep} salvos`);
    }

    /**
     * Salva progresso geral
     */
    async saveProgress() {
        try {
            await this.repositories.localStorage.salvarCheckout({
                currentStep: this.currentStep,
                formData: this.checkoutData
            });
            console.log('💾 Application: Progresso salvo');
        } catch (error) {
            console.error('❌ Application: Erro ao salvar progresso:', error);
        }
    }

    /**
     * Mostra erro global
     * @param {string} message
     */
    showError(message) {
        alert('Erro: ' + message);
    }

    /**
     * Mostra modal de confirmação do pagador
     */
    async showPagadorModal(protocolo) {
        return new Promise((resolve) => {
            const dadosCliente = this.controllers.step2.getClienteData();

            const modal = new PagadorModal();
            modal.show(
                {
                    nome: dadosCliente.nome,
                    cpf: dadosCliente.cpf,
                    email: dadosCliente.email,
                    telefone: dadosCliente.telefone
                },
                async (mesmoPagador) => {
                    if (mesmoPagador) {
                        // Usar mesmos dados do titular
                        this.checkoutData.pagador = {
                            usarDadosUsuario: true,
                            tipoPessoa: 'fisica',
                            dados: {
                                cpf: dadosCliente.cpf,
                                nome: dadosCliente.nome,
                                email: dadosCliente.email,
                                telefone: dadosCliente.telefone
                            }
                        };

                        console.log('✅ Application: Pagador = Titular do certificado');

                        // Salvar dados do step atual
                        await this.saveStepData();

                        // Avançar para Step 4 (Resumo) - pula Step 3
                        await this.loadStep(4);
                    } else {
                        // Informar outros dados - ir para Step 3
                        this.checkoutData.pagador = {
                            usarDadosUsuario: false,
                            tipoPessoa: null,
                            dados: null
                        };

                        console.log('📝 Application: Usuário vai informar outro pagador');

                        // Salvar dados do step atual
                        await this.saveStepData();

                        // Ir para Step 3 (Dados do Pagador)
                        await this.loadStep(3);
                    }

                    resolve();
                },
                null,
                protocolo
            );
        });
    }

    /**
     * Limpa todos os dados
     */
    async clearAll() {
        await this.repositories.localStorage.limparCheckout();
        this.checkoutData = {};
        console.log('🧹 Application: Dados limpos');
    }
}

// ===== BOOTSTRAP =====
// Aguardar DOM estar pronto
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM carregado, inicializando aplicação...');

    // Inicializar otimizações mobile PRIMEIRO
    MobileUtils.init();

    // Criar e inicializar aplicação
    window.app = new Application();
    await window.app.init();

    console.log('🎉 Sistema Clean Architecture inicializado!');
    console.log('💡 Acesse window.app no console para debug');
});

// Exportar para uso em módulos
export { Application };
