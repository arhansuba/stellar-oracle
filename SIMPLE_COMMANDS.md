# 🚀 STELLAR PRICE ORACLE - SIMPLE COMMANDS

# ===========================================
# 📦 INITIAL SETUP (Run Once)
# ===========================================

# Install dependencies
cd oracle-service && npm install && cd ..
cd frontend && npm install && cd ..

# Create environment file
cp .env.example .env
# Edit .env with your settings (optional for demo)

# ===========================================
# 🦀 CONTRACT DEPLOYMENT (Optional)
# ===========================================

# Install Rust and WASM target
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Build contract
cd contract
cargo build --target wasm32-unknown-unknown --release
cd ..

# Deploy with Stellar CLI (if installed)
cd contract
stellar keys generate alice --network testnet
stellar keys fund alice --network testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/price_oracle.wasm \
  --source alice \
  --network testnet
cd ..

# ===========================================
# 🚀 START SERVICES (Every Time)
# ===========================================

# Method 1: Manual (2 terminals)

# Terminal 1 - Oracle Service:
cd oracle-service
npm start

# Terminal 2 - Frontend:
cd frontend  
npm run dev

# Method 2: Background (1 terminal)
cd oracle-service && npm start &
cd frontend && npm run dev

# Method 3: Quick Script
cat > start.sh << 'EOF'
#!/bin/bash
cd oracle-service && npm start &
sleep 3
cd frontend && npm run dev
EOF
chmod +x start.sh
./start.sh

# ===========================================
# 🌐 ACCESS URLS
# ===========================================

# Frontend Dashboard: http://localhost:5173
# Oracle API Health: http://localhost:3001/health  
# Live Prices: http://localhost:3001/prices
# API Status: http://localhost:3001/status

# ===========================================
# 🧪 QUICK TESTS
# ===========================================

# Test Oracle API
curl http://localhost:3001/health
curl http://localhost:3001/prices
curl http://localhost:3001/status

# Test Frontend
curl http://localhost:5173

# Submit test price
curl -X POST http://localhost:3001/submit \
  -H "Content-Type: application/json" \
  -d '{"symbol":"TEST","price":12345.67,"source":"manual"}'

# ===========================================
# 🛑 STOP SERVICES
# ===========================================

# Stop by process name
pkill -f "npm start"
pkill -f "npm run dev"

# Or use Ctrl+C in each terminal

# ===========================================
# 🔧 TROUBLESHOOTING
# ===========================================

# Check if ports are in use
lsof -i :3001  # Oracle service
lsof -i :5173  # Frontend

# Kill specific port processes
kill -9 $(lsof -t -i:3001)
kill -9 $(lsof -t -i:5173)

# Check logs
cd oracle-service && npm start 2>&1 | tee oracle.log
cd frontend && npm run dev 2>&1 | tee frontend.log

# Rebuild if needed
cd frontend && npm run build
cd contract && cargo clean && cargo build --target wasm32-unknown-unknown --release

# ===========================================
# 📱 DEMO MODE COMMANDS
# ===========================================

# Start in demo mode (no contract needed)
export DEMO_MODE=true
cd oracle-service && npm start &
cd frontend && npm run dev

# ===========================================
# 🎯 ONE-LINER FOR HACKATHONS
# ===========================================

# Complete setup and start
git clone YOUR_REPO && cd stellar-price-oracle && \
cd oracle-service && npm install && cd ../frontend && npm install && cd .. && \
(cd oracle-service && npm start &) && sleep 3 && cd frontend && npm run dev

# ===========================================
# 📋 PACKAGE.JSON SCRIPTS TO ADD
# ===========================================

# Add these to your root package.json:
{
  "scripts": {
    "install:all": "cd oracle-service && npm install && cd ../frontend && npm install",
    "start:oracle": "cd oracle-service && npm start",
    "start:frontend": "cd frontend && npm run dev",
    "start:both": "concurrently \"npm run start:oracle\" \"npm run start:frontend\"",
    "build:contract": "cd contract && cargo build --target wasm32-unknown-unknown --release",
    "build:frontend": "cd frontend && npm run build",
    "test:api": "curl http://localhost:3001/health",
    "deploy:contract": "cd contract && stellar contract deploy --wasm target/wasm32-unknown-unknown/release/price_oracle.wasm --source alice --network testnet"
  }
}

# Then you can use:
npm run install:all
npm run start:both

# ===========================================
# 🏆 HACKATHON DEPLOYMENT
# ===========================================

# Deploy frontend to Vercel
cd frontend
npm run build
npx vercel --prod

# Deploy oracle to Railway
cd oracle-service
# Connect to Railway and deploy

# Update .env with production URLs
VITE_API_URL=https://your-oracle.railway.app

# ===========================================
# 💡 QUICK DEMO CHECKLIST
# ===========================================

# ✅ Oracle service running (http://localhost:3001/health)
# ✅ Frontend running (http://localhost:5173)  
# ✅ Live prices loading from DexScreener
# ✅ Price cards displaying correctly
# ✅ Manual price submission working
# ✅ Charts rendering properly
# ✅ Cost comparison showing ($0.00001 vs $500)
# ✅ Network status showing "healthy"

# Demo flow:
# 1. Show dashboard with live prices
# 2. Click price cards to show charts  
# 3. Submit manual price update
# 4. Highlight cost savings
# 5. Explain Stellar advantages
