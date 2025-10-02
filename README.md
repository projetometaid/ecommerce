# 🏗️ E-Commerce Clean Architecture - v7

## 📋 Sobre
Sistema de checkout para **Certificados Digitais e-CPF A1** refatorado com Clean Architecture + SOLID + Design Patterns.

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

*Última atualização: 02/10/2025*
