#!/bin/bash

# ==================================
# BUILD SCRIPT - AWS LAMBDA
# ==================================

set -e

echo "🔨 Construindo Lambda function..."

# Criar diretórios
mkdir -p dist
mkdir -p layers/python/lib/python3.12/site-packages

# Instalar dependências no layer
echo "📦 Instalando dependências..."
pip3 install -r requirements.txt -t layers/python/lib/python3.12/site-packages --upgrade

# Criar ZIP do layer
echo "📦 Criando layer de dependências..."
cd layers
zip -r9 ../dist/python-deps.zip python
cd ..

# Criar ZIP da função Lambda
echo "📦 Criando pacote Lambda..."
cd dist
cp ../lambda_handler.py .
zip -r9 function.zip lambda_handler.py
rm lambda_handler.py
cd ..

# Mover para diretório lambda
mv dist/function.zip .
mv dist/python-deps.zip layers/

echo "✅ Build concluído!"
echo "   - function.zip: $(du -h function.zip | cut -f1)"
echo "   - layers/python-deps.zip: $(du -h layers/python-deps.zip | cut -f1)"
