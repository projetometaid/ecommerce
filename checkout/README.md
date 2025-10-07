# 🛒 Motor de Checkout - Clean Architecture

Este diretório contém o **motor/engine de checkout** da aplicação de e-commerce de certificados digitais.

## 📁 Estrutura

```
checkout/
├── src/                      # Código fonte (Clean Architecture)
│   ├── domain/              # Camada de Domínio (Entidades, Use Cases)
│   ├── application/         # Camada de Aplicação
│   ├── infrastructure/      # Camada de Infraestrutura (APIs, Repos)
│   └── presentation/        # Camada de Apresentação (Controllers, Views)
│
├── assets/                  # Assets do checkout
│   ├── css/                # Estilos do fluxo de checkout
│   │   ├── steps.css       # Estilos dos steps
│   │   └── modal.css       # Estilos dos modais
│   └── images/             # Imagens específicas do checkout
│
└── index.html              # Página standalone do checkout (não usado atualmente)
```

## 🎯 Propósito

Este motor de checkout é:

- **Reutilizável**: Pode ser integrado em qualquer página HTML
- **Clean Architecture**: Separação clara de responsabilidades
- **Modular**: Cada step é independente
- **Testável**: Lógica de negócio isolada

## 🔌 Como Integrar

Para integrar o checkout em uma página HTML:

```html
<!-- 1. Incluir CSS do checkout -->
<link rel="stylesheet" href="/checkout/assets/css/steps.css">
<link rel="stylesheet" href="/checkout/assets/css/modal.css">

<!-- 2. Incluir estrutura HTML dos steps -->
<div id="steps-container">
    <div class="step-content" id="step-1">...</div>
    <div class="step-content" id="step-2">...</div>
    <!-- ... demais steps ... -->
</div>

<!-- 3. Incluir script principal -->
<script type="module" src="/checkout/src/main.js"></script>
```

## 📝 Exemplo de Uso

Atualmente o checkout está integrado em:
- `/public/e-cpf.html` - Página de compra do e-CPF com GTM

## ⚠️ IMPORTANTE

**NÃO MODIFIQUE** o código dentro de `/checkout/src/` sem compreender a arquitetura Clean Architecture.

O código está organizado seguindo SOLID e DDD (Domain-Driven Design).

## 🔗 APIs Utilizadas

- **Safeweb**: Verificação de biometria, consulta CPF, geração de protocolo
- **Safe2Pay**: Geração de pagamento PIX
- **ViaCEP**: Busca de endereço por CEP

Todas as APIs são acessadas via proxy `/api/` configurado em `api_server.py`.
