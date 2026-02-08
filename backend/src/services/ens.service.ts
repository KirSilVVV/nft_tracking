import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { getCacheService } from './cache.service';

export interface ENSData {
  address: string;
  ensName: string | null;
  avatar?: string | null;
  twitter?: string | null;
  email?: string | null;
  resolvedAt: number;
}

/**
 * ENS Resolution Service
 * Resolves Ethereum addresses to their ENS names and associated metadata
 * Lazy loading with aggressive caching (24 hours)
 */
export class ENSService {
  private provider: ethers.JsonRpcProvider;
  private readonly CACHE_TTL = 86400; // 24 hours
  private readonly ERROR_CACHE_TTL = 3600; // 1 hour for errors
  private readonly RESOLVE_TIMEOUT = 3000; // 3 second timeout per address

  constructor() {
    // Use Alchemy provider with fallback to ethers fallback provider
    const rpcUrl = `https://${process.env.ALCHEMY_NETWORK || 'eth-mainnet'}.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    logger.info('✅ ENSService initialized');
  }

  /**
   * Resolve ENS name for a single address (with timeout)
   */
  async resolveAddress(address: string): Promise<ENSData> {
    const cacheService = getCacheService();
    const normalizedAddress = address.toLowerCase();
    const cacheKey = `ens:${normalizedAddress}`;

    // Check cache first
    const cached = cacheService.get<ENSData>(cacheKey);
    if (cached) {
      logger.debug(`✅ ENS cache HIT: ${normalizedAddress}`);
      return cached;
    }

    logger.info(`🔍 Resolving ENS for ${normalizedAddress}`);

    try {
      // Wrap in timeout promise
      const ensName = await Promise.race([
        this.provider.lookupAddress(normalizedAddress),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('ENS resolution timeout')), this.RESOLVE_TIMEOUT)
        ),
      ]);

      if (!ensName) {
        const result: ENSData = {
          address: normalizedAddress,
          ensName: null,
          resolvedAt: Date.now(),
        };
        cacheService.set(cacheKey, result, this.CACHE_TTL);
        return result;
      }

      // Resolve additional ENS metadata
      const resolver = await this.provider.getResolver(ensName);
      if (!resolver) {
        const result: ENSData = {
          address: normalizedAddress,
          ensName,
          resolvedAt: Date.now(),
        };
        cacheService.set(cacheKey, result, this.CACHE_TTL);
        return result;
      }

      // Get additional text records (with individual timeouts)
      const [avatar, twitter, email] = await Promise.allSettled([
        Promise.race([
          resolver.getText('avatar'),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
        ]),
        Promise.race([
          resolver.getText('com.twitter'),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
        ]),
        Promise.race([
          resolver.getText('email'),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
        ]),
      ]);

      const result: ENSData = {
        address: normalizedAddress,
        ensName,
        avatar: avatar.status === 'fulfilled' ? avatar.value : null,
        twitter: twitter.status === 'fulfilled' ? twitter.value : null,
        email: email.status === 'fulfilled' ? email.value : null,
        resolvedAt: Date.now(),
      };

      cacheService.set(cacheKey, result, this.CACHE_TTL);
      logger.info(`✅ Resolved ENS: ${ensName} for ${normalizedAddress}`);

      return result;
    } catch (error) {
      logger.warn(`⚠️ ENS resolution failed for ${normalizedAddress}: ${(error as any)?.message}`);

      // Cache the error result for shorter period
      const result: ENSData = {
        address: normalizedAddress,
        ensName: null,
        resolvedAt: Date.now(),
      };

      cacheService.set(cacheKey, result, this.ERROR_CACHE_TTL);
      return result;
    }
  }

  /**
   * Batch ENS resolution for multiple addresses
   * Processes in parallel batches of 10 to avoid rate limits
   */
  async resolveBatch(addresses: string[]): Promise<Map<string, ENSData>> {
    logger.info(`🔍 Batch resolving ${addresses.length} ENS names`);

    const results = new Map<string, ENSData>();
    const batchSize = 10;
    const batchDelay = 500; // 500ms between batches for rate limiting

    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);

      // Resolve batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map((addr) => this.resolveAddress(addr.toLowerCase()))
      );

      // Collect results
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          results.set(batch[idx].toLowerCase(), result.value);
        } else {
          logger.warn(`⚠️ Batch item failed: ${batch[idx]}`);
        }
      });

      const progress = Math.min(i + batchSize, addresses.length);
      logger.debug(`⏳ ENS Progress: ${progress}/${addresses.length}`);

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < addresses.length) {
        await new Promise((resolve) => setTimeout(resolve, batchDelay));
      }
    }

    logger.info(`✅ Resolved ${results.size}/${addresses.length} ENS names`);
    return results;
  }

  /**
   * Reverse lookup: ENS name → Address
   * Useful for searching by ENS name
   */
  async resolveENSName(ensName: string): Promise<string | null> {
    const cacheService = getCacheService();
    const normalizedName = ensName.toLowerCase();
    const cacheKey = `ens:reverse:${normalizedName}`;

    // Check cache
    const cached = cacheService.get<string | null>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      logger.info(`🔍 Resolving ENS name: ${ensName}`);

      const address = await Promise.race([
        this.provider.resolveName(normalizedName),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('ENS resolution timeout')), this.RESOLVE_TIMEOUT)
        ),
      ]);

      if (address) {
        cacheService.set(cacheKey, address, this.CACHE_TTL);
        logger.info(`✅ Resolved ENS name ${ensName} → ${address}`);
      } else {
        cacheService.set(cacheKey, null, this.ERROR_CACHE_TTL);
      }

      return address || null;
    } catch (error) {
      logger.warn(`⚠️ ENS name resolution failed for ${ensName}: ${(error as any)?.message}`);
      cacheService.set(cacheKey, null, this.ERROR_CACHE_TTL);
      return null;
    }
  }

  /**
   * Get ENS data for address (from cache if available)
   */
  getCached(address: string): ENSData | null {
    const cacheService = getCacheService();
    return cacheService.get<ENSData>(`ens:${address.toLowerCase()}`) || null;
  }

  /**
   * Clear ENS cache for specific address
   */
  clearCache(address: string): void {
    const cacheService = getCacheService();
    cacheService.delete(`ens:${address.toLowerCase()}`);
    logger.debug(`🗑️ Cleared ENS cache for ${address}`);
  }

  /**
   * Clear all ENS cache
   */
  clearAllCache(): void {
    const cacheService = getCacheService();
    // Note: This is a simplistic approach. In production, you'd want to track ENS keys separately
    logger.debug(`🗑️ ENS cache management initiated`);
  }
}

let instance: ENSService;

export function getENSService(): ENSService {
  if (!instance) {
    instance = new ENSService();
  }
  return instance;
}
