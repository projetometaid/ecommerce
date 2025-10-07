/**
 * 🔌 Interface: Safeweb Repository
 *
 * Define contrato para operações Safeweb
 * Pattern: Repository Pattern + Interface Segregation (SOLID)
 * SOLID: Dependency Inversion - Depende de abstração, não implementação
 */

export class ISafewebRepository {
    /**
     * Autentica na API Safeweb
     * @param {string} username
     * @param {string} password
     * @returns {Promise<string>} Token de autenticação
     */
    async authenticate(username, password) {
        throw new Error('Method authenticate() must be implemented');
    }

    /**
     * Verifica se CPF possui biometria facial
     * @param {string} cpf - CPF apenas números
     * @returns {Promise<{temBiometria: boolean, mensagem: string}>}
     */
    async verificarBiometria(cpf) {
        throw new Error('Method verificarBiometria() must be implemented');
    }

    /**
     * Consulta CPF na Receita Federal
     * @param {string} cpf - CPF apenas números
     * @param {string} dataNascimento - Data no formato DD/MM/YYYY
     * @returns {Promise<{valido: boolean, nome: string, mensagem: string}>}
     */
    async consultarCPF(cpf, dataNascimento) {
        throw new Error('Method consultarCPF() must be implemented');
    }

    /**
     * Gera protocolo de atendimento e-CPF A1
     * @param {Object} dadosCompletos - Dados do cliente
     * @returns {Promise<{sucesso: boolean, protocolo: string, erro?: string}>}
     */
    async gerarProtocolo(dadosCompletos) {
        throw new Error('Method gerarProtocolo() must be implemented');
    }

    /**
     * Verifica se token está válido
     * @returns {Promise<boolean>}
     */
    async isTokenValid() {
        throw new Error('Method isTokenValid() must be implemented');
    }
}
