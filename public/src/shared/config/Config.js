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

        // Detectar ambiente (produção vs desenvolvimento)
        const isProd = window.location.hostname !== 'localhost' &&
                      window.location.hostname !== '127.0.0.1';

        // Configurações Safeweb - CREDENCIAIS REMOVIDAS (SEGURANÇA)
        // ⚠️ IMPORTANTE: Credenciais agora estão APENAS no backend (.env ou AWS Secrets)
        // Todas as chamadas passam pelo proxy backend
        this.safeweb = {
            baseURL: 'https://pss.safewebpss.com.br',  // Apenas informativo
            backendProxyURL: isProd
                ? 'https://d2iucdo1dmk5az.cloudfront.net/api/safeweb'
                : 'http://localhost:8082/api/safeweb'
        };

        // Configurações Safe2Pay - CREDENCIAIS REMOVIDAS (SEGURANÇA)
        // ⚠️ IMPORTANTE: Token e SecretKey agora estão APENAS no backend (.env ou AWS Secrets)
        // Todas as chamadas passam pelo proxy backend
        this.safe2pay = {
            baseURL: 'https://payment.safe2pay.com.br/v2',  // Apenas informativo
            backendProxyURL: isProd
                ? 'https://d2iucdo1dmk5az.cloudfront.net/api/pix'
                : 'http://localhost:8082/api/pix'
        };

        // Configurações gerais
        this.app = {
            environment: isProd ? 'production' : 'development',
            debugMode: !isProd
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
