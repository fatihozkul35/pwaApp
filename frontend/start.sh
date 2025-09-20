#!/bin/bash

# Vue.js development server starter script

echo "🚀 Starting Vue.js PWA App..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start development server
echo "🌟 Starting development server on http://localhost:3000"
npm run serve
