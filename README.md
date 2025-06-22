
# 🚀 StellarPrice Oracle - Real-time Crypto Oracle on Stellar

https://drive.google.com/file/d/1dhQchLIvAp9XcbpCoD8ROnsYxg-0AewQ/view?usp=sharing

A hackathon-ready price oracle that fetches real crypto prices from **DexScreener API** and stores them on the Stellar blockchain.

## ⚡ Quick Start (5 minutes)

```bash
# 1. Install prerequisites
# - Node.js 18+
# - Stellar CLI: https://stellar.org/developers-blog/how-to-install-stellar-cli

# 2. Setup Stellar CLI
stellar network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# 3. Create and fund account
stellar keys generate alice --global
stellar keys fund alice --network testnet

# 4. Run setup script
chmod +x complete-setup.sh
./complete-setup.sh

# 5. Deploy and start
chmod +x quick-deploy.sh
./quick-deploy.sh

# 6. Edit .env with your Stellar secret key

# 7. Start the whole app (backend + frontend)
chmod +x start.sh
./start.sh

# 8. Visit http://localhost:3000 🎉
```

## 🚀 Deployment & Setup

For a full guided setup, use the included deployment script:

```bash
chmod +x deploy-setup.sh
./deploy-setup.sh
```

- This script checks prerequisites, builds/contracts, updates `.env`, installs dependencies, and provides one-click startup/test scripts:
  - `./start-oracle.sh` – Start both backend and frontend
  - `./test-oracle.sh` – Test API and frontend health
  - `./start.sh` – Start the whole app (recommended)

**Manual quick start:**  
See below or use the script above for a smoother experience.

## 🎯 What You Get

- ✅ **Real DexScreener API data** (BTC, ETH, SOL, XLM, WBTC, WETH, WSOL, etc.)
- ✅ **Soroban contract** (stores prices on-chain)
- ✅ **Beautiful React dashboard** (animated price cards, live charts)
- ✅ **Manual data submission** (perfect for demos)
- ✅ **One-click deployment**

## 🏗️ Architecture

```
DexScreener API → Oracle Service → Soroban Contract → React Frontend
     ↓                ↓               ↓                ↓
  BTC: $67K      → Format data   → Store on-chain   → Live charts
```

## 📁 Project Structure

```
stellar-price-oracle/
├── 📋 README.md
├── 🚀 quick-deploy.sh         # One-click deployment
├── ⚙️ .env.example
│
├── 🦀 contract/               # Simple Soroban Contract
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs            # Minimal price oracle contract
│
├── 🌐 oracle-service/         # Node.js Price Fetcher
│   ├── package.json
│   ├── index.js              # Main oracle service
│   └── ...                   # Price fetcher, Stellar client
│
├── 🎨 frontend/               # React Dashboard
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.tsx           # Main app
│   │   ├── components/
│   │   │   ├── PriceCard.tsx     # Animated price cards
│   │   │   ├── LiveChart.tsx     # Real-time charts
│   │   │   ├── NetworkStatus.tsx # Oracle health
│   │   │   └── SubmitData.tsx    # Manual data submission
│   │   ├── hooks/
│   │   │   ├── useOracle.ts      # Oracle data hook
│   │   │   └── usePrices.ts      # Price data hook
│   │   ├── services/
│   │   │   ├── stellar.ts        # Stellar integration
│   │   │   └── api.ts            # Backend API
│   │   └── types/
│   │       └── oracle.ts         # TypeScript types
│   └── public/
│
├── 📚 docs/
│   ├── DEMO.md                   # Demo script
│   └── DEPLOY.md                 # Quick deployment guide
```

## 🔗 Smart Contract to App Integration Flow

```
1. RUST CONTRACT (contract/src/lib.rs)
   ↓ compiles to WASM
2. WASM FILE (target/wasm32-unknown-unknown/release/price_oracle.wasm)
   ↓ deploys to Stellar
3. CONTRACT ID (e.g., CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA)
   ↓ stored in .env
4. ORACLE SERVICE (oracle-service/index.js)
   ↓ reads contract ID, submits prices
5. FRONTEND (frontend/src)
   ↓ calls oracle API, displays data
```

### 🦀 Build & Deploy Flow

1. **Build Rust contract:**  
   `cd contract && cargo build --target wasm32-unknown-unknown --release`
2. **Deploy contract:**  
   `stellar contract deploy --wasm target/wasm32-unknown-unknown/release/price_oracle.wasm --source alice --network testnet`
3. **Update `.env` with CONTRACT_ID**  
   (or use the deployment script to automate)
4. **Oracle service reads CONTRACT_ID and submits prices**
5. **Frontend displays on-chain prices via the oracle API**

See [`../deploy-setup.sh`](../deploy-setup.sh) for a full automated script.

## 🎪 Perfect for Hackathons

1. **"Live BTC price from DexScreener API"** *(show real data)*
2. **"Stored on Stellar testnet"** *(show contract)*  
3. **"Updates every 30 seconds"** *(watch animation)*
4. **"I can submit custom data"** *(live interaction)*
5. **"Built in 6 hours!"** *(win judges)*

Built with ❤️ for the Stellar ecosystem

## 🚀 Simple Commands & Quick Reference

See [`SIMPLE_COMMANDS.md`](./SIMPLE_COMMANDS.md) for a full list of one-liners, troubleshooting, and hackathon demo tips.
See [`SIMPLE_COMMANDS.md`](./SIMPLE_COMMANDS.md) for a full list of one-liners, troubleshooting, and hackathon demo tips.
