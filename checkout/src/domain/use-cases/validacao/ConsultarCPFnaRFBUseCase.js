/**
 * 🎯 Use Case: Consultar CPF na RFB
 *
 * Valida CPF e data de nascimento na Receita Federal
 */

export class ConsultarCPFnaRFBUseCase {
    constructor(safewebRepository) {
        this.safewebRepository = safewebRepository;
    }

    async execute(cpf, dataNascimento) {
        if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
            return {
                sucesso: false,
                erro: 'CPF inválido'
            };
        }

        if (!dataNascimento || dataNascimento.length < 8) {
            return {
                sucesso: false,
                erro: 'Data de nascimento inválida'
            };
        }

        const cpfLimpo = cpf.replace(/\D/g, '');
        const resultado = await this.safewebRepository.consultarCPF(cpfLimpo, dataNascimento);

        return {
            sucesso: resultado.valido,
            ...resultado
        };
    }
}
