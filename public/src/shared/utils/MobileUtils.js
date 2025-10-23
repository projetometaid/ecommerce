/**
 * 📱 Mobile Utilities
 *
 * Utilitários para melhorar experiência em dispositivos móveis
 */

export class MobileUtils {
    /**
     * Inicializa otimizações mobile
     */
    static init() {
        this.setupInputFocusScroll();
        this.detectMobile();
    }

    /**
     * Auto-scroll quando input recebe foco (evita teclado sobrepor campo)
     */
    static setupInputFocusScroll() {
        // Detectar se é mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (!isMobile) return;

        // Adicionar listener em todos os inputs
        document.addEventListener('focusin', (e) => {
            const target = e.target;

            // Verificar se é um input/textarea/select
            if (target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT') {

                // Aguardar teclado aparecer (300ms é um valor seguro)
                setTimeout(() => {
                    // Scroll suave para centralizar o campo
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 300);
            }
        });

        console.log('✅ MobileUtils: Auto-scroll em inputs ativado');
    }

    /**
     * Detecta tipo de dispositivo e adiciona classes no body
     */
    static detectMobile() {
        const ua = navigator.userAgent;
        const body = document.body;

        // iOS
        if (/iPhone|iPad|iPod/i.test(ua)) {
            body.classList.add('is-ios');

            // Versão do iOS
            const version = ua.match(/OS (\d+)_(\d+)/);
            if (version) {
                body.classList.add(`ios-${version[1]}`);
            }
        }

        // Android
        if (/Android/i.test(ua)) {
            body.classList.add('is-android');

            // Versão do Android
            const version = ua.match(/Android (\d+)/);
            if (version) {
                body.classList.add(`android-${version[1]}`);
            }
        }

        // Mobile genérico
        if (/iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
            body.classList.add('is-mobile');
        } else {
            body.classList.add('is-desktop');
        }

        // Tablet
        if (/iPad|Android(?!.*Mobile)/i.test(ua)) {
            body.classList.add('is-tablet');
        }

        console.log('✅ MobileUtils: Dispositivo detectado -', {
            iOS: body.classList.contains('is-ios'),
            Android: body.classList.contains('is-android'),
            Mobile: body.classList.contains('is-mobile'),
            Tablet: body.classList.contains('is-tablet')
        });
    }

    /**
     * Verifica se está em modo portrait
     */
    static isPortrait() {
        return window.innerHeight > window.innerWidth;
    }

    /**
     * Verifica se está em modo landscape
     */
    static isLandscape() {
        return window.innerWidth > window.innerHeight;
    }

    /**
     * Obtém altura da viewport considerando barra de endereço mobile
     */
    static getViewportHeight() {
        return window.innerHeight || document.documentElement.clientHeight;
    }

    /**
     * Previne zoom em double-tap (iOS)
     */
    static preventDoubleTapZoom(element) {
        let lastTouchEnd = 0;

        element.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
}
