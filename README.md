# 🏗️ E-Commerce Clean Architecture - v7

## 📋 Sobre
Sistema de checkout para **Certificados Digitais e-CPF A1** refatorado com Clean Architecture + SOLID + Design Patterns.

---

## 🌐 Infraestrutura AWS

### Ambientes de Produção
- **Domínio**: [www.certificadodigital.br.com](https://www.certificadodigital.br.com)
- **CloudFront**: d2nmq07g3fjio1.cloudfront.net (ID: E1S5ICGQCKGAIM)
- **S3 Bucket**: ecommerce-certificado-frontend-prod
- **Região**: us-east-1
- **Conta AWS**: 099670158004 (user: portal_assinatura)

### Certificado SSL
- **Status**: ISSUED ✅
- **Domínio**: www.certificadodigital.br.com
- **ARN**: arn:aws:acm:us-east-1:099670158004:certificate/0b7078c3-66fd-4531-a6d0-f9298273d421
- **Validação**: DNS (CNAME)

### Deploy
O código deste repositório está hospedado no S3 e servido via CloudFront com HTTPS.

---

## 🎯 Status da Migração

### ✅ Fase 0 - Setup Inicial (CONCLUÍDA)
- ✅ Estrutura de pastas criada
- ✅ README criado

### 🔄 Fase 1 - HTML + CSS (EM ANDAMENTO)
- ⏳ Copiar HTML original
- ⏳ Copiar CSS original
- ⏳ Validar visual idêntico

### ⏱️ Próximas Fases
- Fase 2: Domain Layer
- Fase 3: Step 1 - Horários
- Fase 4-7: Step 2 completo (Biometria, RFB, CEP, Protocolo)
- Fase 8: Step 3 - Pagador
- Fase 9: Step 4 - Resumo
- Fase 10: Step 5 - Pagamento PIX
- Fase 11: Step 6 - Confirmação
- Fase 12: Testes finais

---

## 🏛️ Arquitetura

```
v7ecommerce_clean/
├── src/
│   ├── domain/              # Regras de negócio puras
│   ├── application/         # Casos de uso e orquestração
│   ├── infrastructure/      # Implementações (APIs, cache)
│   ├── presentation/        # UI (Controllers, Views)
│   └── shared/              # Utilitários compartilhados
├── assets/
│   ├── css/
│   └── images/
├── config/
└── tests/
```

---

## 🔧 Princípios SOLID Aplicados

- **S**ingle Responsibility: Cada classe tem uma única responsabilidade
- **O**pen/Closed: Aberto para extensão, fechado para modificação
- **L**iskov Substitution: Substituição de interfaces
- **I**nterface Segregation: Interfaces específicas
- **D**ependency Inversion: Depende de abstrações, não implementações

---

## 🎨 Design Patterns

- Repository Pattern
- Use Case Pattern
- Dependency Injection
- Factory Pattern
- Observer Pattern
- Strategy Pattern
- Facade Pattern
- Adapter Pattern

---

## 🚀 Como Usar (Após Migração Completa)

```bash
# Instalar dependências (se houver)
npm install

# Iniciar servidor local
python3 -m http.server 8080

# Acesse
http://localhost:8080
```

---

## 📝 Notas Importantes

- **Sistema antigo continua funcionando** em `checkout_safeweb_integrado/`
- Migração é **incremental e testável**
- Cada fase é validada antes de prosseguir
- Visual e funcionalidade **100% preservados**
- Apenas **e-CPF A1** (videoconferência)

---

## 📚 Documentação

- [Plano de Migração Completo](../PLANO_MIGRACAO_CLEAN_ARCH.md)
- [Sistema Antigo](../checkout_safeweb_integrado/README.md)

---

## 🔄 Como Fazer Deploy

```bash
# Sincronizar código local com S3
aws s3 sync . s3://ecommerce-certificado-frontend-prod/ \
  --exclude ".git/*" \
  --exclude "terraform/*" \
  --exclude "node_modules/*" \
  --exclude ".DS_Store"

# Invalidar cache do CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1S5ICGQCKGAIM \
  --paths "/*"
```

---

*Última atualização: 07/10/2025*
