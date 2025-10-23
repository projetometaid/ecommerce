/**
 * 🔒 Utilitário de Mascaramento de Dados Sensíveis (PII)
 *
 * Protege dados pessoais em logs, console e exibições
 * Compliance: LGPD (Lei Geral de Proteção de Dados)
 *
 * SOLID: SRP - Responsável apenas por mascarar dados sensíveis
 */

export class DataMasking {
    /**
     * Mascara CPF/CNPJ
     * Exemplo: 123.456.789-01 -> 123.***.***-01
     * @param {string} cpf - CPF ou CNPJ para mascarar
     * @returns {string} CPF mascarado
     */
    static maskCPF(cpf) {
        if (!cpf) return cpf;

        const cpfLimpo = cpf.toString().replace(/\D/g, '');

        if (cpfLimpo.length < 11) {
            return '***.***.***-**';
        }

        // CPF: 123.***.***-01
        if (cpfLimpo.length === 11) {
            return `${cpfLimpo.substring(0, 3)}.***.***-${cpfLimpo.substring(9)}`;
        }

        // CNPJ: 12.***.***/****-01
        if (cpfLimpo.length === 14) {
            return `${cpfLimpo.substring(0, 2)}.***.***/****-${cpfLimpo.substring(12)}`;
        }

        return '***';
    }

    /**
     * Mascara email
     * Exemplo: usuario@dominio.com -> u******@dominio.com
     * @param {string} email - Email para mascarar
     * @returns {string} Email mascarado
     */
    static maskEmail(email) {
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return email;
        }

        const [local, domain] = email.split('@');

        if (local.length <= 1) {
            return `*@${domain}`;
        }

        return `${local[0]}${'*'.repeat(local.length - 1)}@${domain}`;
    }

    /**
     * Mascara telefone
     * Exemplo: (11) 98765-4321 -> (11) 9****-**21
     * @param {string} phone - Telefone para mascarar
     * @returns {string} Telefone mascarado
     */
    static maskPhone(phone) {
        if (!phone) return phone;

        const phoneLimpo = phone.toString().replace(/\D/g, '');

        if (phoneLimpo.length < 10) {
            return '(**) ****-****';
        }

        // Formato: (11) 9****-**21
        return `(${phoneLimpo.substring(0, 2)}) ${phoneLimpo[2]}****-**${phoneLimpo.substring(phoneLimpo.length - 2)}`;
    }

    /**
     * Mascara nome completo
     * Exemplo: João da Silva -> João ***
     * @param {string} name - Nome para mascarar
     * @returns {string} Nome mascarado
     */
    static maskName(name) {
        if (!name || typeof name !== 'string') return name;

        const parts = name.trim().split(' ');

        if (parts.length <= 1) {
            return parts[0];
        }

        return `${parts[0]} ***`;
    }

    /**
     * Mascara endereço (remove números)
     * Exemplo: Rua das Flores, 123 -> Rua das Flores, ***
     * @param {string} address - Endereço para mascarar
     * @returns {string} Endereço mascarado
     */
    static maskAddress(address) {
        if (!address || typeof address !== 'string') return address;

        return address.replace(/\d+/g, '***');
    }

    /**
     * Mascara data de nascimento (mostra apenas ano)
     * Exemplo: 28/01/1989 -> **/**/1989
     * @param {string} birthDate - Data de nascimento para mascarar
     * @returns {string} Data mascarada
     */
    static maskBirthDate(birthDate) {
        if (!birthDate || typeof birthDate !== 'string') return birthDate;

        // Formatos aceitos: DD/MM/YYYY, YYYY-MM-DD
        if (birthDate.includes('/')) {
            const parts = birthDate.split('/');
            if (parts.length === 3) {
                return `**/**/${parts[2]}`;
            }
        } else if (birthDate.includes('-')) {
            const parts = birthDate.split('-');
            if (parts.length === 3) {
                return `${parts[0]}-**-**`;
            }
        }

        return '**/**/****';
    }

    /**
     * Mascara todos os dados sensíveis em um objeto
     * @param {Object} data - Objeto com dados para mascarar
     * @returns {Object} Objeto com dados mascarados
     */
    static maskSensitiveData(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }

        // Se for array, mascarar cada item
        if (Array.isArray(data)) {
            return data.map(item => this.maskSensitiveData(item));
        }

        // Criar cópia para não modificar original
        const masked = { ...data };

        // Campos que devem ser mascarados
        const sensitiveFields = {
            cpf: this.maskCPF,
            CPF: this.maskCPF,
            cnpj: this.maskCPF,
            CNPJ: this.maskCPF,
            email: this.maskEmail,
            Email: this.maskEmail,
            telefone: this.maskPhone,
            phone: this.maskPhone,
            telefoneFixo: this.maskPhone,
            celular: this.maskPhone,
            nome: this.maskName,
            name: this.maskName,
            nomeCompleto: this.maskName,
            razaoSocial: this.maskName,
            endereco: this.maskAddress,
            logradouro: this.maskAddress,
            address: this.maskAddress,
            dataNascimento: this.maskBirthDate,
            nascimento: this.maskBirthDate,
            birthDate: this.maskBirthDate
        };

        // Aplicar mascaramento nos campos sensíveis
        for (const [field, maskFunc] of Object.entries(sensitiveFields)) {
            if (field in masked) {
                masked[field] = maskFunc.call(this, masked[field]);
            }
        }

        // Mascarar recursivamente objetos aninhados
        for (const [key, value] of Object.entries(masked)) {
            if (value && typeof value === 'object') {
                masked[key] = this.maskSensitiveData(value);
            }
        }

        return masked;
    }

    /**
     * Console.log seguro (mascara dados automaticamente)
     * Use em vez de console.log direto quando logando dados do usuário
     * @param {string} message - Mensagem de log
     * @param {any} data - Dados para logar (serão mascarados)
     */
    static safeLog(message, data = null) {
        if (data) {
            const masked = this.maskSensitiveData(data);
            console.log(`🔒 ${message}`, masked);
        } else {
            console.log(message);
        }
    }

    /**
     * Console.warn seguro (mascara dados automaticamente)
     * @param {string} message - Mensagem de warning
     * @param {any} data - Dados para logar (serão mascarados)
     */
    static safeWarn(message, data = null) {
        if (data) {
            const masked = this.maskSensitiveData(data);
            console.warn(`🔒 ${message}`, masked);
        } else {
            console.warn(message);
        }
    }

    /**
     * Console.error seguro (mascara dados automaticamente)
     * @param {string} message - Mensagem de erro
     * @param {any} data - Dados para logar (serão mascarados)
     */
    static safeError(message, data = null) {
        if (data) {
            const masked = this.maskSensitiveData(data);
            console.error(`🔒 ${message}`, masked);
        } else {
            console.error(message);
        }
    }
}

// Exportar funções individuais para conveniência
export const maskCPF = DataMasking.maskCPF.bind(DataMasking);
export const maskEmail = DataMasking.maskEmail.bind(DataMasking);
export const maskPhone = DataMasking.maskPhone.bind(DataMasking);
export const maskName = DataMasking.maskName.bind(DataMasking);
export const maskAddress = DataMasking.maskAddress.bind(DataMasking);
export const maskBirthDate = DataMasking.maskBirthDate.bind(DataMasking);
export const maskSensitiveData = DataMasking.maskSensitiveData.bind(DataMasking);
export const safeLog = DataMasking.safeLog.bind(DataMasking);
export const safeWarn = DataMasking.safeWarn.bind(DataMasking);
export const safeError = DataMasking.safeError.bind(DataMasking);
