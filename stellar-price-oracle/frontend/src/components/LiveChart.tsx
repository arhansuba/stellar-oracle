// frontend/src/components/LiveChart.tsx
import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PricePoint {
  price: number;
  timestamp: string | number;
}

interface LiveChartProps {
  asset: string;
  data: PricePoint[];
  height?: number;
  compact?: boolean;
}

const LiveChart: React.FC<LiveChartProps> = ({ 
  asset, 
  data, 
  height = 300, 
  compact = false 
}) => {
  const chartRef = useRef<ChartJS<'line', number[], string>>(null);

  // Generate mock data if none provided (for demo purposes)
  const generateMockData = (basePrice: number) => {
    const points: PricePoint[] = [];
    const now = Date.now();
    
    for (let i = 30; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * 0.1; // ±5% variance
      const price = basePrice * (1 + variance);
      points.push({
        price,
        timestamp: now - (i * 2 * 60 * 1000) // Every 2 minutes
      });
    }
    return points;
  };

  const getBasePrice = (asset: string) => {
    const basePrices: Record<string, number> = {
      'BTC': 67000,
      'ETH': 3500,
      'SOL': 140,
      'XLM': 0.12
    };
    return basePrices[asset] || 100;
  };

  const chartData = data.length > 0 ? data : generateMockData(getBasePrice(asset));

  // Prepare chart data
  const labels = chartData.map(point => {
    const date = new Date(typeof point.timestamp === 'string' ? point.timestamp : point.timestamp);
    return compact ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleTimeString();
  });

  const prices = chartData.map(point => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const isPositive = prices[prices.length - 1] >= prices[0];

  const gradientColors = {
    'BTC': { start: 'rgba(251, 146, 60, 0.3)', end: 'rgba(251, 146, 60, 0)', line: '#f59e0b' },
    'ETH': { start: 'rgba(99, 102, 241, 0.3)', end: 'rgba(99, 102, 241, 0)', line: '#6366f1' },
    'SOL': { start: 'rgba(168, 85, 247, 0.3)', end: 'rgba(168, 85, 247, 0)', line: '#a855f7' },
    'XLM': { start: 'rgba(34, 197, 94, 0.3)', end: 'rgba(34, 197, 94, 0)', line: '#22c55e' }
  };

  const colors = gradientColors[asset as keyof typeof gradientColors] || gradientColors.BTC;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: !compact,
        labels: {
          color: '#e5e7eb',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: colors.line,
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `${asset}: $${context.parsed.y.toLocaleString(undefined, {
              minimumFractionDigits: asset === 'XLM' ? 4 : 2,
              maximumFractionDigits: asset === 'XLM' ? 6 : 2
            })}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: !compact,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 10
          },
          maxTicksLimit: compact ? 5 : 8
        }
      },
      y: {
        display: !compact,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 10
          },
          callback: function(value: any) {
            return '$' + value.toLocaleString(undefined, {
              minimumFractionDigits: asset === 'XLM' ? 4 : 0,
              maximumFractionDigits: asset === 'XLM' ? 6 : 0
            });
          }
        },
        min: minPrice - (priceRange * 0.1),
        max: maxPrice + (priceRange * 0.1)
      }
    },
    elements: {
      point: {
        radius: compact ? 0 : 2,
        hoverRadius: compact ? 3 : 4,
        backgroundColor: colors.line,
        borderColor: colors.line,
        borderWidth: 2
      },
      line: {
        borderWidth: compact ? 2 : 3,
        tension: 0.1
      }
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const
    }
  };

  const data_config = {
    labels,
    datasets: [
      {
        label: `${asset} Price`,
        data: prices,
        borderColor: colors.line,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return colors.start;
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, colors.start);
          gradient.addColorStop(1, colors.end);
          return gradient;
        },
        fill: true,
        pointBackgroundColor: colors.line,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
        pointHoverBackgroundColor: colors.line,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2
      }
    ]
  };

  // Auto-update chart (simulate real-time updates)
  useEffect(() => {
    if (!compact && chartRef.current) {
      const interval = setInterval(() => {
        const chart = chartRef.current;
        if (chart && chart.data.datasets[0].data.length > 0) {
          // Add slight animation to simulate live updates
          chart.update('none');
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [compact]);

  if (chartData.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-white/5 rounded-lg border border-purple-500/20"
        style={{ height }}
      >
        <div className="text-center text-gray-400">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-sm">No chart data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Chart Header (for non-compact mode) */}
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-white">{asset} Price Chart</h3>
            <div className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
            `}>
              {isPositive ? '📈 Trending Up' : '📉 Trending Down'}
            </div>
          </div>
          
          <div className="text-right text-sm">
            <div className="text-white font-semibold">
              ${prices[prices.length - 1]?.toLocaleString(undefined, {
                minimumFractionDigits: asset === 'XLM' ? 4 : 2,
                maximumFractionDigits: asset === 'XLM' ? 6 : 2
              })}
            </div>
            <div className="text-gray-400">Current Price</div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div style={{ height }} className="relative">
        <Line 
          ref={chartRef}
          data={data_config} 
          options={options} 
        />
      </div>

      {/* Chart Footer Stats (for non-compact mode) */}
      {!compact && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="text-sm text-gray-400">24h High</div>
            <div className="text-white font-semibold">
              ${maxPrice.toLocaleString(undefined, {
                minimumFractionDigits: asset === 'XLM' ? 4 : 2,
                maximumFractionDigits: asset === 'XLM' ? 6 : 2
              })}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400">24h Low</div>
            <div className="text-white font-semibold">
              ${minPrice.toLocaleString(undefined, {
                minimumFractionDigits: asset === 'XLM' ? 4 : 2,
                maximumFractionDigits: asset === 'XLM' ? 6 : 2
              })}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400">Range</div>
            <div className="text-white font-semibold">
              ${priceRange.toLocaleString(undefined, {
                minimumFractionDigits: asset === 'XLM' ? 4 : 2,
                maximumFractionDigits: asset === 'XLM' ? 6 : 2
              })}
            </div>
          </div>
        </div>
      )}

      {/* Live Update Indicator */}
      <div className="absolute top-2 right-2">
        <div className="flex items-center space-x-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400 font-medium">LIVE</span>
        </div>
      </div>
    </div>
  );
};

export default LiveChart;