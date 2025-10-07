/**
 * 🔐 Repository: Safeweb (Proxy via Backend - SEGURO)
 *
 * VERSÃO 2.0 - SEGURANÇA APRIMORADA
 * - Credenciais NÃO expostas no frontend
 * - Todas chamadas passam pelo backend Python (localhost:8082)
 * - CPF mascarado em logs
 *
 * Responsabilidades:
 * - Verificação de biometria PSBio
 * - Consulta prévia na RFB (CPF + Data de Nascimento)
 * - Geração de protocolo para emissão de certificado
 *
 * SOLID:
 * - SRP: Responsável apenas pela comunicação com backend proxy
 * - DIP: Implementa interface ISafewebRepository
 *
 * Patterns:
 * - Repository Pattern: Abstrai acesso aos dados externos
 * - Proxy Pattern: Backend intermedia chamadas à Safeweb
 */

import { ISafewebRepository } from '../../domain/repositories/ISafewebRepository.js';

export class SafewebRepository extends ISafewebRepository {
    constructor() {
        super();
        this.backendURL = 'http://localhost:8082';
    }

    /**
     * Mascara CPF para logs (protege privacidade)
     */
    _maskCPF(cpf) {
        if (!cpf || cpf.length !== 11) return cpf;
        return `${cpf.substring(0, 3)}.***.*${cpf.substring(9, 11)}`;
    }

    /**
     * Verifica se CPF possui biometria cadastrada
     * @param {string} cpf - CPF com ou sem máscara
     * @returns {Promise<Object>}
     */
    async verificarBiometria(cpf) {
        try {
            const cpfLimpo = cpf.replace(/\D/g, '');

            if (cpfLimpo.length !== 11) {
                throw new Error('CPF deve ter 11 dígitos');
            }

            console.log('🔍 SafewebRepository: Verificando biometria para CPF:', this._maskCPF(cpfLimpo));

            const response = await fetch(`${this.backendURL}/api/safeweb/verificar-biometria`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cpf: cpfLimpo })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.erro || `Erro HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.sucesso) {
                throw new Error(data.erro || 'Erro ao verificar biometria');
            }

            const temBiometria = data.temBiometria;

            console.log(`${temBiometria ? '✅' : '⚠️'} SafewebRepository: CPF ${this._maskCPF(cpfLimpo)} ${temBiometria ? 'possui' : 'não possui'} biometria`);

            return {
                temBiometria,
                mensagem: data.mensagem
            };

        } catch (error) {
            console.error('❌ SafewebRepository: Erro ao verificar biometria:', error);
            throw error;
        }
    }

    /**
     * Consulta CPF na Receita Federal
     * @param {string} cpf - CPF com ou sem máscara
     * @param {string} dataNascimento - Data no formato YYYY-MM-DD ou DD/MM/YYYY
     * @returns {Promise<Object>}
     */
    async consultarCPF(cpf, dataNascimento) {
        try {
            const cpfLimpo = cpf.replace(/\D/g, '');
            const dataFormatada = this.formatarData(dataNascimento);

            if (cpfLimpo.length !== 11) {
                throw new Error('CPF deve ter 11 dígitos');
            }

            if (!dataFormatada) {
                throw new Error('Data de nascimento inválida');
            }

            console.log('🔍 SafewebRepository: Consultando CPF na RFB:', this._maskCPF(cpfLimpo));

            const response = await fetch(`${this.backendURL}/api/safeweb/consultar-cpf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cpf: cpfLimpo,
                    dataNascimento: dataFormatada
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.erro || `Erro HTTP ${response.status}`);
            }

            const resultado = await response.json();

            // Se a consulta teve erro técnico (não conseguiu consultar)
            if (resultado.sucesso === false && resultado.erro) {
                console.error('❌ SafewebRepository: Erro técnico -', resultado.erro);
                throw new Error(resultado.erro);
            }

            // Se CPF é inválido (código != 0), mas a consulta funcionou
            if (!resultado.valido) {
                console.warn('⚠️ SafewebRepository: CPF inválido -', resultado.mensagem);
                // Retornar resultado completo (controller exibe a mensagem)
                return resultado;
            }

            // CPF válido (código 0)
            console.log('✅ SafewebRepository: CPF válido -', resultado.nome);
            return resultado;

        } catch (error) {
            console.error('❌ SafewebRepository: Erro ao consultar CPF:', error);
            throw error;
        }
    }

    /**
     * Gera protocolo de solicitação de certificado e-CPF A1
     * @param {Object} dadosCompletos - Dados completos do cliente
     * @returns {Promise<Object>}
     */
    async gerarProtocolo(dadosCompletos) {
        try {
            console.log('📝 SafewebRepository: Gerando protocolo...');

            // Preparar payload para o backend
            const payload = {
                cpf: dadosCompletos.cliente.cpf.replace(/\D/g, ''),
                nome: dadosCompletos.cliente.nome,
                nascimento: this.formatarData(dadosCompletos.cliente.dataNascimento),
                email: dadosCompletos.cliente.email,
                telefone: dadosCompletos.cliente.telefone.replace(/\D/g, ''),
                cep: dadosCompletos.cliente.endereco.cep.replace(/\D/g, ''),
                endereco: dadosCompletos.cliente.endereco.logradouro,
                numero: dadosCompletos.cliente.endereco.numero,
                complemento: dadosCompletos.cliente.endereco.complemento || '',
                bairro: dadosCompletos.cliente.endereco.bairro,
                cidade: dadosCompletos.cliente.endereco.cidade,
                estado: dadosCompletos.cliente.endereco.uf
            };

            console.log('📤 SafewebRepository: Enviando protocolo para CPF:', this._maskCPF(payload.cpf));

            const response = await fetch(`${this.backendURL}/api/safeweb/gerar-protocolo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.erro || `Erro HTTP ${response.status}`);
            }

            const resultado = await response.json();

            if (!resultado.sucesso) {
                throw new Error(resultado.erro || 'Erro ao gerar protocolo');
            }

            console.log('✅ SafewebRepository: Protocolo gerado com sucesso:', resultado.protocolo);

            return {
                sucesso: true,
                protocolo: resultado.protocolo,
                mensagem: resultado.mensagem || 'Protocolo gerado com sucesso'
            };

        } catch (error) {
            console.error('❌ SafewebRepository: Erro ao gerar protocolo:', error);
            throw error;
        }
    }

    /**
     * Formata data para o padrão da API (YYYY-MM-DD)
     * @param {string} data - Data em qualquer formato
     * @returns {string|null}
     */
    formatarData(data) {
        if (!data) return null;

        // Se já está no formato YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
            return data;
        }

        // Se está no formato DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
            const [dia, mes, ano] = data.split('/');
            return `${ano}-${mes}-${dia}`;
        }

        // Se está no formato DDMMYYYY
        if (/^\d{8}$/.test(data)) {
            const dia = data.substring(0, 2);
            const mes = data.substring(2, 4);
            const ano = data.substring(4, 8);
            return `${ano}-${mes}-${dia}`;
        }

        return null;
    }
}
