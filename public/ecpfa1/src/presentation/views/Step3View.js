/**
 * 🎨 View: Step 3 - Dados do Pagador
 *
 * Renderiza formulário de dados do pagador (PF ou PJ)
 */
export class Step3View {
    constructor(containerElement) {
        this.container = containerElement;
        this.formContainer = null;
        this.tipoPessoa = 'fisica';
    }

    render() {
        // Encontrar o form-container dentro do step
        this.formContainer = this.container.querySelector('#form-container');

        if (!this.formContainer) {
            console.error('❌ Step3View: form-container não encontrado!');
            return;
        }

        // Injetar HTML apenas dentro do form-container (preserva botões)
        this.formContainer.innerHTML = this.getHTML();
        this.updateVisibility();
    }

    getHTML() {
        return `
            <!-- Seletor de Tipo de Pessoa -->
            <div class="form-section">
                <p class="section-description">Informe os dados de quem será responsável pelo pagamento</p>
                <div class="tipo-pessoa-selector">
                    <div class="radio-group">
                        <label class="radio-option active" data-tipo="fisica">
                            <input type="radio" name="tipoPessoa" value="fisica" checked>
                            <span class="radio-custom"></span>
                            <span class="radio-label">Pessoa Física</span>
                        </label>
                        <label class="radio-option" data-tipo="juridica">
                            <input type="radio" name="tipoPessoa" value="juridica">
                            <span class="radio-custom"></span>
                            <span class="radio-label">Pessoa Jurídica</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Dados Pessoa Física -->
            <div class="form-section" id="dados-fisica">
                <h3 class="section-title">Dados Pessoais</h3>
                <div class="form-row">
                    <div class="form-group field-medium">
                        <input type="tel" class="form-input" id="cpf-pagador" placeholder=" " maxlength="14" inputmode="numeric" required>
                        <label class="form-label" for="cpf-pagador">CPF</label>
                    </div>
                    <div class="form-group field-medium">
                        <input type="text" class="form-input" id="nome-pagador" placeholder=" " required>
                        <label class="form-label" for="nome-pagador">Nome Completo</label>
                    </div>
                </div>
            </div>

            <!-- Dados Pessoa Jurídica -->
            <div class="form-section" id="dados-juridica" style="display: none;">
                <h3 class="section-title">Dados da Empresa</h3>
                <div class="form-row">
                    <div class="form-group field-medium">
                        <input type="tel" class="form-input" id="cnpj" placeholder=" " maxlength="18" inputmode="numeric" required>
                        <label class="form-label" for="cnpj">CNPJ</label>
                    </div>
                    <div class="form-group field-medium">
                        <input type="text" class="form-input" id="razao-social" placeholder=" " required>
                        <label class="form-label" for="razao-social">Razão Social</label>
                    </div>
                </div>
            </div>

            <!-- Endereço -->
            <div class="form-section">
                <h3 class="section-title">Endereço</h3>
                <div class="form-group field-small">
                    <input type="tel" class="form-input" id="cep-pagador" placeholder=" " maxlength="9" inputmode="numeric" required>
                    <label class="form-label" for="cep-pagador">CEP</label>
                </div>
                <div class="form-row">
                    <div class="form-group field-large">
                        <input type="text" class="form-input" id="endereco-pagador" placeholder=" " required>
                        <label class="form-label" for="endereco-pagador">Endereço</label>
                    </div>
                    <div class="form-group field-small">
                        <input type="tel" class="form-input" id="numero-pagador" placeholder=" " inputmode="numeric" required>
                        <label class="form-label" for="numero-pagador">Número</label>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group field-large">
                        <input type="text" class="form-input" id="bairro-pagador" placeholder=" " required>
                        <label class="form-label" for="bairro-pagador">Bairro</label>
                    </div>
                    <div class="form-group field-small">
                        <input type="text" class="form-input" id="complemento-pagador" placeholder=" ">
                        <label class="form-label" for="complemento-pagador">Complemento</label>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group field-medium">
                        <input type="text" class="form-input" id="cidade-pagador" placeholder=" " required>
                        <label class="form-label" for="cidade-pagador">Cidade</label>
                    </div>
                    <div class="form-group field-medium">
                        <input type="text" class="form-input" id="estado-pagador" placeholder=" " readonly required>
                        <label class="form-label" for="estado-pagador">Estado</label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Obtém elemento por ID
     */
    getElementById(id) {
        return this.container.querySelector(`#${id}`);
    }

    /**
     * Obtém valor de um campo
     */
    getFieldValue(fieldId) {
        const field = this.getElementById(fieldId);
        return field ? field.value.trim() : '';
    }

    /**
     * Define valor de um campo
     */
    setFieldValue(fieldId, value) {
        const field = this.getElementById(fieldId);
        if (field) {
            field.value = value;
        }
    }

    /**
     * Preenche endereço a partir do CEP
     */
    fillEndereco(endereco) {
        this.setFieldValue('endereco-pagador', endereco.logradouro);
        this.setFieldValue('bairro-pagador', endereco.bairro);
        this.setFieldValue('cidade-pagador', endereco.cidade);
        this.setFieldValue('estado-pagador', endereco.estado);

        // Focar no número
        const numeroInput = this.getElementById('numero-pagador');
        if (numeroInput) {
            numeroInput.focus();
        }
    }

    /**
     * Alterna tipo de pessoa (física/jurídica)
     */
    switchTipoPessoa(tipo) {
        this.tipoPessoa = tipo;

        // Atualizar radio buttons visuais
        const radioOptions = this.container.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.classList.remove('active');
        });
        const selectedOption = this.container.querySelector(`[data-tipo="${tipo}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }

        // Atualizar input radio
        const radioInput = this.container.querySelector(`input[value="${tipo}"]`);
        if (radioInput) {
            radioInput.checked = true;
        }

        this.updateVisibility();
    }

    /**
     * Atualiza visibilidade dos campos PF/PJ
     */
    updateVisibility() {
        const dadosFisica = this.getElementById('dados-fisica');
        const dadosJuridica = this.getElementById('dados-juridica');

        if (this.tipoPessoa === 'fisica') {
            if (dadosFisica) dadosFisica.style.display = 'block';
            if (dadosJuridica) dadosJuridica.style.display = 'none';
        } else {
            if (dadosFisica) dadosFisica.style.display = 'none';
            if (dadosJuridica) dadosJuridica.style.display = 'block';
        }
    }

    /**
     * Obtém dados do formulário
     */
    getFormData() {
        const baseData = {
            tipoPessoa: this.tipoPessoa,
            cep: this.getFieldValue('cep-pagador'),
            endereco: this.getFieldValue('endereco-pagador'),
            numero: this.getFieldValue('numero-pagador'),
            complemento: this.getFieldValue('complemento-pagador'),
            bairro: this.getFieldValue('bairro-pagador'),
            cidade: this.getFieldValue('cidade-pagador'),
            estado: this.getFieldValue('estado-pagador')
        };

        if (this.tipoPessoa === 'fisica') {
            return {
                ...baseData,
                cpf: this.getFieldValue('cpf-pagador'),
                nome: this.getFieldValue('nome-pagador')
            };
        } else {
            return {
                ...baseData,
                cnpj: this.getFieldValue('cnpj'),
                razaoSocial: this.getFieldValue('razao-social')
            };
        }
    }

    /**
     * Habilita/desabilita botão Continuar
     */
    setButtonState(enabled) {
        const btnNext = document.getElementById('btn-step3-next');
        if (btnNext) {
            btnNext.disabled = !enabled;
        }
    }
}
