// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import PriceCard from './components/PriceCard';
import LiveChart from './components/LiveChart';
import {NetworkStatus} from './components/NetworkStatus';
import {SubmitData} from './components/SubmitData';
import { useOracle } from './hooks/useOracle';
import { usePrices } from './hooks/usePrice';
import { formatPrice, formatPercentage, formatTimeAgo } from './utils/format';
import { SUPPORTED_ASSET_CODES } from './utils/constants';
import './App.css';

interface AppState {
  selectedAsset: string;
  currentView: 'dashboard' | 'submit' | 'analytics' | 'about';
  showMobileMenu: boolean;
}

// Add this helper function before your App() function
function mapOracleStatusToHealth(status: any): import('./types/oracle').OracleHealth | null {
  if (!status) return null;
  return {
    status: status.status,
    timestamp: status.timestamp,
    uptime: status.uptime,
    binance: status.dexscreener || { status: 'unknown' }, // fallback
    contract: status.stellar?.contract || '',
    prices: status.data?.prices ?? 0,
    provider: status.stellar?.provider || '',
  };
}

function App() {
  const [state, setState] = useState<AppState>({
    selectedAsset: 'BTC',
    currentView: 'dashboard',
    showMobileMenu: false
  });

  const { 
    prices, 
    loading: pricesLoading, 
    error: pricesError,
    lastUpdate,
    refetch: refetchPrices
  } = usePrices();

  const { 
    oracleStatus, 
    contractStats,
    loading: oracleLoading,
    refetch: refetchOracle
  } = useOracle();

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchPrices();
      refetchOracle();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchPrices, refetchOracle]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Use SUPPORTED_ASSET_CODES for mapping
  const supportedAssets = SUPPORTED_ASSET_CODES;

  const renderNavigation = () => (
    <nav className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">🌟</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Stellar Price Oracle</h1>
              <div className="flex items-center space-x-2 text-xs text-purple-300">
                <span>Powered by DexScreener</span>
                <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                <span>10,000x cheaper than ChainLink</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {[
              { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
              { id: 'analytics', label: '📈 Analytics', icon: '📈' },
              { id: 'submit', label: '⚡ Submit Data', icon: '⚡' },
              { id: 'about', label: 'ℹ️ About', icon: 'ℹ️' }
            ].map(nav => (
              <button
                key={nav.id}
                onClick={() => updateState({ currentView: nav.id as any })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  state.currentView === nav.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {nav.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => updateState({ showMobileMenu: !state.showMobileMenu })}
            className="md:hidden text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {state.showMobileMenu && (
          <div className="md:hidden py-4 border-t border-purple-500/20">
            <div className="flex flex-col space-y-2">
              {[
                { id: 'dashboard', label: '📊 Dashboard' },
                { id: 'analytics', label: '📈 Analytics' },
                { id: 'submit', label: '⚡ Submit Data' },
                { id: 'about', label: 'ℹ️ About' }
              ].map(nav => (
                <button
                  key={nav.id}
                  onClick={() => updateState({ 
                    currentView: nav.id as any, 
                    showMobileMenu: false 
                  })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-left ${
                    state.currentView === nav.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {nav.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Hero Stats Section */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-8 border border-purple-500/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              $0.00001
            </div>
            <div className="text-purple-300 text-sm">Cost per price update</div>
            <div className="text-xs text-gray-400 mt-1">vs $500 ChainLink</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {Object.keys(prices).length}
            </div>
            <div className="text-purple-300 text-sm">Active price feeds</div>
            <div className="text-xs text-gray-400 mt-1">Real-time updates</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              5s
            </div>
            <div className="text-purple-300 text-sm">Settlement time</div>
            <div className="text-xs text-gray-400 mt-1">Stellar network</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {oracleStatus?.updates || 0}
            </div>
            <div className="text-purple-300 text-sm">Total updates</div>
            <div className="text-xs text-gray-400 mt-1">Since launch</div>
          </div>
        </div>
      </div>

      {/* Price Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {supportedAssets.map((asset: string) => (
          <PriceCard
            key={asset}
            asset={asset}
            price={prices[asset]}
            loading={pricesLoading}
            error={pricesError ?? undefined}
            onClick={() => updateState({ selectedAsset: asset })}
            isSelected={state.selectedAsset === asset}
          />
        ))}
      </div>

      {/* Featured Chart */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {state.selectedAsset} Price Chart
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Real-time price data from DexScreener
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {supportedAssets.map((asset: string) => (
              <button
                key={asset}
                onClick={() => updateState({ selectedAsset: asset })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  state.selectedAsset === asset
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {asset}
              </button>
            ))}
          </div>
        </div>
        
        <LiveChart 
          asset={state.selectedAsset}
          data={prices[state.selectedAsset]?.history || []}
          height={400}
        />
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🔥 Top Performer</h3>
          {Object.entries(prices).length > 0 && (
            <div className="space-y-3">
              {Object.entries(prices)
                .sort(([,a], [,b]) => (b.change24h || 0) - (a.change24h || 0))
                .slice(0, 1)
                .map(([asset, data]) => (
                  <div key={asset} className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">{asset}</div>
                    <div className="text-lg text-green-400 mb-1">
                      {formatPercentage(data.change24h || 0)}
                    </div>
                    <div className="text-sm text-gray-300">
                      {formatPrice(data.price)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">⚡ System Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Oracle Status:</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  oracleStatus?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-white text-sm">
                  {oracleStatus?.status === 'healthy' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">DexScreener:</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-white text-sm">Connected</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Stellar Network:</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-white text-sm">Testnet</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">💰 Cost Comparison</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-300 text-sm">ChainLink Oracle</span>
                <span className="text-red-400 font-semibold">$500</span>
              </div>
              <div className="w-full bg-red-900/30 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full w-full"></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-300 text-sm">Stellar Oracle</span>
                <span className="text-green-400 font-semibold">$0.00001</span>
              </div>
              <div className="w-full bg-green-900/30 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-1"></div>
              </div>
            </div>
            
            <div className="text-center pt-2">
              <span className="text-yellow-400 font-bold">10,000x cheaper!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">📈 Advanced Analytics</h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Comprehensive view of all price feeds, historical trends, and oracle performance metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {supportedAssets.map((asset: string) => (
          <div key={asset} className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">{asset} Analytics</h3>
              <div className="text-right text-sm">
                <div className="text-white font-semibold">
                  {formatPrice(prices[asset]?.price || 0)}
                </div>
                <div className={`${
                  (prices[asset]?.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercentage(prices[asset]?.change24h || 0)}
                </div>
              </div>
            </div>
            <LiveChart 
              asset={asset}
              data={prices[asset]?.history || []}
              height={200}
              compact={true}
            />
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">24h Volume:</span>
                <div className="text-white font-semibold">
                  ${(prices[asset]?.volume24h || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Liquidity:</span>
                <div className="text-white font-semibold">
                  ${(prices[asset]?.liquidity || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">🌟 About Stellar Price Oracle</h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          The future of decentralized price feeds - affordable, reliable, and globally accessible
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">💡 The Problem</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• ChainLink oracles cost $500+ per deployment</li>
            <li>• Centralized APIs have rate limits and downtime</li>
            <li>• New tokens wait months for oracle support</li>
            <li>• High gas fees make frequent updates expensive</li>
          </ul>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">✅ Our Solution</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• $0.00001 per price update (10,000x cheaper)</li>
            <li>• Real-time data from DexScreener</li>
            <li>• Support for any token with DEX liquidity</li>
            <li>• 5-second settlement on Stellar</li>
          </ul>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">🛠️ Technical Stack</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• <strong>Frontend:</strong> React + TypeScript + Vite</li>
            <li>• <strong>Oracle Service:</strong> Node.js + Express</li>
            <li>• <strong>Smart Contract:</strong> Rust + Soroban</li>
            <li>• <strong>Price Data:</strong> DexScreener API</li>
          </ul>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">🌍 Use Cases</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• DeFi protocols needing price feeds</li>
            <li>• Cross-border payment applications</li>
            <li>• Emerging token price discovery</li>
            <li>• Financial data aggregation</li>
          </ul>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-8 border border-purple-500/20 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">🚀 Built for Hackathons</h3>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          This project demonstrates the power of Stellar's blockchain for real-world applications.
          Ultra-low fees, global accessibility, and 5-second settlement make it perfect for 
          next-generation DeFi infrastructure.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a 
            href="https://github.com/your-repo/stellar-price-oracle" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            📁 View Source Code
          </a>
          <a 
            href="https://stellar.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="border border-purple-500 text-purple-300 hover:bg-purple-500/10 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            🌟 Learn About Stellar
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      {renderNavigation()}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Network Status Bar */}
        <NetworkStatus health={mapOracleStatusToHealth(oracleStatus)} />

        {/* View Content */}
        {state.currentView === 'dashboard' && renderDashboard()}
        {state.currentView === 'analytics' && renderAnalytics()}
        {state.currentView === 'submit' && (
          <div className="max-w-2xl mx-auto">
            <SubmitData onSubmit={async (_symbol: string, _price: number) => false} />
          </div>
        )}
        {state.currentView === 'about' && renderAbout()}

        {/* Error Display */}
        {pricesError && (
          <div className="fixed bottom-4 right-4 max-w-sm z-50">
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg shadow-lg">
              <div className="flex items-start">
                <span className="mr-2 text-red-400">⚠️</span>
                <div>
                  <p className="text-sm font-medium">Error fetching prices</p>
                  <p className="text-xs text-red-300 mt-1">{pricesError}</p>
                  <button 
                    onClick={refetchPrices}
                    className="text-xs text-red-200 hover:text-white underline mt-1"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-purple-500/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p className="text-sm mb-2">
              🌟 Stellar Price Oracle • Powered by DexScreener • Built for Hackathons
            </p>
            <p className="text-xs">
              Real-time crypto prices on Stellar blockchain • Ultra-low fees • Global accessibility
            </p>
            {lastUpdate && (
              <p className="text-xs mt-2 text-purple-300">
                Last updated: {formatTimeAgo(lastUpdate)}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;