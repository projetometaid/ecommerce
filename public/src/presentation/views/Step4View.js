/**
 * 🎨 View: Step 4 - Resumo do Pedido
 *
 * Renderiza resumo completo do pedido
 */
export class Step4View {
    constructor(containerElement) {
        this.container = containerElement;
    }

    render(checkoutData) {
        const resumoContainer = this.container.querySelector('#resumo-container');

        if (!resumoContainer) {
            console.error('❌ Step4View: resumo-container não encontrado!');
            return;
        }

        console.log('🎨 Step4View: Renderizando com dados:', checkoutData);
        resumoContainer.innerHTML = this.getResumoHTML(checkoutData);
    }

    getResumoHTML(data) {
        const horario = data.horario || {};
        const certificado = data.certificado || { tipo: 'ecpf', preco: 'R$ 149,90' };
        const cliente = data.cliente || {};
        const pagador = data.pagador || {};
        const protocolo = data.protocolo || '';

        // Verificar se o pagador é o mesmo do titular
        const mesmoPagador = pagador.usarDadosUsuario === true;

        // Determinar título da seção de dados
        let tituloSecaoDados = mesmoPagador
            ? 'Dados do Titular do Certificado e Pagador'
            : 'Dados do Titular do Certificado';

        return `
            <div class="resumo-sections">
                <!-- Protocolo -->
                ${protocolo ? `
                <div class="resumo-section protocolo-section">
                    <h3>Protocolo de Atendimento</h3>
                    <div class="resumo-item">
                        <span class="label">Número:</span>
                        <span class="value protocolo-numero">${protocolo}</span>
                    </div>
                </div>
                ` : ''}

                <!-- Agendamento -->
                <div class="resumo-section">
                    <h3>Agendamento</h3>
                    <div class="resumo-item">
                        <span class="label">Horário:</span>
                        <span class="value">${horario.time || 'Não selecionado'}</span>
                    </div>
                </div>

                <!-- Certificado -->
                <div class="resumo-section">
                    <h3>Certificado Digital</h3>
                    <div class="resumo-item">
                        <span class="label">Modelo:</span>
                        <span class="value">${this.getModeloCertificado(certificado)}</span>
                    </div>
                </div>

                <!-- Dados do Titular -->
                <div class="resumo-section">
                    <h3>${tituloSecaoDados}</h3>
                    <div class="resumo-item">
                        <span class="label">Nome:</span>
                        <span class="value">${cliente.nome || 'Não informado'}</span>
                    </div>
                    <div class="resumo-item">
                        <span class="label">CPF:</span>
                        <span class="value">${cliente.cpf || 'Não informado'}</span>
                    </div>
                    <div class="resumo-item">
                        <span class="label">E-mail:</span>
                        <span class="value">${cliente.email || 'Não informado'}</span>
                    </div>
                    <div class="resumo-item">
                        <span class="label">Telefone:</span>
                        <span class="value">${cliente.telefone || 'Não informado'}</span>
                    </div>
                </div>

                ${this.getDadosPagadorHTML(pagador, mesmoPagador, cliente)}

                <!-- Total -->
                <div class="resumo-total">
                    <div class="total-line">
                        <span class="total-label">Total a Pagar:</span>
                        <span class="total-value">${certificado.getPrecoFormatado ? certificado.getPrecoFormatado() : 'R$ 149,90'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Retorna o modelo do certificado
     */
    getModeloCertificado(certificado) {
        if (certificado.tipo === 'ecpf') {
            return 'e-CPF A1 (1 ano)';
        } else if (certificado.tipo === 'ecnpj') {
            return 'e-CNPJ A1 (1 ano)';
        }
        return certificado.nome || 'e-CPF A1 (1 ano)';
    }

    /**
     * Retorna endereço completo formatado
     */
    getEnderecoCompleto(endereco) {
        if (!endereco) return 'Não informado';

        const partes = [
            endereco.logradouro,
            endereco.numero ? `nº ${endereco.numero}` : null,
            endereco.complemento,
            endereco.bairro,
            endereco.cidade,
            endereco.uf
        ].filter(Boolean);

        return partes.join(', ') || 'Não informado';
    }

    /**
     * Retorna HTML dos dados do pagador (sempre mostra, mesmo se for o titular)
     */
    getDadosPagadorHTML(pagador, mesmoPagador, cliente) {
        // Se for o mesmo pagador (titular), usar dados do cliente
        if (mesmoPagador) {
            return `
                <!-- Dados do Pagador -->
                <div class="resumo-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                        <h3 style="margin-bottom: 0;">Dados do Pagador PIX</h3>
                        <a href="#" id="link-atualizar-pagador" style="font-size: 11px; color: #4285f4; text-decoration: none; font-weight: 600;">
                            Atualizar dados do pagador
                        </a>
                    </div>
                    <div class="resumo-item">
                        <span class="label">Nome:</span>
                        <span class="value">${cliente.nome || 'Não informado'}</span>
                    </div>
                    <div class="resumo-item">
                        <span class="label">CPF:</span>
                        <span class="value">${cliente.cpf || 'Não informado'}</span>
                    </div>
                </div>
            `;
        }

        // Se for pagador diferente, usar dados do pagador
        if (!pagador.dados) {
            return '';
        }

        const dadosPagador = pagador.dados;
        const tipoPagador = pagador.tipoPessoa || 'fisica';

        const nome = tipoPagador === 'fisica'
            ? (dadosPagador.nome || 'Não informado')
            : (dadosPagador.razaoSocial || 'Não informado');

        const documento = tipoPagador === 'fisica'
            ? (dadosPagador.cpf || 'Não informado')
            : (dadosPagador.cnpj || 'Não informado');

        return `
            <!-- Dados do Pagador -->
            <div class="resumo-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                    <h3 style="margin-bottom: 0;">Dados do Pagador PIX</h3>
                    <a href="#" id="link-atualizar-pagador" style="font-size: 11px; color: #4285f4; text-decoration: none; font-weight: 600;">
                        Atualizar dados do pagador
                    </a>
                </div>
                <div class="resumo-item">
                    <span class="label">${tipoPagador === 'fisica' ? 'Nome:' : 'Razão Social:'}</span>
                    <span class="value">${nome}</span>
                </div>
                <div class="resumo-item">
                    <span class="label">${tipoPagador === 'fisica' ? 'CPF:' : 'CNPJ:'}</span>
                    <span class="value">${documento}</span>
                </div>
            </div>
        `;
    }

    /**
     * Habilita/desabilita botão "Gerar Pagamento"
     */
    setButtonState(enabled) {
        const btnNext = document.getElementById('btn-step4-next');
        if (btnNext) {
            btnNext.disabled = !enabled;
        }
    }
}
