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
            consultaRFBValida: false,
            nomeRFB: null
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
    }

    /**
     * Trata blur no CPF - verifica biometria
     */
    async handleCPFBlur() {
        const cpf = this.view.getFieldValue('cpf');

        if (!Validators.cpf(cpf)) {
            return; // CPF incompleto, não fazer nada
        }

        try {
            this.view.showFeedback('biometria', 'loading', 'Verificando biometria...');

            const resultado = await this.verificarBiometriaUseCase.execute(cpf);

            if (resultado.sucesso) {
                this.clienteData.biometriaVerificada = true;

                const icon = resultado.temBiometria ? '✅' : '⚠️';
                const status = resultado.temBiometria ? 'success' : 'warning';

                this.view.showFeedback('biometria', status, `${icon} ${resultado.mensagem}`);
            } else {
                this.view.showFeedback('biometria', 'error', `❌ ${resultado.erro}`);
            }

        } catch (error) {
            console.error('❌ Step2Controller: Erro ao verificar biometria:', error);
            this.view.showFeedback('biometria', 'error', '❌ Erro ao verificar biometria');
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

        try {
            this.view.showFeedback('consulta', 'loading', 'Consultando CPF na Receita Federal...');

            const resultado = await this.consultarCPFUseCase.execute(cpf, dataNascimento);

            if (resultado.sucesso && resultado.valido) {
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
                    preco: 109.00
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
                this.clienteData.consultaRFBValida = false;
                this.view.showFeedback('consulta', 'error', `❌ ${resultado.mensagem || resultado.erro}`);
                this.view.hideNomeField();
                this.validateForm();
            }

        } catch (error) {
            console.error('❌ Step2Controller: Erro ao consultar CPF:', error);
            this.view.showFeedback('consulta', 'error', '❌ Erro ao consultar CPF');
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
            const resultado = await this.buscarCEPUseCase.execute(cep);

            if (resultado.sucesso) {
                this.view.fillEndereco(resultado.endereco);
                this.validateForm();
                console.log('✅ Step2Controller: Endereço preenchido');
            } else {
                alert(`CEP não encontrado: ${resultado.erro}`);
            }

        } catch (error) {
            console.error('❌ Step2Controller: Erro ao buscar CEP:', error);
            alert('Erro ao buscar CEP');
        }
    }

    /**
     * Valida formulário completo
     */
    validateForm() {
        if (!this.view) {
            return false;
        }

        const formData = this.view.getFormData();

        const isValid =
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
                        preco: 109.00
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
