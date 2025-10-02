/**
 * ✅ Validators - Validadores de formulário
 *
 * Validações de entrada de dados
 * Pattern: Strategy Pattern
 */

export class Validators {
    /**
     * Valida email
     */
    static email(value) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value);
    }

    /**
     * Valida CPF (apenas formato)
     */
    static cpf(value) {
        const cpf = value.replace(/\D/g, '');
        return cpf.length === 11;
    }

    /**
     * Valida CNPJ (apenas formato)
     */
    static cnpj(value) {
        const cnpj = value.replace(/\D/g, '');
        return cnpj.length === 14;
    }

    /**
     * Valida telefone
     */
    static telefone(value) {
        const tel = value.replace(/\D/g, '');
        return tel.length >= 10 && tel.length <= 11;
    }

    /**
     * Valida CEP
     */
    static cep(value) {
        const cep = value.replace(/\D/g, '');
        return cep.length === 8;
    }

    /**
     * Valida data (DD/MM/YYYY)
     */
    static data(value) {
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        return regex.test(value);
    }

    /**
     * Valida campo obrigatório
     */
    static required(value) {
        return value && value.toString().trim().length > 0;
    }

    /**
     * Valida nome completo (mínimo 2 palavras)
     */
    static nomeCompleto(value) {
        if (!value) return false;
        const palavras = value.trim().split(/\s+/);
        return palavras.length >= 2 && palavras.every(p => p.length > 0);
    }
}
