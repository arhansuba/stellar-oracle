#!/bin/bash
# 📊 STELLAR PRICE ORACLE - STATUS CHECK

echo "📊 Stellar Price Oracle Status Check"
echo "===================================="
echo ""

# Check backend
echo "🌐 Backend Status:"
if curl -s http://localhost:3001/health > /dev/null; then
    echo "   ✅ Running at http://localhost:3001"
    
    # Get backend info
    HEALTH=$(curl -s http://localhost:3001/health | head -1)
    echo "   📊 Health: $HEALTH"
    
    # Check prices
    PRICE_COUNT=$(curl -s http://localhost:3001/prices | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "   💰 Active Prices: $PRICE_COUNT assets"
else
    echo "   ❌ Not running"
fi

echo ""

# Check frontend
echo "🎨 Frontend Status:"
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Running at http://localhost:3000"
else
    echo "   ❌ Not running"
fi

echo ""

# Check processes
echo "🔧 Process Status:"
BACKEND_PROC=$(pgrep -f "npm start" | wc -l)
FRONTEND_PROC=$(pgrep -f "npm run dev" | wc -l)

echo "   Backend processes: $BACKEND_PROC"
echo "   Frontend processes: $FRONTEND_PROC"

if [ -f .pids ]; then
    echo "   📋 PID file exists"
    cat .pids | sed 's/^/   /'
else
    echo "   ⚠️ No PID file found"
fi

echo ""

# Quick links
echo "🔗 Quick Links:"
echo "   Frontend:     http://localhost:3000"
echo "   Backend API:  http://localhost:3001/health"
echo "   Live Prices:  http://localhost:3001/prices"
echo "   Contract:     https://stellar.expert/explorer/testnet/contract/CCSEZNQLDRP5FJGQTSHKQRCPPXKWDO3TB72OSE4U7IOCNRLE65HTNQ63"

echo ""
echo "💡 Commands:"
echo "   Start:  ./start.sh"
echo "   Stop:   ./stop.sh"
echo "   Status: ./status.sh"