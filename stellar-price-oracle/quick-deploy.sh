#!/bin/bash
# NOTE: For a full guided setup, use deploy-setup.sh instead!
echo "🚀 StellarPrice Oracle - Quick Deploy"
echo "====================================="

# Check requirements
command -v node >/dev/null 2>&1 || { echo "❌ Node.js required"; exit 1; }
command -v stellar >/dev/null 2>&1 || { echo "❌ Stellar CLI required"; exit 1; }

echo "✅ Requirements check passed"

# Setup environment
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env - edit with your Stellar keys!"
fi

# Build and deploy contract
echo "🦀 Building Soroban contract..."
cd contract
stellar contract build --package stellar-price-oracle

echo "🚀 Deploying to testnet..."
CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/price_oracle.wasm \
    --source alice \
    --network testnet)

echo "✅ Contract deployed: $CONTRACT_ID"

# Update .env
cd ..
sed -i.bak "s/ORACLE_CONTRACT_ID=.*/ORACLE_CONTRACT_ID=$CONTRACT_ID/" .env
sed -i.bak "s/REACT_APP_CONTRACT_ID=.*/REACT_APP_CONTRACT_ID=$CONTRACT_ID/" .env

# Get provider secret
PROVIDER_SECRET=$(stellar keys show alice --secret)
sed -i.bak "s/PROVIDER_SECRET=.*/PROVIDER_SECRET=$PROVIDER_SECRET/" .env

# Install dependencies
echo "📦 Installing dependencies..."
cd oracle-service && npm install && cd ..
cd frontend && npm install && cd ..

echo "🌟 Starting services..."

# Start oracle service
cd oracle-service
npm start &
ORACLE_PID=$!
cd ..

sleep 3

# Start frontend  
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================="
echo "📊 Oracle API: http://localhost:3001"
echo "🎨 Frontend: http://localhost:3000"
echo "📋 Contract: $CONTRACT_ID"
echo ""
echo "🎯 Demo ready! Press Ctrl+C to stop"

# Save PIDs for cleanup
echo $ORACLE_PID > .oracle.pid
echo $FRONTEND_PID > .frontend.pid

wait
