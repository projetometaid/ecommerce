/**
 * 📍 Repository: CEP (Implementação)
 *
 * Implementa busca de endereço via ViaCEP
 * Pattern: Repository Pattern + Adapter Pattern
 * SOLID: Dependency Inversion - Implementa ICEPRepository
 */

import { ICEPRepository } from '../../domain/repositories/ICEPRepository.js';
import { HttpClient } from '../http/HttpClient.js';

export class CEPRepository extends ICEPRepository {
    constructor() {
        super();
        this.httpClient = new HttpClient('https://viacep.com.br/ws');
    }

    /**
     * Busca endereço pelo CEP
     * @param {string} cep - CEP com ou sem máscara
     * @returns {Promise<{sucesso: boolean, endereco?: Object, erro?: string}>}
     */
    async buscarEnderecoPorCEP(cep) {
        try {
            // Sanitizar CEP
            const cepLimpo = cep.replace(/\D/g, '');

            // Validar formato
            if (!this.validarCEP(cepLimpo)) {
                return {
                    sucesso: false,
                    erro: 'CEP inválido. Deve conter 8 dígitos'
                };
            }

            console.log('📍 CEPRepository: Buscando CEP:', cepLimpo);

            // Buscar na API ViaCEP
            const response = await this.httpClient.get(`/${cepLimpo}/json/`);

            // ViaCEP retorna {erro: true} quando CEP não existe
            if (response.erro) {
                console.warn('⚠️ CEPRepository: CEP não encontrado');

                return {
                    sucesso: false,
                    erro: 'CEP não encontrado'
                };
            }

            console.log('✅ CEPRepository: Endereço encontrado:', response);

            // Normalizar resposta
            const endereco = {
                cep: cepLimpo,
                logradouro: response.logradouro || '',
                complemento: response.complemento || '',
                bairro: response.bairro || '',
                cidade: response.localidade || '',
                estado: response.uf || '',
                ibge: response.ibge || ''
            };

            return {
                sucesso: true,
                endereco
            };

        } catch (error) {
            console.error('❌ CEPRepository: Erro ao buscar CEP:', error.message);

            return {
                sucesso: false,
                erro: `Erro ao buscar CEP: ${error.message}`
            };
        }
    }

    /**
     * Valida formato do CEP
     * @param {string} cep - CEP apenas números
     * @returns {boolean}
     */
    validarCEP(cep) {
        if (!cep) return false;

        // Remover caracteres não numéricos
        const cepLimpo = cep.replace(/\D/g, '');

        // Deve ter 8 dígitos
        return cepLimpo.length === 8;
    }
}
