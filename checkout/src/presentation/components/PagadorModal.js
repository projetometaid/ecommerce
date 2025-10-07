/**
 * 🎭 Component: Modal de Confirmação do Pagador
 *
 * Exibe modal após geração do protocolo perguntando
 * se o pagador é a mesma pessoa ou outra
 */
export class PagadorModal {
    constructor() {
        this.modal = null;
        this.onConfirm = null;
        this.onCancel = null;
    }

    /**
     * Exibe o modal
     *
     * @param {Object} dadosUsuario - Dados do titular do certificado
     * @param {Function} onConfirm - Callback quando usuário escolher (recebe true/false)
     * @param {Function} onCancel - Callback quando cancelar (opcional)
     * @param {string} protocolo - Número do protocolo gerado
     */
    show(dadosUsuario, onConfirm, onCancel = null, protocolo = null) {
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;

        this.createModal(dadosUsuario, protocolo);
        this.bindEvents();
        document.body.appendChild(this.modal);

        // Animar entrada
        setTimeout(() => {
            this.modal.classList.add('active');
        }, 10);
    }

    createModal(dados, protocolo = null) {
        this.modal = document.createElement('div');
        this.modal.className = 'modal-overlay';

        const protocoloSection = protocolo ? `
            <div class="protocolo-sucesso">
                <div class="protocolo-icon">✅</div>
                <p>Protocolo de atendimento gerado com sucesso!</p>
                <div class="protocolo-number">Protocolo: ${protocolo}</div>
            </div>
        ` : '';

        this.modal.innerHTML = `
            <div class="modal-content">
                ${protocoloSection}

                <div class="modal-header">
                    <h3>Dados do Pagador PIX</h3>
                    <p>Confirme quem será o responsável pelo pagamento</p>
                </div>

                <div class="modal-body">
                    <div class="dados-preview">
                        <h4>Dados informados:</h4>
                        <div class="dados-item">
                            <span class="label">Nome:</span>
                            <span class="value">${dados.nome || 'Não informado'}</span>
                        </div>
                        <div class="dados-item">
                            <span class="label">CPF:</span>
                            <span class="value">${dados.cpf || 'Não informado'}</span>
                        </div>
                        <div class="dados-item">
                            <span class="label">E-mail:</span>
                            <span class="value">${dados.email || 'Não informado'}</span>
                        </div>
                        <div class="dados-item">
                            <span class="label">Telefone:</span>
                            <span class="value">${dados.telefone || 'Não informado'}</span>
                        </div>
                    </div>

                    <div class="pergunta">
                        <p><strong>O PIX deve ser gerado para estes dados?</strong></p>
                    </div>

                    <div class="aviso-obrigatorio">
                        <p>⚠️ Você deve escolher uma das opções abaixo para continuar</p>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn-secondary" id="btn-outro-pagador">
                        Informar outro pagador
                    </button>
                    <button type="button" class="btn-primary" id="btn-mesmo-pagador">
                        Sim, gerar PIX!
                    </button>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const btnMesmoPagador = this.modal.querySelector('#btn-mesmo-pagador');
        const btnOutroPagador = this.modal.querySelector('#btn-outro-pagador');

        btnMesmoPagador.addEventListener('click', () => {
            this.close();
            if (this.onConfirm) this.onConfirm(true); // Usar mesmos dados
        });

        btnOutroPagador.addEventListener('click', () => {
            this.close();
            if (this.onConfirm) this.onConfirm(false); // Informar outros dados
        });

        // Usuário DEVE escolher uma opção - não pode fechar sem escolher
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('active');
            setTimeout(() => {
                if (this.modal && this.modal.parentNode) {
                    this.modal.parentNode.removeChild(this.modal);
                }
                this.modal = null;
            }, 300);
        }
    }
}
