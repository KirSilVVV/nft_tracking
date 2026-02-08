import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WhaleList from './components/WhaleList';
import Dashboard from './pages/Dashboard';
import WhaleDetail from './pages/WhaleDetail';
import MutantFinder from './pages/MutantFinder';
import PortfolioAnalyzer from './pages/PortfolioAnalyzer';
import Navigation from './components/Navigation';
import RealtimeIndicator from './components/RealtimeIndicator';
import Footer from './components/Footer';
import './index.css';

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

type PageType = 'whales' | 'dashboard' | 'whale-detail' | 'mutant-finder' | 'portfolio-analyzer';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('whales');
  const [selectedWhaleAddress, setSelectedWhaleAddress] = useState<string>('');
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

  const handleViewActivity = (address: string) => {
    setSelectedWhaleAddress(address);
    setCurrentPage('whale-detail');
  };

  const handleViewNft = (tokenId: number) => {
    setSelectedTokenId(tokenId);
    setCurrentPage('mutant-finder');
  };

  const handleNavigate = (page: PageType) => {
    setCurrentPage(page);
    if (page !== 'whale-detail') setSelectedWhaleAddress('');
    if (page !== 'mutant-finder') setSelectedTokenId(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
        <RealtimeIndicator />
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />

        <main className="flex-grow">
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
          {currentPage === 'mutant-finder' && (
            <MutantFinder initialTokenId={selectedTokenId} />
          )}
          {currentPage === 'portfolio-analyzer' && <PortfolioAnalyzer />}
        </main>

        <Footer />
      </div>
    </QueryClientProvider>
  );
}

export default App;
