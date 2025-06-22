#!/bin/bash
# 🚀 STELLAR PRICE ORACLE - START SCRIPT

echo "🌟 Starting Stellar Price Oracle..."

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "npm start" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 2

# Start backend
echo "🌐 Starting Backend..."
cd oracle-service
export ORACLE_CONTRACT_ID=CCSEZNQLDRP5FJGQTSHKQRCPPXKWDO3TB72OSE4U7IOCNRLE65HTNQ63
export PROVIDER_SECRET=SBLNHW4PBCYUZBZ6SFFOVJ6ORBQR5T3FYFCBFO2DSZVXXLVLZMQDSLLX
STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443 npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend started successfully"
else
    echo "❌ Backend failed to start"
    cat backend.log
    exit 1
fi

# Start frontend
echo "🎨 Starting Frontend..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 5

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend started successfully"
else
    echo "❌ Frontend failed to start"
    cat frontend.log
    exit 1
fi

# Save PIDs for easy stopping
echo "BACKEND_PID=$BACKEND_PID" > .pids
echo "FRONTEND_PID=$FRONTEND_PID" >> .pids

echo ""
echo "🎉 STELLAR PRICE ORACLE IS RUNNING!"
echo "=================================="
echo ""
echo "🌐 Frontend:    http://localhost:3000"
echo "📊 Backend API: http://localhost:3001/health"
echo "💰 Live Prices: http://localhost:3001/prices"
echo "📋 Contract:    CCSEZNQLDRP5FJGQTSHKQRCPPXKWDO3TB72OSE4U7IOCNRLE65HTNQ63"
echo ""
echo "📋 Process IDs:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "🛑 To stop: ./stop.sh"
echo "📊 To check logs: tail -f backend.log frontend.log"
echo ""
echo "🏆 Your oracle is live with real DexScreener data!"

# Keep script running to show logs
echo ""
echo "📊 Live Backend Logs (Ctrl+C to stop showing logs):"
tail -f backend.log