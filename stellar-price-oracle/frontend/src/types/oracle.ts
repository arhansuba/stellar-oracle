export interface Price {
  symbol: string;
  price: number;
  change24h: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
  timestamp: string;
  source: string;
  txHash?: string;
}

export interface OracleHealth {
  status: string;
  timestamp: string;
  uptime: number;
  binance: {
    status: string;
    serverTime?: number;
    symbols?: number;
  };
  contract: string;
  prices: number;
  provider: string;
}

export interface PriceSubmission {
  symbol: string;
  price: number;
  success?: boolean;
  transaction?: string;
  error?: string;
}

export interface PriceData {
  symbol: string;
  price: number;
  rawPrice: number;
  change24h?: number;
  volume24h?: number;
  liquidity?: number;
  marketCap?: number;
  fdv?: number;
  timestamp: string | number;
  source: string;
  method?: string;
  dex?: string;
  chain?: string;
  pairAddress?: string;
  baseToken?: string;
  quoteToken?: string;
  pairUrl?: string;
  searchTerm?: string;
  txHash?: string;
  history?: PriceHistoryPoint[];
}

export interface PriceHistoryPoint {
  price: number;
  timestamp: string;
  source?: string;
}

export interface PricesResponse {
  prices: Record<string, PriceData>;
  timestamp: string;
  count: number;
  source: string;
  metadata?: {
    updateCount: number;
    averageUpdateTime: string;
    priceHistory: Record<string, {
      points: number;
      latest: string;
      oldest: string;
    }>;
  };
}

export interface OracleStatus {
  status: 'healthy' | 'starting' | 'unhealthy';
  timestamp: string;
  uptime: number;
  updates: number;
  dexscreener: {
    status: string;
    timestamp: number;
    pairs?: number;
    api: string;
    rateLimit: string;
    schemaVersion?: string;
    error?: string;
  };
  stellar: {
    contract: string;
    provider: string;
    network: string;
  };
  data: {
    prices: number;
    lastUpdate: string | null;
    historyPoints: number;
  };
}

export interface ContractStats {
  [asset: string]: number;
}

export interface PriceHistoryResponse {
  symbol: string;
  history: PriceHistoryPoint[];
  count: number;
  timespan: {
    start: string;
    end: string;
  } | null;
}

export interface ManualSubmissionRequest {
  symbol: string;
  price: number;
  source?: string;
}

export interface ManualSubmissionResponse {
  success: boolean;
  transaction?: string;
  data?: PriceData;
  error?: string;
}

export interface ApiError {
  error: string;
  details?: any;
  available?: string[];
  example?: any;
}

export interface ServiceStatus {
  service: string;
  version: string;
  endpoints: Record<string, string>;
  tokens: string[];
  rateLimits: Record<string, string>;
}

// Stellar-specific types
export interface StellarAccount {
  publicKey: string;
  secretKey?: string;
}

export interface ContractInvocation {
  contractId: string;
  method: string;
  args: any[];
  source?: string;
}

export interface TransactionResult {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  ledger?: number;
  createdAt?: string;
}

// UI State types
export interface AppState {
  selectedAsset: string;
  view: 'dashboard' | 'submit' | 'analytics';
  darkMode: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Chart data types
export interface ChartDataPoint {
  x: string | number;
  y: number;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'area';
  timeframe: '1h' | '24h' | '7d' | '30d';
  showVolume: boolean;
  showGrid: boolean;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  loading: boolean;
  error?: string | null;
}

export interface DataState<T> extends LoadingState {
  data: T | null;
  lastUpdate?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// WebSocket types for real-time updates
export interface WebSocketMessage {
  type: 'price_update' | 'status_update' | 'error';
  payload: any;
  timestamp: string;
}

export interface PriceUpdateMessage {
  asset: string;
  price: number;
  change: number;
  volume: number;
  timestamp: string;
}

// Configuration types
export interface AppConfig {
  apiUrl: string;
  stellarRpcUrl: string;
  contractId: string;
  updateInterval: number;
  supportedAssets: string[];
  features: {
    realTimeUpdates: boolean;
    manualSubmission: boolean;
    priceHistory: boolean;
    notifications: boolean;
  };
}
