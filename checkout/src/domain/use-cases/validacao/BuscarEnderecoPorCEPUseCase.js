/**
 * 🎯 Use Case: Buscar Endereço por CEP
 *
 * Busca endereço completo via CEP
 */

export class BuscarEnderecoPorCEPUseCase {
    constructor(cepRepository) {
        this.cepRepository = cepRepository;
    }

    async execute(cep) {
        if (!cep) {
            return {
                sucesso: false,
                erro: 'CEP não informado'
            };
        }

        const resultado = await this.cepRepository.buscarEnderecoPorCEP(cep);
        return resultado;
    }
}
