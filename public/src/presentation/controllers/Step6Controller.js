/**
 * 🎮 Controller: Step 6 - Upload de Documentos (Hope Integration)
 *
 * Gerencia a tela de sucesso pós-pagamento e link de upload de documentos
 */

export class Step6Controller {
    constructor(checkoutData, uploadUrl) {
        this.checkoutData = checkoutData;
        this.uploadUrl = uploadUrl;
    }

    /**
     * Inicializa o step
     */
    async init(containerElement) {
        console.log('🚀 Step6Controller: Inicializando');
        console.log('📎 Upload URL:', this.uploadUrl);

        this.container = containerElement;

        // Renderizar conteúdo
        this.render();

        // Configurar eventos
        this.setupEvents();

        console.log('✅ Step6Controller: Inicializado');
    }

    /**
     * Renderiza o conteúdo do Step 6
     */
    render() {
        // Obter protocolo, horário e nome do titular do checkoutData
        const protocolo = this.checkoutData?.protocolo || 'N/A';
        const horario = this.checkoutData?.horario;
        const dataHorario = horario
            ? `${horario.date.toLocaleDateString('pt-BR')} às ${horario.time}`
            : 'Data não informada';
        const nomeTitular = this.checkoutData?.cliente?.nome || 'Não informado';

        // Adicionar seção de upload de documentos (verificar se já não existe)
        const confirmacaoContainer = this.container.querySelector('.confirmacao-container');
        if (confirmacaoContainer && this.uploadUrl) {
            // Verificar se já existe a seção de upload
            const existingUpload = confirmacaoContainer.querySelector('.upload-section');
            if (existingUpload) {
                console.log('ℹ️ Seção de upload já existe, pulando criação');
                return;
            }

            const uploadSection = document.createElement('div');
            uploadSection.className = 'upload-section';
            uploadSection.innerHTML = `
                <div class="upload-info">
                    <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 8px 10px; margin-bottom: 8px;">
                        <p style="margin: 0 0 3px 0; font-size: 12px; color: #495057; line-height: 1.3;">
                            <strong>Protocolo:</strong> ${protocolo}
                        </p>
                        <p style="margin: 0 0 3px 0; font-size: 12px; color: #495057; line-height: 1.3;">
                            <strong>Dia e hora do atendimento:</strong> ${dataHorario}
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #495057; line-height: 1.3;">
                            <strong>Titular do Certificado:</strong> ${nomeTitular}
                        </p>
                    </div>

                    <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 5px; padding: 8px 10px; margin-bottom: 10px;">
                        <p style="margin: 0 0 4px 0; font-size: 11px; line-height: 1.3; color: #004085;">
                            No dia do seu agendamento, entraremos em contato pelo WhatsApp para confirmar sua disponibilidade.
                        </p>
                        <p style="margin: 0; font-size: 11px; line-height: 1.3; color: #004085;">
                            Caso o documento ainda não tenha sido importado até a data do atendimento, nossa equipe irá orientá-lo(a) sobre como proceder antes do início do processo.
                        </p>
                    </div>

                    <a href="${this.uploadUrl}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="btn-upload-docs"
                       id="btn-upload-docs"
                       style="display: inline-block; margin-bottom: 8px;">
                        📤 Enviar Documento de Identificação
                    </a>

                    <p class="upload-note" style="margin: 8px 0 0 0; font-size: 12px; line-height: 1.4;">
                        Todas instruções já foram enviadas no seu e-mail.<br>
                        <span style="font-size: 11px;">(Caso não tenha recebido o e-mail,
                        <a href="https://wa.me/551940422204?text=Olá%2C%20acabei%20de%20adquirir%20um%20certificado%20digital%20e-CPF%20A1%20no%20site%20www.certificadodigital.br.com%20e%20não%20recebi%20o%20e-mail%20com%20as%20orientações%2C%20pode%20me%20ajudar%3F"
                           target="_blank"
                           rel="noopener noreferrer"
                           style="color: #25D366; text-decoration: underline; font-weight: 600;">
                           clique aqui para WhatsApp
                        </a>)</span>
                    </p>
                </div>
            `;

            confirmacaoContainer.appendChild(uploadSection);
        }
    }

    /**
     * Configura eventos dos botões
     */
    setupEvents() {
        // Botão Finalizar
        const btnFinalizar = document.getElementById('btn-finalizar');
        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', () => this.handleFinalizar());
        }

        // Rastrear clique no link de upload
        const btnUpload = document.getElementById('btn-upload-docs');
        if (btnUpload) {
            btnUpload.addEventListener('click', () => {
                console.log('📤 Usuário clicou para enviar documentos');
                // Aqui você pode disparar um evento GTM se quiser
            });
        }
    }

    /**
     * Trata clique no botão Finalizar
     */
    handleFinalizar() {
        console.log('✅ Finalizando processo');

        // Recarregar página para iniciar nova compra
        window.location.reload();
    }

    /**
     * Cleanup ao sair do step
     */
    destroy() {
        console.log('🧹 Step6Controller: Limpando');
    }
}
