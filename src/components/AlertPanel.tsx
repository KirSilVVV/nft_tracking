import React, { useState, useEffect } from 'react';
import { Alert, AlertType, AlertSeverity } from '../types/alert.types';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api/whales', '') || 'http://localhost:6252';

interface AlertPanelProps {
  limit?: number;
  showControls?: boolean;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ limit = 20, showControls = true }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AlertType | 'all'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [limit]);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/alerts?limit=${limit}`);
      setAlerts(response.data.alerts || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const playAlertSound = () => {
    if (soundEnabled) {
      const audio = new Audio('/alert-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    }
  };

  const getSeverityColor = (severity: AlertSeverity): string => {
    switch (severity) {
      case AlertSeverity.INFO:
        return 'bg-blue-100 border-blue-400 text-blue-800';
      case AlertSeverity.WARNING:
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case AlertSeverity.CRITICAL:
        return 'bg-red-100 border-red-400 text-red-800';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: AlertSeverity): string => {
    switch (severity) {
      case AlertSeverity.INFO:
        return 'ℹ️';
      case AlertSeverity.WARNING:
        return '⚠️';
      case AlertSeverity.CRITICAL:
        return '🚨';
      default:
        return '📢';
    }
  };

  const getTypeIcon = (type: AlertType): string => {
    switch (type) {
      case AlertType.LARGE_SALE:
        return '💰';
      case AlertType.WHALE_BUY:
        return '🐋';
      case AlertType.WHALE_SELL:
        return '🐋💸';
      case AlertType.FLOOR_PRICE_CHANGE:
        return '📊';
      case AlertType.PUMP_DETECTION:
        return '📈';
      case AlertType.DUMP_DETECTION:
        return '📉';
      case AlertType.RARE_LISTING:
        return '💎';
      default:
        return '🔔';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(alert => alert.type === filter);

  if (loading && alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading alerts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          🚨 Smart Alerts
        </h2>
        {showControls && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1 rounded-lg text-sm ${
                soundEnabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
            </button>
            <button
              onClick={fetchAlerts}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
            >
              🔄 Refresh
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg text-sm ${
            filter === 'all'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({alerts.length})
        </button>
        {Object.values(AlertType).map((type) => {
          const count = alerts.filter(a => a.type === type).length;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-lg text-sm ${
                filter === type
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getTypeIcon(type)} {type.replace(/_/g, ' ')} ({count})
            </button>
          );
        })}
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <div>No alerts yet. Monitoring active...</div>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                    <span className="font-bold text-lg">{alert.title}</span>
                    <span className="text-xl">{getSeverityIcon(alert.severity)}</span>
                  </div>
                  <p className="text-sm mb-2">{alert.message}</p>
                  <div className="flex items-center gap-4 text-xs opacity-75">
                    <span>{formatTimestamp(alert.timestamp)}</span>
                    {alert.metadata?.tokenId && (
                      <span>Token #{alert.metadata.tokenId}</span>
                    )}
                    {alert.metadata?.priceETH && (
                      <span className="font-semibold">
                        {alert.metadata.priceETH.toFixed(4)} ETH
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {(alert.metadata?.tokenId || alert.metadata?.txHash) && (
                <div className="mt-3 flex gap-2">
                  {alert.metadata.tokenId && (
                    <a
                      href={`https://opensea.io/assets/ethereum/0x60e4d786628fea6478f785a6d7e704777c86a7c6/${alert.metadata.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white bg-opacity-50 rounded text-xs hover:bg-opacity-70"
                    >
                      View on OpenSea →
                    </a>
                  )}
                  {alert.metadata.txHash && (
                    <a
                      href={`https://etherscan.io/tx/${alert.metadata.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white bg-opacity-50 rounded text-xs hover:bg-opacity-70"
                    >
                      View TX →
                    </a>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
