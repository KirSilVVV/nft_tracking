import React, { useEffect, useState } from 'react';
import axios from 'axios';

type PageType = 'home' | 'whales' | 'dashboard' | 'whale-detail' | 'mutant-finder' | 'portfolio-analyzer' | 'flip-calculator';

interface NavigationProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api/whales', '') || 'http://localhost:6252';

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const [floorPrice, setFloorPrice] = useState<number | null>(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/whales/stats`)
      .then(res => setFloorPrice(res.data.floorPrice ?? null))
      .catch(() => setFloorPrice(null));
  }, []);

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🐋</span>
          <h1 className="text-xl font-bold">MAYC Whale Tracker</h1>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => onNavigate('whales')}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${
                currentPage === 'whales'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-blue-500 hover:bg-blue-400 text-white'
              }
            `}
          >
            🐋 Top Whales
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${
                currentPage === 'dashboard'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-blue-500 hover:bg-blue-400 text-white'
              }
            `}
          >
            📊 Analytics
          </button>

          <button
            onClick={() => onNavigate('mutant-finder')}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${
                currentPage === 'mutant-finder'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-blue-500 hover:bg-blue-400 text-white'
              }
            `}
          >
            🔍 Mutant Finder
          </button>

          <button
            onClick={() => onNavigate('portfolio-analyzer')}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${
                currentPage === 'portfolio-analyzer'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-blue-500 hover:bg-blue-400 text-white'
              }
            `}
          >
            💼 Portfolio
          </button>

          {/* Right-side info */}
          {floorPrice !== null && (
            <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-blue-400">
              <span className="text-sm">
                Floor: <span className="font-bold">{floorPrice.toFixed(2)} ETH</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-blue-500">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-blue-500 animate-pulse"
          style={{ width: '100%' }}
        ></div>
      </div>
    </nav>
  );
};

export default Navigation;
