/**
 * 📍 Entidade: Endereço
 *
 * Representa um endereço completo
 * Pattern: Value Object (não tem identidade própria)
 * SOLID: Single Responsibility - Apenas dados e validações de endereço
 */

export class Endereco {
    /**
     * @param {string} cep - CEP (apenas números)
     * @param {string} logradouro - Rua, avenida, etc
     * @param {string} numero - Número do endereço
     * @param {string} complemento - Complemento (opcional)
     * @param {string} bairro - Bairro
     * @param {string} cidade - Cidade
     * @param {string} estado - Estado (UF ou nome completo)
     */
    constructor(cep, logradouro, numero, complemento, bairro, cidade, estado) {
        this.cep = this.sanitizeCEP(cep);
        this.logradouro = logradouro;
        this.numero = numero;
        this.complemento = complemento || '';
        this.bairro = bairro;
        this.cidade = cidade;
        this.estado = estado;
    }

    /**
     * Remove caracteres não numéricos do CEP
     * @param {string} cep
     * @returns {string}
     */
    sanitizeCEP(cep) {
        return cep ? cep.replace(/\D/g, '') : '';
    }

    /**
     * Valida se o endereço está completo
     * @returns {boolean}
     */
    isValid() {
        return this.cep.length === 8 &&
               this.logradouro &&
               this.numero &&
               this.bairro &&
               this.cidade &&
               this.estado;
    }

    /**
     * Retorna CEP formatado (00000-000)
     * @returns {string}
     */
    getCEPFormatado() {
        if (this.cep.length !== 8) return this.cep;
        return `${this.cep.substring(0, 5)}-${this.cep.substring(5)}`;
    }

    /**
     * Retorna endereço completo em uma linha
     * @returns {string}
     */
    getEnderecoCompleto() {
        const partes = [
            this.logradouro,
            this.numero,
            this.complemento,
            this.bairro,
            this.cidade,
            this.estado,
            this.getCEPFormatado()
        ].filter(p => p);

        return partes.join(', ');
    }

    /**
     * Retorna UF do estado (2 letras)
     * @returns {string}
     */
    getUF() {
        // Se já está em formato UF, retornar
        if (this.estado.length === 2) {
            return this.estado.toUpperCase();
        }

        // Converter nome para UF
        const estados = {
            'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
            'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
            'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
            'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
            'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
            'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
            'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO'
        };

        return estados[this.estado] || this.estado;
    }

    /**
     * Converte para objeto plano
     * @returns {Object}
     */
    toJSON() {
        return {
            cep: this.cep,
            logradouro: this.logradouro,
            numero: this.numero,
            complemento: this.complemento,
            bairro: this.bairro,
            cidade: this.cidade,
            estado: this.estado
        };
    }

    /**
     * Cria instância a partir de objeto plano
     * @param {Object} data
     * @returns {Endereco}
     */
    static fromJSON(data) {
        return new Endereco(
            data.cep,
            data.logradouro || data.endereco, // Compatibilidade
            data.numero,
            data.complemento,
            data.bairro,
            data.cidade,
            data.estado
        );
    }

    /**
     * Cria endereço vazio
     * @returns {Endereco}
     */
    static createEmpty() {
        return new Endereco('', '', '', '', '', '', '');
    }
}
