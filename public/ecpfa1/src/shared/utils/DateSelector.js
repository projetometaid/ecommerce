/**
 * 📅 DateSelector - Controla seleção de data (Hoje/Amanhã/Outra data)
 *
 * Funcionalidades:
 * - Três botões: Hoje, Amanhã, Outra data
 * - Calendário interativo para "Outra data"
 * - Apenas dias úteis (segunda a sexta)
 * - Navegação entre meses
 */

export class DateSelector {
    constructor() {
        this.selectedDate = new Date(); // Hoje por padrão
        this.currentMonth = new Date();
        this.calendarContainer = null;
        this.dateButtons = null;

        this.monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        this.init();
    }

    init() {
        this.calendarContainer = document.getElementById('calendar-container');
        this.dateButtons = document.querySelectorAll('.date-option');

        this.bindDateButtons();
        this.bindCalendarNavigation();

        console.log('✅ DateSelector inicializado');
    }

    /**
     * Vincula eventos aos botões de seleção de data
     */
    bindDateButtons() {
        this.dateButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const option = e.target.dataset.option;

                // Remover classe active de todos
                this.dateButtons.forEach(btn => btn.classList.remove('active'));

                // Adicionar active ao clicado
                e.target.classList.add('active');

                // Processar opção selecionada
                this.handleDateOption(option);
            });
        });
    }

    /**
     * Processa opção de data selecionada
     */
    handleDateOption(option) {
        switch(option) {
            case 'hoje':
                this.selectedDate = new Date();
                this.hideCalendar();
                this.notifyDateChange();
                break;

            case 'outra':
                this.showCalendar();
                break;
        }
    }

    /**
     * Mostra calendário
     */
    showCalendar() {
        if (this.calendarContainer) {
            this.calendarContainer.style.display = 'block';
            this.renderCalendar();
        }
    }

    /**
     * Esconde calendário
     */
    hideCalendar() {
        if (this.calendarContainer) {
            this.calendarContainer.style.display = 'none';
        }
    }

    /**
     * Renderiza calendário
     */
    renderCalendar() {
        const monthElement = document.getElementById('calendar-month');
        const daysElement = document.getElementById('calendar-days');

        if (!monthElement || !daysElement) return;

        // Atualizar nome do mês
        const monthName = this.monthNames[this.currentMonth.getMonth()];
        const year = this.currentMonth.getFullYear();
        monthElement.textContent = `${monthName} ${year}`;

        // Limpar dias anteriores
        daysElement.innerHTML = '';

        // Obter total de dias do mês
        const lastDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);

        // Adicionar dias do mês (apenas dias úteis e futuros)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), day);
            const dayOfWeek = date.getDay();

            // Pular fins de semana (0 = domingo, 6 = sábado)
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;

            // Pular datas passadas (não renderizar)
            if (date < today) continue;

            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.dataset.date = date.toISOString();

            // Estrutura: Número + Dia da semana
            dayElement.innerHTML = `
                <span class="calendar-day-number">${day}</span>
                <span class="calendar-day-week">${weekDays[dayOfWeek]}</span>
            `;

            // Marcar hoje
            if (date.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }

            // Adicionar evento de clique
            dayElement.addEventListener('click', () => {
                this.selectDate(date);
            });

            // Marcar data selecionada
            if (this.selectedDate && date.toDateString() === this.selectedDate.toDateString()) {
                dayElement.classList.add('selected');
            }

            daysElement.appendChild(dayElement);
        }
    }

    /**
     * Vincula navegação do calendário (anterior/próximo mês)
     */
    bindCalendarNavigation() {
        const prevButton = document.getElementById('prev-month');
        const nextButton = document.getElementById('next-month');

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
                this.renderCalendar();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
                this.renderCalendar();
            });
        }
    }

    /**
     * Seleciona uma data no calendário
     */
    selectDate(date) {
        this.selectedDate = date;

        // Remover seleção anterior
        const allDays = document.querySelectorAll('.calendar-day');
        allDays.forEach(day => day.classList.remove('selected'));

        // Adicionar seleção na data clicada
        const selectedDay = document.querySelector(`[data-date="${date.toISOString()}"]`);
        if (selectedDay) {
            selectedDay.classList.add('selected');
        }

        this.notifyDateChange();
    }

    /**
     * Notifica mudança de data (dispara evento customizado)
     */
    notifyDateChange() {
        const event = new CustomEvent('dateSelected', {
            detail: {
                date: this.selectedDate,
                dateString: this.formatDate(this.selectedDate)
            }
        });

        document.dispatchEvent(event);

        console.log(`📅 Data selecionada: ${this.formatDate(this.selectedDate)}`);
    }

    /**
     * Formata data (DD/MM/YYYY)
     */
    formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    /**
     * Obtém data selecionada
     */
    getSelectedDate() {
        return this.selectedDate;
    }

    /**
     * Obtém data selecionada formatada
     */
    getSelectedDateFormatted() {
        return this.formatDate(this.selectedDate);
    }
}
