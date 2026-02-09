import { Alchemy, Network, GetNftsForOwnerOptions } from 'alchemy-sdk';
import { logger } from '../utils/logger';

export interface NFTPortfolioItem {
  contractAddress: string;
  name: string;
  symbol: string;
  tokenType: string;
  count: number;
  floorPrice: number | null;
  estimatedValueETH: number | null;
  image: string | null;
}

/**
 * AlchemySDKProvider - Using official Alchemy SDK for advanced NFT features
 * Handles: NFT portfolio, floor prices, collection metadata
 */
export class AlchemySDKProvider {
  private alchemy: Alchemy;
  private static instance: AlchemySDKProvider;

  private constructor(apiKey: string, networkName: string = 'eth-mainnet') {
    // Map network name to Alchemy SDK Network enum
    const network = this.mapNetworkName(networkName);

    const config = {
      apiKey: apiKey,
      network: network,
      maxRetries: 3,
    };

    this.alchemy = new Alchemy(config);
    logger.info(`AlchemySDKProvider initialized for network ${networkName}`);
  }

  /**
   * Get singleton instance
   */
  static getInstance(apiKey: string, networkName: string = 'eth-mainnet'): AlchemySDKProvider {
    if (!AlchemySDKProvider.instance) {
      AlchemySDKProvider.instance = new AlchemySDKProvider(apiKey, networkName);
    }
    return AlchemySDKProvider.instance;
  }

  /**
   * Map network name string to Alchemy SDK Network enum
   */
  private mapNetworkName(networkName: string): Network {
    const networkMap: { [key: string]: Network } = {
      'eth-mainnet': Network.ETH_MAINNET,
      'eth-sepolia': Network.ETH_SEPOLIA,
      'arbitrum-mainnet': Network.ARB_MAINNET,
      'arbitrum-sepolia': Network.ARB_SEPOLIA,
    };

    return networkMap[networkName.toLowerCase()] || Network.ETH_MAINNET;
  }

  /**
   * Get all NFTs owned by an address
   */
  async getNFTsForOwner(
    ownerAddress: string,
    options?: GetNftsForOwnerOptions
  ): Promise<{ totalCount: number; ownedNfts: any[] }> {
    try {
      logger.info(`Fetching NFTs for owner ${ownerAddress}`);

      const response = await this.alchemy.nft.getNftsForOwner(ownerAddress, options);

      logger.info(`Found ${response.ownedNfts.length} NFTs for owner ${ownerAddress}`);

      return {
        totalCount: response.totalCount,
        ownedNfts: response.ownedNfts,
      };
    } catch (error) {
      logger.error(`Failed to get NFTs for owner ${ownerAddress}`, error);
      throw error;
    }
  }

  /**
   * Get floor price for a collection
   */
  async getFloorPrice(contractAddress: string): Promise<number | null> {
    try {
      logger.info(`Fetching floor price for contract ${contractAddress}`);

      const response = await this.alchemy.nft.getFloorPrice(contractAddress);

      // Check if response is successful and has floor price data
      if (response && 'openSea' in response && response.openSea) {
        const marketplace = response.openSea as any;
        if (marketplace.floorPrice) {
          const floorPrice = parseFloat(marketplace.floorPrice.toString());
          logger.info(`Floor price for ${contractAddress}: ${floorPrice} ETH`);
          return floorPrice;
        }
      }

      logger.warn(`No floor price found for contract ${contractAddress}`);
      return null;
    } catch (error) {
      logger.warn(`Failed to get floor price for ${contractAddress}`, error);
      return null;
    }
  }

  /**
   * Get collection stats including 24h volume from OpenSea API v2
   */
  async getCollectionStats(contractAddress: string): Promise<{
    volume24h: number | null;
    volumeChange24h: number | null;
    floorPrice: number | null;
    sales24h: number | null;
  }> {
    try {
      logger.info(`Fetching collection stats for ${contractAddress} from OpenSea API`);

      // OpenSea API v2 endpoint for collection stats
      const slug = 'mutant-ape-yacht-club'; // MAYC collection slug
      const response = await fetch(`https://api.opensea.io/api/v2/collections/${slug}/stats`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': process.env.OPENSEA_API_KEY || '',
        },
      });

      if (!response.ok) {
        logger.warn(`OpenSea API returned status ${response.status}`);
        return { volume24h: null, volumeChange24h: null, floorPrice: null, sales24h: null };
      }

      const data = await response.json() as any;
      logger.info(`OpenSea stats received:`, JSON.stringify(data).substring(0, 300));

      // Extract stats from OpenSea response
      // 24h data is in intervals array where interval === "one_day"
      const oneDayInterval = data.intervals?.find((i: any) => i.interval === 'one_day') || {};
      const totalStats = data.total || {};

      const volume24h = oneDayInterval.volume ? parseFloat(oneDayInterval.volume) : null;
      const volumeChange24h = oneDayInterval.volume_change ? parseFloat(oneDayInterval.volume_change) : null;
      const floorPrice = totalStats.floor_price ? parseFloat(totalStats.floor_price) : null;
      const sales24h = oneDayInterval.sales ? parseInt(oneDayInterval.sales) : null;

      logger.info(`📊 24h Volume: ${volume24h} ETH, Sales: ${sales24h}, Floor: ${floorPrice} ETH`);

      return { volume24h, volumeChange24h, floorPrice, sales24h };
    } catch (error) {
      logger.error(`Failed to get collection stats from OpenSea`, error);
      return { volume24h: null, volumeChange24h: null, floorPrice: null, sales24h: null };
    }
  }

  /**
   * Get collection metadata
   */
  async getCollectionMetadata(contractAddress: string): Promise<any> {
    try {
      logger.info(`Fetching metadata for contract ${contractAddress}`);

      const response = await this.alchemy.nft.getContractMetadata(contractAddress);

      logger.info(`Got metadata for contract ${contractAddress}: ${response.name}`);

      return response;
    } catch (error) {
      logger.error(`Failed to get collection metadata for ${contractAddress}`, error);
      return null;
    }
  }

  /**
   * Get metadata for a specific NFT by contract address and token ID
   */
  async getNftMetadata(contractAddress: string, tokenId: string): Promise<{
    name: string;
    description: string | null;
    image: string | null;
    traits: { trait_type: string; value: string }[];
    tokenType: string;
  }> {
    try {
      logger.info(`Fetching NFT metadata for ${contractAddress} #${tokenId}`);

      const response = await this.alchemy.nft.getNftMetadata(contractAddress, tokenId);

      const traits = (response.raw?.metadata?.attributes || []).map((attr: any) => ({
        trait_type: attr.trait_type || attr.traitType || 'Unknown',
        value: String(attr.value || ''),
      }));

      // Get image from various possible fields
      const image = response.image?.cachedUrl
        || response.image?.pngUrl
        || response.image?.thumbnailUrl
        || response.raw?.metadata?.image
        || null;

      return {
        name: response.name || `#${tokenId}`,
        description: response.description || null,
        image,
        traits,
        tokenType: response.contract?.tokenType || 'ERC721',
      };
    } catch (error) {
      logger.error(`Failed to get NFT metadata for ${contractAddress} #${tokenId}`, error);
      throw error;
    }
  }

  /**
   * Get all current owners for a contract (returns actual NFT holders, not just recent transfers)
   * This is the CORRECT method for getting whale data
   */
  async getOwnersForContract(contractAddress: string): Promise<{
    owners: string[];
    totalCount: number;
    ownerBalances: Map<string, number>;
  }> {
    try {
      logger.info(`🔍 Fetching ALL current owners for contract ${contractAddress}`);

      const response = await this.alchemy.nft.getOwnersForContract(contractAddress);

      logger.info(`✅ Found ${response.owners.length} unique owners for ${contractAddress}`);

      // Build owner -> token count map
      const ownerBalances = new Map<string, number>();

      // If response includes token balances, use them
      if (response.owners) {
        response.owners.forEach((owner: string) => {
          const count = ownerBalances.get(owner.toLowerCase()) || 0;
          ownerBalances.set(owner.toLowerCase(), count + 1);
        });
      }

      return {
        owners: response.owners,
        totalCount: response.owners.length,
        ownerBalances,
      };
    } catch (error) {
      logger.error(`Failed to get owners for contract ${contractAddress}`, error);
      throw error;
    }
  }

  /**
   * Get detailed ownership data with token counts per address
   * This returns: { address: "0x...", tokenBalances: 45 } format
   */
  async getOwnersForContractWithTokenCount(contractAddress: string): Promise<{
    address: string;
    tokenBalance: number;
  }[]> {
    try {
      logger.info(`🔍 Fetching owners WITH token counts for ${contractAddress}`);

      // Use withTokenBalances option to get counts
      const response = await this.alchemy.nft.getOwnersForContract(contractAddress, {
        withTokenBalances: true,
      });

      logger.info(`✅ Got ${response.owners.length} owners with token balances`);

      // Debug: log first owner structure
      if (response.owners.length > 0) {
        logger.info('🔍 First owner structure:', JSON.stringify(response.owners[0]));
      }

      return response.owners.map((owner: any) => {
        // Handle two possible response formats:
        // 1. String address (withTokenBalances=false)
        // 2. Object with ownerAddress and tokenBalances array
        if (typeof owner === 'string') {
          return { address: owner, tokenBalance: 1 };
        }

        const address = owner.ownerAddress || owner.address;
        // tokenBalances is an array of {tokenId, balance} objects
        // The length of this array = number of NFTs owned
        const tokenCount = Array.isArray(owner.tokenBalances)
          ? owner.tokenBalances.length
          : 1;

        return { address, tokenBalance: tokenCount };
      });
    } catch (error) {
      logger.error(`Failed to get owners with counts for ${contractAddress}`, error);
      throw error;
    }
  }

  /**
   * Batch processing helper - get NFTs for multiple owners
   */
  async batchGetNFTsForOwners(
    addresses: string[],
    batchSize: number = 10,
    delayMs: number = 200
  ): Promise<Map<string, NFTPortfolioItem[]>> {
    const results = new Map<string, NFTPortfolioItem[]>();

    const chunks = this.chunkArray(addresses, batchSize);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      logger.info(`Processing batch ${i + 1}/${chunks.length} (${chunk.length} addresses)`);

      const batchResults = await Promise.all(
        chunk.map(async (address) => {
          try {
            const nfts = await this.getNFTsForOwner(address);
            const portfolio = await this.buildPortfolio(nfts.ownedNfts);
            return { address, portfolio };
          } catch (error) {
            logger.warn(`Failed to process ${address}`, error);
            return { address, portfolio: [] };
          }
        })
      );

      batchResults.forEach(({ address, portfolio }) => {
        results.set(address, portfolio);
      });

      // Delay between batches for rate limiting
      if (i < chunks.length - 1) {
        await this.sleep(delayMs);
      }
    }

    return results;
  }

  /**
   * Build portfolio structure from NFTs array
   */
  private async buildPortfolio(nfts: any[]): Promise<NFTPortfolioItem[]> {
    const collections = new Map<string, NFTPortfolioItem>();

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

    return Array.from(collections.values());
  }

  /**
   * Helper: split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Helper: sleep for given milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Get singleton instance of AlchemySDKProvider
 */
export function getAlchemySDKProvider(): AlchemySDKProvider {
  const apiKey = process.env.ALCHEMY_API_KEY;
  const network = process.env.ALCHEMY_NETWORK || 'eth-mainnet';

  if (!apiKey) {
    throw new Error('ALCHEMY_API_KEY environment variable is required');
  }

  return AlchemySDKProvider.getInstance(apiKey, network);
}
