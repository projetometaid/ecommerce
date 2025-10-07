/**
 * 💰 Entidade: Pagamento PIX
 *
 * Representa um pagamento via PIX (Safe2Pay)
 * Pattern: Aggregate Root
 * SOLID: Single Responsibility - Dados e regras do pagamento
 */

export class Pagamento {
    /**
     * @param {string} transactionId - ID da transação Safe2Pay
     * @param {number} valor - Valor do pagamento
     * @param {string} pixCode - Código PIX (copia e cola)
     * @param {string} qrCodeImage - URL ou Base64 da imagem QR Code
     * @param {string} status - Status do pagamento
     */
    constructor(transactionId, valor, pixCode, qrCodeImage = null, status = 'pending') {
        this.transactionId = transactionId;
        this.valor = valor;
        this.pixCode = pixCode;
        this.qrCodeImage = qrCodeImage;
        this.status = status;
        this.dataCriacao = new Date();
        this.dataAtualizacao = new Date();
    }

    /**
     * Valida se o pagamento é válido
     * @returns {boolean}
     */
    isValid() {
        return this.transactionId &&
               this.valor > 0 &&
               this.pixCode &&
               this.pixCode.length > 0;
    }

    /**
     * Verifica se pagamento está pendente
     * @returns {boolean}
     */
    isPending() {
        return this.status === 'pending' || this.status === '1';
    }

    /**
     * Verifica se pagamento foi aprovado
     * @returns {boolean}
     */
    isApproved() {
        return this.status === 'approved' || this.status === '3';
    }

    /**
     * Verifica se pagamento expirou
     * @returns {boolean}
     */
    isExpired() {
        return this.status === 'expired' || this.status === '9';
    }

    /**
     * Verifica se pagamento foi cancelado
     * @returns {boolean}
     */
    isCancelled() {
        return this.status === 'cancelled' || this.status === '4';
    }

    /**
     * Atualiza status do pagamento
     * @param {string} novoStatus
     */
    updateStatus(novoStatus) {
        this.status = novoStatus;
        this.dataAtualizacao = new Date();
    }

    /**
     * Retorna valor formatado em reais
     * @returns {string}
     */
    getValorFormatado() {
        return `R$ ${this.valor.toFixed(2).replace('.', ',')}`;
    }

    /**
     * Retorna descrição do status
     * @returns {string}
     */
    getStatusDescricao() {
        const statusMap = {
            'pending': 'Pendente',
            '1': 'Pendente',
            'approved': 'Aprovado',
            '3': 'Aprovado',
            'expired': 'Expirado',
            '9': 'Expirado',
            'cancelled': 'Cancelado',
            '4': 'Cancelado'
        };

        return statusMap[this.status] || 'Desconhecido';
    }

    /**
     * Retorna ícone do status
     * @returns {string}
     */
    getStatusIcon() {
        if (this.isApproved()) return '✅';
        if (this.isPending()) return '⏳';
        if (this.isExpired()) return '⏰';
        if (this.isCancelled()) return '❌';
        return '❓';
    }

    /**
     * Retorna tempo desde criação em minutos
     * @returns {number}
     */
    getTempoDecorrido() {
        const agora = new Date();
        const diff = agora - this.dataCriacao;
        return Math.floor(diff / 1000 / 60); // minutos
    }

    /**
     * Verifica se pagamento está próximo de expirar (15 minutos restantes)
     * @returns {boolean}
     */
    isProximoDeExpirar() {
        const tempoDecorrido = this.getTempoDecorrido();
        return tempoDecorrido >= 15; // Safe2Pay expira em ~30min
    }

    /**
     * Converte para objeto plano
     * @returns {Object}
     */
    toJSON() {
        return {
            transactionId: this.transactionId,
            valor: this.valor,
            pixCode: this.pixCode,
            qrCodeImage: this.qrCodeImage,
            status: this.status,
            dataCriacao: this.dataCriacao.toISOString(),
            dataAtualizacao: this.dataAtualizacao.toISOString()
        };
    }

    /**
     * Cria instância a partir de objeto plano
     * @param {Object} data
     * @returns {Pagamento}
     */
    static fromJSON(data) {
        const pagamento = new Pagamento(
            data.transactionId,
            data.valor,
            data.pixCode || data.qrCode || data.pixCopiaECola, // Compatibilidade
            data.qrCodeImage,
            data.status
        );

        if (data.dataCriacao) {
            pagamento.dataCriacao = new Date(data.dataCriacao);
        }
        if (data.dataAtualizacao) {
            pagamento.dataAtualizacao = new Date(data.dataAtualizacao);
        }

        return pagamento;
    }

    /**
     * Factory: Cria pagamento a partir de resposta Safe2Pay
     * @param {Object} safe2payResponse
     * @returns {Pagamento}
     */
    static fromSafe2PayResponse(safe2payResponse) {
        return new Pagamento(
            safe2payResponse.transactionId || safe2payResponse.IdTransaction,
            safe2payResponse.valor || safe2payResponse.Amount || 5.00,
            safe2payResponse.pixCopiaECola || safe2payResponse.qrCode || safe2payResponse.QrCode,
            safe2payResponse.qrCodeImage || safe2payResponse.QrCodeImage,
            safe2payResponse.status || 'pending'
        );
    }

    /**
     * Factory: Cria pagamento demo
     * @returns {Pagamento}
     */
    static createDemo() {
        return new Pagamento(
            'DEMO_' + Date.now(),
            5.00,
            '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426614174000520400005303986540518.005802BR5925CERTIFICADO DIGITAL DEMO6009SAO PAULO62070503***6304ABCD',
            null,
            'pending'
        );
    }
}
