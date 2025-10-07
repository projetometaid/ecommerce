/**
 * 🕐 Entidade: Horário de Atendimento
 *
 * Representa um horário disponível para videoconferência
 * Pattern: Value Object
 * SOLID: Single Responsibility - Apenas dados do horário
 */

export class Horario {
    /**
     * @param {string} time - Horário no formato HH:MM
     * @param {boolean} available - Se o horário está disponível
     * @param {Date} date - Data do horário (opcional)
     */
    constructor(time, available = true, date = null) {
        this.time = time;
        this.available = available;
        this.date = date || new Date();
    }

    /**
     * Valida se o horário é válido
     * @returns {boolean}
     */
    isValid() {
        // Validar formato HH:MM
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        return timeRegex.test(this.time);
    }

    /**
     * Verifica se o horário está disponível
     * @returns {boolean}
     */
    isAvailable() {
        return this.available === true;
    }

    /**
     * Retorna horário formatado
     * @returns {string}
     */
    getTimeFormatted() {
        return this.time;
    }

    /**
     * Retorna data + horário formatado
     * @returns {string}
     */
    getFullDateTime() {
        const dateStr = this.date.toLocaleDateString('pt-BR');
        return `${dateStr} às ${this.time}`;
    }

    /**
     * Marca horário como indisponível
     */
    markAsUnavailable() {
        this.available = false;
    }

    /**
     * Marca horário como disponível
     */
    markAsAvailable() {
        this.available = true;
    }

    /**
     * Converte para objeto plano
     * @returns {Object}
     */
    toJSON() {
        return {
            time: this.time,
            available: this.available,
            date: this.date.toISOString()
        };
    }

    /**
     * Cria instância a partir de objeto plano
     * @param {Object} data
     * @returns {Horario}
     */
    static fromJSON(data) {
        return new Horario(
            data.time,
            data.available,
            data.date ? new Date(data.date) : new Date()
        );
    }

    /**
     * Factory: Cria lista de horários padrão
     * @returns {Horario[]}
     */
    static createDefaultSchedule() {
        const horarios = [
            { time: '08:00', available: true },
            { time: '08:30', available: true },
            { time: '09:00', available: false },
            { time: '09:30', available: true },
            { time: '10:00', available: true },
            { time: '10:30', available: false },
            { time: '11:00', available: true },
            { time: '11:30', available: true },
            { time: '13:00', available: true },
            { time: '13:30', available: false },
            { time: '14:00', available: true },
            { time: '14:30', available: true },
            { time: '15:00', available: true },
            { time: '15:30', available: false },
            { time: '16:00', available: true },
            { time: '16:30', available: true }
        ];

        return horarios.map(h => new Horario(h.time, h.available));
    }

    /**
     * Factory: Cria horário a partir de string HH:MM
     * @param {string} timeString
     * @param {boolean} available
     * @returns {Horario}
     */
    static fromTimeString(timeString, available = true) {
        return new Horario(timeString, available);
    }
}
