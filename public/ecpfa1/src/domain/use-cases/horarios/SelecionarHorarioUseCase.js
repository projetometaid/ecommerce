/**
 * 🎯 Use Case: Selecionar Horário
 *
 * Regra de negócio: Selecionar horário disponível para videoconferência
 * Pattern: Use Case Pattern
 * SOLID: Single Responsibility - Uma única responsabilidade bem definida
 */

import { Horario } from '../../entities/Horario.js';

export class SelecionarHorarioUseCase {
    /**
     * @param {ICheckoutRepository} checkoutRepository
     */
    constructor(checkoutRepository) {
        this.checkoutRepository = checkoutRepository;
    }

    /**
     * Executa o caso de uso
     * @param {Horario} horario - Horário a ser selecionado
     * @returns {Promise<{sucesso: boolean, horario?: Horario, erro?: string}>}
     */
    async execute(horario) {
        try {
            // Validar se horário é válido
            if (!horario || !(horario instanceof Horario)) {
                return {
                    sucesso: false,
                    erro: 'Horário inválido'
                };
            }

            // Validar se horário está disponível
            if (!horario.isAvailable()) {
                return {
                    sucesso: false,
                    erro: 'Horário não está disponível'
                };
            }

            // Validar formato do horário
            if (!horario.isValid()) {
                return {
                    sucesso: false,
                    erro: 'Formato de horário inválido'
                };
            }

            // Salvar horário selecionado
            await this.checkoutRepository.salvarStep('horario', {
                horario: horario.time,
                data: horario.date.toISOString()
            });

            return {
                sucesso: true,
                horario: horario
            };

        } catch (error) {
            console.error('❌ SelecionarHorarioUseCase:', error);
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }

    /**
     * Obtém lista de horários disponíveis
     * @returns {Horario[]}
     */
    getHorariosDisponiveis() {
        return Horario.createDefaultSchedule();
    }

    /**
     * Carrega horário selecionado anteriormente
     * @returns {Promise<Horario|null>}
     */
    async carregarHorarioSelecionado() {
        try {
            const dadosSalvos = await this.checkoutRepository.carregarStep('horario');

            if (!dadosSalvos || !dadosSalvos.horario) {
                return null;
            }

            return Horario.fromTimeString(
                dadosSalvos.horario,
                true
            );

        } catch (error) {
            console.error('❌ Erro ao carregar horário:', error);
            return null;
        }
    }
}
