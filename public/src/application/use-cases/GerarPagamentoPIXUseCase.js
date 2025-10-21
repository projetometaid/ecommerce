/**
 * 🎯 Use Case: Gerar Pagamento PIX
 *
 * Regras de negócio para geração de pagamento PIX
 */

export class GerarPagamentoPIXUseCase {
    constructor(safe2PayRepository) {
        this.safe2PayRepository = safe2PayRepository;
    }

    /**
     * Executa a geração do pagamento PIX
     * @param {Object} checkoutData - Dados completos do checkout
     * @returns {Promise<Object>} Resultado com dados do PIX
     */
    async execute(checkoutData) {
        try {
            // Validar dados obrigatórios
            this.validar(checkoutData);

            // Extrair dados necessários
            const { certificado, protocolo, cliente, pagador } = checkoutData;

            // Determinar quem é o pagador (titular ou outra pessoa)
            const dadosPagador = pagador?.usarDadosUsuario
                ? cliente
                : (pagador?.dados || cliente);

            // Preparar dados do pagamento para o backend (incluindo endereço)
            const dadosPagamento = {
                nomeCompleto: dadosPagador.nome || dadosPagador.razaoSocial,
                cpf: dadosPagador.cpf || dadosPagador.cnpj,
                email: dadosPagador.email || cliente.email,
                telefone: dadosPagador.telefone || cliente.telefone,
                valor: certificado.preco,
                // ID do produto (usado para validação no backend)
                product_id: certificado.codigo || 'ecpf-a1',
                // Número do protocolo Safeweb (para usar como Reference no PIX)
                protocolo: protocolo?.numero || protocolo,
                // Dados de endereço do cliente
                cep: cliente.endereco?.cep || '',
                endereco: cliente.endereco?.logradouro || '',
                numero: cliente.endereco?.numero || '',
                complemento: cliente.endereco?.complemento || '',
                bairro: cliente.endereco?.bairro || '',
                cidade: cliente.endereco?.cidade || '',
                uf: cliente.endereco?.getUF ? cliente.endereco.getUF() : (cliente.endereco?.estado || '')
            };

            // 🔒 Log seguro com dados mascarados
            console.log('💳 GerarPagamentoPIXUseCase: Gerando PIX...', dadosPagamento);

            // Criar PIX via Safe2Pay (backend)
            const resultado = await this.safe2PayRepository.criarPagamentoPIX(dadosPagamento);

            if (!resultado.sucesso) {
                throw new Error(resultado.erro || 'Erro ao gerar PIX');
            }

            console.log('✅ GerarPagamentoPIXUseCase: PIX gerado com sucesso');

            return {
                sucesso: true,
                pagamento: {
                    transactionId: resultado.transactionId,
                    qrCodeImage: resultado.qrCodeImage,
                    qrCode: resultado.qrCode,
                    pixCopiaECola: resultado.pixCopiaECola,
                    valor: resultado.valor,
                    referencia: resultado.referencia,
                    dataExpiracao: resultado.dataExpiracao,
                    protocolo: protocolo,
                    nomeTitular: cliente.nome
                }
            };

        } catch (error) {
            console.error('❌ GerarPagamentoPIXUseCase: Erro', error);
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }

    /**
     * Valida dados antes de gerar PIX
     */
    validar(checkoutData) {
        if (!checkoutData) {
            throw new Error('Dados do checkout são obrigatórios');
        }

        if (!checkoutData.certificado || !checkoutData.certificado.preco) {
            throw new Error('Certificado com preço é obrigatório');
        }

        if (!checkoutData.protocolo) {
            throw new Error('Protocolo Safeweb é obrigatório');
        }

        if (!checkoutData.cliente || !checkoutData.cliente.nome) {
            throw new Error('Dados do cliente são obrigatórios');
        }
    }
}
