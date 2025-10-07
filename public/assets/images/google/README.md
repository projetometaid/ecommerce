# Google Reviews Assets

Esta pasta contém os assets necessários para a seção de avaliações do Google.

## Arquivos Necessários

### 1. Google Reviews Logo
- **Arquivo:** `Google-Reviews.avif` (ou `Google-Reviews.png` como fallback)
- **Dimensões:** Mínimo 128x64px (2x para retina)
- **Formato:** AVIF (preferencial) + PNG (fallback)
- **Onde usar:** Logo do Google Reviews no topo da seção

### 2. Google G Icon
- **Arquivo:** `logo_g_google.avif` (ou `logo_g_google.png` como fallback)
- **Dimensões:** 40x40px (2x para retina, exibido em 20x20px)
- **Formato:** AVIF (preferencial) + PNG (fallback)
- **Onde usar:** Rodapé de cada card de review

## Como Adicionar os Arquivos

1. Baixe o logo do Google Reviews de fontes oficiais
2. Converta para AVIF usando ferramentas como:
   - https://squoosh.app/
   - ImageMagick: `convert input.png output.avif`
3. Salve também uma versão PNG para fallback
4. Coloque ambos os arquivos nesta pasta

## Otimização

- **AVIF:** 30-50% menor que PNG, suportado por navegadores modernos
- **Fallback PNG:** Para navegadores antigos (IE, Safari < 16.1)
- **Lazy Loading:** Já configurado com `loading="lazy"`
- **Alt Text:** Sempre incluído para acessibilidade

## Link de Referência

URL do Google Reviews:
https://www.google.com/maps/place/Certificado+Digital+Campinas/@-22.8866637,-47.0805579,17z/data=!3m1!4b1!4m6!3m5!1s0x94c8c61fd971e243:0xb89c90e5c4d918d9!8m2!3d-22.8866637!4d-47.077983!16s%2Fg%2F11b8229mh6?entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D
