#!/bin/bash
# 🛑 STELLAR PRICE ORACLE - STOP SCRIPT

echo "🛑 Stopping Stellar Price Oracle..."

# Read PIDs if available
if [ -f .pids ]; then
    source .pids
    
    if [ ! -z "$BACKEND_PID" ]; then
        echo "🌐 Stopping Backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "🎨 Stopping Frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    rm .pids
else
    echo "🧹 No PID file found, killing by process name..."
fi

# Kill by process name as backup
pkill -f "npm start" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null

# Wait a moment
sleep 2

# Check if processes are really stopped
if pgrep -f "npm start" > /dev/null || pgrep -f "npm run dev" > /dev/null; then
    echo "⚠️ Some processes still running, force killing..."
    pkill -9 -f "npm start" 2>/dev/null
    pkill -9 -f "npm run dev" 2>/dev/null
fi

echo "✅ All processes stopped"
echo ""
echo "💡 To start again: ./start.sh"