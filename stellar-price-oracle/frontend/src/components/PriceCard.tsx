// frontend/src/components/PriceCard.tsx
import React from 'react';
import { PriceData } from '../types/oracle';

interface PriceCardProps {
  asset: string;
  price?: PriceData;
  loading: boolean;
  error?: string;
  onClick: () => void;
  isSelected: boolean;
}

const PriceCard: React.FC<PriceCardProps> = ({ 
  asset, 
  price, 
  loading, 
  error, 
  onClick, 
  isSelected 
}) => {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: asset === 'BTC' ? 0 : 4
    }).format(value);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getAssetIcon = (asset: string) => {
    const icons: Record<string, string> = {
      'BTC': '₿',
      'ETH': 'Ξ', 
      'SOL': '◎',
      'XLM': '🌟'
    };
    return icons[asset] || '🪙';
  };

  const getAssetColor = (asset: string) => {
    const colors: Record<string, string> = {
      'BTC': 'from-orange-500 to-yellow-500',
      'ETH': 'from-blue-500 to-purple-500',
      'SOL': 'from-purple-500 to-pink-500',
      'XLM': 'from-green-500 to-blue-500'
    };
    return colors[asset] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-600 rounded-lg"></div>
          <div className="h-4 bg-gray-600 rounded w-16"></div>
        </div>
        <div className="h-8 bg-gray-600 rounded w-24 mb-2"></div>
        <div className="h-4 bg-gray-600 rounded w-16"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 backdrop-blur-sm rounded-xl border border-red-500/30 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
            <span className="text-red-400">❌</span>
          </div>
          <h3 className="font-medium text-red-300">{asset}</h3>
        </div>
        <p className="text-red-400 text-sm">Price unavailable</p>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`
        bg-white/5 backdrop-blur-sm rounded-xl border cursor-pointer 
        transition-all duration-300 p-6 group hover:scale-105
        ${isSelected 
          ? 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20' 
          : 'border-purple-500/20 hover:border-purple-400/50'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`
            w-10 h-10 rounded-lg bg-gradient-to-r ${getAssetColor(asset)}
            flex items-center justify-center text-white font-bold text-lg
            group-hover:scale-110 transition-transform
          `}>
            {getAssetIcon(asset)}
          </div>
          <div>
            <h3 className="font-semibold text-white">{asset}</h3>
            <p className="text-xs text-gray-400">{price?.source || 'DexScreener'}</p>
          </div>
        </div>
        
        {/* Live indicator */}
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400">LIVE</span>
        </div>
      </div>

      {/* Price */}
      <div className="mb-3">
        <div className="text-2xl font-bold text-white mb-1">
          {price ? formatPrice(price.price) : '--'}
        </div>
        
        {/* 24h Change */}
        {price?.change24h !== undefined && (
          <div className={`
            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
            ${price.change24h >= 0 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
            }
          `}>
            <span className="mr-1">
              {price.change24h >= 0 ? '📈' : '📉'}
            </span>
            {formatChange(price.change24h)}
          </div>
        )}
      </div>

      {/* Additional Metrics */}
      {price && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-400 block">Volume 24h</span>
            <span className="text-white font-medium">
              ${(price.volume24h || 0).toLocaleString(undefined, { 
                maximumFractionDigits: 0 
              })}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Liquidity</span>
            <span className="text-white font-medium">
              ${(price.liquidity || 0).toLocaleString(undefined, { 
                maximumFractionDigits: 0 
              })}
            </span>
          </div>
        </div>
      )}

      {/* Data source info */}
      {price && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">
              {price.dex ? `${price.dex} • ${price.chain}` : 'Multi-DEX'}
            </span>
            <span className="text-gray-400">
              {new Date(price.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceCard;