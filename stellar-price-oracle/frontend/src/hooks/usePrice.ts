
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { PriceData } from '../types/oracle';

export const usePrices = () => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      const response = await apiService.getPrices();
      setPrices(response.prices);
      setLastUpdate(response.timestamp);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    }
  };

  const fetchPriceHistory = async (asset: string) => {
    try {
      const history = await apiService.getPriceHistory(asset);
      setPrices(prev => ({
        ...prev,
        [asset]: {
          ...prev[asset],
          history: history.history
        }
      }));
    } catch (err) {
      console.error(`Failed to fetch history for ${asset}:`, err);
    }
  };

  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      await fetchPrices();
      setLoading(false);
    };

    initialFetch();

    // Poll prices every 15 seconds
    const interval = setInterval(fetchPrices, 15000);

    return () => clearInterval(interval);
  }, []);

  // Fetch history for each asset when prices are loaded
  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      Object.keys(prices).forEach(asset => {
        if (!prices[asset].history) {
          fetchPriceHistory(asset);
        }
      });
    }
  }, [Object.keys(prices).join(',')]);

  return {
    prices,
    loading,
    error,
    lastUpdate,
    refetch: fetchPrices,
    fetchHistory: fetchPriceHistory
  };
};