import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api/whales', '') || 'http://localhost:6252';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [stats, setStats] = useState<{ totalHolders: number; floorPrice: number } | null>(null);

  useEffect(() => {
    // Fetch stats from multiple sources in parallel
    Promise.all([
      axios.get(`${API_BASE}/api/whales/analytics`).catch(() => ({ data: null })),
      axios.get(`${API_BASE}/api/collection/stats`).catch(() => ({ data: null })),
    ]).then(([analyticsRes, collectionRes]) => {
      setStats({
        totalHolders: analyticsRes.data?.totalHolders || 0,
        floorPrice: collectionRes.data?.data?.floorPrice || 0,
      });
    }).catch(() => {});
  }, []);

  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-16 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              🐋 MAYC Whale Tracker
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Real-time analytics and tracking for Mutant Ape Yacht Club NFT holders.
              Monitor whale activity and collection distribution on Ethereum.
            </p>
          </div>

          {/* Features Section */}
          <div>
            <h3 className="text-lg font-bold mb-3">Features</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-blue-400">✓</span>
                Live whale tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">✓</span>
                Real-time transactions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">✓</span>
                ENS integration
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">✓</span>
                Portfolio analysis
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="text-lg font-bold mb-3">Resources</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>
                <a
                  href="https://etherscan.io/token/0x60e4d786628fea6478f785a6d7e704777c86a7c6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  MAYC Contract ↗
                </a>
              </li>
              <li>
                <a
                  href="https://opensea.io/collection/mutant-ape-yacht-club"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  OpenSea Collection ↗
                </a>
              </li>
              <li>
                <a
                  href="https://docs.alchemy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  Powered by Alchemy ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8 mt-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">19,423</div>
              <div className="text-xs text-gray-500">Total MAYC Supply</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {stats ? stats.totalHolders.toLocaleString() : '—'}
              </div>
              <div className="text-xs text-gray-500">Tracked Holders (7d)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {stats?.floorPrice ? stats.floorPrice.toFixed(2) : '—'}
              </div>
              <div className="text-xs text-gray-500">Floor Price (ETH)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">Real-time</div>
              <div className="text-xs text-gray-500">Data Updates</div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-4 border-t border-gray-700">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} MAYC Whale Tracker. Data powered by Alchemy API.
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-950 bg-opacity-50 text-center py-4 border-t border-gray-700 text-gray-600 text-xs">
        <p>
          This tool is for educational purposes only. Data is retrieved from public blockchain sources.
          Always conduct your own research before making investment decisions.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
