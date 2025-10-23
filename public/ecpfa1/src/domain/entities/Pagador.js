/**
 * 💳 Entidade: Pagador
 *
 * Representa o responsável pelo pagamento (pode ser diferente do titular)
 * Pattern: Entity
 * SOLID: Single Responsibility - Dados do pagador (PF ou PJ)
 */

import { Endereco } from './Endereco.js';

export class Pagador {
    /**
     * @param {string} tipoPessoa - 'fisica' ou 'juridica'
     * @param {string} documento - CPF ou CNPJ (apenas números)
     * @param {string} nome - Nome completo ou Razão Social
     * @param {Endereco} endereco - Objeto Endereco
     * @param {boolean} mesmoDadosTitular - Se usa mesmos dados do titular
     */
    constructor(tipoPessoa, documento, nome, endereco, mesmoDadosTitular = false) {
        this.tipoPessoa = tipoPessoa; // 'fisica' ou 'juridica'
        this.documento = this.sanitizeDocumento(documento);
        this.nome = nome;
        this.endereco = endereco instanceof Endereco ? endereco : Endereco.createEmpty();
        this.mesmoDadosTitular = mesmoDadosTitular;
    }

    /**
     * Remove caracteres não numéricos do documento
     * @param {string} documento
     * @returns {string}
     */
    sanitizeDocumento(documento) {
        return documento ? documento.replace(/\D/g, '') : '';
    }

    /**
     * Valida se os dados do pagador estão completos
     * @returns {boolean}
     */
    isValid() {
        // Se usar mesmos dados do titular, sempre válido
        if (this.mesmoDadosTitular) {
            return true;
        }

        // Validar documento
        const documentoValido = this.isPessoaFisica()
            ? this.documento.length === 11
            : this.documento.length === 14;

        return documentoValido &&
               this.nome &&
               this.endereco.isValid();
    }

    /**
     * Verifica se é pessoa física
     * @returns {boolean}
     */
    isPessoaFisica() {
        return this.tipoPessoa === 'fisica';
    }

    /**
     * Verifica se é pessoa jurídica
     * @returns {boolean}
     */
    isPessoaJuridica() {
        return this.tipoPessoa === 'juridica';
    }

    /**
     * Retorna tipo de documento (CPF ou CNPJ)
     * @returns {string}
     */
    getTipoDocumento() {
        return this.isPessoaFisica() ? 'CPF' : 'CNPJ';
    }

    /**
     * Retorna documento formatado
     * @returns {string}
     */
    getDocumentoFormatado() {
        if (this.isPessoaFisica()) {
            // CPF: 000.000.000-00
            if (this.documento.length !== 11) return this.documento;
            return this.documento.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else {
            // CNPJ: 00.000.000/0000-00
            if (this.documento.length !== 14) return this.documento;
            return this.documento.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
    }

    /**
     * Retorna label do nome (Nome Completo ou Razão Social)
     * @returns {string}
     */
    getLabelNome() {
        return this.isPessoaFisica() ? 'Nome Completo' : 'Razão Social';
    }

    /**
     * Converte para objeto plano
     * @returns {Object}
     */
    toJSON() {
        return {
            tipoPessoa: this.tipoPessoa,
            documento: this.documento,
            nome: this.nome,
            endereco: this.endereco.toJSON(),
            mesmoDadosTitular: this.mesmoDadosTitular
        };
    }

    /**
     * Cria instância a partir de objeto plano
     * @param {Object} data
     * @returns {Pagador}
     */
    static fromJSON(data) {
        // Compatibilidade com formato antigo
        const documento = data.documento || data.cpf || data.cnpj || '';
        const nome = data.nome || data['nome-completo'] || data['razao-social'] || '';

        return new Pagador(
            data.tipoPessoa,
            documento,
            nome,
            data.endereco ? Endereco.fromJSON(data.endereco) : Endereco.createEmpty(),
            data.mesmoDadosTitular || data.usarDadosUsuario || false
        );
    }

    /**
     * Factory: Cria pagador a partir do titular (mesmo dados)
     * @param {Cliente} cliente
     * @returns {Pagador}
     */
    static fromCliente(cliente) {
        return new Pagador(
            'fisica',
            cliente.cpf,
            cliente.nome,
            cliente.endereco,
            true // Mesmos dados do titular
        );
    }

    /**
     * Factory: Cria pagador vazio (Pessoa Física)
     * @returns {Pagador}
     */
    static createEmptyPF() {
        return new Pagador('fisica', '', '', Endereco.createEmpty(), false);
    }

    /**
     * Factory: Cria pagador vazio (Pessoa Jurídica)
     * @returns {Pagador}
     */
    static createEmptyPJ() {
        return new Pagador('juridica', '', '', Endereco.createEmpty(), false);
    }
}
