// frontend/src/services/api.ts
import {
  PricesResponse,
  OracleStatus,
  ContractStats,
  PriceHistoryResponse,
  ManualSubmissionRequest,
  ManualSubmissionResponse,
  ServiceStatus,
  PriceData
} from '../types/oracle';

// Type workaround for Vite env variables
interface ImportMetaEnv {
  VITE_API_URL?: string;
}
interface ImportMeta {
  env: ImportMetaEnv;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ((import.meta as unknown) as ImportMeta).env.VITE_API_URL || 'http://localhost:3001';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error: ${error}`);
    }
  }

  // Health check endpoint
  async getHealth(): Promise<OracleStatus> {
    return this.request<OracleStatus>('/health');
  }

  // Get all current prices
  async getPrices(detailed = false): Promise<PricesResponse> {
    const query = detailed ? '?detailed=true' : '';
    return this.request<PricesResponse>(`/prices${query}`);
  }

  // Get specific token price
  async getPrice(symbol: string): Promise<PriceData> {
    return this.request<PriceData>(`/prices/${symbol.toUpperCase()}`);
  }

  // Get price history for a token
  async getPriceHistory(symbol: string, limit = 50): Promise<PriceHistoryResponse> {
    return this.request<PriceHistoryResponse>(`/history/${symbol.toUpperCase()}?limit=${limit}`);
  }

  // Manual price submission
  async submitPrice(data: ManualSubmissionRequest): Promise<ManualSubmissionResponse> {
    return this.request<ManualSubmissionResponse>('/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get service status and configuration
  async getStatus(): Promise<ServiceStatus> {
    return this.request<ServiceStatus>('/status');
  }

  // Get contract statistics
  async getStats(): Promise<ContractStats> {
    // This would be implemented when the oracle service exposes contract stats
    // For now, return mock data
    return this.request<ContractStats>('/stats').catch(() => ({
      BTC: 150,
      ETH: 142,
      SOL: 98,
      XLM: 67
    }));
  }

  // Utility method to check if API is reachable
  async checkConnection(): Promise<boolean> {
    try {
      await this.getHealth();
      return true;
    } catch {
      return false;
    }
  }

  // Get supported assets list
  async getSupportedAssets(): Promise<string[]> {
    try {
      const status = await this.getStatus();
      return status.tokens || ['BTC', 'ETH', 'SOL', 'XLM'];
    } catch {
      return ['BTC', 'ETH', 'SOL', 'XLM'];
    }
  }
}

export const apiService = new ApiService();
