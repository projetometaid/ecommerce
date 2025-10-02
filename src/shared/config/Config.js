/**
 * Configurações da Aplicação
 *
 * SOLID: SRP - Centraliza todas as configurações da aplicação
 * Pattern: Singleton Pattern
 */
export class Config {
    static instance = null;

    constructor() {
        if (Config.instance) {
            return Config.instance;
        }

        // Configurações Safeweb - CREDENCIAIS REMOVIDAS (SEGURANÇA)
        // ⚠️ IMPORTANTE: Credenciais agora estão APENAS no backend (.env)
        // Todas as chamadas passam pelo proxy backend em localhost:8082
        this.safeweb = {
            // REMOVIDO: username, password, authURL, cnpjAR, codigoParceiro
            // Mantido apenas URL base para referência (não usado diretamente)
            baseURL: 'https://pss.safewebpss.com.br',  // Apenas informativo
            backendProxyURL: 'http://localhost:8082/api/safeweb'
        };

        // Configurações Safe2Pay - CREDENCIAIS REMOVIDAS (SEGURANÇA)
        // ⚠️ IMPORTANTE: Token e SecretKey agora estão APENAS no backend (.env)
        // Todas as chamadas passam pelo proxy backend em localhost:8082
        this.safe2pay = {
            // REMOVIDO: token, secretKey
            // Mantido apenas URL base para referência (não usado diretamente)
            baseURL: 'https://payment.safe2pay.com.br/v2',  // Apenas informativo
            backendProxyURL: 'http://localhost:8082/api/pix'
        };

        // Configurações gerais
        this.app = {
            environment: 'development',
            debugMode: true
        };

        Config.instance = this;
    }

    static getInstance() {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }

    getSafewebConfig() {
        return this.safeweb;
    }

    getSafe2PayConfig() {
        return this.safe2pay;
    }

    isDebugMode() {
        return this.app.debugMode;
    }
}

// Exportar instância singleton
export const config = new Config();
