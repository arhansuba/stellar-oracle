import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { Keypair, SorobanRpc, TransactionBuilder, Networks, Contract, Address, nativeToScVal } from '@stellar/stellar-sdk';

class DexScreenerPriceFetcher {
  constructor() {
    this.baseURL = 'https://api.dexscreener.com';
    
    // Official token addresses for maximum accuracy
    this.tokenConfig = {
      'BTC': {
        name: 'Wrapped Bitcoin',
        addresses: {
          'solana': '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // WBTC on Solana
          'ethereum': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC on Ethereum
        },
        searchTerms: ['WBTC', 'Bitcoin', 'BTC'],
        minLiquidity: 100000
      },
      'ETH': {
        name: 'Wrapped Ethereum',
        addresses: {
          'solana': '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // WETH on Solana
          'ethereum': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH on Ethereum
        },
        searchTerms: ['WETH', 'Ethereum', 'ETH'],
        minLiquidity: 100000
      },
      'SOL': {
        name: 'Wrapped Solana',
        addresses: {
          'solana': 'So11111111111111111111111111111111111111112', // Native SOL
          'ethereum': '0xD31a59c85aE9D8edEFeC411D448f90841571b89c', // Wrapped SOL on Ethereum
        },
        searchTerms: ['SOL', 'Solana', 'WSOL'],
        minLiquidity: 50000
      },
      'XLM': {
        name: 'Stellar Lumens',
        addresses: {
          'ethereum': '0x0C10bF8FcB7Bf5412187A595ab97a3609160b5c6', // XLM on Ethereum
        },
        searchTerms: ['XLM', 'Stellar', 'Stellar Lumens'],
        minLiquidity: 25000
      }
    };

    // Rate limiting
    this.lastRequest = 0;
    this.minRequestInterval = 250; // 4 requests per second (well under 300/minute limit)
  }

  async rateLimitedRequest(url, params = {}) {
    // Ensure we don't exceed rate limits
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }

    this.lastRequest = Date.now();
    
    return axios.get(url, {
      params,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'StellarOracle/1.0'
      }
    });
  }

  async fetchPrices() {
    try {
      console.log('📊 Fetching prices from DexScreener API...');
      const prices = {};
      
      // Method 1: Try specific token addresses first (most reliable)
      for (const [symbol, config] of Object.entries(this.tokenConfig)) {
        try {
          let bestPrice = await this.fetchByTokenAddress(symbol, config);
          
          // Method 2: Fallback to search if token address method fails
          if (!bestPrice) {
            bestPrice = await this.fetchBySearch(symbol, config);
          }
          
          if (bestPrice) {
            prices[symbol] = bestPrice;
            console.log(`💰 ${symbol}: $${bestPrice.price.toFixed(6)} via ${bestPrice.method} (${bestPrice.dex})`);
          } else {
            console.log(`⚠️ No price found for ${symbol}`);
          }
          
        } catch (error) {
          console.error(`❌ Error fetching ${symbol}:`, error.message);
        }
      }
      
      return prices;
    } catch (error) {
      console.error('❌ DexScreener fetch error:', error.message);
      return {};
    }
  }

  async fetchByTokenAddress(symbol, config) {
    try {
      // Try Solana first (usually has good liquidity), then Ethereum
      for (const [chainId, tokenAddress] of Object.entries(config.addresses)) {
        try {
          const response = await this.rateLimitedRequest(
            `${this.baseURL}/tokens/v1/${chainId}/${tokenAddress}`
          );
          
          const pairs = response.data || [];
          const validPairs = this.filterAndSortPairs(pairs, config.minLiquidity);
          
          if (validPairs.length > 0) {
            const bestPair = validPairs[0];
            return this.formatPriceData(symbol, bestPair, 'token_address', chainId);
          }
        } catch (error) {
          console.log(`⚠️ Token address method failed for ${symbol} on ${chainId}: ${error.message}`);
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Token address fetch failed for ${symbol}:`, error.message);
      return null;
    }
  }

  async fetchBySearch(symbol, config) {
    try {
      // Try each search term
      for (const searchTerm of config.searchTerms) {
        try {
          const response = await this.rateLimitedRequest(
            `${this.baseURL}/latest/dex/search`,
            { q: searchTerm }
          );
          
          const pairs = response.data?.pairs || [];
          const validPairs = this.filterAndSortPairs(pairs, config.minLiquidity, symbol);
          
          if (validPairs.length > 0) {
            const bestPair = validPairs[0];
            return this.formatPriceData(symbol, bestPair, 'search', searchTerm);
          }
        } catch (error) {
          console.log(`⚠️ Search failed for ${searchTerm}: ${error.message}`);
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Search fetch failed for ${symbol}:`, error.message);
      return null;
    }
  }

  filterAndSortPairs(pairs, minLiquidity, expectedSymbol = null) {
    return pairs
      .filter(pair => {
        // Basic data validation
        if (!pair.priceUsd || !pair.liquidity?.usd) return false;
        if (pair.liquidity.usd < minLiquidity) return false;
        
        // Symbol matching (if provided)
        if (expectedSymbol) {
          const baseSymbol = pair.baseToken?.symbol?.toUpperCase();
          const expectedUpper = expectedSymbol.toUpperCase();
          
          // Allow some flexibility in symbol matching
          if (baseSymbol && !baseSymbol.includes(expectedUpper) && !expectedUpper.includes(baseSymbol)) {
            // Special cases
            if (!(expectedSymbol === 'BTC' && baseSymbol.includes('WBTC'))) {
              if (!(expectedSymbol === 'ETH' && baseSymbol.includes('WETH'))) {
                if (!(expectedSymbol === 'SOL' && (baseSymbol.includes('SOL') || baseSymbol.includes('WSOL')))) {
                  return false;
                }
              }
            }
          }
        }
        
        return true;
      })
      .sort((a, b) => {
        // Primary sort: Liquidity (higher is better)
        const liquidityDiff = (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0);
        if (Math.abs(liquidityDiff) > 10000) return liquidityDiff;
        
        // Secondary sort: Volume (higher is better)
        const volumeA = a.volume?.h24 || 0;
        const volumeB = b.volume?.h24 || 0;
        return volumeB - volumeA;
      });
  }

  formatPriceData(symbol, pair, method, source) {
    return {
      symbol,
      price: parseFloat(pair.priceUsd),
      rawPrice: parseFloat(pair.priceUsd),
      change24h: parseFloat(pair.priceChange?.h24 || 0),
      volume24h: parseFloat(pair.volume?.h24 || 0),
      liquidity: parseFloat(pair.liquidity?.usd || 0),
      marketCap: parseFloat(pair.marketCap || 0),
      fdv: parseFloat(pair.fdv || 0),
      timestamp: Date.now(),
      source: 'dexscreener',
      method, // 'token_address' or 'search'
      dex: pair.dexId,
      chain: pair.chainId,
      pairAddress: pair.pairAddress,
      baseToken: pair.baseToken?.symbol,
      quoteToken: pair.quoteToken?.symbol,
      pairUrl: pair.url,
      searchTerm: source
    };
  }

  async getSpecificPair(chainId, pairAddress) {
    try {
      const response = await this.rateLimitedRequest(
        `${this.baseURL}/latest/dex/pairs/${chainId}/${pairAddress}`
      );
      
      return response.data?.pairs?.[0] || null;
    } catch (error) {
      console.error('Failed to fetch specific pair:', error.message);
      return null;
    }
  }

  async getMarketStatus() {
    try {
      // Test with a simple search
      const response = await this.rateLimitedRequest(
        `${this.baseURL}/latest/dex/search`,
        { q: 'USDC' }
      );
      
      return {
        status: 'online',
        timestamp: Date.now(),
        pairs: response.data?.pairs?.length || 0,
        api: 'dexscreener',
        rateLimit: '300 req/min',
        schemaVersion: response.data?.schemaVersion
      };
    } catch (error) {
      return { 
        status: 'offline', 
        error: error.message,
        api: 'dexscreener'
      };
    }
  }
}

class StellarPriceOracle {
  constructor() {
    this.app = express();
    this.priceFetcher = new DexScreenerPriceFetcher();
    this.server = new SorobanRpc.Server(process.env.STELLAR_RPC_URL);
    this.networkPassphrase = Networks.TESTNET;
    this.contractId = process.env.ORACLE_CONTRACT_ID;
    this.provider = process.env.PROVIDER_SECRET ? Keypair.fromSecret(process.env.PROVIDER_SECRET) : null;
    this.contract = this.contractId ? new Contract(this.contractId) : null;
    this.latestPrices = {};
    this.priceHistory = {};
    this.startTime = Date.now();
    this.isRunning = false;
    this.updateCount = 0;
    
    this.setupExpress();
    this.setupRoutes();
    
    console.log('🚀 Stellar Oracle Pro initialized');
    
    if (!this.contractId) {
        console.log("📋 Contract: Not deployed");
    } else {
        console.log("📋 Contract: " + this.contractId);
    }

    if (!this.provider) {
        console.log("📍 Provider: Not configured");
    } else {
        console.log("📍 Provider: Configured");
        console.log("🔑 Provider Public Key:", this.provider.publicKey());
    }
  }

  setupExpress() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`📡 ${req.method} ${req.path} from ${req.ip}`);
      next();
    });
  }

  setupRoutes() {
    // Enhanced health endpoint
    this.app.get('/health', async (req, res) => {
      const dexStatus = await this.priceFetcher.getMarketStatus();
      
      res.json({
        status: this.isRunning ? 'healthy' : 'starting',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        updates: this.updateCount,
        dexscreener: dexStatus,
        stellar: {
          contract: this.contractId ? 'deployed' : 'not_deployed',
          provider: this.provider ? 'configured' : 'not_configured',
          network: 'testnet'
        },
        data: {
          prices: Object.keys(this.latestPrices).length,
          lastUpdate: this.lastUpdate || null,
          historyPoints: Object.values(this.priceHistory).reduce((sum, arr) => sum + arr.length, 0)
        }
      });
    });

    // Enhanced prices endpoint with metadata
    this.app.get('/prices', (req, res) => {
      const detailed = req.query.detailed === 'true';
      
      let response = {
        prices: this.latestPrices,
        timestamp: new Date().toISOString(),
        count: Object.keys(this.latestPrices).length,
        source: 'dexscreener'
      };
      
      if (detailed) {
        response.metadata = {
          updateCount: this.updateCount,
          averageUpdateTime: this.getAverageUpdateTime(),
          priceHistory: this.getPriceHistorySummary()
        };
      }
      
      res.json(response);
    });

    // Get specific token price
    this.app.get('/prices/:symbol', (req, res) => {
      const symbol = req.params.symbol.toUpperCase();
      const price = this.latestPrices[symbol];
      
      if (price) {
        res.json({
          ...price,
          history: this.priceHistory[symbol]?.slice(-10) || [] // Last 10 updates
        });
      } else {
        res.status(404).json({ 
          error: `Price for ${symbol} not found`,
          available: Object.keys(this.latestPrices)
        });
      }
    });

    // Enhanced manual submission
    this.app.post('/submit', async (req, res) => {
      try {
        const { symbol, price, source = 'manual' } = req.body;
        
        if (!symbol || !price || isNaN(parseFloat(price))) {
          return res.status(400).json({ 
            error: 'Valid symbol and price required',
            example: { symbol: 'BTC', price: 67000.50 }
          });
        }

        if (!this.provider || !this.contract) {
          return res.status(503).json({ 
            error: 'Oracle not fully configured',
            details: {
              provider: !!this.provider,
              contract: !!this.contract
            }
          });
        }

        const priceValue = Math.round(parseFloat(price) * 100);
        const txHash = await this.submitToContract(symbol, priceValue);
        
        if (txHash) {
          const newPrice = {
            symbol,
            price: parseFloat(price),
            rawPrice: parseFloat(price),
            change24h: 0,
            volume24h: 0,
            timestamp: new Date().toISOString(),
            source,
            method: 'manual_submission',
            txHash
          };
          
          this.latestPrices[symbol] = newPrice;
          this.addToPriceHistory(symbol, newPrice);
          
          res.json({ 
            success: true, 
            transaction: txHash,
            data: newPrice
          });
        } else {
          res.status(500).json({ error: 'Failed to submit to Stellar blockchain' });
        }
      } catch (error) {
        console.error('Manual submission error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get price history for a token
    this.app.get('/history/:symbol', (req, res) => {
      const symbol = req.params.symbol.toUpperCase();
      const limit = parseInt(req.query.limit) || 50;
      
      const history = this.priceHistory[symbol] || [];
      const limitedHistory = history.slice(-limit);
      
      res.json({
        symbol,
        history: limitedHistory,
        count: limitedHistory.length,
        timespan: limitedHistory.length > 0 ? {
          start: limitedHistory[0].timestamp,
          end: limitedHistory[limitedHistory.length - 1].timestamp
        } : null
      });
    });

    // API status and configuration
    this.app.get('/status', (req, res) => {
      res.json({
        service: 'Stellar Price Oracle',
        version: '1.0.0',
        endpoints: {
          'GET /health': 'Service health status',
          'GET /prices': 'All current prices (add ?detailed=true for metadata)',
          'GET /prices/:symbol': 'Specific token price with history',
          'GET /history/:symbol': 'Price history for token (add ?limit=N)',
          'POST /submit': 'Manual price submission',
          'GET /status': 'This endpoint'
        },
        tokens: Object.keys(this.priceFetcher.tokenConfig),
        rateLimits: {
          dexscreener: '300 requests/minute',
          manual_submissions: 'No limit'
        }
      });
    });
  }

  async submitToContract(symbol, priceValue) {
    try {
      if (!this.provider || !this.contract) {
        console.error(`❌ Provider or contract not configured for ${symbol}`);
        return null;
      }
      
      const sourceAccount = await this.server.getAccount(this.provider.publicKey());

      const operation = this.contract.call(
        'set_price',
        nativeToScVal(symbol, { type: 'symbol' }),
        nativeToScVal(BigInt(priceValue), { type: 'i64' }),
        new Address(this.provider.publicKey()).toScVal()
      );

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '1000',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      transaction.sign(this.provider);
      const result = await this.server.sendTransaction(transaction);

      console.log(`🔎 TX result for ${symbol}:`, JSON.stringify(result, null, 2));

      if (result.status === 'PENDING') {
        console.log(`✅ ${symbol}: $${(priceValue/100).toFixed(2)} | TX: ${result.hash.slice(0, 8)}...`);
        return result.hash;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Stellar submission failed for ${symbol}:`, error);
      return null;
    }
  }

  addToPriceHistory(symbol, priceData) {
    if (!this.priceHistory[symbol]) {
      this.priceHistory[symbol] = [];
    }
    
    this.priceHistory[symbol].push({
      price: priceData.price,
      timestamp: priceData.timestamp,
      source: priceData.source
    });
    
    // Keep only last 100 history points per symbol
    if (this.priceHistory[symbol].length > 100) {
      this.priceHistory[symbol] = this.priceHistory[symbol].slice(-100);
    }
  }

  getPriceHistorySummary() {
    const summary = {};
    for (const [symbol, history] of Object.entries(this.priceHistory)) {
      summary[symbol] = {
        points: history.length,
        latest: history[history.length - 1]?.timestamp,
        oldest: history[0]?.timestamp
      };
    }
    return summary;
  }

  getAverageUpdateTime() {
    // This would track update performance - simplified for now
    return '~2.5s';
  }

  async updatePrices() {
    const startTime = Date.now();
    console.log(`🔄 Starting price update cycle #${this.updateCount + 1}...`);
    
    try {
      const prices = await this.priceFetcher.fetchPrices();
      
      if (Object.keys(prices).length === 0) {
        console.log('⚠️ No prices fetched from DexScreener');
        return;
      }

      // Submit to Stellar contract
      const submissions = [];
      if (this.provider && this.contract) {
        for (const [symbol, priceData] of Object.entries(prices)) {
          submissions.push(
            this.submitToContract(symbol, Math.round(priceData.price * 100))
          );
        }
      }

      const results = await Promise.allSettled(submissions);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;

      // Log failed submissions for debugging
      results.forEach((r, idx) => {
        if (r.status === 'rejected' || !r.value) {
          const symbol = Object.keys(prices)[idx];
          console.error(`❌ Submission failed for ${symbol}:`, r.reason || r.value);
        }
      });

      // Update local state
      for (const [symbol, priceData] of Object.entries(prices)) {
        this.latestPrices[symbol] = {
          ...priceData,
          timestamp: new Date().toISOString()
        };
        this.addToPriceHistory(symbol, priceData);
      }

      this.lastUpdate = new Date().toISOString();
      this.updateCount++;
      
      const duration = Date.now() - startTime;
      console.log(`📊 Update #${this.updateCount} complete in ${duration}ms`);
      console.log(`💰 Fetched ${Object.keys(prices).length} prices | ⛓️ Submitted ${successful} to Stellar`);
      
    } catch (error) {
      console.error('❌ Price update cycle failed:', error.message);
    }
  }

  async start() {
    const port = process.env.API_PORT || 3001;
    
    this.app.listen(port, () => {
      console.log(`🌐 Stellar Oracle API running on port ${port}`);
      console.log(`📊 Health: http://localhost:${port}/health`);
      console.log(`💰 Prices: http://localhost:${port}/prices`);
      console.log(`📈 Status: http://localhost:${port}/status`);
    });

    // Wait for contract if not deployed yet
    if (!this.contractId) {
      console.log('⏳ Waiting for contract deployment...');
      const checkInterval = setInterval(() => {
        if (process.env.ORACLE_CONTRACT_ID) {
          this.contractId = process.env.ORACLE_CONTRACT_ID;
          this.contract = new Contract(this.contractId);
          console.log('✅ Contract configuration updated');
          clearInterval(checkInterval);
        }
      }, 5000);
    }

    // Start price updates
    this.isRunning = true;
    console.log('🔄 Starting price update service...');
    
    // Initial update
    await this.updatePrices();
    
    // Regular updates
    const interval = parseInt(process.env.UPDATE_INTERVAL) || 30000;
    setInterval(() => this.updatePrices(), interval);
    
    console.log(`✅ Oracle service ready (${interval/1000}s updates)`);
    console.log('🎯 Perfect for hackathon demos!');
  }
}

// Initialize and start
const oracle = new StellarPriceOracle();
oracle.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stellar Oracle shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n📴 Stellar Oracle terminated');
  process.exit(0);
});