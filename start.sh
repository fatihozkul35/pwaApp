#!/bin/bash

echo "🚀 Starting PWA App..."

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check ports
if ! check_port 8000; then
    echo "Please stop the service using port 8000 and try again"
    exit 1
fi

if ! check_port 3000; then
    echo "Please stop the service using port 3000 and try again"
    exit 1
fi

# Start Django backend
echo "🐍 Starting Django Backend..."
cd backend
python run.py &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 5

# Start Vue.js frontend
echo "⚡ Starting Vue.js Frontend..."
cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

npm run serve &
FRONTEND_PID=$!

echo ""
echo "🎉 Both servers are running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for processes
wait
