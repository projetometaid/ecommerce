# 🚀 Roadmap de Melhorias - E-commerce Certificados Digitais

> Plano detalhado para implementação de e-mails transacionais e banco de dados

---

## 📋 Visão Geral

Este documento detalha as melhorias planejadas para o sistema de e-commerce, divididas em 2 fases principais:

1. **Fase 1**: Sistema de E-mails Transacionais
2. **Fase 2**: Banco de Dados (Pedidos + UTMs + Eventos)

---

## 🎯 Objetivos

- ✅ **Melhorar experiência do cliente** (e-mails de confirmação)
- ✅ **Rastreabilidade** (histórico de pedidos e pagamentos)
- ✅ **Marketing data-driven** (UTMs e atribuição)
- ✅ **Gestão operacional** (dashboard de pedidos)
- ✅ **Compliance LGPD** (auditoria e dados processados)

---

# 📧 FASE 1: Sistema de E-mails Transacionais

## 1.1. Dados que Temos Disponíveis

### **No Step 2 (Dados do Certificado)**
```javascript
{
  cpf: "38601836801",
  nome: "LEANDRO VICTOR ALBERTINI",
  nascimento: "1989-01-28",
  email: "leandro.albertini@metaid.com.br",
  telefone: "19997888810",
  cep: "13070064",
  endereco: "Rua Bento da Silva Leite",
  numero: "104",
  complemento: "",
  bairro: "Jardim Chapadão",
  cidade: "Campinas",
  estado: "SP",
  protocolo: "1009101899"
}
```

### **No Step 3 (Dados do Pagador)**
```javascript
{
  cpfCnpj: "38601836801",  // Pode ser diferente do titular
  nomeCompleto: "LEANDRO VICTOR ALBERTINI",
  email: "leandro.albertini@metaid.com.br",
  telefone: "19997888810"
}
```

### **No Step 5 (Pagamento PIX)**
```javascript
{
  transactionId: "141881236",
  qrCodeImage: "https://images.safe2pay.com.br/pix/fd14db83dbfb4cffa5745e6b88b1536f.png",
  pixCopiaECola: "00020101021226850014br.gov.bcb.pix...",
  valor: 8.00,
  status: "pending",
  protocolo: "1009101899",
  dataExpiracao: "2025-10-23T12:40:10.258Z"
}
```

### **UTMs (Capturadas no Frontend)**
```javascript
{
  utm_source: "google",
  utm_medium: "cpc",
  utm_campaign: "certificado_digital_2025",
  utm_content: "anuncio_v1",
  utm_term: "certificado digital cpf"
}
```

---

## 1.2. E-mails Transacionais a Implementar

### **E-mail 1: Protocolo Gerado** (Step 2)
**Trigger:** Após gerar protocolo Safeweb com sucesso

**Destinatário:** E-mail do titular do certificado

**Assunto:** `🎫 Protocolo Gerado - Certificado Digital [PRODUTO]`

**Conteúdo:**
```
Olá [NOME],

Seu protocolo foi gerado com sucesso! ✅

📋 Dados do Protocolo:
- Número: [PROTOCOLO]
- Produto: [PRODUTO_NOME]
- Titular: [NOME_COMPLETO]
- CPF: [CPF_FORMATADO]

📅 Próximos Passos:
1. Realize o pagamento via PIX
2. Aguarde a confirmação do pagamento
3. Agende sua videoconferência

⚠️ IMPORTANTE: Este protocolo é válido por 30 dias.

--
Equipe Certificado Digital
www.certificadodigital.br.com
```

---

### **E-mail 2: PIX Gerado** (Step 5)
**Trigger:** Após criar pagamento PIX no Safe2Pay

**Destinatário:** E-mail do pagador (pode ser diferente do titular)

**Assunto:** `💰 PIX Gerado - Protocolo [PROTOCOLO]`

**Conteúdo:**
```
Olá [NOME_PAGADOR],

Seu PIX foi gerado! Para concluir, efetue o pagamento.

💳 Dados do Pagamento:
- Valor: R$ [VALOR]
- Protocolo: [PROTOCOLO]
- Vencimento: [DATA_EXPIRACAO] (30 minutos)

🔗 Código PIX Copia e Cola:
[PIX_COPIA_E_COLA]

📱 QR Code:
[LINK_DO_QRCODE_IMAGE]

⏱️ Após o pagamento, você receberá a confirmação em até 5 minutos.

--
Equipe Certificado Digital
www.certificadodigital.br.com
```

---

### **E-mail 3: Pagamento Confirmado** (Webhook Safe2Pay)
**Trigger:** Webhook do Safe2Pay com status "Aprovado"

**Destinatário:** E-mail do titular + E-mail do pagador (se diferente)

**Assunto:** `✅ Pagamento Confirmado - Protocolo [PROTOCOLO]`

**Conteúdo:**
```
Parabéns [NOME]! 🎉

Seu pagamento foi confirmado com sucesso!

✅ Resumo da Compra:
- Protocolo: [PROTOCOLO]
- Produto: [PRODUTO_NOME]
- Valor Pago: R$ [VALOR]
- Data: [DATA_PAGAMENTO]
- ID Transação: [TRANSACTION_ID]

📅 Próximos Passos:
1. Você receberá um e-mail da Safeweb com as instruções para agendar a videoconferência
2. Tenha em mãos os documentos necessários (RG, CNF, comprovante de residência)
3. O agendamento deve ser feito em até 30 dias

📞 Dúvidas?
Entre em contato: suporte@certificadodigital.br.com

--
Equipe Certificado Digital
www.certificadodigital.br.com
```

---

### **E-mail 4: PIX Expirado** (Webhook Safe2Pay)
**Trigger:** 30 minutos após gerar PIX sem pagamento

**Destinatário:** E-mail do pagador

**Assunto:** `⏰ PIX Expirado - Protocolo [PROTOCOLO]`

**Conteúdo:**
```
Olá [NOME_PAGADOR],

O PIX gerado para o protocolo [PROTOCOLO] expirou.

⏰ O prazo de 30 minutos foi atingido sem confirmação de pagamento.

🔄 O que fazer?
- Acesse novamente: www.certificadodigital.br.com
- Refaça o checkout com o mesmo protocolo
- Gere um novo PIX

⚠️ Seu protocolo continua válido!

--
Equipe Certificado Digital
www.certificadodigital.br.com
```

---

## 1.3. Arquitetura de E-mails

### **Opção 1: AWS SES (Recomendado)**

**Vantagens:**
- Nativo AWS (integra com Lambda)
- Custo baixo ($0.10 por 1.000 e-mails)
- Até 62.000 e-mails grátis/mês (Free Tier)
- Templates HTML nativos
- Monitoramento (CloudWatch)

**Implementação:**
```
Lambda (evento) → SES → E-mail enviado
```

**Configuração Necessária:**
1. Verificar domínio no SES (`certificadodigital.br.com`)
2. Sair do SES Sandbox (aprovar conta)
3. Criar templates SES
4. Configurar DKIM/SPF no Route 53

---

### **Opção 2: SendGrid / Mailgun (Terceiros)**

**Vantagens:**
- Fácil configuração
- Templates visuais
- Analytics embutido

**Desvantagens:**
- Custo maior
- Dependência externa
- Mais uma integração

---

### **Recomendação: AWS SES**

**Motivo:** Já estamos 100% AWS, custo baixo, escalável.

---

## 1.4. Implementação Técnica (SES)

### **Estrutura de Código**

```
lambda/
├── lambda_handler.py          # Handler principal
├── services/
│   ├── email_service.py       # Serviço de e-mail (SES)
│   └── template_service.py    # Renderização de templates
├── templates/
│   ├── protocolo_gerado.html
│   ├── pix_gerado.html
│   ├── pagamento_confirmado.html
│   └── pix_expirado.html
└── requirements.txt           # + boto3 (já tem)
```

---

### **Código: email_service.py**

```python
import boto3
from botocore.exceptions import ClientError

class EmailService:
    def __init__(self):
        self.ses_client = boto3.client('ses', region_name='us-east-1')
        self.sender = 'noreply@certificadodigital.br.com'

    def send_email(self, to_email, subject, html_body, text_body=None):
        """Envia e-mail via AWS SES"""
        try:
            response = self.ses_client.send_email(
                Source=self.sender,
                Destination={'ToAddresses': [to_email]},
                Message={
                    'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                    'Body': {
                        'Html': {'Data': html_body, 'Charset': 'UTF-8'},
                        'Text': {'Data': text_body or html_body, 'Charset': 'UTF-8'}
                    }
                }
            )
            print(f"✅ E-mail enviado para {to_email}: {response['MessageId']}")
            return True
        except ClientError as e:
            print(f"❌ Erro ao enviar e-mail: {e}")
            return False

    def send_protocolo_gerado(self, dados):
        """E-mail 1: Protocolo gerado"""
        subject = f"🎫 Protocolo Gerado - Certificado Digital {dados['produto']}"
        html_body = render_template('protocolo_gerado.html', dados)
        return self.send_email(dados['email'], subject, html_body)

    def send_pix_gerado(self, dados):
        """E-mail 2: PIX gerado"""
        subject = f"💰 PIX Gerado - Protocolo {dados['protocolo']}"
        html_body = render_template('pix_gerado.html', dados)
        return self.send_email(dados['email_pagador'], subject, html_body)

    def send_pagamento_confirmado(self, dados):
        """E-mail 3: Pagamento confirmado"""
        subject = f"✅ Pagamento Confirmado - Protocolo {dados['protocolo']}"
        html_body = render_template('pagamento_confirmado.html', dados)

        # Enviar para titular
        self.send_email(dados['email_titular'], subject, html_body)

        # Enviar para pagador (se diferente)
        if dados['email_pagador'] != dados['email_titular']:
            self.send_email(dados['email_pagador'], subject, html_body)

        return True

    def send_pix_expirado(self, dados):
        """E-mail 4: PIX expirado"""
        subject = f"⏰ PIX Expirado - Protocolo {dados['protocolo']}"
        html_body = render_template('pix_expirado.html', dados)
        return self.send_email(dados['email_pagador'], subject, html_body)
```

---

### **Integração na Lambda (lambda_handler.py)**

```python
from services.email_service import EmailService

email_service = EmailService()

# No endpoint de gerar protocolo (após sucesso)
def gerar_protocolo(event, context):
    # ... código existente ...

    if protocolo_gerado_com_sucesso:
        # Enviar e-mail
        email_service.send_protocolo_gerado({
            'email': dados['email'],
            'nome': dados['nome'],
            'protocolo': protocolo,
            'produto': 'e-CPF A1',
            'cpf': mask_cpf(dados['cpf'])
        })

    return response

# No endpoint de criar PIX (após sucesso)
def criar_pix(event, context):
    # ... código existente ...

    if pix_criado_com_sucesso:
        email_service.send_pix_gerado({
            'email_pagador': dados['email'],
            'nome_pagador': dados['nome_completo'],
            'protocolo': dados['protocolo'],
            'valor': dados['valor'],
            'pix_copia_e_cola': response['pixCopiaECola'],
            'qrcode_url': response['qrCodeImage'],
            'data_expiracao': response['expiresAt']
        })

    return response

# No webhook Safe2Pay
def webhook_safe2pay(event, context):
    # ... código existente ...

    if status == 'Aprovado':
        email_service.send_pagamento_confirmado({
            'email_titular': get_email_titular(protocolo),
            'email_pagador': get_email_pagador(protocolo),
            'nome': get_nome_titular(protocolo),
            'protocolo': protocolo,
            'produto': 'e-CPF A1',
            'valor': valor,
            'transaction_id': transaction_id,
            'data_pagamento': datetime.now().strftime('%d/%m/%Y %H:%M')
        })
```

---

### **Template HTML (protocolo_gerado.html)**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Protocolo Gerado</h1>
        </div>

        <div class="content">
            <p>Olá <strong>{{ nome }}</strong>,</p>

            <p>Seu protocolo foi gerado com sucesso! ✅</p>

            <div class="info-box">
                <h3>📋 Dados do Protocolo</h3>
                <p><strong>Número:</strong> {{ protocolo }}</p>
                <p><strong>Produto:</strong> {{ produto }}</p>
                <p><strong>Titular:</strong> {{ nome }}</p>
                <p><strong>CPF:</strong> {{ cpf }}</p>
            </div>

            <div class="info-box">
                <h3>📅 Próximos Passos</h3>
                <ol>
                    <li>Realize o pagamento via PIX</li>
                    <li>Aguarde a confirmação do pagamento</li>
                    <li>Agende sua videoconferência</li>
                </ol>
            </div>

            <p style="text-align: center; margin: 30px 0;">
                <a href="https://www.certificadodigital.br.com" class="button">Continuar para Pagamento</a>
            </p>

            <p><strong>⚠️ IMPORTANTE:</strong> Este protocolo é válido por 30 dias.</p>
        </div>

        <div class="footer">
            <p>Equipe Certificado Digital<br>
            www.certificadodigital.br.com</p>
        </div>
    </div>
</body>
</html>
```

---

### **Terraform para SES (terraform/ses.tf)**

```hcl
# Verificar domínio no SES
resource "aws_ses_domain_identity" "main" {
  domain = "certificadodigital.br.com"
}

# DKIM para autenticação
resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

# Verificar e-mail remetente
resource "aws_ses_email_identity" "noreply" {
  email = "noreply@certificadodigital.br.com"
}

# Permissão para Lambda enviar e-mails
resource "aws_iam_policy" "lambda_ses" {
  name = "${var.project_name}-lambda-ses-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_ses" {
  role       = aws_iam_role.lambda_api.name
  policy_arn = aws_iam_policy.lambda_ses.arn
}

# Outputs
output "ses_domain_verification_token" {
  value = aws_ses_domain_identity.main.verification_token
  description = "Adicionar este TXT record no Route 53"
}

output "ses_dkim_tokens" {
  value = aws_ses_domain_dkim.main.dkim_tokens
  description = "Adicionar estes CNAME records no Route 53"
}
```

---

## 1.5. Checklist de Implementação (E-mails)

### **Fase 1.1: Configuração AWS SES**
- [ ] Criar conta SES
- [ ] Verificar domínio `certificadodigital.br.com`
- [ ] Adicionar TXT record no Route 53 (verificação)
- [ ] Configurar DKIM (adicionar CNAME records)
- [ ] Sair do SES Sandbox (request production access)
- [ ] Testar envio de e-mail

### **Fase 1.2: Desenvolvimento**
- [ ] Criar `email_service.py`
- [ ] Criar `template_service.py`
- [ ] Criar templates HTML (4 e-mails)
- [ ] Integrar no `lambda_handler.py`
- [ ] Adicionar dependências no `requirements.txt`
- [ ] Testar localmente (api_server.py)

### **Fase 1.3: Deploy**
- [ ] Aplicar Terraform (SES resources)
- [ ] Build Lambda com novos arquivos
- [ ] Deploy Lambda atualizada
- [ ] Testar em produção

### **Fase 1.4: Monitoramento**
- [ ] Configurar alarmes SES (bounce rate, complaints)
- [ ] Monitorar logs Lambda (e-mails enviados)
- [ ] Criar dashboard CloudWatch (métricas de e-mail)

---

# 💾 FASE 2: Banco de Dados (DynamoDB)

## 2.1. Dados a Armazenar

### **Tabela: Pedidos**

```javascript
{
  // Primary Key
  "PK": "PROTOCOLO#1009101899",
  "SK": "METADATA",

  // Dados do Certificado (Titular)
  "titular": {
    "cpf": "38601836801",
    "nome": "LEANDRO VICTOR ALBERTINI",
    "nascimento": "1989-01-28",
    "email": "leandro.albertini@metaid.com.br",
    "telefone": "19997888810",
    "endereco": {
      "cep": "13070064",
      "logradouro": "Rua Bento da Silva Leite",
      "numero": "104",
      "complemento": "",
      "bairro": "Jardim Chapadão",
      "cidade": "Campinas",
      "estado": "SP"
    }
  },

  // Dados do Pagador
  "pagador": {
    "cpfCnpj": "38601836801",
    "nome": "LEANDRO VICTOR ALBERTINI",
    "email": "leandro.albertini@metaid.com.br",
    "telefone": "19997888810"
  },

  // Dados do Produto
  "produto": {
    "id": "ecpf-a1",
    "nome": "e-CPF A1",
    "valor": 8.00,
    "validade": "1 ano"
  },

  // Dados do Pagamento
  "pagamento": {
    "transactionId": "141881236",
    "metodo": "PIX",
    "valor": 8.00,
    "status": "pending",  // pending | approved | cancelled | expired
    "pixCopiaECola": "00020101021226850014br.gov.bcb.pix...",
    "qrCodeImage": "https://images.safe2pay.com.br/pix/...",
    "dataCriacao": "2025-10-23T12:10:10.258Z",
    "dataExpiracao": "2025-10-23T12:40:10.258Z",
    "dataPagamento": null  // Preenchido quando pago
  },

  // UTMs (Marketing Attribution)
  "utm": {
    "source": "google",
    "medium": "cpc",
    "campaign": "certificado_digital_2025",
    "content": "anuncio_v1",
    "term": "certificado digital cpf"
  },

  // Metadados
  "protocolo": "1009101899",
  "status": "aguardando_pagamento",  // aguardando_pagamento | pago | expirado | cancelado
  "dataCriacao": "2025-10-23T12:05:03.000Z",
  "dataAtualizacao": "2025-10-23T12:10:10.258Z",

  // Índices GSI
  "GSI1PK": "CPF#38601836801",  // Buscar por CPF do titular
  "GSI1SK": "2025-10-23T12:05:03.000Z",

  "GSI2PK": "EMAIL#leandro.albertini@metaid.com.br",  // Buscar por e-mail
  "GSI2SK": "2025-10-23T12:05:03.000Z",

  "GSI3PK": "STATUS#aguardando_pagamento",  // Buscar por status
  "GSI3SK": "2025-10-23T12:05:03.000Z"
}
```

---

### **Tabela: Eventos (Timeline do Pedido)**

```javascript
{
  // Primary Key
  "PK": "PROTOCOLO#1009101899",
  "SK": "EVENTO#2025-10-23T12:05:03.000Z#protocolo_gerado",

  // Dados do Evento
  "tipo": "protocolo_gerado",  // protocolo_gerado | pix_gerado | pagamento_confirmado | etc
  "timestamp": "2025-10-23T12:05:03.000Z",
  "dados": {
    "protocolo": "1009101899",
    "produto": "ecpf-a1"
  }
}

{
  "PK": "PROTOCOLO#1009101899",
  "SK": "EVENTO#2025-10-23T12:10:10.258Z#pix_gerado",
  "tipo": "pix_gerado",
  "timestamp": "2025-10-23T12:10:10.258Z",
  "dados": {
    "transactionId": "141881236",
    "valor": 8.00
  }
}

{
  "PK": "PROTOCOLO#1009101899",
  "SK": "EVENTO#2025-10-23T12:15:30.000Z#pagamento_confirmado",
  "tipo": "pagamento_confirmado",
  "timestamp": "2025-10-23T12:15:30.000Z",
  "dados": {
    "transactionId": "141881236",
    "valor": 8.00,
    "metodoPagamento": "PIX"
  }
}
```

---

## 2.2. Arquitetura DynamoDB

### **Tabela Principal: `ecommerce-pedidos-prod`**

```
Partition Key (PK): String  # PROTOCOLO#1009101899
Sort Key (SK): String       # METADATA | EVENTO#timestamp#tipo

Global Secondary Index 1 (GSI1):
  - GSI1PK: CPF#38601836801
  - GSI1SK: timestamp
  - Uso: Buscar todos os pedidos de um CPF

Global Secondary Index 2 (GSI2):
  - GSI2PK: EMAIL#email@exemplo.com
  - GSI2SK: timestamp
  - Uso: Buscar pedidos por e-mail

Global Secondary Index 3 (GSI3):
  - GSI3PK: STATUS#aguardando_pagamento
  - GSI3SK: timestamp
  - Uso: Listar pedidos por status (relatórios)
```

---

### **Vantagens desta Modelagem**

1. **Single Table Design** - Todos os dados em 1 tabela (padrão DynamoDB)
2. **Queries Eficientes** - Buscar por protocolo, CPF, e-mail ou status
3. **Timeline de Eventos** - Histórico completo do pedido
4. **Escalável** - Suporta milhões de registros
5. **Custo Baixo** - Pay-per-use (sob demanda)

---

## 2.3. Quando Salvar no Banco

### **Ponto 1: Após Gerar Protocolo (Step 2)**

```python
def gerar_protocolo(event, context):
    # ... código existente ...

    if protocolo_gerado_com_sucesso:
        # Salvar no DynamoDB
        dynamodb_service.criar_pedido({
            'protocolo': protocolo,
            'titular': dados_titular,
            'produto': produto_info,
            'utm': utm_params,  # Capturado do frontend
            'status': 'aguardando_pagamento'
        })

        # Registrar evento
        dynamodb_service.registrar_evento(protocolo, 'protocolo_gerado', {
            'produto': produto_info['id']
        })

        # Enviar e-mail
        email_service.send_protocolo_gerado(...)
```

---

### **Ponto 2: Após Gerar PIX (Step 5)**

```python
def criar_pix(event, context):
    # ... código existente ...

    if pix_criado_com_sucesso:
        # Atualizar pedido
        dynamodb_service.atualizar_pedido(protocolo, {
            'pagamento': {
                'transactionId': transaction_id,
                'metodo': 'PIX',
                'status': 'pending',
                'pixCopiaECola': pix_code,
                'qrCodeImage': qr_code_url,
                'dataCriacao': datetime.now().isoformat(),
                'dataExpiracao': expiration_date.isoformat()
            },
            'pagador': dados_pagador
        })

        # Registrar evento
        dynamodb_service.registrar_evento(protocolo, 'pix_gerado', {
            'transactionId': transaction_id,
            'valor': valor
        })

        # Enviar e-mail
        email_service.send_pix_gerado(...)
```

---

### **Ponto 3: Webhook Safe2Pay (Pagamento Confirmado)**

```python
def webhook_safe2pay(event, context):
    # ... código existente ...

    if status == 'Aprovado':
        # Atualizar pedido
        dynamodb_service.atualizar_pedido(protocolo, {
            'status': 'pago',
            'pagamento.status': 'approved',
            'pagamento.dataPagamento': datetime.now().isoformat()
        })

        # Registrar evento
        dynamodb_service.registrar_evento(protocolo, 'pagamento_confirmado', {
            'transactionId': transaction_id,
            'valor': valor,
            'metodoPagamento': 'PIX'
        })

        # Enviar e-mail
        email_service.send_pagamento_confirmado(...)
```

---

### **Ponto 4: PIX Expirado (30 minutos sem pagamento)**

```python
def verificar_pix_expirado():
    """Função agendada (CloudWatch Events / EventBridge)"""
    # Buscar pedidos com status pending e expirados
    pedidos_expirados = dynamodb_service.buscar_pedidos_expirados()

    for pedido in pedidos_expirados:
        # Atualizar status
        dynamodb_service.atualizar_pedido(pedido['protocolo'], {
            'status': 'expirado',
            'pagamento.status': 'expired'
        })

        # Registrar evento
        dynamodb_service.registrar_evento(pedido['protocolo'], 'pix_expirado', {})

        # Enviar e-mail
        email_service.send_pix_expirado(pedido)
```

---

## 2.4. Implementação Técnica (DynamoDB)

### **Estrutura de Código**

```
lambda/
├── lambda_handler.py
├── services/
│   ├── email_service.py
│   ├── dynamodb_service.py      # ← NOVO
│   └── utm_service.py           # ← NOVO (captura UTMs)
└── requirements.txt             # boto3 já incluso
```

---

### **Código: dynamodb_service.py**

```python
import boto3
from datetime import datetime
from decimal import Decimal

class DynamoDBService:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        self.table = self.dynamodb.Table('ecommerce-pedidos-prod')

    def criar_pedido(self, dados):
        """Cria um novo pedido no DynamoDB"""
        item = {
            'PK': f"PROTOCOLO#{dados['protocolo']}",
            'SK': 'METADATA',
            'protocolo': dados['protocolo'],
            'titular': dados['titular'],
            'pagador': dados.get('pagador', {}),
            'produto': dados['produto'],
            'pagamento': {},
            'utm': dados.get('utm', {}),
            'status': dados['status'],
            'dataCriacao': datetime.now().isoformat(),
            'dataAtualizacao': datetime.now().isoformat(),
            # GSIs
            'GSI1PK': f"CPF#{dados['titular']['cpf']}",
            'GSI1SK': datetime.now().isoformat(),
            'GSI2PK': f"EMAIL#{dados['titular']['email']}",
            'GSI2SK': datetime.now().isoformat(),
            'GSI3PK': f"STATUS#{dados['status']}",
            'GSI3SK': datetime.now().isoformat()
        }

        # Converter floats para Decimal (DynamoDB requirement)
        item = self._float_to_decimal(item)

        self.table.put_item(Item=item)
        print(f"✅ Pedido criado: {dados['protocolo']}")
        return item

    def atualizar_pedido(self, protocolo, updates):
        """Atualiza campos específicos do pedido"""
        update_expression = "SET "
        expression_values = {}

        for key, value in updates.items():
            safe_key = key.replace('.', '_')
            update_expression += f"{key} = :{safe_key}, "
            expression_values[f":{safe_key}"] = self._float_to_decimal(value)

        # Adicionar dataAtualizacao
        update_expression += "dataAtualizacao = :dataAtualizacao"
        expression_values[':dataAtualizacao'] = datetime.now().isoformat()

        self.table.update_item(
            Key={'PK': f"PROTOCOLO#{protocolo}", 'SK': 'METADATA'},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        print(f"✅ Pedido atualizado: {protocolo}")

    def registrar_evento(self, protocolo, tipo_evento, dados):
        """Registra um evento na timeline do pedido"""
        timestamp = datetime.now().isoformat()

        item = {
            'PK': f"PROTOCOLO#{protocolo}",
            'SK': f"EVENTO#{timestamp}#{tipo_evento}",
            'tipo': tipo_evento,
            'timestamp': timestamp,
            'dados': self._float_to_decimal(dados)
        }

        self.table.put_item(Item=item)
        print(f"✅ Evento registrado: {protocolo} - {tipo_evento}")

    def buscar_pedido(self, protocolo):
        """Busca um pedido pelo protocolo"""
        response = self.table.get_item(
            Key={'PK': f"PROTOCOLO#{protocolo}", 'SK': 'METADATA'}
        )
        return response.get('Item')

    def buscar_pedidos_por_cpf(self, cpf):
        """Busca todos os pedidos de um CPF"""
        response = self.table.query(
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :cpf',
            ExpressionAttributeValues={':cpf': f"CPF#{cpf}"}
        )
        return response.get('Items', [])

    def buscar_eventos(self, protocolo):
        """Busca todos os eventos de um pedido (timeline)"""
        response = self.table.query(
            KeyConditionExpression='PK = :pk AND begins_with(SK, :sk_prefix)',
            ExpressionAttributeValues={
                ':pk': f"PROTOCOLO#{protocolo}",
                ':sk_prefix': 'EVENTO#'
            }
        )
        return response.get('Items', [])

    def _float_to_decimal(self, obj):
        """Converte float para Decimal (DynamoDB não aceita float)"""
        if isinstance(obj, float):
            return Decimal(str(obj))
        elif isinstance(obj, dict):
            return {k: self._float_to_decimal(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._float_to_decimal(i) for i in obj]
        return obj
```

---

### **Código: utm_service.py**

```python
class UTMService:
    @staticmethod
    def extract_utm_params(event):
        """Extrai parâmetros UTM do evento Lambda"""
        query_params = event.get('queryStringParameters', {}) or {}

        return {
            'source': query_params.get('utm_source'),
            'medium': query_params.get('utm_medium'),
            'campaign': query_params.get('utm_campaign'),
            'content': query_params.get('utm_content'),
            'term': query_params.get('utm_term')
        }

    @staticmethod
    def parse_utm_from_body(body):
        """Extrai UTMs do corpo da requisição (se enviado pelo frontend)"""
        return body.get('utm', {})
```

---

### **Terraform para DynamoDB (terraform/dynamodb.tf)**

```hcl
# Tabela DynamoDB
resource "aws_dynamodb_table" "pedidos" {
  name           = "${var.project_name}-pedidos-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"  # On-demand pricing
  hash_key       = "PK"
  range_key      = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  attribute {
    name = "GSI2PK"
    type = "S"
  }

  attribute {
    name = "GSI2SK"
    type = "S"
  }

  attribute {
    name = "GSI3PK"
    type = "S"
  }

  attribute {
    name = "GSI3SK"
    type = "S"
  }

  # GSI1: Buscar por CPF
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  # GSI2: Buscar por E-mail
  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    projection_type = "ALL"
  }

  # GSI3: Buscar por Status
  global_secondary_index {
    name            = "GSI3"
    hash_key        = "GSI3PK"
    range_key       = "GSI3SK"
    projection_type = "ALL"
  }

  # Point-in-time recovery (backup)
  point_in_time_recovery {
    enabled = true
  }

  # Encryption at rest
  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "Pedidos E-commerce"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Permissão para Lambda acessar DynamoDB
resource "aws_iam_policy" "lambda_dynamodb" {
  name = "${var.project_name}-lambda-dynamodb-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.pedidos.arn,
          "${aws_dynamodb_table.pedidos.arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda_api.name
  policy_arn = aws_iam_policy.lambda_dynamodb.arn
}

# Outputs
output "dynamodb_table_name" {
  value = aws_dynamodb_table.pedidos.name
}

output "dynamodb_table_arn" {
  value = aws_dynamodb_table.pedidos.arn
}
```

---

## 2.5. Dashboard de Pedidos (Futuro - Fase 3)

### **Funcionalidades**

1. **Listar Pedidos**
   - Filtrar por: Status, Data, CPF, E-mail, Protocolo
   - Ordenar por: Data (mais recentes primeiro)
   - Paginação

2. **Detalhes do Pedido**
   - Dados do titular
   - Dados do pagador
   - Produto
   - Pagamento (status, PIX, transação)
   - UTMs (origem do tráfego)
   - Timeline de eventos

3. **Relatórios**
   - Total de pedidos por status
   - Taxa de conversão (protocolos → pagos)
   - Ticket médio
   - Produtos mais vendidos
   - Origem de tráfego (UTMs)
   - Funil de conversão

---

### **Tecnologia Sugerida**

**Opção 1: AWS AppSync + React**
- GraphQL API (AppSync)
- Frontend em React
- Hospedado no S3 + CloudFront

**Opção 2: Lambda + API Gateway + Admin simples**
- Endpoints REST para listar/filtrar
- Frontend HTML/JavaScript simples
- Mesma stack atual

---

## 2.6. Checklist de Implementação (Banco de Dados)

### **Fase 2.1: Setup DynamoDB**
- [ ] Criar tabela via Terraform
- [ ] Configurar GSIs (índices)
- [ ] Configurar backup (Point-in-time recovery)
- [ ] Configurar permissões IAM
- [ ] Testar criação de items manualmente

### **Fase 2.2: Desenvolvimento**
- [ ] Criar `dynamodb_service.py`
- [ ] Criar `utm_service.py`
- [ ] Integrar no `lambda_handler.py` (3 pontos)
- [ ] Capturar UTMs no frontend (localStorage → enviar na API)
- [ ] Testar localmente (api_server.py + DynamoDB local)

### **Fase 2.3: Deploy**
- [ ] Aplicar Terraform (DynamoDB resources)
- [ ] Build Lambda com novos arquivos
- [ ] Deploy Lambda atualizada
- [ ] Testar em produção

### **Fase 2.4: Validação**
- [ ] Fazer checkout completo (end-to-end)
- [ ] Verificar item criado no DynamoDB
- [ ] Verificar eventos registrados
- [ ] Verificar UTMs salvos

### **Fase 2.5: Dashboard (Opcional - Fase 3)**
- [ ] Definir tecnologia (AppSync ou Lambda)
- [ ] Criar endpoints de listagem
- [ ] Criar frontend de dashboard
- [ ] Deploy do dashboard

---

## 📊 Benefícios Após Implementação Completa

### **E-mails**
✅ Melhor experiência do cliente (confirmações automáticas)
✅ Redução de dúvidas (suporte)
✅ Profissionalismo (marca)

### **Banco de Dados**
✅ Rastreabilidade total (todos os pedidos salvos)
✅ Conciliação financeira (PIX vs Protocolos)
✅ Suporte eficiente (consultar por CPF/email/protocolo)
✅ Auditoria LGPD (compliance)

### **UTMs**
✅ ROI de marketing (qual canal converte)
✅ Otimização de campanhas (dados reais)
✅ Decisões baseadas em dados

### **Dashboard**
✅ Visibilidade operacional
✅ Relatórios automatizados
✅ Identificação de gargalos

---

## 💰 Estimativa de Custo Mensal (AWS)

### **SES (E-mails)**
- 1.000 pedidos/mês × 4 e-mails = 4.000 e-mails
- Custo: **$0.40/mês** (Free Tier: 62.000 grátis)

### **DynamoDB**
- 1.000 pedidos/mês × 3 eventos = 4.000 writes
- 10.000 reads/mês (consultas)
- Armazenamento: ~10 MB
- Custo: **$2-5/mês**

### **Lambda (adicional)**
- Processamento de e-mails e DB: +2 segundos/request
- Custo adicional: **$1-2/mês**

### **Total Estimado: $3-7/mês** (para 1.000 pedidos)

---

## 🚀 Ordem de Implementação Recomendada

1. **Semana 1-2**: E-mails Transacionais (SES)
   - Setup SES + Templates
   - Integração Lambda
   - Testes e deploy

2. **Semana 3-4**: Banco de Dados (DynamoDB)
   - Setup DynamoDB + GSIs
   - Implementação dos services
   - Captura de UTMs
   - Testes e deploy

3. **Semana 5-6**: Monitoramento e Ajustes
   - Monitorar métricas
   - Ajustar templates de e-mail
   - Validar dados salvos

4. **Futuro (Fase 3)**: Dashboard Admin
   - Design e planejamento
   - Desenvolvimento
   - Deploy

---

## 📝 Próximos Passos

1. **Revisar este roadmap** com a equipe
2. **Definir prioridades** (e-mails primeiro ou DB primeiro?)
3. **Alocar recursos** (dev time)
4. **Iniciar Fase 1** (E-mails Transacionais)

---

**Documento criado**: 23/10/2025
**Versão**: 1.0
**Mantido por**: Equipe de Desenvolvimento
