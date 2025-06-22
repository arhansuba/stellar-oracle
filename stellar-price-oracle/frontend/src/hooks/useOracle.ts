// frontend/src/hooks/useOracle.ts
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { OracleStatus, ContractStats } from '../types/oracle';

export const useOracle = () => {
  const [oracleStatus, setOracleStatus] = useState<OracleStatus | null>(null);
  const [contractStats, setContractStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOracleStatus = async () => {
    try {
      const status = await apiService.getHealth();
      setOracleStatus(status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch oracle status');
    }
  };

  const fetchContractStats = async () => {
    try {
      const stats = await apiService.getStats();
      setContractStats(stats);
    } catch (err) {
      console.error('Failed to fetch contract stats:', err);
    }
  };

  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      await Promise.all([
        fetchOracleStatus(),
        fetchContractStats()
      ]);
      setLoading(false);
    };

    initialFetch();

    // Poll oracle status every 30 seconds
    const statusInterval = setInterval(fetchOracleStatus, 30000);
    
    // Poll contract stats every 60 seconds
    const statsInterval = setInterval(fetchContractStats, 60000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(statsInterval);
    };
  }, []);

  return {
    oracleStatus,
    contractStats,
    loading,
    error,
    refetch: () => {
      fetchOracleStatus();
      fetchContractStats();
    }
  };
};

