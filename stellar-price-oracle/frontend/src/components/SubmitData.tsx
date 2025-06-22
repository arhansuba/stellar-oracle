import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SubmitDataProps {
  onSubmit: (symbol: string, price: number) => Promise<boolean>;
}

export const SubmitData: React.FC<SubmitDataProps> = ({ onSubmit }) => {
  const [symbol, setSymbol] = useState('BTC');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<{
    symbol: string;
    price: string;
    success: boolean;
    timestamp: Date;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const priceValue = parseFloat(price);
    if (!price || isNaN(priceValue) || priceValue <= 0) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit(symbol, priceValue);
      setLastSubmission({
        symbol,
        price,
        success,
        timestamp: new Date(),
      });
      
      if (success) {
        setPrice('');
      }
    } catch (error) {
      console.error('Submission failed:', error);
      setLastSubmission({
        symbol,
        price,
        success: false,
        timestamp: new Date(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">
          🎯 Live Price Submission
        </h3>
        <p className="text-blue-200">
          Submit custom price data live during demos! Perfect for hackathon presentations.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Cryptocurrency
          </label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          >
            <option value="BTC" className="bg-gray-800">Bitcoin (BTC)</option>
            <option value="ETH" className="bg-gray-800">Ethereum (ETH)</option>
            <option value="XLM" className="bg-gray-800">Stellar (XLM)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Price (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300">
              $
            </span>
            <input
              type="number"
              step="0.000001"
              placeholder="Enter price..."
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Example: 67000.50 for Bitcoin
          </p>
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting || !price || isNaN(parseFloat(price))}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Submitting to Stellar...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>🚀 Submit to Oracle</span>
            </>
          )}
        </motion.button>
      </form>

      {/* Last Submission Status */}
      {lastSubmission && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center"
        >
          <div className={`
            inline-flex items-center space-x-2 px-4 py-2 rounded-full
            ${lastSubmission.success 
              ? 'bg-green-500/20 border border-green-500/30 text-green-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300'}
          `}>
            {lastSubmission.success ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>
              {lastSubmission.success 
                ? `✅ ${lastSubmission.symbol}: $${lastSubmission.price} submitted!`
                : `❌ Failed to submit ${lastSubmission.symbol} price`}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {lastSubmission.timestamp.toLocaleTimeString()}
          </p>
        </motion.div>
      )}

      {/* Demo Tips */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-blue-300 font-medium mb-2">💡 Demo Tips</h4>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Submit dramatic price changes to show real-time updates</li>
          <li>• Use round numbers like $50,000 for easy demonstration</li>
          <li>• Try different symbols to show multi-asset support</li>
          <li>• Price appears immediately in the dashboard</li>
        </ul>
      </div>
    </motion.div>
  );
};
