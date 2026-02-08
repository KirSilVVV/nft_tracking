/**
 * Enrichment Models - Extended whale data with portfolio and financial info
 */

import { Holder } from './holder.model';

/**
 * Portfolio Item - Single NFT collection in a whale's portfolio
 */
export interface PortfolioCollection {
  contractAddress: string;
  name: string;
  symbol: string;
  tokenType: 'ERC721' | 'ERC1155' | string;
  count: number;
  floorPrice: number | null;
  estimatedValueETH: number | null;
  image: string | null;
}

/**
 * NFT Portfolio - Complete portfolio structure
 */
export interface NFTPortfolio {
  totalCollections: number;
  totalNFTs: number;
  collections: PortfolioCollection[];
}

/**
 * Enriched Whale - Holder with extended data
 */
export interface EnrichedWhale extends Omit<Holder, 'ensName' | 'label'> {
  // Enriched fields (redefine with nullable types)
  ensName: string | null;
  label: string | null;
  ethBalance: string; // In ETH units
  ethBalanceUSD?: number;
  portfolio: NFTPortfolio;
  portfolioValueETH: number | null; // Total value in ETH
  portfolioValueUSD?: number; // Total value in USD

  // ENS Metadata
  ensAvatar?: string | null;
  twitter?: string | null;
  email?: string | null;
  ensResolvedAt?: number; // Timestamp of ENS resolution

  // Metadata
  enrichedAt: Date;
  enrichmentStatus: 'complete' | 'partial' | 'failed';
}

/**
 * Enrichment Options - Configuration for enrichment process
 */
export interface EnrichmentOptions {
  includePortfolio: boolean;
  includeFloorPrices: boolean;
  maxCollections?: number;
  batchSize?: number;
  delayMs?: number;
  timeoutMs?: number;
}

/**
 * Enrichment Result - Result of enriching a single whale
 */
export interface EnrichmentResult {
  success: boolean;
  whale: EnrichedWhale | null;
  error: string | null;
  duration: number; // milliseconds
}

/**
 * Batch Enrichment Result - Result of batch enrichment
 */
export interface BatchEnrichmentResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  partialCount: number;
  whales: EnrichedWhale[];
  duration: number;
  errors: string[];
}

/**
 * Whale Comparison - For comparing portfolios
 */
export interface WhaleComparison {
  addresses: string[];
  ethBalances: Map<string, string>;
  portfolioValues: Map<string, number | null>;
  commonHoldings: Array<{
    contractAddress: string;
    name: string;
    holders: string[];
  }>;
}

/**
 * Portfolio Statistics - Analysis of portfolio composition
 */
export interface PortfolioStatistics {
  address: string;
  totalValue: number | null;
  topCollection: PortfolioCollection | null;
  concentration: number; // % of portfolio in top collection
  diversificationScore: number; // 0-100, higher = more diverse
  averageCollectionSize: number;
  largestCollectionSize: number;
  smallestCollectionSize: number;
}
