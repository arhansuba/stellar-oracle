# ⚡ STELLAR PRICE ORACLE - ULTRA SIMPLE COMMANDS

# ===========================================
# 🎯 COPY-PASTE THESE COMMANDS:
# ===========================================

# 1️⃣ SETUP (run once)
cd oracle-service && npm install
cd ../frontend && npm install  
cd ..

# 2️⃣ START ORACLE (Terminal 1)
cd oracle-service
npm start

# 3️⃣ START FRONTEND (Terminal 2) 
cd frontend
npm run dev

# 4️⃣ OPEN BROWSER
# http://localhost:5173

# ===========================================
# 🚀 ONE-COMMAND STARTUP SCRIPT
# ===========================================

cat > run.sh << 'EOF'
#!/bin/bash
echo "🌟 Starting Stellar Price Oracle..."
(cd oracle-service && npm start) &
sleep 3  
cd frontend && npm run dev
EOF

chmod +x run.sh
./run.sh

# ===========================================
# 🧪 TEST IT WORKS
# ===========================================

curl http://localhost:3001/health
curl http://localhost:3001/prices

# Should see:
# ✅ Oracle: {"status":"healthy",...}
# ✅ Prices: {"prices":{"BTC":{"price":67000...}

# ===========================================
# 🎭 DEMO WITHOUT CONTRACTS
# ===========================================

# Your oracle works perfectly without deploying contracts!
# It uses:
# ✅ Real DexScreener price data
# ✅ Simulated Stellar transactions  
# ✅ Professional UI/UX
# ✅ Cost comparison ($0.00001 vs $500)

# Perfect for hackathon demos! 🏆

# ===========================================
# 📱 MOBILE QUICK TEST
# ===========================================

# Get your computer's IP address
ipconfig getifaddr en0  # Mac
hostname -I | cut -d' ' -f1  # Linux

# Then access from mobile:
# http://YOUR_IP:5173

# ===========================================
# 🛑 STOP EVERYTHING
# ===========================================

pkill -f "npm start"
pkill -f "npm run dev"

# ===========================================
# 🔥 ULTRA-FAST DEMO SETUP
# ===========================================

# If you need to demo in 30 seconds:

# 1. Copy all project files to computer
# 2. Run these 4 commands:

cd stellar-price-oracle
cd oracle-service && npm install && npm start &
cd ../frontend && npm install && npm run dev &
sleep 5 && open http://localhost:5173

# 🎉 DONE! Oracle running in 30 seconds!
