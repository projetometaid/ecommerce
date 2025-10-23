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
                        <input type="tel" class="form-input" id="nascimento" placeholder=" " maxlength="10" inputmode="numeric" required>
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

                <!-- Campo CNH (aparece quando não tem biometria) -->
                <div class="form-row" id="cnh-container" style="display: none;">
                    <div class="form-group field-medium">
                        <input type="tel" class="form-input" id="cnh" placeholder=" " maxlength="11" inputmode="numeric" required>
                        <label class="form-label" for="cnh">Número da CNH *</label>
                    </div>
                    <div class="form-group field-medium" style="display: flex; align-items: flex-end;">
                        <small style="color: #666; font-size: 0.85em; padding-bottom: 8px;">Digite apenas os 11 números da CNH</small>
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
     * Mostra feedback INLINE no campo (melhor UX, sem scroll)
     */
    showFeedback(tipo, status, mensagem) {
        const inputId = tipo === 'biometria' ? 'cpf' : 'nascimento';
        const inputEl = this.getElementById(inputId);
        const formGroup = inputEl?.closest('.form-group');

        if (!inputEl || !formGroup) return;

        // Remover estados anteriores
        formGroup.classList.remove('input-loading', 'input-success', 'input-warning', 'input-error');

        // Remover ícones anteriores
        const oldIcon = formGroup.querySelector('.input-status-icon');
        if (oldIcon) oldIcon.remove();

        // Ícones SVG inline para cada estado
        const icons = {
            loading: `<svg class="spinner" width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#0066cc" stroke-width="5" stroke-dasharray="31.4 31.4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg>`,
            success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#28a745"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
            warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#ffc107"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
            error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#dc3545"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`
        };

        // Adicionar classe de estado (para bordas coloridas)
        formGroup.classList.add(`input-${status}`);

        // Criar e adicionar ícone inline
        const iconEl = document.createElement('span');
        iconEl.className = 'input-status-icon';
        iconEl.innerHTML = icons[status] || '';
        iconEl.title = mensagem; // Tooltip com mensagem completa
        formGroup.appendChild(iconEl);

        // Auto-remover após alguns segundos (exceto loading)
        if (status !== 'loading') {
            setTimeout(() => {
                formGroup.classList.remove(`input-${status}`);
                iconEl.remove();
            }, status === 'error' ? 8000 : 5000);
        }
    }

    /**
     * Mostra feedback INLINE no campo CEP
     */
    showFeedbackCEP(status, mensagem) {
        const inputEl = this.getElementById('cep');
        const formGroup = inputEl?.closest('.form-group');

        if (!inputEl || !formGroup) return;

        // Remover estados anteriores
        formGroup.classList.remove('input-loading', 'input-success', 'input-warning', 'input-error');

        // Remover ícones anteriores
        const oldIcon = formGroup.querySelector('.input-status-icon');
        if (oldIcon) oldIcon.remove();

        // Ícones SVG inline para cada estado
        const icons = {
            loading: `<svg class="spinner" width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#0066cc" stroke-width="5" stroke-dasharray="31.4 31.4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg>`,
            success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#28a745"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
            warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#ffc107"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
            error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#dc3545"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`
        };

        // Adicionar classe de estado (para bordas coloridas)
        formGroup.classList.add(`input-${status}`);

        // Criar e adicionar ícone inline
        const iconEl = document.createElement('span');
        iconEl.className = 'input-status-icon';
        iconEl.innerHTML = icons[status] || '';
        iconEl.title = mensagem; // Tooltip com mensagem completa
        formGroup.appendChild(iconEl);

        // Auto-remover após alguns segundos (exceto loading)
        if (status !== 'loading') {
            setTimeout(() => {
                formGroup.classList.remove(`input-${status}`);
                iconEl.remove();
            }, status === 'error' ? 5000 : 3000);
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
     * Mostra campo CNH (quando não tem biometria)
     */
    showCNHField() {
        const container = this.getElementById('cnh-container');
        if (container) {
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
     * Esconde campo CNH
     */
    hideCNHField() {
        const container = this.getElementById('cnh-container');
        const input = this.getElementById('cnh');

        if (container && input) {
            container.style.display = 'none';
            input.value = '';
        }
    }

    /**
     * Mostra popup de confirmação de CNH
     */
    showCNHModal(onConfirm, onReject) {
        // Criar overlay
        const overlay = document.createElement('div');
        overlay.id = 'cnh-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

        // Criar modal
        const modal = document.createElement('div');
        modal.id = 'cnh-modal';
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 32px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease;
        `;

        modal.innerHTML = `
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
            <div style="text-align: center;">
                <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: #fff3cd; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#ffc107">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                </div>
                <h2 style="margin: 0 0 16px; font-size: 1.5em; color: #333;">Biometria não cadastrada</h2>
                <p style="margin: 0 0 24px; color: #666; line-height: 1.6; font-size: 1.05em;">
                    Você não possui biometria cadastrada no PSBio e só poderá seguir se tiver CNH para validação no momento do atendimento.
                </p>
                <p style="margin: 0 0 24px; font-weight: 600; font-size: 1.1em; color: #333;">
                    Você possui CNH?
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="btn-cnh-sim" style="flex: 1; padding: 14px 24px; background: #28a745; color: white; border: none; border-radius: 8px; font-size: 1em; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                        Sim, tenho CNH
                    </button>
                    <button id="btn-cnh-nao" style="flex: 1; padding: 14px 24px; background: #dc3545; color: white; border: none; border-radius: 8px; font-size: 1em; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                        Não tenho CNH
                    </button>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Animações hover
        const btnSim = modal.querySelector('#btn-cnh-sim');
        const btnNao = modal.querySelector('#btn-cnh-nao');

        btnSim.addEventListener('mouseenter', () => {
            btnSim.style.background = '#218838';
            btnSim.style.transform = 'translateY(-2px)';
        });
        btnSim.addEventListener('mouseleave', () => {
            btnSim.style.background = '#28a745';
            btnSim.style.transform = 'translateY(0)';
        });

        btnNao.addEventListener('mouseenter', () => {
            btnNao.style.background = '#c82333';
            btnNao.style.transform = 'translateY(-2px)';
        });
        btnNao.addEventListener('mouseleave', () => {
            btnNao.style.background = '#dc3545';
            btnNao.style.transform = 'translateY(0)';
        });

        // Eventos
        btnSim.addEventListener('click', () => {
            overlay.remove();
            onConfirm();
        });

        btnNao.addEventListener('click', () => {
            overlay.remove();
            onReject();
        });
    }

    /**
     * Mostra modal de bloqueio (quando não tem CNH)
     */
    showBlockModal() {
        // Criar overlay
        const overlay = document.createElement('div');
        overlay.id = 'block-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            animation: fadeIn 0.3s ease;
        `;

        // Criar modal
        const modal = document.createElement('div');
        modal.id = 'block-modal';
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 32px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease;
        `;

        modal.innerHTML = `
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
            <div style="text-align: center;">
                <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: #f8d7da; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#dc3545">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                </div>
                <h2 style="margin: 0 0 16px; font-size: 1.5em; color: #333;">Não é possível continuar</h2>
                <p style="margin: 0 0 24px; color: #666; line-height: 1.6; font-size: 1.05em;">
                    Infelizmente não poderá seguir nesse modelo. Se desejar, fale com um de nossos especialistas.
                </p>
                <a href="https://wa.me/551940422204?text=Ol%C3%A1%2C%20vim%20atrav%C3%A9s%20do%20site%20www.certificadodigital.br.com%2C%20tentei%20comprar%20um%20certificado%20mas%20tive%20problemas%20na%20quest%C3%A3o%20da%20CNH%2C%20pode%20me%20ajudar%3F" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; background: #25D366; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1em; transition: all 0.2s;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Dúvidas na compra
                </a>
                <button id="btn-block-fechar" style="margin-top: 16px; width: 100%; padding: 12px; background: #f0f0f0; color: #333; border: none; border-radius: 8px; font-size: 1em; cursor: pointer; transition: all 0.2s;">
                    Fechar
                </button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Animação hover do botão WhatsApp
        const btnWhatsApp = modal.querySelector('a[href*="wa.me"]');
        btnWhatsApp.addEventListener('mouseenter', () => {
            btnWhatsApp.style.background = '#128C7E';
            btnWhatsApp.style.transform = 'translateY(-2px)';
        });
        btnWhatsApp.addEventListener('mouseleave', () => {
            btnWhatsApp.style.background = '#25D366';
            btnWhatsApp.style.transform = 'translateY(0)';
        });

        // Evento fechar apenas pelo botão
        const btnFechar = modal.querySelector('#btn-block-fechar');
        btnFechar.addEventListener('click', () => {
            overlay.remove();
        });

        // NÃO fechar ao clicar fora - forçar usuário a ler a mensagem
        // e decidir se quer clicar no WhatsApp ou fechar
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
     * Habilita campo Estado como select quando CEP falha
     */
    enableEstadoSelect() {
        const estadoField = this.getElementById('estado');
        if (!estadoField) return;

        const formGroup = estadoField.closest('.form-group');
        if (!formGroup) return;

        // Lista de estados brasileiros
        const estados = [
            { sigla: '', nome: 'Selecione' },
            { sigla: 'AC', nome: 'Acre' },
            { sigla: 'AL', nome: 'Alagoas' },
            { sigla: 'AP', nome: 'Amapá' },
            { sigla: 'AM', nome: 'Amazonas' },
            { sigla: 'BA', nome: 'Bahia' },
            { sigla: 'CE', nome: 'Ceará' },
            { sigla: 'DF', nome: 'Distrito Federal' },
            { sigla: 'ES', nome: 'Espírito Santo' },
            { sigla: 'GO', nome: 'Goiás' },
            { sigla: 'MA', nome: 'Maranhão' },
            { sigla: 'MT', nome: 'Mato Grosso' },
            { sigla: 'MS', nome: 'Mato Grosso do Sul' },
            { sigla: 'MG', nome: 'Minas Gerais' },
            { sigla: 'PA', nome: 'Pará' },
            { sigla: 'PB', nome: 'Paraíba' },
            { sigla: 'PR', nome: 'Paraná' },
            { sigla: 'PE', nome: 'Pernambuco' },
            { sigla: 'PI', nome: 'Piauí' },
            { sigla: 'RJ', nome: 'Rio de Janeiro' },
            { sigla: 'RN', nome: 'Rio Grande do Norte' },
            { sigla: 'RS', nome: 'Rio Grande do Sul' },
            { sigla: 'RO', nome: 'Rondônia' },
            { sigla: 'RR', nome: 'Roraima' },
            { sigla: 'SC', nome: 'Santa Catarina' },
            { sigla: 'SP', nome: 'São Paulo' },
            { sigla: 'SE', nome: 'Sergipe' },
            { sigla: 'TO', nome: 'Tocantins' }
        ];

        // Criar select
        const select = document.createElement('select');
        select.id = 'estado';
        select.className = 'form-input';
        select.required = true;

        // Adicionar options
        estados.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado.sigla;
            option.textContent = estado.sigla ? `${estado.sigla} - ${estado.nome}` : estado.nome;
            select.appendChild(option);
        });

        // Substituir input por select
        estadoField.replaceWith(select);

        // Disparar evento customizado para informar que o select foi criado
        const event = new CustomEvent('estadoSelectCreated', { detail: { selectElement: select } });
        document.dispatchEvent(event);

        console.log('✅ Step2View: Campo Estado habilitado como select');
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
            cnh: this.getFieldValue('cnh'),
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
