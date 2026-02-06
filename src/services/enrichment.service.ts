import { ethers } from 'ethers';
import { getAlchemySDKProvider } from '../providers/alchemy-sdk.provider';
import { Holder } from '../models/holder.model';
import {
  EnrichedWhale,
  NFTPortfolio,
  PortfolioCollection,
  EnrichmentResult,
  EnrichmentOptions,
  BatchEnrichmentResult,
} from '../models/enrichment.model';
import { getCacheService } from './cache.service';
import { logger } from '../utils/logger';

/**
 * EnrichmentService - Enrich whale data with ENS, ETH balance, and portfolio
 */
export class EnrichmentService {
  private alchemySDKProvider: ReturnType<typeof getAlchemySDKProvider>;
  private cacheService: ReturnType<typeof getCacheService>;
  private ethersProvider: ethers.JsonRpcProvider;
  private static instance: EnrichmentService;

  private constructor() {
    this.alchemySDKProvider = getAlchemySDKProvider();
    this.cacheService = getCacheService();

    // Initialize ethers provider for ENS and balance lookups
    const rpcUrl = `https://${process.env.ALCHEMY_NETWORK}.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
    this.ethersProvider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EnrichmentService {
    if (!EnrichmentService.instance) {
      EnrichmentService.instance = new EnrichmentService();
    }
    return EnrichmentService.instance;
  }

  /**
   * Enrich a single whale with full data
   */
  async enrichWhale(holder: Holder, options: Partial<EnrichmentOptions> = {}): Promise<EnrichedWhale> {
    const startTime = Date.now();
    const enriched: Partial<EnrichedWhale> = { ...holder };
    let status: 'complete' | 'partial' | 'failed' = 'complete';

    try {
      // 1. ENS Resolution (non-critical)
      try {
        enriched.ensName = await this.resolveENS(holder.address);
      } catch (error) {
        logger.warn(`ENS resolution failed for ${holder.address}`, error);
        enriched.ensName = null;
        status = 'partial';
      }

      // 2. ETH Balance (important)
      try {
        enriched.ethBalance = await this.getETHBalance(holder.address);
      } catch (error) {
        logger.error(`Failed to get ETH balance for ${holder.address}`, error);
        enriched.ethBalance = '0';
        status = 'partial';
      }

      // 3. NFT Portfolio (important)
      try {
        const portfolio = await this.analyzePortfolio(holder.address);
        enriched.portfolio = portfolio;

        // Calculate portfolio value
        enriched.portfolioValueETH = await this.calculatePortfolioValue(portfolio);
      } catch (error) {
        logger.error(`Failed to analyze portfolio for ${holder.address}`, error);
        enriched.portfolio = { totalCollections: 0, totalNFTs: 0, collections: [] };
        enriched.portfolioValueETH = null;
        status = 'failed';
      }

      // Mark enrichment completion
      enriched.enrichedAt = new Date();
      enriched.enrichmentStatus = status;

      logger.info(`Enriched ${holder.address} in ${Date.now() - startTime}ms (status: ${status})`);

      return enriched as EnrichedWhale;
    } catch (error) {
      logger.error(`Complete enrichment failure for ${holder.address}`, error);
      throw error;
    }
  }

  /**
   * Batch enrich multiple whales with rate limiting
   */
  async enrichWhales(
    holders: Holder[],
    options: Partial<EnrichmentOptions> = {}
  ): Promise<EnrichedWhale[]> {
    const startTime = Date.now();
    const batchSize = options.batchSize || 10;
    const delayMs = options.delayMs || 200;

    const enriched: EnrichedWhale[] = [];
    const errors: string[] = [];

    logger.info(`Starting batch enrichment of ${holders.length} whales (batch size: ${batchSize})`);

    // Process in chunks with delays for rate limiting
    const chunks = this.chunkArray(holders, batchSize);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      logger.info(
        `Processing batch ${i + 1}/${chunks.length} (${chunk.length} whales) - ${enriched.length}/${holders.length} completed`
      );

      // Process all whales in chunk in parallel
      const batchResults = await Promise.allSettled(chunk.map((h) => this.enrichWhale(h, options)));

      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          enriched.push(result.value);
        } else {
          errors.push(`Failed to enrich ${chunk[idx].address}: ${result.reason}`);
          logger.error(`Batch processing error for ${chunk[idx].address}`, result.reason);
        }
      });

      // Delay between batches for rate limiting
      if (i < chunks.length - 1) {
        await this.sleep(delayMs);
      }
    }

    const duration = Date.now() - startTime;
    logger.info(
      `Batch enrichment completed in ${duration}ms. Success: ${enriched.length}, Failed: ${errors.length}`
    );

    return enriched;
  }

  /**
   * Resolve ENS name for an address
   */
  async resolveENS(address: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.cacheService.getENSName(address);
      if (cached !== undefined) {
        return cached;
      }

      // Resolve via ethers
      const ensName = await this.ethersProvider.lookupAddress(address);

      // Cache the result (even if null)
      this.cacheService.setENSName(address, ensName);

      return ensName;
    } catch (error) {
      logger.warn(`ENS resolution error for ${address}`, error);
      // Cache null result to avoid repeated attempts
      this.cacheService.setENSName(address, null);
      return null;
    }
  }

  /**
   * Get ETH balance for an address
   */
  async getETHBalance(address: string): Promise<string> {
    try {
      // Check cache first
      const cached = this.cacheService.getETHBalance(address);
      if (cached !== undefined) {
        return cached;
      }

      // Get balance via ethers
      const balance = await this.ethersProvider.getBalance(address);
      const balanceETH = ethers.formatEther(balance);

      // Cache the result
      this.cacheService.setETHBalance(address, balanceETH);

      return balanceETH;
    } catch (error) {
      logger.error(`Failed to get ETH balance for ${address}`, error);
      return '0';
    }
  }

  /**
   * Analyze NFT portfolio for an address
   */
  async analyzePortfolio(address: string): Promise<NFTPortfolio> {
    try {
      // Check cache first
      const cached = this.cacheService.getPortfolio(address);
      if (cached) {
        return cached;
      }

      // Fetch NFTs via Alchemy SDK
      const nftsData = await this.alchemySDKProvider.getNFTsForOwner(address);

      // Build portfolio structure
      const portfolio = await this.buildPortfolioFromNFTs(nftsData.ownedNfts);

      // Cache the result
      this.cacheService.setPortfolio(address, portfolio);

      return portfolio;
    } catch (error) {
      logger.error(`Failed to analyze portfolio for ${address}`, error);
      return { totalCollections: 0, totalNFTs: 0, collections: [] };
    }
  }

  /**
   * Calculate total portfolio value
   */
  async calculatePortfolioValue(portfolio: NFTPortfolio): Promise<number | null> {
    try {
      let totalValue = 0;

      for (const collection of portfolio.collections) {
        if (!collection.floorPrice) {
          // Try to get floor price if missing
          const floorPrice = await this.getFloorPrice(collection.contractAddress);
          if (floorPrice) {
            collection.floorPrice = floorPrice;
            collection.estimatedValueETH = collection.count * floorPrice;
          }
        }

        if (collection.estimatedValueETH) {
          totalValue += collection.estimatedValueETH;
        }
      }

      return parseFloat(totalValue.toFixed(4));
    } catch (error) {
      logger.error('Failed to calculate portfolio value', error);
      return null;
    }
  }

  /**
   * Get floor price for a collection
   */
  async getFloorPrice(contractAddress: string): Promise<number | null> {
    try {
      // Check cache first
      const cached = this.cacheService.getFloorPrice(contractAddress);
      if (cached !== undefined) {
        return cached;
      }

      // Fetch from Alchemy
      const price = await this.alchemySDKProvider.getFloorPrice(contractAddress);

      // Cache the result (even if null)
      this.cacheService.setFloorPrice(contractAddress, price);

      return price;
    } catch (error) {
      logger.warn(`Failed to get floor price for ${contractAddress}`, error);
      return null;
    }
  }

  /**
   * Build portfolio structure from NFTs array
   */
  private async buildPortfolioFromNFTs(nfts: any[]): Promise<NFTPortfolio> {
    const collections = new Map<string, PortfolioCollection>();

    // Group NFTs by contract address
    for (const nft of nfts) {
      const contractAddress = nft.contract.address;

      if (!collections.has(contractAddress)) {
        collections.set(contractAddress, {
          contractAddress,
          name: nft.contract.name || 'Unknown',
          symbol: nft.contract.symbol || '',
          tokenType: nft.contractMetadata?.tokenType || 'ERC721',
          count: 0,
          floorPrice: null,
          estimatedValueETH: null,
          image: nft.contract.openSeaMetadata?.imageUrl || null,
        });
      }

      const collection = collections.get(contractAddress)!;
      collection.count++;
    }

    // Get floor prices for each collection
    for (const [contractAddress, collection] of collections) {
      collection.floorPrice = await this.getFloorPrice(contractAddress);
      if (collection.floorPrice) {
        collection.estimatedValueETH = collection.count * collection.floorPrice;
      }
    }

    return {
      totalCollections: collections.size,
      totalNFTs: nfts.length,
      collections: Array.from(collections.values()),
    };
  }

  /**
   * Helper: chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Helper: sleep for milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Get singleton instance of EnrichmentService
 */
export function getEnrichmentService(): EnrichmentService {
  return EnrichmentService.getInstance();
}
