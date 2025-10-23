export class Config {
    static instance = null;

    constructor() {
        if (Config.instance) {
            return Config.instance;
        }

        const isProd = window.location.hostname !== 'localhost' &&
                      window.location.hostname !== '127.0.0.1';

        const devApiUrl = `http://${window.location.hostname}:8082`;
        
        this.safeweb = {
            baseURL: 'https://pss.safewebpss.com.br',
            backendProxyURL: isProd
                ? 'https://u4w4tf2o4f.execute-api.us-east-1.amazonaws.com/api/safeweb'
                : `${devApiUrl}/api/safeweb`
        };

        this.safe2pay = {
            baseURL: 'https://api.safe2pay.com.br/v2',
            backendProxyURL: isProd
                ? 'https://u4w4tf2o4f.execute-api.us-east-1.amazonaws.com/api/pix'
                : `${devApiUrl}/api/pix`
        };

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

export const config = new Config();
