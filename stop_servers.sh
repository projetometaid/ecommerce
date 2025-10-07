#!/bin/bash
# Script para parar todos os servidores

echo "🛑 Parando servidores..."

# Matar processos nas portas 8080 e 8082
if lsof -ti:8080 >/dev/null 2>&1; then
    echo "   Parando servidor frontend (8080)..."
    lsof -ti:8080 | xargs kill -9 2>/dev/null
fi

if lsof -ti:8082 >/dev/null 2>&1; then
    echo "   Parando API backend (8082)..."
    lsof -ti:8082 | xargs kill -9 2>/dev/null
fi

# Matar processos Python específicos do projeto
pkill -f "api_server.py" 2>/dev/null
pkill -f "http.server 8080" 2>/dev/null

echo "✅ Todos os servidores foram parados"
