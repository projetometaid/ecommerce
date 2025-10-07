/**
 * 🎨 View: Step 2 - Dados do Cliente
 *
 * Responsável por renderizar formulário do Step 2
 */

import { InputMasks } from '../../shared/utils/InputMasks.js';

export class Step2View {
    constructor(containerElement) {
        this.container = containerElement;
        this.formContainer = null;
    }

    /**
     * Renderiza formulário completo
     */
    render() {
        this.formContainer = this.container.querySelector('#form-dados');

        if (!this.formContainer) {
            console.error('❌ Step2View: #form-dados não encontrado');
            return;
        }

        this.formContainer.innerHTML = this.getFormHTML();
        this.applyMasks();
    }

    /**
     * Retorna HTML do formulário
     */
    getFormHTML() {
        return `
            <!-- Consulta Prévia -->
            <div class="form-section">
                <h3 class="section-title">Consulta Prévia</h3>
                <div class="form-row">
                    <div class="form-group field-medium">
                        <input type="tel" class="form-input" id="cpf" placeholder=" " maxlength="14" inputmode="numeric" required>
                        <label class="form-label" for="cpf">CPF</label>
                        <div id="feedback-biometria"></div>
                    </div>
                    <div class="form-group field-medium">
                        <input type="text" class="form-input" id="nascimento" placeholder=" " maxlength="10" required>
                        <label class="form-label" for="nascimento">Data de nascimento</label>
                        <div id="feedback-consulta"></div>
                    </div>
                </div>

                <!-- Campo Nome (aparece após consulta RFB) -->
                <div class="form-row" id="nome-container" style="display: none;">
                    <div class="form-group field-full">
                        <input type="text" class="form-input" id="nome" placeholder=" " readonly>
                        <label class="form-label" for="nome">Nome Completo</label>
                    </div>
                </div>
            </div>

            <!-- Endereço -->
            <div class="form-section">
                <h3 class="section-title">Endereço</h3>
                <div class="form-group field-small">
                    <input type="tel" class="form-input" id="cep" placeholder=" " maxlength="9" inputmode="numeric" required>
                    <label class="form-label" for="cep">CEP</label>
                </div>
                <div class="form-row">
                    <div class="form-group field-large">
                        <input type="text" class="form-input" id="endereco" placeholder=" " required>
                        <label class="form-label" for="endereco">Endereço</label>
                    </div>
                    <div class="form-group field-small">
                        <input type="tel" class="form-input" id="numero" placeholder=" " inputmode="numeric" required>
                        <label class="form-label" for="numero">Número</label>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group field-large">
                        <input type="text" class="form-input" id="bairro" placeholder=" " required>
                        <label class="form-label" for="bairro">Bairro</label>
                    </div>
                    <div class="form-group field-small">
                        <input type="text" class="form-input" id="complemento" placeholder=" ">
                        <label class="form-label" for="complemento">Complemento</label>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group field-large">
                        <input type="text" class="form-input" id="cidade" placeholder=" " required>
                        <label class="form-label" for="cidade">Cidade</label>
                    </div>
                    <div class="form-group field-small">
                        <input type="text" class="form-input" id="estado" placeholder=" " readonly required>
                        <label class="form-label" for="estado">Estado</label>
                    </div>
                </div>
            </div>

            <!-- Contato -->
            <div class="form-section">
                <h3 class="section-title">Contato</h3>
                <div class="form-row">
                    <div class="form-group field-medium">
                        <input type="email" class="form-input" id="email" placeholder=" " required>
                        <label class="form-label" for="email">E-mail</label>
                    </div>
                    <div class="form-group field-medium">
                        <input type="tel" class="form-input" id="telefone" placeholder=" " maxlength="15" inputmode="numeric" required>
                        <label class="form-label" for="telefone">Telefone</label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Aplica máscaras nos inputs
     */
    applyMasks() {
        InputMasks.bindToElement(this.getElementById('cpf'), 'cpf');
        InputMasks.bindToElement(this.getElementById('nascimento'), 'data');
        InputMasks.bindToElement(this.getElementById('cep'), 'cep');
        InputMasks.bindToElement(this.getElementById('telefone'), 'telefone');
    }

    /**
     * Mostra feedback (biometria ou consulta)
     */
    showFeedback(tipo, status, mensagem) {
        const feedbackId = tipo === 'biometria' ? 'feedback-biometria' : 'feedback-consulta';
        const feedbackEl = this.getElementById(feedbackId);

        if (!feedbackEl) return;

        const colors = {
            loading: { bg: '#e7f3ff', color: '#0066cc', border: '#b3d9ff' },
            success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
            warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
            error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' }
        };

        const color = colors[status] || colors.error;

        feedbackEl.innerHTML = `
            <div style="margin-top: 8px; padding: 8px 12px; border-radius: 4px; font-size: 12px; font-weight: 500;
                        background: ${color.bg}; color: ${color.color}; border: 1px solid ${color.border};">
                ${mensagem}
            </div>
        `;

        if (status !== 'loading') {
            setTimeout(() => feedbackEl.innerHTML = '', status === 'error' ? 8000 : 5000);
        }
    }

    /**
     * Mostra campo nome
     */
    showNomeField(nome) {
        const container = this.getElementById('nome-container');
        const input = this.getElementById('nome');

        if (container && input && nome) {
            input.value = nome;
            container.style.display = 'block';
            container.style.opacity = '0';
            container.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                container.style.transition = 'all 0.3s ease';
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    /**
     * Esconde campo nome
     */
    hideNomeField() {
        const container = this.getElementById('nome-container');
        const input = this.getElementById('nome');

        if (container && input) {
            container.style.display = 'none';
            input.value = '';
        }
    }

    /**
     * Preenche endereço com dados do CEP
     */
    fillEndereco(endereco) {
        this.setFieldValue('endereco', endereco.logradouro);
        this.setFieldValue('bairro', endereco.bairro);
        this.setFieldValue('cidade', endereco.cidade);
        this.setFieldValue('estado', endereco.estado);
        this.setFieldValue('complemento', endereco.complemento);
    }

    /**
     * Define valor de um campo
     */
    setFieldValue(fieldId, value) {
        const field = this.getElementById(fieldId);
        if (field) field.value = value || '';
    }

    /**
     * Obtém valor de um campo
     */
    getFieldValue(fieldId) {
        const field = this.getElementById(fieldId);
        return field ? field.value : '';
    }

    /**
     * Obtém todos os dados do formulário
     */
    getFormData() {
        return {
            cpf: this.getFieldValue('cpf'),
            nascimento: this.getFieldValue('nascimento'),
            nome: this.getFieldValue('nome'),
            cep: this.getFieldValue('cep'),
            endereco: this.getFieldValue('endereco'),
            numero: this.getFieldValue('numero'),
            complemento: this.getFieldValue('complemento'),
            bairro: this.getFieldValue('bairro'),
            cidade: this.getFieldValue('cidade'),
            estado: this.getFieldValue('estado'),
            email: this.getFieldValue('email'),
            telefone: this.getFieldValue('telefone')
        };
    }

    /**
     * Habilita/desabilita botão continuar
     */
    setButtonState(enabled) {
        const btn = this.container.querySelector('#btn-step2-next');
        if (btn) btn.disabled = !enabled;
    }

    /**
     * Helper para getElementById no contexto do container
     */
    getElementById(id) {
        return this.container.querySelector(`#${id}`);
    }
}
