/**
 * 📍 Interface: CEP Repository
 *
 * Define contrato para busca de endereço por CEP
 * Pattern: Repository Pattern
 * SOLID: Interface Segregation
 */

export class ICEPRepository {
    /**
     * Busca endereço pelo CEP
     * @param {string} cep - CEP com ou sem máscara
     * @returns {Promise<{sucesso: boolean, endereco?: Object, erro?: string}>}
     */
    async buscarEnderecoPorCEP(cep) {
        throw new Error('Method buscarEnderecoPorCEP() must be implemented');
    }

    /**
     * Valida formato do CEP
     * @param {string} cep
     * @returns {boolean}
     */
    validarCEP(cep) {
        throw new Error('Method validarCEP() must be implemented');
    }
}
