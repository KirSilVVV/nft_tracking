import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Homepage from './pages/Homepage';
import WhaleList from './components/WhaleList';
import Dashboard from './pages/Dashboard';
import WhaleDetail from './pages/WhaleDetail';
import MutantFinder from './pages/MutantFinder';
import PortfolioAnalyzer from './pages/PortfolioAnalyzer';
import FlipCalculator from './pages/FlipCalculator';
import Alerts from './pages/Alerts';
import ImageSearch from './pages/ImageSearch';
import AIInsights from './pages/AIInsights';
import Transactions from './pages/Transactions';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import MobileMenuButton from './components/MobileMenuButton';
import './index.css';
import './styles/loading.css';
import './styles/mobile-menu.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

type PageType = 'home' | 'whales' | 'dashboard' | 'whale-detail' | 'alerts' | 'image-search' | 'ai-insights' | 'portfolio-analyzer' | 'flip-calculator' | 'transactions';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedWhaleAddress, setSelectedWhaleAddress] = useState<string>('');
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleViewActivity = (address: string) => {
    setSelectedWhaleAddress(address);
    setCurrentPage('whale-detail');
  };

  const handleViewNft = (tokenId: number) => {
    setSelectedTokenId(tokenId);
    setCurrentPage('image-search');
  };

  const handleNavigate = (page: PageType) => {
    setCurrentPage(page);
    if (page !== 'whale-detail') setSelectedWhaleAddress('');
    if (page !== 'image-search') setSelectedTokenId(null);
  };

  // Get page title for Topbar
  const getPageTitle = (page: PageType): string => {
    const titles: Record<PageType, string> = {
      'home': 'Home',
      'whales': 'Top Whales',
      'dashboard': 'Analytics Dashboard',
      'whale-detail': 'Whale Details',
      'alerts': 'AI Alerts',
      'image-search': 'Image Search',
      'ai-insights': 'AI Insights',
      'portfolio-analyzer': 'Portfolio Analyzer',
      'flip-calculator': 'Flip Calculator',
      'transactions': 'Transactions',
    };
    return titles[page] || 'NFT Tracker';
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          {/* Homepage: показывается БЕЗ Sidebar/Topbar */}
          {currentPage === 'home' ? (
            <Homepage onNavigate={handleNavigate} />
          ) : (
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Mobile Menu Button (visible only on mobile) */}
            <MobileMenuButton
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />

            {/* Mobile Overlay (backdrop when menu is open) */}
            <div
              className={`mobile-overlay ${isMobileMenuOpen ? 'visible' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>

            {/* Sidebar - fixed left navigation */}
            <Sidebar
              currentPage={currentPage}
              onNavigate={handleNavigate}
              isMobileOpen={isMobileMenuOpen}
              onMobileClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Main content area */}
            <div className="main" style={{ flex: 1, marginLeft: '240px' }}>
              {/* Topbar - sticky top bar */}
              <Topbar title={getPageTitle(currentPage)} />

              {/* Content area */}
              <div className="content" style={{ padding: '24px 32px' }}>
                {currentPage === 'whales' && (
                  <WhaleList onViewActivity={handleViewActivity} onViewNft={handleViewNft} />
                )}
                {currentPage === 'dashboard' && <Dashboard />}
                {currentPage === 'whale-detail' && selectedWhaleAddress && (
                  <WhaleDetail
                    address={selectedWhaleAddress}
                    onBack={() => handleNavigate('whales')}
                    onViewNft={handleViewNft}
                  />
                )}
                {currentPage === 'alerts' && <Alerts />}
                {currentPage === 'image-search' && <ImageSearch />}
                {currentPage === 'ai-insights' && <AIInsights />}
                {currentPage === 'portfolio-analyzer' && <PortfolioAnalyzer />}
                {currentPage === 'flip-calculator' && <FlipCalculator onViewNft={handleViewNft} />}
                {currentPage === 'transactions' && <Transactions />}
              </div>
            </div>
          </div>
        )}
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
