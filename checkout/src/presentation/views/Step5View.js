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

            <div class="payment-status">
                <p>Gerando pagamento PIX...</p>
                <div class="loading-spinner"></div>
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

            img.onload = () => {
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
                console.error('❌ Erro ao carregar imagem:', error);
                reject(new Error('Falha ao carregar imagem do QR Code'));
            };

            // Tentar carregar via proxy do backend se necessário
            const proxyUrl = imageUrl.includes('safe2pay.com')
                ? `http://localhost:8082/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
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
    generateQRCodeFromString(pixString) {
        const qrCodeContainer = document.getElementById('qr-code');
        if (!qrCodeContainer) {
            console.error('❌ Container QR Code não encontrado');
            return;
        }

        if (!window.QRCode) {
            console.error('❌ Biblioteca QRCode não carregada');
            qrCodeContainer.innerHTML = '<div class="qr-error">Biblioteca QRCode não disponível</div>';
            return;
        }

        // Limpar container
        qrCodeContainer.innerHTML = '';

        try {
            new QRCode(qrCodeContainer, {
                text: pixString,
                width: 250,
                height: 250,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
            console.log('✅ QR Code gerado da string PIX');
        } catch (error) {
            console.error('❌ Erro ao gerar QR Code:', error);
            qrCodeContainer.innerHTML = '<div class="qr-error">Erro ao gerar QR Code</div>';
        }
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
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <div style="color: #155724; font-weight: bold; margin-bottom: 8px;">
                    ✅ PIX Gerado com Sucesso
                </div>
                <div style="color: #155724; font-size: 14px;">
                    Pagamento para: <strong>${nomeTitular}</strong>
                </div>
                ${pagamentoData.transactionId ? `
                <div style="color: #155724; font-size: 12px; margin-top: 8px; font-family: monospace;">
                    ID: ${pagamentoData.transactionId}
                </div>
                ` : ''}
                <div style="color: #155724; font-size: 14px; margin-top: 8px;">
                    Valor: <strong>R$ ${valor.toFixed(2).replace('.', ',')}</strong>
                </div>
            </div>
            <p style="text-align: center; color: #666;">⏳ Aguardando confirmação do pagamento...</p>
            <div class="loading-spinner" style="margin: 20px auto;"></div>
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
