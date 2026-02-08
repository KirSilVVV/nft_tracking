import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Spinner } from '../components/loading';

interface FlipEstimate {
  buyPrice: number;
  sellPrice: number;
  gasFees: number;
  marketplaceFees: number;
  netProfit: number;
  roi: number;
  breakeven: number;
}

interface EstimateUSD {
  buyPrice: number;
  sellPrice: number;
  gasFees: number;
  marketplaceFees: number;
  netProfit: number;
}

interface HistoricalFlip {
  tokenId: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  roi: number;
  holdingPeriodDays: number;
  buyDate: string;
  sellDate: string;
}

interface FlipStatistics {
  totalFlips: number;
  profitableFlips: number;
  unprofitableFlips: number;
  successRate: number;
  avgProfit: number;
  avgHoldingPeriod: number;
  avgROI: number;
}

interface FlipCalculatorProps {
  onViewNft?: (tokenId: number) => void;
}

const FlipCalculator: React.FC<FlipCalculatorProps> = ({ onViewNft }) => {
  const [buyPrice, setBuyPrice] = useState<string>('1.5');
  const [sellPrice, setSellPrice] = useState<string>('2.0');
  const [useFloorPrice, setUseFloorPrice] = useState(false);
  const [floorPrice, setFloorPrice] = useState<number>(0);

  const [estimate, setEstimate] = useState<FlipEstimate | null>(null);
  const [estimateUSD, setEstimateUSD] = useState<EstimateUSD | null>(null);
  const [calculating, setCalculating] = useState(false);

  const [historicalFlips, setHistoricalFlips] = useState<HistoricalFlip[]>([]);
  const [statistics, setStatistics] = useState<FlipStatistics | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL?.replace('/api/whales', '') || 'http://localhost:6252';

  // Fetch floor price on mount
  useEffect(() => {
    fetchFloorPrice();
    fetchHistoricalFlips();
  }, []);

  const fetchFloorPrice = async () => {
    try {
      // Use OpenSea collection stats for accurate floor price
      const response = await axios.get(`${API_BASE}/api/collection/stats`);
      const floor = response.data?.data?.floorPrice || 0;
      setFloorPrice(floor);
      if (useFloorPrice) {
        setSellPrice(floor.toString());
      }
    } catch (error) {
      console.error('Failed to fetch floor price:', error);
    }
  };

  const fetchHistoricalFlips = async () => {
    try {
      setLoadingHistory(true);
      const response = await axios.get(`${API_BASE}/api/calculator/historical-flips?limit=10&sortBy=profit`);
      setHistoricalFlips(response.data.data.flips);
      setStatistics(response.data.data.statistics);
    } catch (error) {
      console.error('Failed to fetch historical flips:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCalculate = async () => {
    const buy = parseFloat(buyPrice);
    const sell = parseFloat(sellPrice);

    if (isNaN(buy) || isNaN(sell) || buy <= 0 || sell <= 0) {
      alert('Please enter valid prices');
      return;
    }

    try {
      setCalculating(true);
      const response = await axios.get(
        `${API_BASE}/api/calculator/estimate?buyPrice=${buy}&sellPrice=${sell}`
      );
      setEstimate(response.data.data.estimate);
      setEstimateUSD(response.data.data.estimateUSD);
    } catch (error) {
      console.error('Failed to calculate estimate:', error);
      alert('Failed to calculate. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const handleUseFloorPrice = (checked: boolean) => {
    setUseFloorPrice(checked);
    if (checked && floorPrice > 0) {
      setSellPrice(floorPrice.toString());
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            💰 Flip Calculator
          </h1>
          <p className="text-lg text-gray-600">
            Calculate potential profit from flipping MAYC NFTs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Calculator Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📊 Profit Calculator
            </h2>

            <div className="space-y-4">
              {/* Buy Price Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buy Price (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="1.5"
                />
              </div>

              {/* Sell Price Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sell Price (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  disabled={useFloorPrice}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="2.0"
                />

                <label className="flex items-center mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useFloorPrice}
                    onChange={(e) => handleUseFloorPrice(e.target.checked)}
                    className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-600">
                    Use current floor price ({floorPrice.toFixed(4)} ETH from OpenSea)
                  </span>
                </label>
              </div>

              {/* Calculate Button */}
              <button
                onClick={handleCalculate}
                disabled={calculating}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {calculating ? (
                  <>
                    <Spinner size="sm" />
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <span>💡</span>
                    <span>Calculate Profit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Display */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📈 Profit Breakdown
            </h2>

            {estimate ? (
              <div className="space-y-4">
                {/* Net Profit */}
                <div className={`p-4 rounded-lg ${estimate.netProfit > 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                  <p className="text-sm text-gray-600 mb-1">Net Profit</p>
                  <p className={`text-3xl font-bold ${estimate.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {estimate.netProfit > 0 ? '+' : ''}{estimate.netProfit.toFixed(4)} ETH
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ≈ ${estimateUSD?.netProfit.toFixed(2)} USD
                  </p>
                </div>

                {/* ROI */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Return on Investment (ROI)</p>
                  <p className={`text-2xl font-bold ${estimate.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {estimate.roi > 0 ? '+' : ''}{estimate.roi.toFixed(2)}%
                  </p>
                </div>

                {/* Fees Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">⛽ Gas Fees</span>
                    <span className="font-semibold">{estimate.gasFees.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">🏪 Marketplace Fees (2.5%)</span>
                    <span className="font-semibold">{estimate.marketplaceFees.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">🎯 Breakeven Price</span>
                    <span className="font-semibold text-orange-600">{estimate.breakeven.toFixed(4)} ETH</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Summary</p>
                  <p className="text-sm text-gray-700">
                    {estimate.netProfit > 0 ? (
                      <>✅ This flip would be <span className="font-bold text-green-600">profitable</span>. You need to sell above <span className="font-bold">{estimate.breakeven.toFixed(4)} ETH</span> to break even.</>
                    ) : (
                      <>❌ This flip would result in a <span className="font-bold text-red-600">loss</span>. Consider waiting for a better sell price.</>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-center">Enter buy and sell prices to calculate profit</p>
              </div>
            )}
          </div>
        </div>

        {/* Market Insights */}
        {statistics && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📍 Market Insights
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Total Flips</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.totalFlips}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{statistics.successRate.toFixed(1)}%</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Avg Profit</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.avgProfit.toFixed(3)} ETH</p>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Avg Hold Time</p>
                <p className="text-2xl font-bold text-orange-600">{Math.round(statistics.avgHoldingPeriod)}d</p>
              </div>
            </div>
          </div>
        )}

        {/* Historical Flips Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🏆 Top 10 Profitable Flips
          </h2>

          {loadingHistory ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : historicalFlips.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Token ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Buy Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Sell Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Profit</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ROI</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Hold Time</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalFlips.map((flip, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onViewNft?.(flip.tokenId)}
                          className="font-mono text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                        >
                          #{flip.tokenId}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm">{flip.buyPrice.toFixed(4)} ETH</td>
                      <td className="py-3 px-4 text-sm">{flip.sellPrice.toFixed(4)} ETH</td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${flip.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {flip.profit > 0 ? '+' : ''}{flip.profit.toFixed(4)} ETH
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${flip.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {flip.roi > 0 ? '+' : ''}{flip.roi.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{flip.holdingPeriodDays}d</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{formatDate(flip.sellDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-center">No historical flips found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlipCalculator;
