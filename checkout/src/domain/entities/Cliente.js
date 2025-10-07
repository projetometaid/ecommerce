/**
 * 👤 Entidade: Cliente (Titular do Certificado)
 *
 * Representa o titular do certificado e-CPF
 * Pattern: Aggregate Root (raiz de agregação)
 * SOLID: Single Responsibility - Dados e validações do cliente
 */

import { Endereco } from './Endereco.js';

export class Cliente {
    /**
     * @param {string} cpf - CPF (apenas números)
     * @param {string} nome - Nome completo
     * @param {string} dataNascimento - Data de nascimento (DD/MM/YYYY ou YYYY-MM-DD)
     * @param {string} email - Email
     * @param {string} telefone - Telefone com DDD
     * @param {Endereco} endereco - Objeto Endereco
     */
    constructor(cpf, nome, dataNascimento, email, telefone, endereco) {
        this.cpf = this.sanitizeCPF(cpf);
        this.nome = nome;
        this.dataNascimento = dataNascimento;
        this.email = email;
        this.telefone = this.sanitizeTelefone(telefone);
        this.endereco = endereco instanceof Endereco ? endereco : Endereco.createEmpty();

        // Dados adicionais Safeweb (preenchidos após consulta RFB)
        this.nomeRFB = null;
        this.temBiometria = null;
        this.validadoRFB = false;
    }

    /**
     * Remove caracteres não numéricos do CPF
     * @param {string} cpf
     * @returns {string}
     */
    sanitizeCPF(cpf) {
        return cpf ? cpf.replace(/\D/g, '') : '';
    }

    /**
     * Remove caracteres não numéricos do telefone
     * @param {string} telefone
     * @returns {string}
     */
    sanitizeTelefone(telefone) {
        return telefone ? telefone.replace(/\D/g, '') : '';
    }

    /**
     * Valida se os dados do cliente estão completos
     * @returns {boolean}
     */
    isValid() {
        return this.cpf.length === 11 &&
               this.nome &&
               this.nome.split(' ').length >= 2 && // Nome completo
               this.dataNascimento &&
               this.isEmailValid() &&
               this.telefone.length >= 10 &&
               this.endereco.isValid();
    }

    /**
     * Valida formato do email
     * @returns {boolean}
     */
    isEmailValid() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(this.email);
    }

    /**
     * Retorna CPF formatado (000.000.000-00)
     * @returns {string}
     */
    getCPFFormatado() {
        if (this.cpf.length !== 11) return this.cpf;
        return this.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    /**
     * Retorna telefone formatado ((00) 00000-0000)
     * @returns {string}
     */
    getTelefoneFormatado() {
        const tel = this.telefone;
        if (tel.length === 11) {
            return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (tel.length === 10) {
            return tel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return tel;
    }

    /**
     * Retorna data de nascimento formatada (DD/MM/YYYY)
     * @returns {string}
     */
    getDataNascimentoFormatada() {
        if (!this.dataNascimento) return '';

        // Se está em formato YYYY-MM-DD, converter
        if (/^\d{4}-\d{2}-\d{2}$/.test(this.dataNascimento)) {
            const [ano, mes, dia] = this.dataNascimento.split('-');
            return `${dia}/${mes}/${ano}`;
        }

        // Já está em formato DD/MM/YYYY
        return this.dataNascimento;
    }

    /**
     * Define dados da consulta RFB
     * @param {string} nomeRFB - Nome retornado pela RFB
     * @param {boolean} validado - Se CPF foi validado
     */
    setDadosRFB(nomeRFB, validado = true) {
        this.nomeRFB = nomeRFB;
        this.validadoRFB = validado;

        // Se nome da RFB veio, atualizar nome do cliente
        if (nomeRFB && !this.nome) {
            this.nome = nomeRFB;
        }
    }

    /**
     * Define resultado da verificação de biometria
     * @param {boolean} temBiometria
     */
    setBiometria(temBiometria) {
        this.temBiometria = temBiometria;
    }

    /**
     * Converte para objeto plano
     * @returns {Object}
     */
    toJSON() {
        return {
            cpf: this.cpf,
            nome: this.nome,
            dataNascimento: this.dataNascimento,
            email: this.email,
            telefone: this.telefone,
            endereco: this.endereco.toJSON(),
            nomeRFB: this.nomeRFB,
            temBiometria: this.temBiometria,
            validadoRFB: this.validadoRFB
        };
    }

    /**
     * Cria instância a partir de objeto plano
     * @param {Object} data
     * @returns {Cliente}
     */
    static fromJSON(data) {
        const cliente = new Cliente(
            data.cpf,
            data.nome,
            data.dataNascimento || data.nascimento, // Compatibilidade
            data.email,
            data.telefone,
            data.endereco ? Endereco.fromJSON(data.endereco) : Endereco.createEmpty()
        );

        if (data.nomeRFB) cliente.nomeRFB = data.nomeRFB;
        if (data.temBiometria !== undefined) cliente.temBiometria = data.temBiometria;
        if (data.validadoRFB !== undefined) cliente.validadoRFB = data.validadoRFB;

        return cliente;
    }

    /**
     * Cria cliente vazio
     * @returns {Cliente}
     */
    static createEmpty() {
        return new Cliente('', '', '', '', '', Endereco.createEmpty());
    }
}
