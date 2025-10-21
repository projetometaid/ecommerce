/**
 * 🎮 Controller: Step 2 - Dados do Cliente
 *
 * Orquestra View e Use Cases do Step 2
 */

import { Step2View } from '../views/Step2View.js';
import { Validators } from '../validators/Validators.js';
import { Cliente } from '../../domain/entities/Cliente.js';
import { Endereco } from '../../domain/entities/Endereco.js';
import { gtmService } from '../../shared/utils/GTMService.js';

export class Step2Controller {
    constructor(
        verificarBiometriaUseCase,
        consultarCPFUseCase,
        buscarCEPUseCase,
        gerarProtocoloUseCase
    ) {
        this.verificarBiometriaUseCase = verificarBiometriaUseCase;
        this.consultarCPFUseCase = consultarCPFUseCase;
        this.buscarCEPUseCase = buscarCEPUseCase;
        this.gerarProtocoloUseCase = gerarProtocoloUseCase;

        this.view = null;
        this.clienteData = {
            biometriaVerificada: false,
            temBiometria: null,
            precisaCNH: false,
            consultaRFBValida: false,
            nomeRFB: null
        };

        // 🔒 Rate Limit para evitar abuso (consultas de CPFs diferentes)
        this.rateLimiter = {
            cpfsConsultados: new Set(), // Armazena CPFs únicos consultados
            ultimaConsulta: null, // Timestamp da última consulta
            maxCPFsDiferentes: 5, // Máximo de CPFs diferentes permitidos
            intervaloMinimo: 2000 // 2 segundos entre consultas (evita spam)
        };
    }

    async init(containerElement) {
        console.log('🚀 Step2Controller: Inicializando...');

        this.view = new Step2View(containerElement);
        this.view.render();

        this.setupEvents();

        console.log('✅ Step2Controller: Inicializado');
    }

    setupEvents() {
        // CPF - verificar biometria ao sair do campo
        const cpfInput = this.view.getElementById('cpf');
        if (cpfInput) {
            // Detectar quando CPF é modificado (resetar estado)
            cpfInput.addEventListener('input', () => this.handleCPFInput());

            // Verificar biometria ao sair do campo
            cpfInput.addEventListener('blur', () => this.handleCPFBlur());
        }

        // Data nascimento - consultar RFB ao sair do campo
        const nascInput = this.view.getElementById('nascimento');
        if (nascInput) {
            nascInput.addEventListener('blur', () => this.handleDataNascimentoBlur());
        }

        // CEP - buscar endereço
        const cepInput = this.view.getElementById('cep');
        if (cepInput) {
            cepInput.addEventListener('blur', () => this.handleCEPBlur());
        }

        // Validação em tempo real
        const form = this.view.formContainer;
        if (form) {
            form.addEventListener('input', () => this.validateForm());
        }

        // Listener para quando o select de Estado for criado dinamicamente
        document.addEventListener('estadoSelectCreated', (e) => {
            const selectElement = e.detail.selectElement;
            if (selectElement) {
                selectElement.addEventListener('change', () => this.validateForm());
                console.log('✅ Step2Controller: Event listener adicionado ao select de Estado');
            }
        });
    }

    /**
     * Reseta todos os estados quando CPF é alterado
     */
    resetCPFState() {
        // Resetar estados
        this.clienteData.biometriaVerificada = false;
        this.clienteData.temBiometria = null;
        this.clienteData.precisaCNH = false;
        this.clienteData.consultaRFBValida = false;
        this.clienteData.nomeRFB = null;

        // Limpar feedbacks visuais
        const cpfFormGroup = this.view.getElementById('cpf')?.closest('.form-group');
        if (cpfFormGroup) {
            cpfFormGroup.classList.remove('input-loading', 'input-success', 'input-warning', 'input-error');
            const oldIcon = cpfFormGroup.querySelector('.input-status-icon');
            if (oldIcon) oldIcon.remove();
        }

        const nascFormGroup = this.view.getElementById('nascimento')?.closest('.form-group');
        if (nascFormGroup) {
            nascFormGroup.classList.remove('input-loading', 'input-success', 'input-warning', 'input-error');
            const oldIcon = nascFormGroup.querySelector('.input-status-icon');
            if (oldIcon) oldIcon.remove();
        }

        // Limpar campos dependentes
        this.view.setFieldValue('nascimento', '');
        this.view.hideNomeField();
        this.view.hideCNHField();

        // Fechar modais se estiverem abertos
        const cnhModal = document.getElementById('cnh-modal-overlay');
        if (cnhModal) cnhModal.remove();

        const blockModal = document.getElementById('block-modal-overlay');
        if (blockModal) blockModal.remove();

        console.log('🔄 Estado do CPF resetado');
    }

    /**
     * Trata input no CPF - reseta estado quando usuário digita
     */
    handleCPFInput() {
        const cpfAtual = this.view.getFieldValue('cpf');

        // Se tinha validação anterior e o CPF mudou, resetar
        if (this.clienteData.biometriaVerificada && cpfAtual.replace(/\D/g, '').length < 11) {
            this.resetCPFState();
        }
    }

    /**
     * Trata blur no CPF - verifica biometria (SEMPRE faz nova consulta)
     */
    async handleCPFBlur() {
        const cpf = this.view.getFieldValue('cpf');

        if (!Validators.cpf(cpf)) {
            return; // CPF incompleto, não fazer nada
        }

        // 🔒 VERIFICAR RATE LIMIT
        const cpfLimpo = cpf.replace(/\D/g, '');
        const agora = Date.now();

        // 1. Verificar intervalo mínimo entre consultas (anti-spam)
        if (this.rateLimiter.ultimaConsulta) {
            const tempoDecorrido = agora - this.rateLimiter.ultimaConsulta;
            if (tempoDecorrido < this.rateLimiter.intervaloMinimo) {
                const aguardar = Math.ceil((this.rateLimiter.intervaloMinimo - tempoDecorrido) / 1000);
                this.view.showFeedback('biometria', 'warning', `⚠️ Aguarde ${aguardar} segundo(s) antes de consultar novamente`);
                return;
            }
        }

        // 2. Verificar se não excedeu limite de CPFs diferentes
        if (!this.rateLimiter.cpfsConsultados.has(cpfLimpo)) {
            // É um CPF novo
            if (this.rateLimiter.cpfsConsultados.size >= this.rateLimiter.maxCPFsDiferentes) {
                this.view.showFeedback('biometria', 'error', '❌ Você atingiu o limite de consultas. Entre em contato conosco se precisar de ajuda.');
                console.warn('🚫 Rate limit atingido:', this.rateLimiter.cpfsConsultados.size, 'CPFs consultados');

                // Bloquear campo CPF
                const cpfInput = this.view.getElementById('cpf');
                if (cpfInput) {
                    cpfInput.disabled = true;
                    cpfInput.style.cursor = 'not-allowed';
                }

                // Mostrar modal com orientações
                this.view.showBlockModal();
                return;
            }

            // Adicionar CPF à lista de consultados
            this.rateLimiter.cpfsConsultados.add(cpfLimpo);
            console.log(`📝 CPF adicionado ao rate limiter (${this.rateLimiter.cpfsConsultados.size}/${this.rateLimiter.maxCPFsDiferentes})`);
        }

        // Atualizar timestamp da última consulta
        this.rateLimiter.ultimaConsulta = agora;

        // 🔄 SEMPRE resetar estado antes de fazer nova consulta
        // Isso garante que cada vez que o usuário sair do campo, faça consulta nova
        if (this.clienteData.biometriaVerificada) {
            console.log('🔄 CPF já foi validado antes, resetando para nova consulta...');
            this.resetCPFState();
        }

        try {
            this.view.showFeedback('biometria', 'loading', 'Verificando biometria...');

            // 🔒 BLOQUEAR campo de data de nascimento enquanto valida CPF
            const nascInput = this.view.getElementById('nascimento');
            if (nascInput) {
                nascInput.disabled = true;
                nascInput.style.cursor = 'not-allowed';
                nascInput.style.opacity = '0.6';
            }

            const resultado = await this.verificarBiometriaUseCase.execute(cpf);

            if (resultado.sucesso) {
                this.clienteData.biometriaVerificada = true;
                this.clienteData.temBiometria = resultado.temBiometria;

                if (resultado.temBiometria) {
                    // ✅ Tem biometria - tudo certo
                    this.view.showFeedback('biometria', 'success', `✅ ${resultado.mensagem}`);
                    this.view.hideCNHField();
                    this.clienteData.precisaCNH = false;

                    // 🔓 DESBLOQUEAR campo de data de nascimento
                    const nascInput = this.view.getElementById('nascimento');
                    if (nascInput) {
                        nascInput.disabled = false;
                        nascInput.style.cursor = 'text';
                        nascInput.style.opacity = '1';
                    }
                } else {
                    // ⚠️ Não tem biometria - mostrar popup de CNH
                    this.view.showFeedback('biometria', 'warning', `⚠️ ${resultado.mensagem}`);

                    // Mostrar popup perguntando sobre CNH
                    this.view.showCNHModal(
                        // Callback: Tem CNH
                        () => {
                            console.log('✅ Cliente possui CNH');
                            this.clienteData.precisaCNH = true;
                            this.view.showCNHField();
                            this.view.showFeedback('biometria', 'success', '✅ Prosseguir com validação por CNH');

                            // 🔓 DESBLOQUEAR campo de data de nascimento
                            const nascInput = this.view.getElementById('nascimento');
                            if (nascInput) {
                                nascInput.disabled = false;
                                nascInput.style.cursor = 'text';
                                nascInput.style.opacity = '1';
                            }
                        },
                        // Callback: Não tem CNH
                        () => {
                            console.log('❌ Cliente não possui CNH - bloqueado');

                            // Mostrar modal de bloqueio (com WhatsApp)
                            this.view.showBlockModal();

                            // Feedback de erro no campo
                            this.view.showFeedback('biometria', 'error', '❌ Não é possível continuar sem biometria ou CNH');

                            // NÃO limpar CPF - deixar usuário ver o que digitou
                            // NÃO resetar estado - manter feedback de erro visível
                        }
                    );
                }
            } else {
                this.view.showFeedback('biometria', 'error', `❌ ${resultado.erro}`);

                // 🔓 DESBLOQUEAR campo de data de nascimento mesmo em caso de erro
                const nascInput = this.view.getElementById('nascimento');
                if (nascInput) {
                    nascInput.disabled = false;
                    nascInput.style.cursor = 'text';
                    nascInput.style.opacity = '1';
                }
            }

        } catch (error) {
            console.error('❌ Step2Controller: Erro ao verificar biometria:', error);
            this.view.showFeedback('biometria', 'error', '❌ Erro ao verificar biometria');

            // 🔓 DESBLOQUEAR campo de data de nascimento mesmo em caso de exceção
            const nascInput = this.view.getElementById('nascimento');
            if (nascInput) {
                nascInput.disabled = false;
                nascInput.style.cursor = 'text';
                nascInput.style.opacity = '1';
            }
        }
    }

    /**
     * Trata blur na data nascimento - consulta RFB
     */
    async handleDataNascimentoBlur() {
        const cpf = this.view.getFieldValue('cpf');
        const dataNascimento = this.view.getFieldValue('nascimento');

        if (!Validators.cpf(cpf) || !Validators.data(dataNascimento)) {
            return; // Dados incompletos
        }

        // Verificar se passou pela validação de biometria
        if (!this.clienteData.biometriaVerificada) {
            this.view.showFeedback('consulta', 'warning', '⚠️ Primeiro valide o CPF');
            return;
        }

        try {
            this.view.showFeedback('consulta', 'loading', 'Consultando CPF na Receita Federal...');

            const resultado = await this.consultarCPFUseCase.execute(cpf, dataNascimento);

            if (resultado.sucesso && resultado.valido) {
                // ✅ Data de nascimento correta
                this.clienteData.consultaRFBValida = true;
                this.clienteData.nomeRFB = resultado.nome;
                this.clienteData.temBiometria = resultado.temBiometria;

                this.view.showFeedback('consulta', 'success', `✅ CPF válido - ${resultado.nome}`);
                this.view.showNomeField(resultado.nome);

                // 📊 Disparar evento GTM: CPF validado na RFB
                const formData = this.view.getFormData();
                gtmService.trackCPFValidated(
                    resultado.temBiometria || false,
                    formData.estado || 'N/A',
                    formData.cidade || 'N/A'
                );

                // 📊 Disparar evento GTM: Adicionar informações de envio
                gtmService.trackAddShippingInfo({
                    codigo: 'ecpf-a1',
                    nome: 'e-CPF A1 (1 ano)',
                    tipo: 'e-CPF',
                    preco: 5.00
                });

                // 📊 Enviar dados do usuário para Enhanced Conversions
                gtmService.setUserData({
                    email: formData.email,
                    telefone: formData.telefone,
                    cidade: formData.cidade,
                    estado: formData.estado
                });

                this.validateForm();

            } else {
                // ❌ Erro na validação (data errada ou outro erro)
                this.clienteData.consultaRFBValida = false;

                // Verificar se é erro de data de nascimento divergente (código 4)
                if (resultado.codigo === 4 || (resultado.mensagem && resultado.mensagem.includes('divergente'))) {
                    this.view.showFeedback('consulta', 'error', '❌ Data de nascimento não confere com a Receita Federal. Verifique e tente novamente.');
                } else {
                    // Outro tipo de erro
                    this.view.showFeedback('consulta', 'error', `❌ ${resultado.mensagem || resultado.erro}`);
                }

                this.view.hideNomeField();
                this.validateForm();
            }

        } catch (error) {
            console.error('❌ Step2Controller: Erro ao consultar CPF:', error);
            this.view.showFeedback('consulta', 'error', '❌ Erro ao consultar CPF. Tente novamente.');
        }
    }

    /**
     * Trata blur no CEP - busca endereço
     */
    async handleCEPBlur() {
        const cep = this.view.getFieldValue('cep');

        if (!Validators.cep(cep)) {
            return; // CEP incompleto
        }

        try {
            // Mostrar loading no campo CEP
            this.view.showFeedbackCEP('loading', 'Consultando CEP...');

            const resultado = await this.buscarCEPUseCase.execute(cep);

            if (resultado.sucesso) {
                // Sucesso - mostrar checkmark verde
                this.view.showFeedbackCEP('success', '✅ CEP encontrado');
                this.view.fillEndereco(resultado.endereco);
                this.validateForm();
                console.log('✅ Step2Controller: Endereço preenchido');
            } else {
                // Erro - mostrar X vermelho e habilitar preenchimento manual
                this.view.showFeedbackCEP('error', `❌ CEP não encontrado - preencha manualmente`);
                this.view.enableEstadoSelect();
                this.enableManualAddressFields();
            }

        } catch (error) {
            console.error('❌ Step2Controller: Erro ao buscar CEP:', error);
            this.view.showFeedbackCEP('error', '❌ Erro ao buscar CEP - preencha manualmente');
            this.view.enableEstadoSelect();
            this.enableManualAddressFields();
        }
    }

    /**
     * Habilita campos de endereço para preenchimento manual quando CEP falha
     */
    enableManualAddressFields() {
        const fields = ['endereco', 'bairro', 'cidade'];
        fields.forEach(fieldId => {
            const field = this.view.getElementById(fieldId);
            if (field) {
                field.removeAttribute('readonly');
                field.style.cursor = 'text';
                field.style.background = '';
            }
        });
        console.log('✅ Step2Controller: Campos de endereço habilitados para preenchimento manual');
    }

    /**
     * Valida formulário completo
     */
    validateForm() {
        if (!this.view) {
            return false;
        }

        const formData = this.view.getFormData();

        // Validações básicas
        let isValid =
            Validators.cpf(formData.cpf) &&
            Validators.data(formData.nascimento) &&
            Validators.required(formData.nome) &&
            Validators.cep(formData.cep) &&
            Validators.required(formData.endereco) &&
            Validators.required(formData.numero) &&
            Validators.required(formData.bairro) &&
            Validators.required(formData.cidade) &&
            Validators.required(formData.estado) &&
            Validators.email(formData.email) &&
            Validators.telefone(formData.telefone) &&
            this.clienteData.consultaRFBValida; // Deve ter validado na RFB

        // Se precisa de CNH, validar campo CNH (11 dígitos)
        if (this.clienteData.precisaCNH) {
            const cnhValida = formData.cnh && formData.cnh.replace(/\D/g, '').length === 11;
            isValid = isValid && cnhValida;
        }

        this.view.setButtonState(isValid);
        return isValid;
    }

    /**
     * Pode avançar para próximo step?
     */
    canProceed() {
        return this.validateForm();
    }

    /**
     * Gera protocolo (chamado ao clicar "Continuar")
     */
    async gerarProtocolo() {
        if (!this.canProceed()) {
            alert('Por favor, preencha todos os campos corretamente');
            return { sucesso: false };
        }

        try {
            const formData = this.view.getFormData();

            console.log('📝 Step2Controller: Gerando protocolo...');

            const resultado = await this.gerarProtocoloUseCase.execute(formData);

            if (resultado.sucesso) {
                // 📊 Disparar evento GTM: Protocolo gerado
                gtmService.trackProtocolGenerated(
                    resultado.protocolo.numero || '',
                    {
                        codigo: 'ecpf-a1',
                        nome: 'e-CPF A1 (1 ano)',
                        tipo: 'e-CPF',
                        preco: 5.00
                    }
                );

                console.log('✅ Step2Controller: Protocolo gerado:', resultado.protocolo);
                return resultado;
            } else {
                alert(`Erro ao gerar protocolo: ${resultado.erro}`);
                return resultado;
            }

        } catch (error) {
            console.error('❌ Step2Controller: Erro ao gerar protocolo:', error);
            alert('Erro ao gerar protocolo');
            return { sucesso: false };
        }
    }

    /**
     * Retorna dados do cliente
     */
    getClienteData() {
        const formData = this.view.getFormData();

        const endereco = new Endereco(
            formData.cep,
            formData.endereco,
            formData.numero,
            formData.complemento,
            formData.bairro,
            formData.cidade,
            formData.estado
        );

        const cliente = new Cliente(
            formData.cpf,
            formData.nome,
            formData.nascimento,
            formData.email,
            formData.telefone,
            endereco
        );

        // Adicionar dados RFB
        if (this.clienteData.nomeRFB) {
            cliente.setDadosRFB(this.clienteData.nomeRFB, this.clienteData.consultaRFBValida);
        }

        return cliente;
    }

    destroy() {
        this.view = null;
        this.clienteData = {};
    }
}
