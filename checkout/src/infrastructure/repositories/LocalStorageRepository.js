/**
 * 💾 Repository: LocalStorage (Implementação)
 *
 * Implementa persistência de dados do checkout no localStorage
 * Pattern: Repository Pattern (implementação concreta)
 * SOLID: Dependency Inversion - Implementa interface ICheckoutRepository
 *
 * 🔐 SEGURANÇA: Dados sensíveis são criptografados com AES-256
 * - CPF/CNPJ criptografados
 * - E-mail criptografado
 * - Telefone criptografado
 * - Outros dados permanecem em plaintext para debug
 */

import { ICheckoutRepository } from '../../domain/repositories/ICheckoutRepository.js';
import { cryptoUtil } from '../../shared/utils/CryptoUtil.js';

export class LocalStorageRepository extends ICheckoutRepository {
    constructor() {
        super();
        this.storageKey = 'checkout_progress';

        // Lista de campos sensíveis que devem ser criptografados
        this.sensitiveFields = [
            'cpf',
            'cnpj',
            'cpfResponsavel',
            'email',
            'telefone',
            'dataNascimento'
        ];
    }

    /**
     * Criptografa campos sensíveis de um objeto
     * @param {Object} data - Dados a processar
     * @returns {Object} Dados com campos sensíveis criptografados
     */
    _encryptSensitiveFields(data) {
        if (!data || typeof data !== 'object') return data;

        const encrypted = { ...data };

        // Percorrer todos os campos
        for (const [key, value] of Object.entries(encrypted)) {
            if (this.sensitiveFields.includes(key) && value) {
                encrypted[key] = cryptoUtil.encrypt(String(value));
            } else if (typeof value === 'object' && value !== null) {
                // Recursivo para objetos aninhados
                encrypted[key] = this._encryptSensitiveFields(value);
            }
        }

        return encrypted;
    }

    /**
     * Descriptografa campos sensíveis de um objeto
     * @param {Object} data - Dados criptografados
     * @returns {Object} Dados descriptografados
     */
    _decryptSensitiveFields(data) {
        if (!data || typeof data !== 'object') return data;

        const decrypted = { ...data };

        // Percorrer todos os campos
        for (const [key, value] of Object.entries(decrypted)) {
            if (this.sensitiveFields.includes(key) && value) {
                decrypted[key] = cryptoUtil.decrypt(String(value));
            } else if (typeof value === 'object' && value !== null) {
                // Recursivo para objetos aninhados
                decrypted[key] = this._decryptSensitiveFields(value);
            }
        }

        return decrypted;
    }

    /**
     * Salva dados completos do checkout
     * @param {Object} checkoutData
     * @returns {Promise<{sucesso: boolean, erro?: string}>}
     */
    async salvarCheckout(checkoutData) {
        try {
            const progressData = {
                currentStep: checkoutData.currentStep || 1,
                formData: checkoutData.formData || {},
                timestamp: new Date().toISOString()
            };

            // 🔐 Criptografar campos sensíveis antes de salvar
            const encryptedData = {
                ...progressData,
                formData: this._encryptSensitiveFields(progressData.formData)
            };

            localStorage.setItem(this.storageKey, JSON.stringify(encryptedData));

            console.log('🔐 LocalStorage: Dados salvos com criptografia AES-256');

            return { sucesso: true };

        } catch (error) {
            console.error('❌ LocalStorageRepository: Erro ao salvar checkout:', error);
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }

    /**
     * Carrega dados completos do checkout
     * @returns {Promise<Object|null>}
     */
    async carregarCheckout() {
        try {
            const saved = localStorage.getItem(this.storageKey);

            if (!saved) {
                return null;
            }

            const progressData = JSON.parse(saved);

            // Verificar se não é muito antigo (24 horas)
            if (progressData.timestamp) {
                const savedTime = new Date(progressData.timestamp);
                const now = new Date();
                const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

                if (hoursDiff > 24) {
                    console.log('⚠️ Dados do checkout expirados (>24h), limpando...');
                    await this.limparCheckout();
                    return null;
                }
            }

            // 🔓 Descriptografar campos sensíveis
            const decryptedData = {
                ...progressData,
                formData: this._decryptSensitiveFields(progressData.formData)
            };

            console.log('🔓 LocalStorage: Dados carregados e descriptografados');

            return decryptedData;

        } catch (error) {
            console.error('❌ LocalStorageRepository: Erro ao carregar checkout:', error);
            return null;
        }
    }

    /**
     * Limpa todos os dados do checkout
     * @returns {Promise<{sucesso: boolean}>}
     */
    async limparCheckout() {
        try {
            localStorage.removeItem(this.storageKey);
            return { sucesso: true };

        } catch (error) {
            console.error('❌ LocalStorageRepository: Erro ao limpar checkout:', error);
            return { sucesso: false };
        }
    }

    /**
     * Salva step específico
     * @param {string} stepKey - Chave do step ('horario', 'dados', etc)
     * @param {Object} stepData - Dados do step
     * @returns {Promise<{sucesso: boolean}>}
     */
    async salvarStep(stepKey, stepData) {
        try {
            // Carregar dados atuais (já descriptografados)
            const checkoutData = await this.carregarCheckout() || {
                formData: {},
                timestamp: new Date().toISOString()
            };

            // Atualizar step específico
            checkoutData.formData[stepKey] = stepData;
            checkoutData.timestamp = new Date().toISOString();

            // 🔐 Criptografar campos sensíveis antes de salvar
            const encryptedData = {
                ...checkoutData,
                formData: this._encryptSensitiveFields(checkoutData.formData)
            };

            // Salvar novamente
            localStorage.setItem(this.storageKey, JSON.stringify(encryptedData));

            console.log(`🔐 LocalStorage: Step '${stepKey}' salvo com criptografia`);

            return { sucesso: true };

        } catch (error) {
            console.error(`❌ LocalStorageRepository: Erro ao salvar step '${stepKey}':`, error);
            return { sucesso: false };
        }
    }

    /**
     * Carrega step específico
     * @param {string} stepKey
     * @returns {Promise<Object|null>}
     */
    async carregarStep(stepKey) {
        try {
            const checkoutData = await this.carregarCheckout();

            if (!checkoutData || !checkoutData.formData) {
                return null;
            }

            return checkoutData.formData[stepKey] || null;

        } catch (error) {
            console.error(`❌ LocalStorageRepository: Erro ao carregar step '${stepKey}':`, error);
            return null;
        }
    }

    /**
     * Verifica se há dados salvos
     * @returns {boolean}
     */
    hasData() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    /**
     * Retorna todos os dados salvos (debug)
     * @returns {Object|null}
     */
    getAllData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            return null;
        }
    }
}
