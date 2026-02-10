// Sidebar - Main navigation sidebar component (ATLAS Design)

import React from 'react';
import '../styles/sidebar.css';

type PageType = 'home' | 'whales' | 'dashboard' | 'whale-detail' | 'alerts' | 'image-search' | 'ai-insights' | 'portfolio-analyzer' | 'flip-calculator' | 'transactions';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isMobileOpen = false, onMobileClose }) => {
  const handleNavigation = (page: PageType) => {
    onNavigate(page);
    // Close mobile menu after navigation
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🐋</div>
        <span>NFT-Tracker</span>
        <span style={{ color: 'var(--gold)' }}>.ai</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Analytics Section */}
        <div className="sidebar-section">Analytics</div>
        <a
          className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigation('dashboard')}
        >
          <span className="icon">📊</span> Dashboard
        </a>
        <a
          className={`nav-item ${currentPage === 'whales' ? 'active' : ''}`}
          onClick={() => handleNavigation('whales')}
        >
          <span className="icon">🐋</span> Whales
        </a>
        <a
          className={`nav-item ${currentPage === 'transactions' ? 'active' : ''}`}
          onClick={() => handleNavigation('transactions')}
        >
          <span className="icon">💱</span> Transactions
        </a>

        {/* Tools Section */}
        <div className="sidebar-section">Tools</div>
        <a
          className={`nav-item ${currentPage === 'alerts' ? 'active' : ''}`}
          onClick={() => handleNavigation('alerts')}
        >
          <span className="icon">🔔</span> Alerts
        </a>
        <a
          className={`nav-item ${currentPage === 'image-search' ? 'active' : ''}`}
          onClick={() => handleNavigation('image-search')}
        >
          <span className="icon">🖼️</span> Image Search
        </a>
        <a
          className={`nav-item ${currentPage === 'ai-insights' ? 'active' : ''}`}
          onClick={() => handleNavigation('ai-insights')}
        >
          <span className="icon">🤖</span> AI Insights
        </a>
        <a
          className={`nav-item ${currentPage === 'portfolio-analyzer' ? 'active' : ''}`}
          onClick={() => handleNavigation('portfolio-analyzer')}
        >
          <span className="icon">📈</span> Portfolio Analyzer
        </a>
        <a
          className={`nav-item ${currentPage === 'flip-calculator' ? 'active' : ''}`}
          onClick={() => handleNavigation('flip-calculator')}
        >
          <span className="icon">💰</span> Flip Calculator
        </a>
      </nav>
    </aside>
  );
};

export default Sidebar;
