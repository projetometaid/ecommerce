/**
 * 🎨 View: Step 1 - Horários
 *
 * Responsável por renderizar a interface do Step 1
 * Pattern: MVC - View
 * SOLID: Single Responsibility - Apenas renderização
 */

export class Step1View {
    constructor(containerElement) {
        this.container = containerElement;
        this.horariosListElement = null;
    }

    /**
     * Renderiza lista de horários
     * @param {Horario[]} horarios - Array de horários
     */
    renderHorarios(horarios) {
        this.horariosListElement = this.container.querySelector('#horarios-list');

        if (!this.horariosListElement) {
            console.error('❌ Step1View: Elemento #horarios-list não encontrado');
            return;
        }

        // Limpar horários anteriores
        this.horariosListElement.innerHTML = '';

        // Renderizar cada horário
        horarios.forEach(horario => {
            const horarioElement = this.createHorarioElement(horario);
            this.horariosListElement.appendChild(horarioElement);
        });

        console.log(`✅ Step1View: ${horarios.length} horários renderizados`);
    }

    /**
     * Cria elemento HTML de um horário
     * @param {Horario} horario
     * @returns {HTMLElement}
     */
    createHorarioElement(horario) {
        const element = document.createElement('div');
        element.className = `horario-item ${!horario.isAvailable() ? 'disabled' : ''}`;
        element.textContent = horario.getTimeFormatted();
        element.dataset.horario = horario.time;

        // Adicionar atributo de disponibilidade
        if (!horario.isAvailable()) {
            element.setAttribute('aria-disabled', 'true');
        }

        return element;
    }

    /**
     * Marca um horário como selecionado
     * @param {string} timeString - Horário no formato HH:MM
     */
    markAsSelected(timeString) {
        // Remove seleção anterior
        this.clearSelection();

        // Adiciona seleção atual
        const horarioElement = this.container.querySelector(`[data-horario="${timeString}"]`);
        if (horarioElement && !horarioElement.classList.contains('disabled')) {
            horarioElement.classList.add('selected');
        }
    }

    /**
     * Remove seleção de todos os horários
     */
    clearSelection() {
        const selectedElements = this.container.querySelectorAll('.horario-item.selected');
        selectedElements.forEach(el => el.classList.remove('selected'));
    }

    /**
     * Habilita botão "Continuar"
     */
    enableContinueButton() {
        const btnNext = this.container.querySelector('#btn-step1-next');
        if (btnNext) {
            btnNext.disabled = false;
        }
    }

    /**
     * Desabilita botão "Continuar"
     */
    disableContinueButton() {
        const btnNext = this.container.querySelector('#btn-step1-next');
        if (btnNext) {
            btnNext.disabled = true;
        }
    }

    /**
     * Mostra mensagem de erro
     * @param {string} message
     */
    showError(message) {
        // Remover erro anterior
        this.hideError();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 12px;
            margin: 16px 0;
            font-size: 14px;
        `;

        // Inserir antes do botão
        const btnNext = this.container.querySelector('#btn-step1-next');
        if (btnNext && btnNext.parentNode) {
            btnNext.parentNode.insertBefore(errorDiv, btnNext.parentNode.firstChild);
        }
    }

    /**
     * Esconde mensagem de erro
     */
    hideError() {
        const errorDiv = this.container.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    /**
     * Mostra loading
     */
    showLoading() {
        if (this.horariosListElement) {
            this.horariosListElement.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div class="loading-spinner" style="margin: 0 auto 16px;"></div>
                    <p>Carregando horários...</p>
                </div>
            `;
        }
    }

    /**
     * Mostra mensagem de horários indisponíveis
     */
    showNoHorarios() {
        if (this.horariosListElement) {
            this.horariosListElement.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <p>⚠️ Nenhum horário disponível no momento.</p>
                    <p style="font-size: 14px; margin-top: 8px;">Por favor, tente novamente mais tarde.</p>
                </div>
            `;
        }
    }

    /**
     * Obtém elemento do container
     * @returns {HTMLElement}
     */
    getContainer() {
        return this.container;
    }
}
