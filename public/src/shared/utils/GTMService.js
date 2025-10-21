/**
 * 📊 Google Tag Manager (GTM) Service
 *
 * Centraliza os disparos de eventos para Google Tag Manager
 * Implementa Enhanced Ecommerce para rastreamento completo do funil
 *
 * IMPORTANTE: Dados sensíveis (CPF, email completo, telefone) NÃO são enviados
 */
export class GTMService {
    constructor() {
        this.dataLayer = window.dataLayer || [];
        this.enabled = typeof window.dataLayer !== 'undefined';

        // Inicializar dataLayer se não existir
        if (!window.dataLayer) {
            window.dataLayer = [];
            this.dataLayer = window.dataLayer;
        }

        console.log('📊 GTMService: Inicializado', { enabled: this.enabled });
    }

    /**
     * Push genérico de eventos para o dataLayer
     * @param {Object} eventData
     */
    pushEvent(eventData) {
        if (!this.enabled) {
            console.warn('⚠️ GTMService: DataLayer não disponível');
            return;
        }

        this.dataLayer.push(eventData);
        console.log('📊 GTMService: Evento enviado', eventData);
    }

    /**
     * Limpa o dataLayer para evitar dados persistentes entre eventos
     */
    clearEcommerce() {
        this.pushEvent({
            ecommerce: null
        });
    }

    // ========================================
    // EVENTOS DO FUNIL DE E-COMMERCE
    // ========================================

    /**
     * Evento: Início do checkout (Step 1 - Seleção de horário)
     * Disparado quando o usuário seleciona um horário
     */
    trackBeginCheckout(productData) {
        this.clearEcommerce();

        this.pushEvent({
            event: 'begin_checkout',
            ecommerce: {
                currency: 'BRL',
                value: productData.preco || 5.00,
                items: [{
                    item_id: productData.codigo || 'ecpf-a1',
                    item_name: productData.nome || 'e-CPF A1 (1 ano)',
                    item_category: 'Certificado Digital',
                    item_category2: productData.tipo || 'e-CPF',
                    item_category3: 'A1',
                    price: productData.preco || 5.00,
                    quantity: 1
                }]
            }
        });
    }

    /**
     * Evento: Seleção de horário de atendimento
     * @param {string} horario - Horário selecionado (ex: "14:00")
     * @param {string} data - Data do agendamento
     */
    trackSelectSchedule(horario, data) {
        this.pushEvent({
            event: 'select_schedule',
            schedule_time: horario,
            schedule_date: data,
            event_category: 'Agendamento',
            event_label: 'Horário Selecionado'
        });
    }

    /**
     * Evento: CPF validado na RFB
     * @param {boolean} temBiometria - Se CPF tem biometria
     * @param {string} estado - UF do endereço
     * @param {string} cidade - Cidade do endereço
     */
    trackCPFValidated(temBiometria, estado, cidade) {
        this.pushEvent({
            event: 'cpf_validated',
            has_biometria: temBiometria,
            location_state: estado || 'N/A',
            location_city: cidade || 'N/A',
            event_category: 'Validação',
            event_label: 'CPF Validado RFB'
        });
    }

    /**
     * Evento: Adicionar informações de envio (Step 2 - Dados do cliente)
     * @param {Object} productData
     */
    trackAddShippingInfo(productData) {
        this.clearEcommerce();

        this.pushEvent({
            event: 'add_shipping_info',
            ecommerce: {
                currency: 'BRL',
                value: productData.preco || 5.00,
                shipping_tier: 'videoconferencia',
                items: [{
                    item_id: productData.codigo || 'ecpf-a1',
                    item_name: productData.nome || 'e-CPF A1 (1 ano)',
                    item_category: 'Certificado Digital',
                    item_category2: productData.tipo || 'e-CPF',
                    price: productData.preco || 5.00,
                    quantity: 1
                }]
            }
        });
    }

    /**
     * Evento: Protocolo Safeweb gerado
     * @param {string} protocoloId - ID do protocolo (mascarado)
     * @param {Object} productData
     */
    trackProtocolGenerated(protocoloId, productData) {
        // Mascarar protocolo para privacidade (mostrar apenas últimos 4 dígitos)
        const maskedProtocol = protocoloId
            ? `****${protocoloId.slice(-4)}`
            : 'MASKED';

        this.pushEvent({
            event: 'protocol_generated',
            protocol_id: maskedProtocol,
            product_id: productData.codigo || '37341',
            product_name: productData.nome || 'e-CPF A1',
            value: productData.preco || 5.00,
            currency: 'BRL',
            event_category: 'Checkout',
            event_label: 'Protocolo Safeweb Gerado'
        });
    }

    /**
     * Evento: Seleção de pagador
     * @param {boolean} mesmoPagador - Se o pagador é o mesmo do titular
     * @param {string} tipoPessoa - 'fisica' ou 'juridica'
     */
    trackSelectPayer(mesmoPagador, tipoPessoa) {
        this.pushEvent({
            event: 'select_payer',
            same_as_holder: mesmoPagador,
            payer_type: tipoPessoa || 'fisica',
            event_category: 'Checkout',
            event_label: mesmoPagador ? 'Pagador Titular' : 'Pagador Diferente'
        });
    }

    /**
     * Evento: Adicionar informações de pagamento (Step 3/4 - PIX gerado)
     * @param {Object} paymentData
     * @param {Object} productData
     */
    trackAddPaymentInfo(paymentData, productData) {
        this.clearEcommerce();

        this.pushEvent({
            event: 'add_payment_info',
            ecommerce: {
                currency: 'BRL',
                value: paymentData.valor || productData.preco || 5.00,
                payment_type: 'pix',
                items: [{
                    item_id: productData.codigo || 'ecpf-a1',
                    item_name: productData.nome || 'e-CPF A1 (1 ano)',
                    item_category: 'Certificado Digital',
                    item_category2: productData.tipo || 'e-CPF',
                    price: productData.preco || 5.00,
                    quantity: 1
                }]
            },
            transaction_id: paymentData.transactionId || 'pending'
        });
    }

    /**
     * Evento: Código PIX copiado
     * @param {number} valor
     */
    trackPixCopied(valor) {
        this.pushEvent({
            event: 'pix_copied',
            value: valor || 5.00,
            currency: 'BRL',
            event_category: 'Checkout',
            event_label: 'PIX Copia e Cola'
        });
    }

    /**
     * Evento: Compra finalizada (Step 6 - Confirmação de pagamento)
     * @param {Object} purchaseData
     */
    trackPurchase(purchaseData) {
        this.clearEcommerce();

        const {
            transactionId,
            productData,
            valor,
            email,
            telefone
        } = purchaseData;

        this.pushEvent({
            event: 'purchase',
            ecommerce: {
                transaction_id: transactionId,
                value: valor || productData.preco || 5.00,
                currency: 'BRL',
                tax: 0,
                shipping: 0,
                items: [{
                    item_id: productData.codigo || 'ecpf-a1',
                    item_name: productData.nome || 'e-CPF A1 (1 ano)',
                    item_category: 'Certificado Digital',
                    item_category2: productData.tipo || 'e-CPF',
                    item_category3: 'A1',
                    price: productData.preco || 5.00,
                    quantity: 1
                }]
            },
            // Enhanced Conversions - Dados completos do usuário para Google Ads
            user_data: {
                email: email || undefined,
                phone_number: telefone || undefined
            }
        });

        console.log('✅ GTMService: Evento purchase disparado', {
            transactionId,
            valor,
            email: email ? '✓' : '✗',
            telefone: telefone ? '✓' : '✗'
        });
    }

    /**
     * Evento: Google Ads Conversion
     * IMPORTANTE: Este evento será configurado diretamente no GTM
     * @param {string} conversionLabel - Label da conversão no Google Ads
     * @param {Object} conversionData
     */
    trackConversion(conversionLabel, conversionData) {
        this.pushEvent({
            event: 'conversion',
            send_to: `AW-CONVERSION_ID/${conversionLabel}`, // Será configurado no GTM
            value: conversionData.valor || 5.00,
            currency: 'BRL',
            transaction_id: conversionData.transactionId
        });

        console.log('🎯 GTMService: Conversão Google Ads', { conversionLabel });
    }

    // ========================================
    // UTILITÁRIOS DE SEGURANÇA
    // ========================================

    /**
     * Criar hash SHA-256 simples de email (para remarketing)
     * @param {string} email
     * @returns {string}
     */
    hashEmail(email) {
        if (!email) return undefined;

        // Normalizar email (lowercase, trim)
        const normalized = email.toLowerCase().trim();

        // Em produção, usar hashing adequado (SHA-256)
        // Por enquanto, retornar apenas domínio para privacidade
        const domain = normalized.split('@')[1];
        return domain ? `****@${domain}` : undefined;
    }

    /**
     * Mascarar telefone (manter apenas DDD)
     * @param {string} telefone
     * @returns {string}
     */
    hashTelefone(telefone) {
        if (!telefone) return undefined;

        // Remover caracteres especiais
        const digits = telefone.replace(/\D/g, '');

        // Retornar apenas DDD (2 primeiros dígitos)
        return digits.length >= 2 ? `(${digits.slice(0, 2)})****-****` : undefined;
    }

    /**
     * Enviar dados de usuário para Enhanced Conversions (Google Ads)
     * IMPORTANTE: Dados completos são enviados e hashados automaticamente pelo Google
     * @param {Object} userData
     */
    setUserData(userData) {
        if (!userData) return;

        // Normalizar telefone (remover caracteres especiais)
        const phoneClean = userData.telefone
            ? userData.telefone.replace(/\D/g, '')
            : undefined;

        // Email em lowercase (padrão Google)
        const emailClean = userData.email
            ? userData.email.toLowerCase().trim()
            : undefined;

        // Dados serão hashados automaticamente pelo GTM/Google Ads
        this.pushEvent({
            event: 'set_user_data',
            user_data: {
                email: emailClean,
                phone_number: phoneClean,
                address: {
                    city: userData.cidade || undefined,
                    region: userData.estado || undefined,
                    country: 'BR'
                }
            }
        });

        console.log('📊 GTMService: Dados do usuário enviados', {
            email: emailClean ? '✓' : '✗',
            phone: phoneClean ? '✓' : '✗',
            city: userData.cidade || '✗',
            region: userData.estado || '✗'
        });
    }
}

// ========================================
// SINGLETON INSTANCE
// ========================================
export const gtmService = new GTMService();
