/**
 * 🌐 HttpClient - Cliente HTTP Base
 *
 * Cliente HTTP genérico para requisições
 * Pattern: Adapter Pattern
 * SOLID: Single Responsibility - Apenas requisições HTTP
 */

export class HttpClient {
    constructor(baseURL = '', defaultHeaders = {}) {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            ...defaultHeaders
        };
    }

    /**
     * Realiza requisição GET
     * @param {string} url
     * @param {Object} headers
     * @returns {Promise<Object>}
     */
    async get(url, headers = {}) {
        return this.request('GET', url, null, headers);
    }

    /**
     * Realiza requisição POST
     * @param {string} url
     * @param {Object} data
     * @param {Object} headers
     * @returns {Promise<Object>}
     */
    async post(url, data, headers = {}) {
        return this.request('POST', url, data, headers);
    }

    /**
     * Realiza requisição PUT
     * @param {string} url
     * @param {Object} data
     * @param {Object} headers
     * @returns {Promise<Object>}
     */
    async put(url, data, headers = {}) {
        return this.request('PUT', url, data, headers);
    }

    /**
     * Realiza requisição DELETE
     * @param {string} url
     * @param {Object} headers
     * @returns {Promise<Object>}
     */
    async delete(url, headers = {}) {
        return this.request('DELETE', url, null, headers);
    }

    /**
     * Realiza requisição HTTP genérica
     * @param {string} method
     * @param {string} url
     * @param {Object|null} data
     * @param {Object} headers
     * @returns {Promise<Object>}
     */
    async request(method, url, data = null, headers = {}) {
        const fullURL = this.buildURL(url);
        const requestHeaders = { ...this.defaultHeaders, ...headers };

        const options = {
            method,
            headers: requestHeaders
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            console.log(`🌐 HttpClient: ${method} ${fullURL}`);

            const response = await fetch(fullURL, options);

            // Tratar resposta
            const result = await this.handleResponse(response);

            return result;

        } catch (error) {
            console.error(`❌ HttpClient: Erro na requisição ${method} ${fullURL}:`, error);
            throw error;
        }
    }

    /**
     * Trata resposta HTTP
     * @param {Response} response
     * @returns {Promise<Object>}
     */
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');

        // Se for JSON
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.erro || `HTTP ${response.status}`);
            }

            return data;
        }

        // Se for texto
        const text = await response.text();

        if (!response.ok) {
            throw new Error(text || `HTTP ${response.status}`);
        }

        return text;
    }

    /**
     * Constrói URL completa
     * @param {string} url
     * @returns {string}
     */
    buildURL(url) {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        return `${this.baseURL}${url}`;
    }

    /**
     * Define header padrão
     * @param {string} key
     * @param {string} value
     */
    setDefaultHeader(key, value) {
        this.defaultHeaders[key] = value;
    }

    /**
     * Remove header padrão
     * @param {string} key
     */
    removeDefaultHeader(key) {
        delete this.defaultHeaders[key];
    }
}
