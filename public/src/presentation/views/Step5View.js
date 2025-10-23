/**
 * 🎨 View: Step 5 - Pagamento PIX
 *
 * Renderiza interface de pagamento com QR Code
 */
export class Step5View {
    constructor(containerElement) {
        this.container = containerElement;

        // Coordenadas para recortar o QR Code (remove logos/bordas Safe2Pay)
        this.CROP_COORDINATES = {
            x: 50,           // Remove margem esquerda
            y: 180,          // Remove texto "Pague com PIX"
            width: 493,      // Largura ideal do QR Code
            height: 470      // Remove logo e borda azul
        };
    }

    render(pagamentoData) {
        const pagamentoContainer = this.container.querySelector('.pagamento-container');

        if (!pagamentoContainer) {
            console.error('❌ Step5View: pagamento-container não encontrado!');
            return;
        }

        pagamentoContainer.innerHTML = this.getHTML();

        // Se já temos dados do pagamento, exibir
        if (pagamentoData) {
            this.displayPagamento(pagamentoData);
        }
    }

    getHTML() {
        return `
            <div class="payment-status">
                <p>Gerando pagamento PIX...</p>
                <div class="loading-spinner"></div>
            </div>

            <div class="qr-code-section">
                <div class="qr-code" id="qr-code">
                    <div class="loading-spinner"></div>
                </div>
                <p>Escaneie o QR Code com seu banco</p>
            </div>

            <div class="pix-copy-section">
                <label>Ou copie o código PIX:</label>
                <div class="pix-code-container">
                    <input type="text" id="pix-code" readonly>
                    <button class="btn-copy" id="btn-copy-pix">Copiar</button>
                </div>
            </div>
        `;
    }

    /**
     * Exibe os dados do pagamento gerado
     */
    async displayPagamento(pagamentoData) {
        console.log('💳 Step5View: Exibindo pagamento', pagamentoData);

        // Exibir QR Code
        if (pagamentoData.qrCodeImage) {
            // Se tem imagem, processar e recortar para remover logos
            await this.processAndDisplayQRCode(pagamentoData);
        } else if (pagamentoData.pixCopiaECola) {
            // Gerar QR Code da string
            this.generateQRCodeFromString(pagamentoData.pixCopiaECola);
        }

        // Preencher código PIX
        this.fillPixCode(pagamentoData.pixCopiaECola || pagamentoData.qrCode);

        // Atualizar status
        this.updateStatus(pagamentoData);
    }

    /**
     * Processa e exibe o QR Code removendo logos e bordas
     */
    async processAndDisplayQRCode(pagamentoData) {
        try {
            console.log('🎨 Processando QR Code da Safe2Pay...');
            const cleanQRCode = await this.cropQRCodeImage(pagamentoData.qrCodeImage);
            this.displayCleanQRCode(cleanQRCode);
        } catch (error) {
            console.error('❌ Erro ao processar QR Code:', error);
            // Fallback: gerar da string
            if (pagamentoData.pixCopiaECola) {
                this.generateQRCodeFromString(pagamentoData.pixCopiaECola);
            }
        }
    }

    /**
     * Recorta a imagem do QR Code removendo logos e bordas da Safe2Pay
     */
    async cropQRCodeImage(imageUrl) {
        return new Promise((resolve, reject) => {
            console.log('✂️ Recortando QR Code...');

            const img = new Image();
            img.crossOrigin = 'anonymous';

            // CRÍTICO: Timeout para evitar travamento em conexões lentas
            const IMAGE_LOAD_TIMEOUT = 5000; // 5 segundos (otimizado - se demorar mais, usa fallback)
            let timeoutId = null;
            let loaded = false;

            timeoutId = setTimeout(() => {
                if (!loaded) {
                    console.warn(`⏱️ Timeout ao carregar imagem do QR Code (${IMAGE_LOAD_TIMEOUT}ms)`);
                    reject(new Error('Timeout ao carregar imagem - usando fallback'));
                }
            }, IMAGE_LOAD_TIMEOUT);

            img.onload = () => {
                loaded = true;
                clearTimeout(timeoutId);
                try {
                    // Criar canvas para processamento
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Configurar qualidade
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Calcular coordenadas proporcionais
                    const originalWidth = img.width;
                    const originalHeight = img.height;

                    const cropX = Math.round(originalWidth * (this.CROP_COORDINATES.x / 593));
                    const cropY = Math.round(originalHeight * (this.CROP_COORDINATES.y / 825));
                    const cropWidth = Math.round(originalWidth * (this.CROP_COORDINATES.width / 593));
                    const cropHeight = Math.round(originalHeight * (this.CROP_COORDINATES.height / 825));

                    console.log('📐 Coordenadas de recorte:', { cropX, cropY, cropWidth, cropHeight });

                    // Definir tamanho final do canvas
                    canvas.width = 250;
                    canvas.height = 250;

                    // Recortar e redimensionar
                    ctx.drawImage(
                        img,
                        cropX, cropY,           // Posição do recorte na imagem original
                        cropWidth, cropHeight,  // Tamanho do recorte
                        0, 0,                   // Posição no canvas
                        250, 250                // Tamanho final
                    );

                    // Converter para Base64
                    const cleanQRCode = canvas.toDataURL('image/png', 1.0);
                    console.log('✅ QR Code limpo gerado');
                    resolve(cleanQRCode);

                } catch (error) {
                    console.error('❌ Erro ao processar canvas:', error);
                    reject(error);
                }
            };

            img.onerror = (error) => {
                loaded = true;
                clearTimeout(timeoutId);
                console.error('❌ Erro ao carregar imagem:', error);
                reject(new Error('Falha ao carregar imagem do QR Code'));
            };

            // Tentar carregar via proxy do backend se necessário
            // IMPORTANTE: Usar o mesmo hostname (localhost ou 127.0.0.1) para evitar CORS
            const devApiUrl = `http://${window.location.hostname}:8082`;
            const proxyUrl = imageUrl.includes('safe2pay.com')
                ? `${devApiUrl}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
                : imageUrl;

            img.src = proxyUrl;
        });
    }

    /**
     * Exibe o QR Code limpo (sem logos/bordas)
     */
    displayCleanQRCode(base64Image) {
        const qrCodeContainer = document.getElementById('qr-code');
        if (!qrCodeContainer) return;

        qrCodeContainer.innerHTML = `
            <img src="${base64Image}"
                 alt="QR Code PIX"
                 class="qr-code-image"
                 style="max-width: 100%; height: auto; border-radius: 8px;">
        `;
        console.log('✅ QR Code limpo exibido');
    }

    /**
     * Gera QR Code a partir da string PIX
     */
    async generateQRCodeFromString(pixString) {
        const qrCodeContainer = document.getElementById('qr-code');
        if (!qrCodeContainer) {
            console.error('❌ Container QR Code não encontrado');
            return;
        }

        // Tentar carregar biblioteca se não estiver disponível
        if (!window.QRCode) {
            console.warn('⚠️ Biblioteca QRCode não carregada, tentando carregar...');
            qrCodeContainer.innerHTML = '<div style="text-align: center; padding: 20px;">⏳ Carregando QR Code...</div>';

            try {
                await this.loadQRCodeLibrary();
            } catch (error) {
                console.error('❌ Falha ao carregar biblioteca QRCode:', error);
                qrCodeContainer.innerHTML = '<div class="qr-error">❌ Erro ao carregar QR Code. Copie o código PIX acima.</div>';
                return;
            }
        }

        // Limpar container
        qrCodeContainer.innerHTML = '';

        try {
            new QRCode(qrCodeContainer, {
                text: pixString,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
            console.log('✅ QR Code gerado da string PIX');
        } catch (error) {
            console.error('❌ Erro ao gerar QR Code:', error);
            qrCodeContainer.innerHTML = '<div class="qr-error">❌ Erro ao gerar QR Code. Copie o código PIX acima.</div>';
        }
    }

    /**
     * Carrega biblioteca QRCode dinamicamente se não estiver disponível
     */
    loadQRCodeLibrary() {
        return new Promise((resolve, reject) => {
            // Tentar múltiplos CDNs
            const cdns = [
                'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
                'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
                'https://unpkg.com/qrcodejs@1.0.0/qrcode.min.js'
            ];

            let currentCdnIndex = 0;
            const CDN_TIMEOUT = 8000; // 8 segundos por CDN (importante para 3G/Edge)

            const tryLoadFromCdn = () => {
                if (currentCdnIndex >= cdns.length) {
                    reject(new Error('Todos os CDNs falharam'));
                    return;
                }

                const script = document.createElement('script');
                script.src = cdns[currentCdnIndex];
                script.crossOrigin = 'anonymous';

                let timeoutId = null;
                let loaded = false;

                // Timeout para conexões lentas (3G/Edge)
                timeoutId = setTimeout(() => {
                    if (!loaded) {
                        console.warn(`⏱️ Timeout ao carregar CDN: ${cdns[currentCdnIndex]} (${CDN_TIMEOUT}ms)`);
                        script.remove(); // Remover script que travou
                        currentCdnIndex++;
                        tryLoadFromCdn();
                    }
                }, CDN_TIMEOUT);

                script.onload = () => {
                    loaded = true;
                    clearTimeout(timeoutId);
                    console.log(`✅ QRCode carregado do CDN: ${cdns[currentCdnIndex]}`);
                    resolve();
                };

                script.onerror = () => {
                    loaded = true;
                    clearTimeout(timeoutId);
                    console.warn(`⚠️ Falha ao carregar do CDN: ${cdns[currentCdnIndex]}`);
                    currentCdnIndex++;
                    tryLoadFromCdn();
                };

                document.head.appendChild(script);
            };

            tryLoadFromCdn();
        });
    }

    /**
     * Preenche o campo de código PIX
     */
    fillPixCode(pixCode) {
        const pixCodeInput = document.getElementById('pix-code');
        if (!pixCodeInput) {
            console.error('❌ Input código PIX não encontrado');
            return;
        }

        pixCodeInput.value = pixCode || '';
    }

    /**
     * Atualiza o status visual do pagamento
     */
    updateStatus(pagamentoData) {
        const paymentStatus = document.querySelector('#step-5 .payment-status');
        if (!paymentStatus) {
            console.error('❌ Container status não encontrado');
            return;
        }

        const nomeTitular = pagamentoData.nomeTitular || 'Titular do Certificado';
        const valor = pagamentoData.valor || 0;

        paymentStatus.innerHTML = `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; padding: 6px 10px; margin: 4px 0; text-align: center;">
                <div style="color: #155724; font-weight: 600; font-size: 11px; line-height: 1.3;">
                    📧 Enviamos no email todas orientações do seu pedido.
                </div>
                <div style="color: #155724; font-size: 10px; margin-top: 2px; line-height: 1.2;">
                    Você pode pagar agora ou fechar e seguir pelo email.
                </div>
            </div>

            <div id="payment-check-status" style="text-align: center; margin: 8px 0; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <div class="spinner" style="
                    border: 2px solid #e0e0e0;
                    border-top: 2px solid #666;
                    border-radius: 50%;
                    width: 14px;
                    height: 14px;
                    animation: spin 1s linear infinite;
                "></div>
                <span id="payment-check-text" style="color: #666; font-size: 12px; font-weight: 500;">Aguardando pagamento (0 segundos)</span>
            </div>

            <!-- Alerta de suporte após 1m30s -->
            <div id="payment-timeout-alert" style="display: none; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 8px 12px; margin: 8px 0; text-align: center;">
                <div style="color: #856404; font-weight: 600; font-size: 12px; margin-bottom: 6px;">
                    ⏱️ A tela parece estar travada?
                </div>
                <div style="color: #856404; font-size: 11px; margin-bottom: 8px;">
                    Estamos aguardando o pagamento. Se já pagou, entre em contato.
                </div>
                <a href="https://wa.me/551940422204?text=Ol%C3%A1%2C%20realizei%20o%20pagamento%20do%20PIX%20mas%20a%20tela%20parece%20travada"
                   target="_blank"
                   rel="noopener noreferrer"
                   style="display: inline-block; background: #25D366; color: white; text-decoration: none; padding: 6px 14px; border-radius: 4px; font-weight: 600; font-size: 12px;">
                    💬 Falar no WhatsApp
                </a>
            </div>

            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    /**
     * Exibe mensagem de loading
     */
    showLoading(message = 'Gerando pagamento PIX...') {
        const paymentStatus = document.querySelector('#step-5 .payment-status');
        if (paymentStatus) {
            paymentStatus.innerHTML = `
                <div style="background: #e2e3e5; border: 1px solid #d6d8db; border-radius: 8px; padding: 24px; margin: 20px 0; text-align: center;">
                    <div style="color: #6c757d; font-weight: bold; margin-bottom: 12px; font-size: 16px;">
                        ⏳ ${message}
                    </div>
                    <div class="loading-spinner" style="margin: 0 auto;"></div>
                </div>
            `;
        }
    }

    /**
     * Exibe mensagem de erro
     */
    showError(message) {
        const paymentStatus = document.querySelector('#step-5 .payment-status');
        if (paymentStatus) {
            paymentStatus.innerHTML = `
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <div style="color: #721c24; font-weight: bold; margin-bottom: 8px;">
                        ❌ Erro
                    </div>
                    <div style="color: #721c24; font-size: 14px;">
                        ${message}
                    </div>
                </div>
            `;
        }
    }

    /**
     * Exibe feedback de cópia do PIX
     */
    showCopyFeedback(btnCopy) {
        const originalText = btnCopy.textContent;
        const originalBg = btnCopy.style.backgroundColor;

        btnCopy.textContent = '✓ Copiado!';
        btnCopy.style.backgroundColor = '#28a745';

        setTimeout(() => {
            btnCopy.textContent = originalText;
            btnCopy.style.backgroundColor = originalBg;
        }, 2000);
    }
}
