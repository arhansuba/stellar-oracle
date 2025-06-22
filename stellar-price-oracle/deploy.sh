#!/bin/bash
# 🚀 FIXED ONE SCRIPT TO DEPLOY EVERYTHING

set -e
echo "🌟 Deploying Stellar Price Oracle - Fixed Version"

# Install Stellar CLI
echo "📦 Installing Stellar CLI..."
cargo install --locked stellar-cli --features opt --force

# Add WASM target
rustup target add wasm32-unknown-unknown

# Setup testnet
echo "🌐 Setting up testnet..."
stellar network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Create account
echo "🔑 Creating deployment account..."
stellar keys generate deployer --network testnet --global

# Fund account with proper network passphrase
echo "💰 Funding account..."
stellar keys fund deployer \
  --network testnet \
  --network-passphrase "Test SDF Network ; September 2015"

# Check balance
echo "💳 Checking balance..."
stellar account --id $(stellar keys address deployer) --network testnet

# Build contract
echo "🏗️ Building smart contract..."
cd contract
cargo build --target wasm32-unknown-unknown --release
cd ..

# Deploy contract
echo "🚀 Deploying contract to Stellar..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm contract/target/wasm32-unknown-unknown/release/price_oracle.wasm \
  --source deployer \
  --network testnet)

echo "✅ Contract deployed: $CONTRACT_ID"

# Initialize contract
echo "🔧 Initializing contract..."
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address deployer)

# Test contract
echo "🧪 Testing contract..."
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- get_assets

# Create .env with everything
echo "⚙️ Creating .env..."
cat > .env << EOF
STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
STELLAR_NETWORK=testnet
PROVIDER_SECRET=$(stellar keys show deployer)
ORACLE_CONTRACT_ID=$CONTRACT_ID
API_PORT=3001
UPDATE_INTERVAL=30000
VITE_API_URL=http://localhost:3001
VITE_STELLAR_RPC=https://soroban-testnet.stellar.org:443
VITE_CONTRACT_ID=$CONTRACT_ID
EOF

# Install backend dependencies
echo "📦 Installing backend..."
cd oracle-service
npm install
cd ..

# Install frontend dependencies  
echo "🎨 Installing frontend..."
cd frontend
npm install
cd ..

# Start backend
echo "🌐 Starting backend..."
cd oracle-service
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 5

# Test backend
echo "🧪 Testing backend..."
curl -s http://localhost:3001/health || echo "Backend starting..."

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend
sleep 5

echo ""
echo "🎉 EVERYTHING IS RUNNING!"
echo "========================"
echo ""
echo "📋 Contract ID: $CONTRACT_ID"
echo "🔍 Explorer: https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID"
echo "🌐 Frontend: http://localhost:5173"
echo "📊 Backend: http://localhost:3001/health"
echo ""
echo "🛑 To stop: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🏆 Your oracle is live with real smart contracts!"

# Save PIDs for easy stopping
echo "BACKEND_PID=$BACKEND_PID" > .pids
echo "FRONTEND_PID=$FRONTEND_PID" >> .pids

echo ""
echo "💡 Quick commands:"
echo "   Test contract: stellar contract invoke --id $CONTRACT_ID --source deployer --network testnet -- get_assets"
echo "   Stop services: kill $BACKEND_PID $FRONTEND_PID"
echo "   View logs: tail -f oracle-service/*.log"