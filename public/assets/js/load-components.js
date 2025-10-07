/**
 * Load Header and Footer Components
 * Carrega os componentes compartilhados de header e footer
 */

(function() {
    'use strict';

    // Função para carregar um componente HTML
    async function loadComponent(elementId, componentPath) {
        try {
            const response = await fetch(componentPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = html;
            }
        } catch (error) {
            console.error(`Erro ao carregar ${componentPath}:`, error);
        }
    }

    // Função para inicializar os componentes após o carregamento
    function initializeComponents() {
        // Inicializar Lucide icons se disponível
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }

        // Inicializar menu mobile
        const menuToggle = document.getElementById('menuToggle');
        const nav = document.getElementById('nav');

        if (menuToggle && nav) {
            menuToggle.addEventListener('click', function() {
                nav.classList.toggle('active');
                const isExpanded = nav.classList.contains('active');
                menuToggle.setAttribute('aria-expanded', isExpanded);
            });
        }
    }

    // Carregar componentes quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async function() {
            await Promise.all([
                loadComponent('header-container', '/public/includes/header.html'),
                loadComponent('footer-container', '/public/includes/footer.html')
            ]);
            initializeComponents();
        });
    } else {
        (async function() {
            await Promise.all([
                loadComponent('header-container', '/public/includes/header.html'),
                loadComponent('footer-container', '/public/includes/footer.html')
            ]);
            initializeComponents();
        })();
    }
})();
