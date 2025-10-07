/**
 * 🎮 Controller: Step 4 - Resumo do Pedido
 *
 * Orquestra View do Step 4 (Resumo)
 */

import { Step4View } from '../views/Step4View.js';

export class Step4Controller {
    constructor(checkoutData) {
        this.checkoutData = checkoutData;
        this.view = null;
    }

    async init(containerElement) {
        console.log('🚀 Step4Controller: Inicializando...');

        this.view = new Step4View(containerElement);
        this.view.render(this.checkoutData);

        this.validateData();

        console.log('✅ Step4Controller: Inicializado');
    }

    /**
     * Valida se todos os dados estão completos
     */
    validateData() {
        const isValid = this.isDataComplete();
        console.log('🔍 Step4Controller: Validação =', isValid);
        console.log('📦 Step4Controller: Dados do checkout:', this.checkoutData);
        this.view.setButtonState(isValid);
        return isValid;
    }

    /**
     * Verifica se os dados estão completos
     */
    isDataComplete() {
        const { horario, cliente, pagador, protocolo } = this.checkoutData;

        // Validar horário
        if (!horario || !horario.time) {
            console.warn('⚠️ Step4: Horário não selecionado');
            return false;
        }

        // Validar cliente
        if (!cliente || !cliente.nome || !cliente.cpf) {
            console.warn('⚠️ Step4: Dados do cliente incompletos');
            return false;
        }

        // Validar protocolo
        if (!protocolo) {
            console.warn('⚠️ Step4: Protocolo não gerado');
            return false;
        }

        // Validar pagador
        const mesmoPagador = pagador?.usarDadosUsuario === true;
        if (!mesmoPagador) {
            // Se pagador diferente, verificar dados
            if (!pagador?.dados) {
                console.warn('⚠️ Step4: Dados do pagador não informados');
                return false;
            }

            const tipoPagador = pagador.tipoPessoa || 'fisica';
            const dadosPagador = pagador.dados;

            if (tipoPagador === 'fisica') {
                if (!dadosPagador.nome || !dadosPagador.cpf) {
                    console.warn('⚠️ Step4: Dados do pagador PF incompletos');
                    return false;
                }
            } else {
                if (!dadosPagador.razaoSocial || !dadosPagador.cnpj) {
                    console.warn('⚠️ Step4: Dados do pagador PJ incompletos');
                    return false;
                }
            }
        }

        console.log('✅ Step4: Dados completos e validados');
        return true;
    }

    /**
     * Pode avançar para próximo step?
     */
    canProceed() {
        return this.isDataComplete();
    }

    destroy() {
        this.view = null;
    }
}
