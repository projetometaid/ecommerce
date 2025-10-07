/**
 * 🎫 Entidade: Certificado Digital
 *
 * Representa um certificado digital e-CPF A1
 * Pattern: Entity (Domain-Driven Design)
 * SOLID: Single Responsibility - Apenas dados e regras do certificado
 */

export class Certificado {
    /**
     * @param {string} tipo - Tipo do certificado (sempre 'ecpf' para este sistema)
     * @param {string} nome - Nome do certificado
     * @param {number} preco - Preço do certificado
     * @param {string} descricao - Descrição do certificado
     * @param {number} validade - Validade em anos
     * @param {string} codigoProdutoSafeweb - Código do produto na Safeweb
     */
    constructor(tipo, nome, preco, descricao, validade = 1, codigoProdutoSafeweb = null) {
        this.tipo = tipo;
        this.nome = nome;
        this.preco = preco;
        this.descricao = descricao;
        this.validade = validade;
        this.codigoProdutoSafeweb = codigoProdutoSafeweb;
        this.createdAt = new Date();
    }

    /**
     * Valida se o certificado é válido
     * @returns {boolean}
     */
    isValid() {
        return this.tipo === 'ecpf' &&
               this.nome &&
               this.preco > 0 &&
               this.validade > 0;
    }

    /**
     * Retorna o preço formatado em reais
     * @returns {string}
     */
    getPrecoFormatado() {
        return `R$ ${this.preco.toFixed(2).replace('.', ',')}`;
    }

    /**
     * Retorna o tipo formatado
     * @returns {string}
     */
    getTipoFormatado() {
        return this.tipo === 'ecpf' ? 'e-CPF' : this.tipo.toUpperCase();
    }

    /**
     * Factory method para criar e-CPF A1
     * Pattern: Factory Method
     * @returns {Certificado}
     */
    static createECPFA1() {
        return new Certificado(
            'ecpf',
            'e-CPF A1 (1 ano)',
            5.00,
            'Certificado Digital e-CPF A1 com validade de 1 ano - Videoconferência',
            1,
            '37341' // Código do produto e-CPF A1 na Safeweb (do .env)
        );
    }

    /**
     * Converte para objeto plano
     * @returns {Object}
     */
    toJSON() {
        return {
            tipo: this.tipo,
            nome: this.nome,
            preco: this.preco,
            descricao: this.descricao,
            validade: this.validade,
            codigoProdutoSafeweb: this.codigoProdutoSafeweb,
            createdAt: this.createdAt.toISOString()
        };
    }

    /**
     * Cria instância a partir de objeto plano
     * @param {Object} data
     * @returns {Certificado}
     */
    static fromJSON(data) {
        const cert = new Certificado(
            data.tipo,
            data.nome,
            data.preco,
            data.descricao,
            data.validade,
            data.codigoProdutoSafeweb
        );
        if (data.createdAt) {
            cert.createdAt = new Date(data.createdAt);
        }
        return cert;
    }
}
