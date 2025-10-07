/**
 * 🎯 Use Case: Verificar Biometria
 *
 * Verifica se CPF possui biometria facial cadastrada
 */

export class VerificarBiometriaUseCase {
    constructor(safewebRepository) {
        this.safewebRepository = safewebRepository;
    }

    async execute(cpf) {
        if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
            return {
                sucesso: false,
                erro: 'CPF inválido'
            };
        }

        const cpfLimpo = cpf.replace(/\D/g, '');
        const resultado = await this.safewebRepository.verificarBiometria(cpfLimpo);

        return {
            sucesso: true,
            ...resultado
        };
    }
}
