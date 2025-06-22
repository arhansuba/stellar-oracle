import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Activity, Clock } from 'lucide-react';
import { OracleHealth } from '../types/oracle';

interface NetworkStatusProps {
  health: OracleHealth | null;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ health }) => {
  if (!health) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="inline-flex items-center space-x-2 bg-gray-500/20 px-4 py-2 rounded-full border border-gray-500/30"
      >
        <WifiOff size={16} className="text-gray-400" />
        <span className="text-gray-300 text-sm">Connecting...</span>
      </motion.div>
    );
  }

  const isHealthy = health.status === 'healthy' || health.status === 'demo';
  const isDemoMode = health.status === 'demo';
  const statusColor = isDemoMode ? 'yellow' : isHealthy ? 'green' : 'red';

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center space-x-3 px-6 py-3 rounded-full border
        ${isDemoMode 
          ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' 
          : isHealthy 
            ? 'bg-green-500/20 border-green-500/30 text-green-300'
            : 'bg-red-500/20 border-red-500/30 text-red-300'}
      `}
    >
      {/* Status Icon */}
      <div className="flex items-center space-x-2">
        {isHealthy ? (
          <Wifi size={16} className={isDemoMode ? 'text-yellow-400' : 'text-green-400'} />
        ) : (
          <WifiOff size={16} className="text-red-400" />
        )}
        <span className="font-medium">
          {isDemoMode ? 'Demo Mode' : isHealthy ? 'Oracle Online' : 'Oracle Offline'}
        </span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-current opacity-30" />

      {/* Details */}
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <Activity size={14} />
          <span>{health.prices} feeds</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Clock size={14} />
          <span>{formatUptime(health.uptime)}</span>
        </div>
      </div>

      {/* Provider Info */}
      <div className="text-xs opacity-75">
        {isDemoMode ? 'DEMO' : `${health.provider.slice(0, 4)}...${health.provider.slice(-4)}`}
      </div>

      {/* Pulse Animation for Active Status */}
      {isHealthy && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-yellow-400' : 'bg-green-400'}`}
        />
      )}
    </motion.div>
  );
};
