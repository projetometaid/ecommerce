/**
 * 📋 Entidade: Protocolo Safeweb
 *
 * Representa um protocolo de atendimento Safeweb
 * Pattern: Entity
 * SOLID: Single Responsibility - Dados do protocolo
 */

export class Protocolo {
    /**
     * @param {string} numero - Número do protocolo
     * @param {string} idProduto - ID do produto Safeweb (37341 para e-CPF A1)
     * @param {Date} dataGeracao - Data de geração
     * @param {string} status - Status do protocolo
     */
    constructor(numero, idProduto = '37341', dataGeracao = null, status = 'gerado') {
        this.numero = numero;
        this.idProduto = idProduto;
        this.dataGeracao = dataGeracao || new Date();
        this.status = status;
    }

    /**
     * Valida se o protocolo é válido
     * @returns {boolean}
     */
    isValid() {
        return this.numero &&
               this.numero.length > 0 &&
               this.idProduto &&
               this.dataGeracao instanceof Date;
    }

    /**
     * Retorna data de geração formatada
     * @returns {string}
     */
    getDataGeracaoFormatada() {
        return this.dataGeracao.toLocaleString('pt-BR');
    }

    /**
     * Retorna apenas data (sem hora)
     * @returns {string}
     */
    getDataFormatada() {
        return this.dataGeracao.toLocaleDateString('pt-BR');
    }

    /**
     * Retorna apenas hora
     * @returns {string}
     */
    getHoraFormatada() {
        return this.dataGeracao.toLocaleTimeString('pt-BR');
    }

    /**
     * Verifica se protocolo está ativo
     * @returns {boolean}
     */
    isAtivo() {
        return this.status === 'gerado' || this.status === 'ativo';
    }

    /**
     * Marca protocolo como utilizado
     */
    marcarComoUtilizado() {
        this.status = 'utilizado';
    }

    /**
     * Marca protocolo como cancelado
     */
    marcarComoCancelado() {
        this.status = 'cancelado';
    }

    /**
     * Converte para objeto plano
     * @returns {Object}
     */
    toJSON() {
        return {
            numero: this.numero,
            idProduto: this.idProduto,
            dataGeracao: this.dataGeracao.toISOString(),
            status: this.status
        };
    }

    /**
     * Cria instância a partir de objeto plano
     * @param {Object} data
     * @returns {Protocolo}
     */
    static fromJSON(data) {
        return new Protocolo(
            data.numero || data.protocolo, // Compatibilidade
            data.idProduto,
            data.dataGeracao ? new Date(data.dataGeracao) : new Date(),
            data.status || 'gerado'
        );
    }

    /**
     * Factory: Cria protocolo a partir de resposta Safeweb
     * @param {string} numeroProtocolo
     * @returns {Protocolo}
     */
    static fromSafewebResponse(numeroProtocolo) {
        return new Protocolo(numeroProtocolo, '37341', new Date(), 'gerado');
    }
}
