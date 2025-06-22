import { useState, useEffect } from 'react';
import { Price } from '../types/oracle';

interface PricePoint {
  time: string;
  price: number;
  timestamp: number;
}

interface PriceStats {
  min: number;
  max: number;
  avg: number;
  latest: number;
  change: number;
}

export const usePriceHistory = (symbol: string, currentPrice?: Price) => {
  const [history, setHistory] = useState<PricePoint[]>([]);

  useEffect(() => {
    if (currentPrice && currentPrice.symbol === symbol) {
      setHistory(prev => {
        const newPoint: PricePoint = {
          time: new Date().toLocaleTimeString(),
          price: currentPrice.price,
          timestamp: Date.now(),
        };

        const updated = [...prev, newPoint];
        return updated.slice(-50); // Keep last 50 points
      });
    }
  }, [currentPrice, symbol]);

  const getStats = (): PriceStats | null => {
    if (history.length === 0) return null;

    const prices = history.map(h => h.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      latest: prices[prices.length - 1],
      change: prices.length > 1 ? prices[prices.length - 1] - prices[0] : 0,
    };
  };

  const clear = () => setHistory([]);

  return { history, stats: getStats(), clear };
};
