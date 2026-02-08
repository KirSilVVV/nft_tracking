/**
 * Whale Data Types for Frontend
 */

export interface Whale {
  address: string;
  ensName: string | null;
  ensAvatar?: string | null;
  twitter?: string | null;
  email?: string | null;
  rank: number;
  nftCount: number;
  nftIds: number[];
  percentageOfCollection?: number;
  floorPrice: number;
  estimatedValueETH: number;
  estimatedValueUSD?: number;
  ethBalance: number | null;  // ✅ Now allows null (real data from ethers.js is async)
  firstSeen?: string;
  lastActivity?: string;
}

export interface WhaleListResponse {
  whales: Whale[];
  totalCount: number;
  totalUniqueHolders: number;
  floorPrice: number;
  ensResolved?: number;
  cachedAt: boolean;
  lastUpdated: string;
}

export interface WhaleSearchResult {
  whale: Whale | null;
  found: boolean;
  message: string;
}

export interface WhaleAnalytics {
  topWhales: Whale[];
  distribution: {
    single: number;
    small: number;
    medium: number;
    whales: number;
  };
  statistics: {
    totalHolders: number;
    totalNFTs: number;
    averagePerHolder: number;
    medianPerHolder: number;
  };
  floorPrice: number;
  totalMarketCap: number;
  whale90Concentration: number;
}

export interface QuickStats {
  topWhales: number;
  topWhale: Whale | null;
  floorPrice: number;
  totalValue: number;
  averageHoldingSize: number;
  cachedAt: boolean;
}

/**
 * Whale Activity Types
 */
export interface ActivityEvent {
  timestamp: string;
  action: 'buy' | 'sell' | 'mint' | 'transfer_in' | 'transfer_out';
  tokenId: number;
  counterparty: string;
  priceETH: number | null;
  txHash: string;
  blockNumber: number;
}

export interface ActivitySummary {
  buys: number;
  sells: number;
  mints: number;
  totalEvents: number;
  volumeETH: number;
}

export interface ActivityResponse {
  address: string;
  ensName: string | null;
  currentHoldings: number;
  rank: number;
  activity: ActivityEvent[];
  summary: ActivitySummary;
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
}

/**
 * NFT Metadata Types (Mutant Finder)
 */
export interface NftTrait {
  trait_type: string;
  value: string;
}

export interface NftMetadataResponse {
  tokenId: number;
  contractAddress: string;
  name: string;
  description: string | null;
  image: string | null;
  owner: string | null;
  ownerENS: string | null;
  traits: NftTrait[];
  history: {
    timestamp: string;
    from: string;
    to: string;
    priceETH: number | null;
    txHash: string;
  }[];
  lastSalePrice: number | null;
  floorPrice: number | null;
}

/**
 * Portfolio Types
 */
export interface PortfolioCollection {
  contractAddress: string;
  name: string;
  symbol: string;
  tokenType: string;
  count: number;
  floorPrice: number | null;
  estimatedValueETH: number | null;
  image: string | null;
}

export interface NFTPortfolio {
  totalCollections: number;
  totalNFTs: number;
  collections: PortfolioCollection[];
}

/**
 * Enriched Whale with Portfolio
 */
export interface EnrichedWhale {
  address: string;
  tokenIds: number[];
  count: number;
  firstSeen: string;
  lastActivity: string;
  percentageOfCollection: number;
  ensName: string | null;
  ensAvatar?: string | null;
  twitter?: string | null;
  email?: string | null;
  ethBalance: string;
  ethBalanceUSD?: number;
  portfolio: NFTPortfolio;
  portfolioValueETH: number | null;
  portfolioValueUSD?: number;
  enrichedAt: string;
  enrichmentStatus: 'complete' | 'partial' | 'failed';
  rank: number;
}

export interface EnrichedWhaleResponse {
  whale: EnrichedWhale;
  enrichedAt: string;
  timestamp: string;
}
