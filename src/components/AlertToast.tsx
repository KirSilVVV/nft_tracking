import React, { useState, useEffect, useRef } from 'react';
import { Alert, AlertSeverity } from '../types/alert.types';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:6255';

interface ToastAlert extends Alert {
  toastId: string;
}

export const AlertToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('✅ WebSocket connected for alerts');
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === 'alert') {
              const alert: Alert = message.data;
              handleNewAlert(alert);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected, reconnecting in 5s...');
          setTimeout(connectWebSocket, 5000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleNewAlert = (alert: Alert) => {
    const toastId = `${alert.id}-${Date.now()}`;
    const toastAlert: ToastAlert = { ...alert, toastId };

    setToasts((prev) => [toastAlert, ...prev].slice(0, 5)); // Keep max 5 toasts

    // Play sound
    if (soundEnabled) {
      playAlertSound(alert.severity);
    }

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      removeToast(toastId);
    }, 10000);
  };

  const playAlertSound = (severity: AlertSeverity) => {
    try {
      // Use Web Audio API for simple beep
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different severities
      const frequency = severity === AlertSeverity.CRITICAL ? 800 :
                       severity === AlertSeverity.WARNING ? 600 : 400;

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
      }, 200);
    } catch (error) {
      // Silently fail if audio not supported
    }
  };

  const removeToast = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  };

  const getSeverityStyle = (severity: AlertSeverity): string => {
    switch (severity) {
      case AlertSeverity.INFO:
        return 'bg-blue-500 border-blue-600';
      case AlertSeverity.WARNING:
        return 'bg-yellow-500 border-yellow-600';
      case AlertSeverity.CRITICAL:
        return 'bg-red-500 border-red-600 animate-pulse';
      default:
        return 'bg-gray-500 border-gray-600';
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

  if (toasts.length === 0) return null;

  return (
    <>
      {/* Toast Container - Fixed position top-right */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.toastId}
            className={`${getSeverityStyle(toast.severity)} text-white rounded-lg shadow-2xl border-l-4 p-4 transform transition-all duration-300 animate-slide-in`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{getSeverityIcon(toast.severity)}</span>
                  <span className="font-bold">{toast.title}</span>
                </div>
                <p className="text-sm opacity-90">{toast.message}</p>
                {toast.metadata?.priceETH && (
                  <div className="mt-2 text-xs font-semibold bg-white bg-opacity-20 rounded px-2 py-1 inline-block">
                    {toast.metadata.priceETH.toFixed(4)} ETH
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.toastId)}
                className="ml-2 text-white opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sound Toggle Button - Fixed bottom-right */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-full shadow-lg transition-all ${
          soundEnabled
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-400 text-white hover:bg-gray-500'
        }`}
        title={soundEnabled ? 'Sound On' : 'Sound Off'}
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>

      {/* CSS Animation */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};
