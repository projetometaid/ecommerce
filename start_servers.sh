#!/bin/bash
# Script para iniciar API backend + Frontend estático

echo "🚀 Iniciando servidores..."
echo ""

# Verificar se as portas estão em uso
if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Porta 8082 (API) já está em uso"
    echo "💡 Execute: lsof -ti:8082 | xargs kill -9"
    exit 1
fi

if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Porta 8080 (Frontend) já está em uso"
    echo "💡 Execute: lsof -ti:8080 | xargs kill -9"
    exit 1
fi

# Iniciar API backend em background
echo "📡 Iniciando API backend (porta 8082)..."
python3 api_server.py &
API_PID=$!
sleep 2

# Iniciar servidor estático para o frontend em background
echo "🌐 Iniciando servidor frontend (porta 8080)..."
python3 -m http.server 8080 &
STATIC_PID=$!
sleep 1

echo ""
echo "=" | head -c 60 | tr -d '\n' && echo "="
echo "✅ Servidores iniciados com sucesso!"
echo "=" | head -c 60 | tr -d '\n' && echo "="
echo ""
echo "🌐 Frontend:  http://localhost:8080"
echo "📡 API:       http://localhost:8082"
echo ""
echo "📋 Páginas disponíveis:"
echo "   http://localhost:8080/public/index.html   - Site principal"
echo "   http://localhost:8080/public/e-cpf.html   - Checkout e-CPF"
echo ""
echo "⏹️  Para parar: Ctrl+C ou execute ./stop_servers.sh"
echo "=" | head -c 60 | tr -d '\n' && echo "="
echo ""

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando servidores..."
    kill $API_PID 2>/dev/null
    kill $STATIC_PID 2>/dev/null
    echo "✅ Servidores parados"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

# Aguardar
wait
