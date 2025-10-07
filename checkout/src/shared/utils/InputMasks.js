/**
 * 🎭 InputMasks - Utilitário de Máscaras
 *
 * Aplica máscaras em inputs (CPF, telefone, CEP, data)
 * Pattern: Strategy Pattern
 */

export class InputMasks {
    /**
     * Aplica máscara de CPF (000.000.000-00)
     */
    static cpf(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }

    /**
     * Aplica máscara de CNPJ (00.000.000/0000-00)
     */
    static cnpj(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }

    /**
     * Aplica máscara de telefone ((00) 00000-0000)
     */
    static telefone(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    }

    /**
     * Aplica máscara de CEP (00000-000)
     */
    static cep(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    }

    /**
     * Aplica máscara de data (00/00/0000)
     */
    static data(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1/$2')
            .replace(/(\d{2})(\d)/, '$1/$2')
            .replace(/(\/\d{4})\d+?$/, '$1');
    }

    /**
     * Vincula máscara a um elemento input
     * @param {HTMLInputElement} element
     * @param {string} maskType - 'cpf', 'cnpj', 'telefone', 'cep', 'data'
     */
    static bindToElement(element, maskType) {
        if (!element) return;

        const maskFunction = this[maskType];
        if (!maskFunction) {
            console.warn(`Máscara '${maskType}' não encontrada`);
            return;
        }

        element.addEventListener('input', (e) => {
            e.target.value = maskFunction(e.target.value);
        });
    }

    /**
     * Remove máscara (retorna apenas números)
     */
    static removeFormatting(value) {
        return value.replace(/\D/g, '');
    }
}
