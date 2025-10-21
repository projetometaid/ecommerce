/**
 * Widget Size Enforcer - Determinístico e Insensível a Zoom
 * Garante que o widget mantenha as dimensões exatas
 *
 * Dimensões:
 * - Desktop (≥ 48rem / 768px): 600x435
 * - Mobile (< 48rem / 768px): 310x435
 */

(function enforceWidgetSize() {
  'use strict';

  const WRAPPER_SEL = '#h4-Cert-DigitalElement';
  let isApplying = false;
  let resizeTimer = null;
  let lastWidth = null;

  // Usa matchMedia com rem para ser insensível a zoom
  const mobileQuery = window.matchMedia('(max-width: 48rem)');

  const getDimensions = () => {
    const isMobile = mobileQuery.matches;
    return {
      width: isMobile ? 310 : 600,
      height: 435  // 480 - 45px ajustado
    };
  };

  const apply = () => {
    // Previne loops infinitos
    if (isApplying) return;
    isApplying = true;

    try {
      const wrap = document.querySelector(WRAPPER_SEL);
      if (!wrap) {
        isApplying = false;
        return;
      }

      const { width, height } = getDimensions();

      // Só aplica se as dimensões mudaram
      if (lastWidth === width) {
        isApplying = false;
        return;
      }
      lastWidth = width;

      // Aplica dimensões ao wrapper (fixo)
      wrap.style.cssText = `width: ${width}px; height: ${height}px; display: block; margin: 0 auto; overflow: hidden; position: relative;`;

      // Aplica ao iframe se existir
      const iframe = wrap.querySelector('iframe');
      if (iframe) {
        iframe.style.cssText = 'width: 100% !important; height: 100% !important; display: block; border: 0;';
        iframe.setAttribute('width', width);
        iframe.setAttribute('height', height);
      }
    } finally {
      isApplying = false;
    }
  };

  // Debounce para resize
  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(apply, 150);
  };

  // Inicializa quando o DOM estiver pronto
  const init = () => {
    apply();

    // Observa mutações apenas no childList (quando iframe é adicionado)
    const wrap = document.querySelector(WRAPPER_SEL);
    if (wrap) {
      const mo = new MutationObserver((mutations) => {
        // Só aplica se um iframe foi adicionado
        const hasNewIframe = mutations.some(m =>
          Array.from(m.addedNodes).some(node =>
            node.nodeName === 'IFRAME'
          )
        );
        if (hasNewIframe) {
          requestAnimationFrame(apply);
        }
      });

      mo.observe(wrap, {
        childList: true,
        subtree: false
      });
    }

    // Event listener otimizado para resize
    window.addEventListener('resize', handleResize, { passive: true });

    // Listener para mudanças no breakpoint (insensível a zoom)
    mobileQuery.addEventListener('change', apply);

    // Re-aplica após delays para garantir que o widget carregou
    setTimeout(apply, 1000);
    setTimeout(apply, 2000);
  };

  // Aguarda o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
