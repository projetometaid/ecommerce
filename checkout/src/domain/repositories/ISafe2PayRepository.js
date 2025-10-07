/**
 * 💳 Interface: Safe2Pay Repository
 *
 * Define contrato para operações Safe2Pay (PIX)
 * Pattern: Repository Pattern + Interface Segregation (SOLID)
 * SOLID: Dependency Inversion
 */

export class ISafe2PayRepository {
    /**
     * Cria pagamento PIX
     * @param {Object} dadosPagamento - Dados do pagamento
     * @returns {Promise<{sucesso: boolean, dados?: Object, erro?: string}>}
     */
    async criarPagamentoPix(dadosPagamento) {
        throw new Error('Method criarPagamentoPix() must be implemented');
    }

    /**
     * Verifica status do pagamento
     * @param {string} transactionId - ID da transação
     * @returns {Promise<{sucesso: boolean, status: string, dados?: Object}>}
     */
    async verificarStatusPagamento(transactionId) {
        throw new Error('Method verificarStatusPagamento() must be implemented');
    }

    /**
     * Cancela pagamento
     * @param {string} transactionId - ID da transação
     * @returns {Promise<{sucesso: boolean, mensagem?: string}>}
     */
    async cancelarPagamento(transactionId) {
        throw new Error('Method cancelarPagamento() must be implemented');
    }
}
