/**
 * 🎮 Controller: Step 3 - Dados do Pagador
 *
 * Orquestra View e Use Cases do Step 3
 */

import { Step3View } from '../views/Step3View.js';
import { Validators } from '../validators/Validators.js';
import { InputMasks } from '../../shared/utils/InputMasks.js';
import { gtmService } from '../../shared/utils/GTMService.js';

export class Step3Controller {
    constructor(buscarCEPUseCase) {
        this.buscarCEPUseCase = buscarCEPUseCase;
        this.view = null;
        this.tipoPessoa = 'fisica';
    }

    async init(containerElement) {
        console.log('🚀 Step3Controller: Inicializando...');

        this.view = new Step3View(containerElement);
        this.view.render();

        this.setupEvents();

        console.log('✅ Step3Controller: Inicializado');
    }

    setupEvents() {
        // Seletor de tipo de pessoa
        const radioOptions = this.view.container.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.addEventListener('click', () => {
                const tipo = option.dataset.tipo;
                this.handleTipoPessoaChange(tipo);
            });
        });

        // Máscaras de input
        this.setupInputMasks();

        // CEP - buscar endereço
        const cepInput = this.view.getElementById('cep-pagador');
        if (cepInput) {
            cepInput.addEventListener('blur', () => this.handleCEPBlur());
        }

        // Validação em tempo real
        const inputs = this.view.container.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateForm());
            input.addEventListener('blur', () => this.validateForm());
        });
    }

    setupInputMasks() {
        InputMasks.bindToElement(this.view.getElementById('cpf-pagador'), 'cpf');
        InputMasks.bindToElement(this.view.getElementById('cnpj'), 'cnpj');
        InputMasks.bindToElement(this.view.getElementById('cep-pagador'), 'cep');
    }

    /**
     * Trata mudança de tipo de pessoa
     */
    handleTipoPessoaChange(tipo) {
        this.tipoPessoa = tipo;
        this.view.switchTipoPessoa(tipo);

        // 📊 Disparar evento GTM: Tipo de pagador selecionado
        gtmService.trackSelectPayer(false, tipo);

        this.validateForm();
    }

    /**
     * Trata blur no CEP - busca endereço
     */
    async handleCEPBlur() {
        const cep = this.view.getFieldValue('cep-pagador');

        if (!Validators.cep(cep)) {
            return; // CEP incompleto
        }

        try {
            const resultado = await this.buscarCEPUseCase.execute(cep);

            if (resultado.sucesso) {
                this.view.fillEndereco(resultado.endereco);
                this.validateForm();
                console.log('✅ Step3Controller: Endereço preenchido');
            } else {
                alert(`CEP não encontrado: ${resultado.erro}`);
            }

        } catch (error) {
            console.error('❌ Step3Controller: Erro ao buscar CEP:', error);
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
        let isValid = false;

        if (this.tipoPessoa === 'fisica') {
            isValid =
                Validators.cpf(formData.cpf) &&
                Validators.required(formData.nome) &&
                Validators.cep(formData.cep) &&
                Validators.required(formData.endereco) &&
                Validators.required(formData.numero) &&
                Validators.required(formData.bairro) &&
                Validators.required(formData.cidade) &&
                Validators.required(formData.estado);
        } else {
            isValid =
                Validators.cnpj(formData.cnpj) &&
                Validators.required(formData.razaoSocial) &&
                Validators.cep(formData.cep) &&
                Validators.required(formData.endereco) &&
                Validators.required(formData.numero) &&
                Validators.required(formData.bairro) &&
                Validators.required(formData.cidade) &&
                Validators.required(formData.estado);
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
     * Retorna dados do pagador
     */
    getPagadorData() {
        const formData = this.view.getFormData();

        return {
            usarDadosUsuario: false,
            tipoPessoa: this.tipoPessoa,
            dados: formData
        };
    }

    destroy() {
        this.view = null;
    }
}
