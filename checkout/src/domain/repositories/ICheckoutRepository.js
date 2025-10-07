/**
 * 🛒 Interface: Checkout Repository
 *
 * Define contrato para persistência de dados do checkout
 * Pattern: Repository Pattern
 * SOLID: Interface Segregation
 */

export class ICheckoutRepository {
    /**
     * Salva dados do checkout
     * @param {Object} checkoutData
     * @returns {Promise<{sucesso: boolean, erro?: string}>}
     */
    async salvarCheckout(checkoutData) {
        throw new Error('Method salvarCheckout() must be implemented');
    }

    /**
     * Carrega dados do checkout
     * @returns {Promise<Object|null>}
     */
    async carregarCheckout() {
        throw new Error('Method carregarCheckout() must be implemented');
    }

    /**
     * Limpa dados do checkout
     * @returns {Promise<{sucesso: boolean}>}
     */
    async limparCheckout() {
        throw new Error('Method limparCheckout() must be implemented');
    }

    /**
     * Salva step específico
     * @param {string} stepKey - Chave do step (ex: 'horario', 'dados')
     * @param {Object} stepData - Dados do step
     * @returns {Promise<{sucesso: boolean}>}
     */
    async salvarStep(stepKey, stepData) {
        throw new Error('Method salvarStep() must be implemented');
    }

    /**
     * Carrega step específico
     * @param {string} stepKey
     * @returns {Promise<Object|null>}
     */
    async carregarStep(stepKey) {
        throw new Error('Method carregarStep() must be implemented');
    }
}
