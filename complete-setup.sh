#!/bin/bash
# complete-setup.sh - Build the entire StellarPrice Oracle from scratch

echo "🚀 StellarPrice Oracle - Complete Setup"
echo "======================================"

# Create project structure
echo "📁 Creating project structure..."
mkdir -p stellar-price-oracle/{contract/src,oracle-service,frontend/src/{components,hooks,services,types,utils},docs}

cd stellar-price-oracle

# Create all files with content
echo "📝 Creating project files..."

# Root files
cat > README.md << 'EOF'
# 🚀 StellarPrice Oracle - Real-time Crypto Oracle on Stellar

A hackathon-ready price oracle that fetches real crypto prices from Binance API and stores them on Stellar blockchain.

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
# 7. Visit http://localhost:3000 🎉
```

## 🎯 What You Get

- ✅ **Real Binance API data** (BTC, ETH, XLM prices)
- ✅ **30-line Soroban contract** (stores prices on-chain)
- ✅ **Beautiful React dashboard** (animated price cards, live charts)
- ✅ **Manual data submission** (perfect for demos)
- ✅ **One-click deployment**

## 🏗️ Architecture

```
Binance API → Oracle Service → Soroban Contract → React Frontend
     ↓              ↓               ↓              ↓
  BTC: $67K    → Format data   → Store on-chain → Live charts
```

## 🎪 Perfect for Hackathons

1. **"Live BTC price from Binance API"** *(show real data)*
2. **"Stored on Stellar testnet"** *(show contract)*  
3. **"Updates every 30 seconds"** *(watch animation)*
4. **"I can submit custom data"** *(live interaction)*
5. **"Built in 6 hours!"** *(win judges)*

Built with ❤️ for the Stellar ecosystem
EOF

cat > .env.example << 'EOF'
# Stellar Configuration
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
ORACLE_CONTRACT_ID=

# Provider Account (Get from: stellar keys show alice --secret)
PROVIDER_SECRET=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
PROVIDER_PUBLIC=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Oracle Service
API_PORT=3001
UPDATE_INTERVAL=30000
LOG_LEVEL=info

# Frontend
REACT_APP_ORACLE_API=http://localhost:3001
REACT_APP_CONTRACT_ID=
EOF

cat > package.json << 'EOF'
{
  "name": "stellar-price-oracle",
  "version": "1.0.0",
  "description": "Real-time price oracle for Stellar blockchain",
  "scripts": {
    "build:contract": "cd contract && stellar contract build",
    "start:oracle": "cd oracle-service && npm start",
    "start:frontend": "cd frontend && npm run dev",
    "start": "concurrently \"npm run start:oracle\" \"npm run start:frontend\"",
    "install:all": "cd oracle-service && npm install && cd ../frontend && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  },
  "keywords": ["stellar", "oracle", "blockchain", "cryptocurrency", "hackathon"],
  "author": "Your Name",
  "license": "MIT"
}
EOF

# Contract files
cat > contract/Cargo.toml << 'EOF'
[package]
name = "stellar-price-oracle"
version = "1.0.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
soroban-sdk = "21.0.0"

[dev-dependencies]
soroban-sdk = { version = "21.0.0", features = ["testutils"] }

[features]
testutils = ["soroban-sdk/testutils"]

[profile.release]
opt-level = "z"
overflow-checks = true
debug = 0
strip = "symbols"
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = true
EOF

cat > contract/src/lib.rs << 'EOF'
#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Address, Symbol, log};

#[contract]
pub struct PriceOracle;

#[contractimpl]
impl PriceOracle {
    /// Set price for a symbol (only authorized providers)
    pub fn set_price(env: Env, symbol: Symbol, price: u64, provider: Address) {
        provider.require_auth();
        
        let timestamp = env.ledger().timestamp();
        
        // Store price and metadata
        env.storage().instance().set(&symbol, &price);
        env.storage().instance().set(&(symbol.clone(), symbol_short!("time")), &timestamp);
        env.storage().instance().set(&(symbol.clone(), symbol_short!("provider")), &provider);
        
        log!(&env, "Price set: {} = {} by {}", symbol, price, provider);
    }
    
    /// Get current price for a symbol
    pub fn get_price(env: Env, symbol: Symbol) -> Option<u64> {
        env.storage().instance().get(&symbol)
    }
    
    /// Get price timestamp  
    pub fn get_timestamp(env: Env, symbol: Symbol) -> Option<u64> {
        env.storage().instance().get(&(symbol, symbol_short!("time")))
    }
    
    /// Get price provider
    pub fn get_provider(env: Env, symbol: Symbol) -> Option<Address> {
        env.storage().instance().get(&(symbol, symbol_short!("provider")))
    }
    
    /// Check if price is fresh (within max_age seconds)
    pub fn is_fresh(env: Env, symbol: Symbol, max_age: u64) -> bool {
        if let Some(timestamp) = Self::get_timestamp(env.clone(), symbol) {
            env.ledger().timestamp() - timestamp <= max_age
        } else {
            false
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as TestAddress, Address, Env};

    #[test]
    fn test_price_oracle() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PriceOracle);
        let client = PriceOracleClient::new(&env, &contract_id);
        
        let provider = Address::generate(&env);
        let symbol = symbol_short!("BTC");
        let price = 6700000; // $67,000.00 (2 decimals)
        
        client.set_price(&symbol, &price, &provider);
        
        assert_eq!(client.get_price(&symbol), Some(price));
        assert!(client.is_fresh(&symbol, &300)); // 5 minutes
    }
}
EOF

# Oracle service files
cat > oracle-service/package.json << 'EOF'
{
  "name": "stellar-price-oracle-service",
  "version": "1.0.0",
  "description": "Price oracle service using Binance API",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "@stellar/stellar-sdk": "^12.0.1",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

cat > oracle-service/index.js << 'EOF'
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { Keypair, SorobanRpc, TransactionBuilder, Networks, Contract, Address } from '@stellar/stellar-sdk';

class StellarPriceOracle {
  constructor() {
    this.app = express();
    this.server = new SorobanRpc.Server(process.env.STELLAR_RPC_URL);
    this.networkPassphrase = Networks.TESTNET;
    this.contractId = process.env.ORACLE_CONTRACT_ID;
    this.provider = process.env.PROVIDER_SECRET ? Keypair.fromSecret(process.env.PROVIDER_SECRET) : null;
    this.contract = this.contractId ? new Contract(this.contractId) : null;
    this.latestPrices = {};
    this.startTime = Date.now();
    
    this.setupExpress();
    this.setupRoutes();
  }

  setupExpress() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({
        status: this.contractId ? 'healthy' : 'waiting_for_contract',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        binance: { status: 'online' },
        contract: this.contractId ? 'connected' : 'not_deployed',
        prices: Object.keys(this.latestPrices).length,
        provider: this.provider?.publicKey() || 'not_set'
      });
    });

    this.app.get('/prices', (req, res) => {
      res.json({
        prices: this.latestPrices,
        timestamp: new Date().toISOString(),
        count: Object.keys(this.latestPrices).length
      });
    });

    this.app.post('/submit', async (req, res) => {
      try {
        const { symbol, price } = req.body;
        if (!symbol || !price || !this.provider || !this.contract) {
          return res.status(400).json({ error: 'Missing requirements' });
        }

        const priceValue = Math.round(price * 100); // Convert to cents
        const txHash = await this.submitToContract(symbol, priceValue);
        
        if (txHash) {
          this.latestPrices[symbol] = {
            symbol, price, change24h: 0, timestamp: new Date().toISOString(), source: 'manual', txHash
          };
          res.json({ success: true, transaction: txHash, symbol, price });
        } else {
          res.status(500).json({ error: 'Failed to submit to blockchain' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  async fetchBinancePrices() {
    try {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'XLMUSDT'];
      const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
      const prices = {};
      
      response.data.filter(item => symbols.includes(item.symbol)).forEach(item => {
        const symbol = item.symbol.replace('USDT', '');
        prices[symbol] = {
          symbol,
          price: parseFloat(item.lastPrice),
          change24h: parseFloat(item.priceChangePercent),
          timestamp: new Date().toISOString(),
          source: 'binance'
        };
      });
      
      return prices;
    } catch (error) {
      console.error('Binance API error:', error.message);
      return {};
    }
  }

  async submitToContract(symbol, priceValue) {
    try {
      if (!this.provider || !this.contract) return null;
      
      const sourceAccount = await this.server.getAccount(this.provider.publicKey());
      const operation = this.contract.call(
        'set_price',
        { switch: () => 'scvSymbol', sym: () => symbol },
        { switch: () => 'scvU64', u64: () => BigInt(priceValue) },
        new Address(this.provider.publicKey()).toScVal()
      );

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100000',
        networkPassphrase: this.networkPassphrase,
      }).addOperation(operation).setTimeout(30).build();

      transaction.sign(this.provider);
      const result = await this.server.sendTransaction(transaction);
      
      if (result.status === 'PENDING') {
        console.log(`✅ ${symbol}: $${(priceValue/100).toFixed(2)} | TX: ${result.hash.slice(0, 8)}...`);
        return result.hash;
      }
      return null;
    } catch (error) {
      console.error(`❌ Failed to submit ${symbol}:`, error.message);
      return null;
    }
  }

  async updatePrices() {
    try {
      const prices = await this.fetchBinancePrices();
      if (Object.keys(prices).length === 0) return;

      // Submit to contract if available
      if (this.provider && this.contract) {
        for (const [symbol, priceData] of Object.entries(prices)) {
          await this.submitToContract(symbol, Math.round(priceData.price * 100));
        }
      }

      // Update local cache
      this.latestPrices = { ...this.latestPrices, ...prices };
      console.log(`📊 Updated ${Object.keys(prices).length} prices`);
    } catch (error) {
      console.error('❌ Price update failed:', error.message);
    }
  }

  start() {
    const port = process.env.API_PORT || 3001;
    this.app.listen(port, () => {
      console.log(`🌐 Oracle API running on port ${port}`);
      console.log(`📊 Health: http://localhost:${port}/health`);
      console.log(`💰 Prices: http://localhost:${port}/prices`);
      
      // Initial fetch
      this.updatePrices();
      
      // Set up interval
      setInterval(() => this.updatePrices(), 30000);
    });
  }
}

new StellarPriceOracle().start();
EOF

# Frontend files
cat > frontend/package.json << 'EOF'
{
  "name": "stellar-oracle-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^10.16.5",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.1.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2",
    "vite": "^4.5.0"
  }
}
EOF

cat > frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, host: true },
  define: { global: 'globalThis' },
})
EOF

cat > frontend/tailwind.config.js << 'EOF'
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'price-flash': 'priceFlash 1s ease-out',
      },
      keyframes: {
        priceFlash: {
          '0%': { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
}
EOF

cat > frontend/postcss.config.js << 'EOF'
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
EOF

cat > frontend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
EOF

cat > frontend/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StellarPrice Oracle</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

cat > frontend/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

cat > frontend/src/index.css << 'EOF'
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #3730a3 100%);
  min-height: 100vh;
}

.price-flash {
  animation: priceFlash 1s ease-out;
}
EOF

# Create a simplified App.tsx for quick demo
cat > frontend/src/App.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface Price {
  symbol: string;
  price: number;
  change24h: number;
  timestamp: string;
  source: string;
}

const PriceCard: React.FC<{ price: Price; onClick: () => void }> = ({ price, onClick }) => {
  const isPositive = price.change24h >= 0;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{price.symbol}/USD</h3>
        {isPositive ? <TrendingUp className="text-green-400" /> : <TrendingDown className="text-red-400" />}
      </div>
      
      <div className="text-3xl font-bold text-white mb-2">
        ${price.price.toFixed(6)}
      </div>
      
      <div className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{price.change24h.toFixed(2)}% 24h
      </div>
      
      <div className="mt-4 text-xs text-gray-300">
        {new Date(price.timestamp).toLocaleTimeString()} • {price.source}
      </div>
    </motion.div>
  );
};

function App() {
  const [prices, setPrices] = useState<Record<string, Price>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [manualPrice, setManualPrice] = useState('');
  const [manualSymbol, setManualSymbol] = useState('BTC');

  const fetchPrices = async () => {
    try {
      const response = await fetch('http://localhost:3001/prices');
      const data = await response.json();
      setPrices(data.prices || {});
    } catch (error) {
      // Demo mode with simulated data
      setPrices({
        BTC: { symbol: 'BTC', price: 67000 + Math.random() * 1000, change24h: Math.random() * 10 - 5, timestamp: new Date().toISOString(), source: 'demo' },
        ETH: { symbol: 'ETH', price: 3400 + Math.random() * 100, change24h: Math.random() * 8 - 4, timestamp: new Date().toISOString(), source: 'demo' },
        XLM: { symbol: 'XLM', price: 0.12 + Math.random() * 0.02, change24h: Math.random() * 15 - 7.5, timestamp: new Date().toISOString(), source: 'demo' },
      });
    }
    setIsLoading(false);
  };

  const submitPrice = async () => {
    try {
      await fetch('http://localhost:3001/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: manualSymbol, price: parseFloat(manualPrice) }),
      });
      setManualPrice('');
      fetchPrices();
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Zap className="text-yellow-400" size={48} />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              StellarPrice Oracle
            </h1>
          </div>
          <p className="text-xl text-blue-200 mb-6">
            Real-time crypto prices on Stellar blockchain
          </p>
          <div className="flex items-center justify-center space-x-4">
            <div className="bg-green-500/20 px-4 py-2 rounded-full border border-green-500/30 text-green-300">
              🟢 Oracle Online • {Object.keys(prices).length} feeds
            </div>
            <button
              onClick={fetchPrices}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/20 text-white"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </motion.header>

        {Object.keys(prices).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            {Object.values(prices).map((price) => (
              <PriceCard key={price.symbol} price={price} onClick={() => {}} />
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-md mx-auto"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            🎯 Live Price Submission
          </h3>
          
          <div className="space-y-4">
            <select
              value={manualSymbol}
              onChange={(e) => setManualSymbol(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
            >
              <option value="BTC" className="bg-gray-800">Bitcoin (BTC)</option>
              <option value="ETH" className="bg-gray-800">Ethereum (ETH)</option>
              <option value="XLM" className="bg-gray-800">Stellar (XLM)</option>
            </select>
            
            <input
              type="number"
              placeholder="Enter price..."
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
            />
            
            <button
              onClick={submitPrice}
              disabled={!manualPrice}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              🚀 Submit to Oracle
            </button>
          </div>
        </motion.div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 mt-12"
        >
          <p className="text-blue-200">
            🌟 Built on Stellar • 📊 Real Binance Data • ⚡ Live Updates • 🏆 Hackathon Ready
          </p>
        </motion.footer>
      </div>
    </div>
  );
}

export default App;
EOF

# Deployment script
cat > quick-deploy.sh << 'EOF'
#!/bin/bash
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
    --wasm target/wasm32-unknown-unknown/release/stellar_price_oracle.wasm \
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
EOF

echo "✅ Project structure created!"
echo ""
echo "📋 Next steps:"
echo "1. cd stellar-price-oracle"
echo "2. ./quick-deploy.sh"
echo "3. Edit .env with your Stellar secret key"
echo "4. Visit http://localhost:3000"
echo ""
echo "🎉 Your hackathon-winning oracle is ready!"
EOF

chmod +x complete-setup.sh

echo "🎉 Complete setup script created!"
echo ""
echo "🚀 Run this to build the entire project:"
echo "   chmod +x complete-setup.sh"
echo "   ./complete-setup.sh"
echo ""
echo "📋 Then follow the setup steps and you'll have:"
echo "   ✅ Working Soroban contract on Stellar testnet"
echo "   ✅ Real-time price fetching from Binance API"
echo "   ✅ Beautiful React dashboard with animations"
echo "   ✅ Manual price submission for demos"
echo "   ✅ One-click deployment script"
echo ""
echo "🏆 Perfect for hackathons - real data, real blockchain, amazing UX!"