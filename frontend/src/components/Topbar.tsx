// Topbar - Top navigation bar with search and live indicator (ATLAS Design)

import React from 'react';
import '../styles/topbar.css';

interface TopbarProps {
  title: string;
  showSearch?: boolean;
  isLive?: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ title, showSearch = true, isLive = true }) => {
  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>

      {showSearch && (
        <div className="topbar-search">
          <span className="s-icon">🔍</span>
          <input type="text" placeholder="Search wallet, ENS, token ID..." />
        </div>
      )}

      <div className="topbar-right">
        {isLive && (
          <div className="topbar-live">
            <div className="live-dot"></div>
            <span>Live</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar;
