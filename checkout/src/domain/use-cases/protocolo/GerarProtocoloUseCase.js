/**
 * 🎯 Use Case: Gerar Protocolo
 *
 * Gera protocolo de atendimento Safeweb e-CPF A1
 */

import { Protocolo } from '../../entities/Protocolo.js';

export class GerarProtocoloUseCase {
    constructor(safewebRepository, checkoutRepository) {
        this.safewebRepository = safewebRepository;
        this.checkoutRepository = checkoutRepository;
    }

    async execute(dadosCliente) {
        // Validar dados obrigatórios
        if (!this.validarDados(dadosCliente)) {
            return {
                sucesso: false,
                erro: 'Dados incompletos para gerar protocolo'
            };
        }

        // Transformar formData plano para estrutura esperada pelo repository
        const dadosCompletos = {
            cliente: {
                cpf: dadosCliente.cpf,
                nome: dadosCliente.nome,
                dataNascimento: dadosCliente.nascimento,
                email: dadosCliente.email,
                telefone: dadosCliente.telefone,
                temBiometria: dadosCliente.temBiometria || false,
                endereco: {
                    cep: dadosCliente.cep,
                    logradouro: dadosCliente.endereco,
                    numero: dadosCliente.numero,
                    complemento: dadosCliente.complemento || '',
                    bairro: dadosCliente.bairro,
                    cidade: dadosCliente.cidade,
                    uf: dadosCliente.estado
                }
            }
        };

        // Gerar protocolo via Safeweb
        const resultado = await this.safewebRepository.gerarProtocolo(dadosCompletos);

        if (resultado.sucesso) {
            // Criar entidade Protocolo
            const protocolo = Protocolo.fromSafewebResponse(resultado.protocolo);

            // Salvar protocolo no checkout
            await this.checkoutRepository.salvarStep('protocolo', protocolo.toJSON());

            return {
                sucesso: true,
                protocolo: protocolo.numero
            };
        }

        return resultado;
    }

    validarDados(dados) {
        const campos = ['cpf', 'nome', 'email', 'telefone', 'cep', 'endereco', 'numero', 'bairro', 'cidade', 'estado'];
        return campos.every(campo => dados[campo] && dados[campo].toString().trim().length > 0);
    }
}
