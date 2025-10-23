/**
 * 💳 Infrastructure: Safe2PayRepository
 *
 * Repositório para integração com API Safe2Pay (PIX)
 * Realiza a criação de cobranças PIX estáticas via backend
 */
import { Config } from '../../shared/config/Config.js';

export class Safe2PayRepository {
    constructor() {
        const config = new Config();
        this.backendURL = config.safe2pay.backendProxyURL.replace('/api/pix', '');
    }

    /**
     * Cria uma cobrança PIX dinâmica
     * @param {Object} dados - Dados do pagamento
     * @returns {Promise<Object>} Resultado da criação do PIX
     */
    async criarPagamentoPIX(dados) {
        try {
            // PIX DINÂMICO: Enviando dados do usuário para o backend
            const payload = {
                valor: dados.valor || 8.00,
                protocolo: dados.protocolo || '',
                product_id: dados.product_id || 'ecpf-a1',
                // Dados do cliente (aceita ambos os formatos: nomeCompleto e nome_completo)
                nome_completo: dados.nome_completo || dados.nomeCompleto || '',
                cpf: dados.cpf || '',
                email: dados.email || '',
                telefone: dados.telefone || '',
                // Endereço
                cep: dados.cep || '',
                endereco: dados.endereco || '',
                numero: dados.numero || '',
                complemento: dados.complemento || '',
                bairro: dados.bairro || '',
                cidade: dados.cidade || '',
                uf: dados.uf || ''
            };

            console.log('📤 Safe2PayRepository: Criando PIX Dinâmico com dados do usuário via backend...', {
                ...payload,
                cpf: payload.cpf ? '***' + payload.cpf.slice(-3) : '',
                telefone: payload.telefone ? '***' + payload.telefone.slice(-4) : ''
            });

            const response = await fetch(`${this.backendURL}/api/pix/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Backend API erro ${response.status}: ${errorText}`);
            }

            const resultado = await response.json();

            console.log('✅ Safe2PayRepository: PIX criado', resultado);

            // Resposta do backend já está normalizada
            if (resultado.sucesso && resultado.dados) {
                return {
                    sucesso: true,
                    transactionId: resultado.dados.transactionId,
                    qrCodeImage: resultado.dados.qrCodeImage,
                    qrCode: resultado.dados.qrCode,
                    pixCopiaECola: resultado.dados.pixCopiaECola || resultado.dados.qrCode,
                    valor: dados.valor,
                    referencia: resultado.dados.reference,
                    dataExpiracao: null
                };
            } else {
                throw new Error(resultado.erro || 'Erro desconhecido ao criar PIX');
            }

        } catch (error) {
            console.error('❌ Safe2PayRepository: Erro ao criar PIX', error);
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }

    /**
     * Consulta status de um pagamento PIX via backend proxy (SEGURO)
     * @param {string} transactionId - ID da transação
     * @returns {Promise<Object>} Status do pagamento
     */
    async consultarStatusPagamento(transactionId) {
        try {
            console.log('📊 Safe2PayRepository: Consultando status via backend...', transactionId);

            const response = await fetch(`${this.backendURL}/api/pix/status/${transactionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Backend API erro ${response.status}: ${errorText}`);
            }

            const resultado = await response.json();

            console.log('✅ Safe2PayRepository: Status obtido', resultado);

            // Backend já retorna normalizado
            if (resultado.sucesso && resultado.dados) {
                return {
                    sucesso: true,
                    status: resultado.dados.PaymentStatus || resultado.status,
                    statusDescricao: this.getStatusDescricao(resultado.dados.PaymentStatus || resultado.status),
                    transactionId: transactionId,
                    valor: resultado.dados.Amount,
                    dataPagamento: resultado.dados.PaymentDate
                };
            }

            return resultado;

        } catch (error) {
            console.error('❌ Safe2PayRepository: Erro ao consultar status', error);
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }

    /**
     * Retorna descrição do status Safe2Pay
     * @param {number} status - Código do status
     * @returns {string} Descrição
     */
    getStatusDescricao(status) {
        const statusMap = {
            1: 'Pendente',
            2: 'Processando',
            3: 'Aprovado',
            4: 'Cancelado',
            5: 'Rejeitado',
            6: 'Estornado',
            7: 'Pendente de Estorno',
            8: 'Pré Autorizado',
            9: 'Expirado'
        };

        return statusMap[status] || 'Desconhecido';
    }
}
