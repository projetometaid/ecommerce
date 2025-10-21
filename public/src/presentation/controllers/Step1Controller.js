/**
 * 🎮 Controller: Step 1 - Horários
 *
 * Orquestra View e Use Case do Step 1
 * Pattern: MVC - Controller
 * SOLID: Single Responsibility - Apenas coordenação
 */

import { Step1View } from '../views/Step1View.js';
import { Horario } from '../../domain/entities/Horario.js';
import { gtmService } from '../../shared/utils/GTMService.js';
import { DateSelector } from '../../shared/utils/DateSelector.js';

export class Step1Controller {
    /**
     * @param {SelecionarHorarioUseCase} selecionarHorarioUseCase
     */
    constructor(selecionarHorarioUseCase) {
        this.useCase = selecionarHorarioUseCase;
        this.view = null;
        this.dateSelector = null;
        this.horarioSelecionado = null;
        this.horarios = [];
        this.selectedDate = new Date(); // Data selecionada (padrão: hoje)
    }

    /**
     * Inicializa o Step 1
     * @param {HTMLElement} containerElement
     */
    async init(containerElement) {
        console.log('🚀 Step1Controller: Inicializando...');

        // Criar view
        this.view = new Step1View(containerElement);

        // Inicializar DateSelector
        this.dateSelector = new DateSelector();

        // Configurar listener para mudança de data
        this.setupDateListener();

        // Carregar horários
        await this.loadHorarios();

        // Tentar carregar horário previamente selecionado
        await this.loadSavedHorario();

        // Configurar eventos
        this.setupEvents();

        console.log('✅ Step1Controller: Inicializado com sucesso');
    }

    /**
     * Carrega lista de horários disponíveis
     */
    async loadHorarios() {
        try {
            this.view.showLoading();

            // Obter horários do Use Case
            this.horarios = this.useCase.getHorariosDisponiveis();

            if (this.horarios.length === 0) {
                this.view.showNoHorarios();
                return;
            }

            // Renderizar horários
            this.view.renderHorarios(this.horarios);

            console.log(`✅ Step1Controller: ${this.horarios.length} horários carregados`);

        } catch (error) {
            console.error('❌ Step1Controller: Erro ao carregar horários:', error);
            this.view.showError('Erro ao carregar horários. Tente novamente.');
        }
    }

    /**
     * Carrega horário previamente selecionado
     */
    async loadSavedHorario() {
        try {
            const horarioSalvo = await this.useCase.carregarHorarioSelecionado();

            if (horarioSalvo) {
                this.horarioSelecionado = horarioSalvo;
                this.view.markAsSelected(horarioSalvo.time);
                this.view.enableContinueButton();
                console.log('✅ Step1Controller: Horário salvo restaurado:', horarioSalvo.time);
            }

        } catch (error) {
            console.error('❌ Step1Controller: Erro ao carregar horário salvo:', error);
        }
    }

    /**
     * Configura eventos da view
     */
    setupEvents() {
        const container = this.view.getContainer();

        // Evento de clique nos horários
        container.addEventListener('click', (e) => {
            const horarioElement = e.target.closest('.horario-item');

            if (horarioElement && !horarioElement.classList.contains('disabled')) {
                this.handleHorarioClick(horarioElement);
            }
        });

        console.log('✅ Step1Controller: Eventos configurados');
    }

    /**
     * Configura listener para mudança de data
     */
    setupDateListener() {
        document.addEventListener('dateSelected', (e) => {
            this.selectedDate = e.detail.date;
            console.log('📅 Step1Controller: Data alterada para', e.detail.dateString);

            // Recarregar horários para a nova data
            this.loadHorarios();

            // Limpar seleção de horário anterior
            this.clearSelection();
        });
    }

    /**
     * Trata clique em um horário
     * @param {HTMLElement} horarioElement
     */
    async handleHorarioClick(horarioElement) {
        try {
            const timeString = horarioElement.dataset.horario;

            if (!timeString) {
                console.error('❌ Step1Controller: Horário sem data-horario');
                return;
            }

            // Encontrar horário correspondente
            const horario = this.horarios.find(h => h.time === timeString);

            if (!horario) {
                console.error('❌ Step1Controller: Horário não encontrado:', timeString);
                return;
            }

            // Executar use case
            const resultado = await this.useCase.execute(horario);

            if (resultado.sucesso) {
                this.horarioSelecionado = resultado.horario;
                this.view.markAsSelected(timeString);
                this.view.enableContinueButton();
                this.view.hideError();

                // 📊 Disparar evento GTM: Horário selecionado
                gtmService.trackSelectSchedule(
                    timeString,
                    this.horarioSelecionado.date ? this.horarioSelecionado.date.toISOString().split('T')[0] : 'N/A'
                );

                // 📊 Disparar evento GTM: Início do checkout
                gtmService.trackBeginCheckout({
                    codigo: 'ecpf-a1',
                    nome: 'e-CPF A1 (1 ano)',
                    tipo: 'e-CPF',
                    preco: 5.00
                });

                console.log('✅ Step1Controller: Horário selecionado:', timeString);
            } else {
                this.view.showError(resultado.erro || 'Erro ao selecionar horário');
                console.error('❌ Step1Controller:', resultado.erro);
            }

        } catch (error) {
            console.error('❌ Step1Controller: Erro ao tratar clique:', error);
            this.view.showError('Erro ao selecionar horário. Tente novamente.');
        }
    }

    /**
     * Valida se pode avançar para próximo step
     * @returns {boolean}
     */
    canProceed() {
        return this.horarioSelecionado !== null;
    }

    /**
     * Retorna horário selecionado
     * @returns {Horario|null}
     */
    getSelectedHorario() {
        return this.horarioSelecionado;
    }

    /**
     * Limpa seleção
     */
    clearSelection() {
        this.horarioSelecionado = null;
        this.view.clearSelection();
        this.view.disableContinueButton();
    }

    /**
     * Destrói o controller (cleanup)
     */
    destroy() {
        this.view = null;
        this.horarioSelecionado = null;
        this.horarios = [];
        console.log('🧹 Step1Controller: Destruído');
    }
}
