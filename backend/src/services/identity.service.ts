// Identity Resolution Service
// Resolves blockchain addresses to real identities (ENS, Twitter, avatars, labels)

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import type {
  WalletIdentity,
  WalletLabel,
  IdentitySource,
  LocalWalletEntry,
  Web3BioProfile,
  IdentityResolverOptions,
} from '../types/identity.types';

class IdentityService {
  private cache: Map<string, WalletIdentity> = new Map();
  private localDB: Map<string, LocalWalletEntry> = new Map();
  private provider: ethers.AlchemyProvider;

  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly ENS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly WEB3BIO_BASE_URL = 'https://api.web3.bio/profile';
  private readonly MAX_CONCURRENT_RESOLVES = 10;

  constructor() {
    // Initialize Ethereum provider (Alchemy)
    const alchemyKey = process.env.ALCHEMY_API_KEY;
    if (!alchemyKey) {
      throw new Error('ALCHEMY_API_KEY not found in environment');
    }

    this.provider = new ethers.AlchemyProvider('mainnet', alchemyKey);

    // Load local curated database
    this.loadLocalDB();

    logger.info('IdentityService initialized');
  }

  /**
   * Load known wallets from local JSON database
   */
  private loadLocalDB(): void {
    try {
      const dbPath = path.join(__dirname, '..', '..', 'data', 'known-wallets.json');
      const data = fs.readFileSync(dbPath, 'utf-8');
      const entries: Record<string, LocalWalletEntry> = JSON.parse(data);

      for (const [address, entry] of Object.entries(entries)) {
        this.localDB.set(address.toLowerCase(), entry);
      }

      logger.info(`Loaded ${this.localDB.size} known wallets from local DB`);
    } catch (error) {
      logger.warn('Failed to load local DB, continuing without it', error);
    }
  }

  /**
   * Main entry point - Resolve identity for a single address
   */
  async resolve(
    address: string,
    options: IdentityResolverOptions = {}
  ): Promise<WalletIdentity> {
    const normalizedAddress = address.toLowerCase();

    // Check cache first (unless force refresh)
    if (!options.forceRefresh && this.cache.has(normalizedAddress)) {
      const cached = this.cache.get(normalizedAddress)!;
      const now = new Date().toISOString();

      // Return cached if not expired
      if (cached.expiresAt > now) {
        logger.debug(`Cache hit for ${address}`);
        return cached;
      }
    }

    // Resolve from providers
    logger.info(`Resolving identity for ${address}`);

    const results: Partial<WalletIdentity>[] = [];

    // Provider 1: Local DB (instant)
    const localResult = await this.resolveLocalDB(normalizedAddress);
    if (localResult.sources && localResult.sources.length > 0) {
      results.push(localResult);
    }

    // Provider 2: ENS (fast, ~200ms)
    const ensResult = await this.resolveENS(normalizedAddress);
    if (ensResult.sources && ensResult.sources.length > 0) {
      results.push(ensResult);
    }

    // Provider 3: Web3.bio (slower, ~500ms) - skip if quick mode
    if (!options.quick) {
      const web3bioResult = await this.resolveWeb3Bio(normalizedAddress);
      if (web3bioResult.sources && web3bioResult.sources.length > 0) {
        results.push(web3bioResult);
      }
    }

    // Merge all results
    const identity = this.merge(results, normalizedAddress);

    // Cache the result
    this.cache.set(normalizedAddress, identity);

    return identity;
  }

  /**
   * Batch resolve multiple addresses (parallel with concurrency limit)
   */
  async resolveBatch(
    addresses: string[],
    options: IdentityResolverOptions = {}
  ): Promise<Map<string, WalletIdentity>> {
    const results = new Map<string, WalletIdentity>();

    // Process in chunks to limit concurrency
    for (let i = 0; i < addresses.length; i += this.MAX_CONCURRENT_RESOLVES) {
      const chunk = addresses.slice(i, i + this.MAX_CONCURRENT_RESOLVES);

      const chunkResults = await Promise.allSettled(
        chunk.map((addr) => this.resolve(addr, options))
      );

      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.set(chunk[index].toLowerCase(), result.value);
        } else {
          logger.error(`Failed to resolve ${chunk[index]}:`, result.reason);
        }
      });
    }

    return results;
  }

  /**
   * Provider 1: Local Curated Database
   */
  private async resolveLocalDB(address: string): Promise<Partial<WalletIdentity>> {
    const entry = this.localDB.get(address);

    if (!entry) {
      return { sources: [] };
    }

    return {
      displayName: entry.displayName,
      twitter: entry.twitter || null,
      labels: entry.labels,
      sources: ['local_db'],
    };
  }

  /**
   * Provider 2: ENS (Ethereum Name Service)
   */
  private async resolveENS(address: string): Promise<Partial<WalletIdentity>> {
    try {
      // Step 1: Reverse lookup (address -> ENS name)
      const ensName = await this.provider.lookupAddress(address);

      if (!ensName) {
        return { sources: [] };
      }

      // Step 2: Get resolver for text records
      const resolver = await this.provider.getResolver(ensName);

      if (!resolver) {
        return {
          ensName,
          displayName: ensName,
          sources: ['ens'],
        };
      }

      // Step 3: Fetch text records in parallel
      const [twitter, avatar, url, description, email] = await Promise.allSettled([
        resolver.getText('com.twitter'),
        resolver.getText('avatar'),
        resolver.getText('url'),
        resolver.getText('description'),
        resolver.getText('email'),
      ]);

      return {
        ensName,
        ensAvatar: avatar.status === 'fulfilled' ? avatar.value || null : null,
        twitter:
          twitter.status === 'fulfilled'
            ? (twitter.value?.replace('@', '') || null)
            : null,
        website: url.status === 'fulfilled' ? url.value || null : null,
        email: email.status === 'fulfilled' ? email.value || null : null,
        displayName: ensName,
        sources: ['ens'],
      };
    } catch (error) {
      logger.debug(`ENS resolution failed for ${address}:`, error);
      return { sources: [] };
    }
  }

  /**
   * Provider 3: Web3.bio API
   */
  private async resolveWeb3Bio(address: string): Promise<Partial<WalletIdentity>> {
    try {
      const response = await axios.get<Web3BioProfile[]>(
        `${this.WEB3BIO_BASE_URL}/${address}`,
        { timeout: 5000 }
      );

      if (!response.data || response.data.length === 0) {
        return { sources: [] };
      }

      const result: Partial<WalletIdentity> = { sources: ['web3bio'] };

      for (const profile of response.data) {
        // ENS profile
        if (profile.platform === 'ens') {
          result.ensName = result.ensName || profile.identity;
          result.ensAvatar = result.ensAvatar || profile.avatar || null;
          result.displayName = result.displayName || profile.displayName || profile.identity;
        }

        // Lens profile
        if (profile.platform === 'lens') {
          result.lens = profile.identity;
        }

        // Farcaster profile
        if (profile.platform === 'farcaster') {
          result.farcaster = profile.identity;
        }

        // Extract Twitter from links
        if (profile.links) {
          const twitterLink = profile.links.find((l) => l.platform === 'twitter');
          if (twitterLink) {
            result.twitter = twitterLink.handle.replace('@', '');
          }
        }
      }

      return result;
    } catch (error) {
      logger.debug(`Web3.bio resolution failed for ${address}:`, error);
      return { sources: [] };
    }
  }

  /**
   * Merge results from multiple providers
   * Priority: Local DB > ENS > Web3.bio
   */
  private merge(
    results: Partial<WalletIdentity>[],
    address: string
  ): WalletIdentity {
    const merged: WalletIdentity = {
      address,
      ensName: null,
      ensAvatar: null,
      twitter: null,
      farcaster: null,
      lens: null,
      website: null,
      email: null,
      labels: [],
      displayName: null,
      identityScore: 0,
      sources: [],
      resolvedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.CACHE_TTL).toISOString(),
    };

    const allSources: IdentitySource[] = [];
    const allLabels: WalletLabel[] = [];

    for (const result of results) {
      // Collect sources
      if (result.sources) {
        allSources.push(...result.sources);
      }

      // Merge fields (first non-null wins)
      if (result.ensName && !merged.ensName) merged.ensName = result.ensName;
      if (result.ensAvatar && !merged.ensAvatar) merged.ensAvatar = result.ensAvatar;
      if (result.twitter && !merged.twitter) merged.twitter = result.twitter;
      if (result.farcaster && !merged.farcaster) merged.farcaster = result.farcaster;
      if (result.lens && !merged.lens) merged.lens = result.lens;
      if (result.website && !merged.website) merged.website = result.website;
      if (result.email && !merged.email) merged.email = result.email;
      if (result.displayName && !merged.displayName) {
        merged.displayName = result.displayName;
      }

      // Collect labels
      if (result.labels) {
        allLabels.push(...result.labels);
      }
    }

    merged.sources = Array.from(new Set(allSources));
    merged.labels = Array.from(new Set(allLabels));

    // Calculate identity score
    merged.identityScore = this.calculateScore(merged);

    // Best display name
    merged.displayName =
      merged.displayName ||
      merged.ensName ||
      merged.twitter ||
      `${address.slice(0, 6)}...${address.slice(-4)}`;

    return merged;
  }

  /**
   * Calculate identity confidence score (0-100)
   */
  private calculateScore(identity: WalletIdentity): number {
    let score = 0;

    // Base score from sources
    if (identity.sources.includes('local_db')) score += 40;
    if (identity.sources.includes('ens')) score += 30;
    if (identity.sources.includes('web3bio')) score += 15;

    // Bonus for data completeness
    if (identity.ensName) score += 10;
    if (identity.twitter) score += 10;
    if (identity.ensAvatar) score += 5;
    if (identity.farcaster || identity.lens) score += 5;
    if (identity.website) score += 3;
    if (identity.labels.length > 0) score += 7;

    return Math.min(100, score);
  }

  /**
   * Search wallets by name/twitter
   */
  async search(query: string): Promise<WalletIdentity[]> {
    const results: WalletIdentity[] = [];
    const queryLower = query.toLowerCase();

    // Search in cache
    for (const identity of this.cache.values()) {
      if (
        identity.ensName?.toLowerCase().includes(queryLower) ||
        identity.twitter?.toLowerCase().includes(queryLower) ||
        identity.displayName?.toLowerCase().includes(queryLower)
      ) {
        results.push(identity);
      }
    }

    // Search in local DB
    for (const [address, entry] of this.localDB.entries()) {
      if (
        entry.displayName.toLowerCase().includes(queryLower) ||
        entry.twitter?.toLowerCase().includes(queryLower)
      ) {
        // Check if already in results
        if (!results.some((r) => r.address === address)) {
          const identity = await this.resolve(address);
          results.push(identity);
        }
      }
    }

    return results;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Identity cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; knownWallets: number } {
    return {
      size: this.cache.size,
      knownWallets: this.localDB.size,
    };
  }
}

// Singleton instance
let identityService: IdentityService | null = null;

export function getIdentityService(): IdentityService {
  if (!identityService) {
    identityService = new IdentityService();
  }
  return identityService;
}

export default IdentityService;
