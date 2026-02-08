import React, { useEffect, useState } from 'react';
import { useWebSocket, WebSocketEvent } from '../hooks/useWebSocket';

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: number;
  icon: string;
  color: string;
}

const RealtimeIndicator: React.FC = () => {
  const { isConnected, lastEvent, events } = useWebSocket('ws://localhost:6255');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showFeed, setShowFeed] = useState(false);

  useEffect(() => {
    if (lastEvent) {
      const notification = createNotification(lastEvent);
      setNotifications((prev) => [notification, ...prev.slice(0, 4)]);

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  const createNotification = (event: WebSocketEvent): Notification => {
    const id = `${Date.now()}-${Math.random()}`;
    const timestamp = new Date(event.timestamp);
    const timeStr = timestamp.toLocaleTimeString();

    switch (event.type) {
      case 'whale_alert':
        return {
          id,
          type: event.type,
          message: `🐋 Whale moved ${event.data?.count || '?'} NFTs`,
          timestamp: event.timestamp,
          icon: '🐋',
          color: 'bg-blue-50 border-blue-300',
        };
      case 'large_sale':
        return {
          id,
          type: event.type,
          message: `💰 Large sale: ${event.data?.price || '?'} ETH`,
          timestamp: event.timestamp,
          icon: '💰',
          color: 'bg-green-50 border-green-300',
        };
      case 'new_transfer':
        return {
          id,
          type: event.type,
          message: `🔄 Transfer: MAYC #${event.data?.tokenId || '?'}`,
          timestamp: event.timestamp,
          icon: '🔄',
          color: 'bg-purple-50 border-purple-300',
        };
      default:
        return {
          id,
          type: event.type,
          message: `📦 ${event.type}`,
          timestamp: event.timestamp,
          icon: '📦',
          color: 'bg-gray-50 border-gray-300',
        };
    }
  };

  return (
    <>
      {/* Connection Status Badge */}
      <div className="fixed top-4 right-4 z-40 flex flex-col items-end gap-3">
        {/* Status Indicator */}
        <div
          className={`
            px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2
            transition-all duration-300 shadow-lg
            ${
              isConnected
                ? 'bg-gradient-to-r from-green-400 to-green-600 text-white'
                : 'bg-gradient-to-r from-red-400 to-red-600 text-white'
            }
          `}
          onClick={() => setShowFeed(!showFeed)}
        >
          <span
            className={`
              inline-block w-2.5 h-2.5 rounded-full
              ${isConnected ? 'bg-white animate-pulse' : 'bg-white'}
            `}
          ></span>
          {isConnected ? '● Live' : '● Offline'}
          <span className="text-xs opacity-75">
            ({events.length} events)
          </span>
        </div>

        {/* Recent Events Feed */}
        {showFeed && (
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 max-w-sm w-96">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
              <h3 className="font-bold text-sm">📡 Real-Time Feed</h3>
              <p className="text-xs opacity-75">Last 5 events</p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {events.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Waiting for events...
                </div>
              ) : (
                events.map((event) => {
                  const notification = createNotification(event);
                  return (
                    <div
                      key={notification.id}
                      className={`
                        p-3 border-b border-gray-100 hover:bg-gray-50
                        transition-colors cursor-pointer last:border-b-0
                        ${notification.color}
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-lg flex-shrink-0">
                          {notification.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-xs text-gray-600">
              {isConnected ? (
                <>
                  ✓ Connected to{' '}
                  <span className="font-mono text-xs">localhost:6255</span>
                </>
              ) : (
                <>⚠ Connection lost. Reconnecting...</>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications for Important Events */}
      <div className="fixed top-20 right-4 z-40 space-y-2 pointer-events-none">
        {notifications
          .filter((n) => ['whale_alert', 'large_sale'].includes(n.type))
          .map((notification) => (
            <div
              key={notification.id}
              className={`
                px-4 py-3 rounded-lg shadow-lg font-medium text-sm
                animate-slide-in pointer-events-auto cursor-default
                ${notification.color}
              `}
            >
              {notification.message}
            </div>
          ))}
      </div>
    </>
  );
};

const formatTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  return new Date(timestamp).toLocaleTimeString();
};

export default RealtimeIndicator;
