# Estrutura de Imagens

Esta pasta contém todas as imagens do site organizadas por categoria.

## Estrutura de Pastas

```
assets/images/
├── favicon/          # Ícones PWA e favicon
│   ├── icon-192.svg  # Ícone PWA 192x192
│   ├── icon-512.svg  # Ícone PWA 512x512
│   └── favicon.ico   # Favicon do site (adicionar)
│
├── logo/             # Logotipos da marca
│   ├── logo.svg      # Logo principal (adicionar)
│   ├── logo-white.svg # Logo branco para fundos escuros (adicionar)
│   └── logo.png      # Logo em PNG (adicionar)
│
└── blog/             # Imagens de artigos do blog
    ├── artigo-1.jpg  # Imagens dos posts (adicionar)
    └── ...
```

## Recomendações de Formato

### Favicon
- **Formato:** SVG (já existente) + ICO para compatibilidade
- **Tamanhos:** 192x192, 512x512 (PWA), 16x16, 32x32 (favicon.ico)

### Logo
- **Formato:** SVG (principal) + PNG (fallback)
- **Recomendação:** SVG para escalabilidade perfeita
- **PNG:** Exportar em 2x para telas retina (ex: 400px se exibido em 200px)

### Blog
- **Formato:** JPG (fotos) ou WebP (melhor compressão)
- **Dimensões recomendadas:** 800x600px ou 16:9 (1280x720px)
- **Otimização:** Comprimir com TinyPNG ou similar
- **Naming:** Use nomes descritivos (ex: `certificado-digital-beneficios.jpg`)

## Como Adicionar Imagens

### 1. Favicon personalizado
```html
<!-- Adicionar no <head> do index.html -->
<link rel="icon" type="image/x-icon" href="/assets/images/favicon/favicon.ico">
<link rel="icon" type="image/svg+xml" href="/assets/images/favicon/icon-192.svg">
```

### 2. Logo
```html
<!-- Substituir logo inline SVG no header -->
<img src="/assets/images/logo/logo.svg" alt="CertDigital" width="180" height="40">
```

### 3. Imagens do Blog
```html
<!-- Adicionar no blog card -->
<img src="/assets/images/blog/artigo-1.jpg"
     alt="Descrição do artigo"
     width="400"
     height="250"
     loading="lazy">
```

## Otimização de Performance

- **Lazy Loading:** Use `loading="lazy"` em imagens fora do viewport inicial
- **Dimensões explícitas:** Sempre defina `width` e `height` para prevenir CLS
- **WebP:** Considere usar WebP com fallback JPG para melhor compressão
- **Compressão:** Reduza tamanho de arquivo sem perder qualidade visível
- **Responsive:** Use `srcset` para servir tamanhos diferentes em mobile

## Service Worker

As imagens em `favicon/` estão no cache do Service Worker (sw.js).
Imagens de blog são cacheadas em runtime quando acessadas.
