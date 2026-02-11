import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import http from 'http';
import multer from 'multer';
import routes from './api/routes';
import { WebSocketManager } from './api/websocket';
import { getBlockchainService } from './services/blockchain.service';
import { getAnalyticsService } from './services/analytics.service';
import { getCacheService } from './services/cache.service';
import { getEnrichmentService } from './services/enrichment.service';
import { getENSService } from './services/ens.service';
import { getImageSearchService } from './services/image-search.service';
import { getAlchemySDKProvider } from './providers/alchemy-sdk.provider';
import { logger } from './utils/logger';
import { sleep } from './utils/helpers';
import * as authController from './controllers/auth.controller';
import * as identityController from './controllers/identity.controller';

class App {
  private express: Express;
  private httpServer: http.Server;
  private wsManager: WebSocketManager | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.express = express();
    this.httpServer = http.createServer(this.express);
  }

  /**
   * Initialize Express middleware
   */
  private initializeMiddleware(): void {
    // CORS configuration - allow all origins for development
    this.express.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));

    // Request logging middleware
    this.express.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Health check
    this.express.get('/health', (req, res) => {
      res.json({ status: 'ok', uptime: process.uptime() });
    });

    // Whale tracker routes (direct handlers)
    const blockchainService = getBlockchainService();
    const analyticsService = getAnalyticsService();

    this.express.get('/api/whales/top', async (req, res) => {
      const limit = parseInt(req.query.limit as string) || 50;
      const skipENS = req.query.skipENS === 'true';
      const MAYC_TOTAL_SUPPLY = 19423;
      const MAYC_CONTRACT = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';

      try {
        logger.info('🔍 Fetching ALL current MAYC owners from Alchemy SDK (getOwnersForContract)...');
        const alchemyProvider = getAlchemySDKProvider();

        // ✅ ПРАВИЛЬНЫЙ метод: получаем ВСЕХ текущих владельцев NFT
        const ownersData = await alchemyProvider.getOwnersForContractWithTokenCount(MAYC_CONTRACT);

        if (ownersData.length === 0) {
          return res.status(503).json({
            error: 'No owners data available',
            message: 'Unable to fetch current NFT holders. Please try again.',
          });
        }

        logger.info(`✅ Got ${ownersData.length} current MAYC holders from blockchain`);

        // Конвертируем в формат Holder для совместимости с existing code
        const allHolders = ownersData.map(owner => ({
          address: owner.address,
          count: owner.tokenBalance,
          tokenIds: [], // Token IDs не нужны для топ списка (можно получить отдельным запросом)
          firstSeen: new Date(), // Не доступно из getOwnersForContract
          lastActivity: new Date(), // Не доступно из getOwnersForContract
          ensName: null, // ENS будет резолвиться позже в batch ENS enrichment
        }));

        logger.info(`📊 Built ${allHolders.length} holders list from current owners`);

        const topWhales = allHolders.sort((a, b) => b.count - a.count).slice(0, limit);
        const totalUniqueHolders = allHolders.length; // Все адреса уникальны из getOwnersForContract

        // Get floor price from Alchemy/OpenSea API (cached 30min)
        let floorPrice: number | null = null;
        try {
          const alchemyProvider = getAlchemySDKProvider();
          floorPrice = await alchemyProvider.getFloorPrice(MAYC_CONTRACT);
          logger.info(`Floor price from Alchemy/OpenSea API: ${floorPrice} ETH`);
        } catch (floorError) {
          logger.warn(`Failed to get floor price: ${(floorError as any)?.message}`);
          floorPrice = 0.025; // Fallback floor price
        }

        // Batch ENS enrichment
        let ensDataMap = new Map<string, any>();
        if (!skipENS) {
          try {
            logger.info(`Batch resolving ENS names for ${topWhales.length} whales...`);
            const ensService = getENSService();
            ensDataMap = await ensService.resolveBatch(topWhales.map(w => w.address));
            logger.info(`Resolved ${ensDataMap.size} ENS names`);
          } catch (ensError) {
            logger.warn(`ENS enrichment failed, continuing without ENS data: ${(ensError as any)?.message}`);
          }
        }

        // Batch ETH balance fetching (cached 30min per address)
        const ethBalanceMap = new Map<string, string>();
        try {
          const enrichmentService = getEnrichmentService();
          logger.info(`Fetching ETH balances for ${topWhales.length} whales...`);
          const batchSize = 10;
          for (let i = 0; i < topWhales.length; i += batchSize) {
            const batch = topWhales.slice(i, i + batchSize);
            const results = await Promise.allSettled(
              batch.map(w => enrichmentService.getETHBalance(w.address))
            );
            results.forEach((result, j) => {
              if (result.status === 'fulfilled') {
                ethBalanceMap.set(batch[j].address.toLowerCase(), result.value);
              }
            });
            if (i + batchSize < topWhales.length) await sleep(100);
          }
          logger.info(`Fetched ${ethBalanceMap.size} ETH balances`);
        } catch (balanceError) {
          logger.warn(`ETH balance fetch failed, continuing without: ${(balanceError as any)?.message}`);
        }

        return res.json({
          whales: topWhales.map((w, idx) => {
            const ensData = ensDataMap.get(w.address.toLowerCase());
            const ethBal = ethBalanceMap.get(w.address.toLowerCase());
            return {
              rank: idx + 1,
              address: w.address,
              ensName: ensData?.ensName || w.ensName || null,
              ensAvatar: ensData?.avatar || null,
              twitter: ensData?.twitter || null,
              email: ensData?.email || null,
              nftCount: w.count,
              nftIds: w.tokenIds || [],
              percentageOfCollection: parseFloat(((w.count / MAYC_TOTAL_SUPPLY) * 100).toFixed(2)),
              floorPrice,
              estimatedValueETH: floorPrice ? parseFloat((w.count * floorPrice).toFixed(2)) : null,
              ethBalance: ethBal ? parseFloat(parseFloat(ethBal).toFixed(4)) : null,
              firstSeen: w.firstSeen?.toISOString() || new Date(2021, 0, 1).toISOString(),
              lastActivity: w.lastActivity?.toISOString() || new Date().toISOString(),
            };
          }),
          totalCount: topWhales.length,
          totalUniqueHolders,
          floorPrice,
          ensResolved: ensDataMap.size,
          cachedAt: false,
          lastUpdated: new Date(),
          _source: 'alchemy_owners_api_real_data', // ✅ Используем getOwnersForContract (РЕАЛЬНЫЕ текущие владельцы)
        });
      } catch (error) {
        logger.error('Blockchain API error in /api/whales/top', error);
        res.status(500).json({
          error: 'Failed to fetch whale data',
          details: (error as any)?.message,
        });
      }
    });

    this.express.get('/api/whales/search', async (req, res) => {
      try {
        const address = (req.query.address as string) || '';
        if (!address.match(/^0x[a-fA-F0-9]{40}$/i)) {
          return res.status(400).json({ error: 'Invalid Ethereum address' });
        }

        const MAYC_TOTAL_SUPPLY = 19423;
        const MAYC_CONTRACT = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';
        const events = await blockchainService.getAllTransferEvents(0);
        const allHolders = analyticsService.buildHoldersList(events);
        const whale = allHolders.find(h => h.address.toLowerCase() === address.toLowerCase());

        if (!whale) {
          return res.status(404).json({ error: 'Address not found' });
        }

        // Get floor price from Alchemy/OpenSea API
        let floorPrice: number | null = null;
        try {
          const alchemyProvider = getAlchemySDKProvider();
          floorPrice = await alchemyProvider.getFloorPrice(MAYC_CONTRACT);
        } catch (error) {
          logger.warn('Failed to get floor price', error);
          floorPrice = 0.025;
        }

        const rank = allHolders.sort((a, b) => b.count - a.count).findIndex(h => h.address.toLowerCase() === address.toLowerCase()) + 1;

        res.json({
          address: whale.address,
          ensName: whale.ensName || null,
          rank,
          nftCount: whale.count,
          nftIds: whale.tokenIds || [],
          percentageOfCollection: ((whale.count / MAYC_TOTAL_SUPPLY) * 100).toFixed(2),
          floorPrice,
          estimatedValueETH: floorPrice ? (whale.count * floorPrice).toFixed(2) : null,
          lastUpdated: new Date(),
        });
      } catch (error) {
        logger.error('Error searching whale', error);
        res.status(500).json({ error: 'Failed to search whale' });
      }
    });

    this.express.get('/api/whales/analytics', async (req, res) => {
      try {
        const MAYC_CONTRACT = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';
        logger.info('🔍 Fetching ALL current MAYC owners for analytics...');
        const alchemyProvider = getAlchemySDKProvider();

        // ✅ Use getOwnersForContract to get ALL current holders
        const ownersData = await alchemyProvider.getOwnersForContractWithTokenCount(MAYC_CONTRACT);

        // Convert to Holder format for analytics
        const allHolders = ownersData.map(owner => ({
          address: owner.address,
          count: owner.tokenBalance,
          tokenIds: [],
          firstSeen: new Date(),
          lastActivity: new Date(),
        }));

        const distribution = {
          single: allHolders.filter(h => h.count === 1).length,
          small: allHolders.filter(h => h.count >= 2 && h.count <= 5).length,
          medium: allHolders.filter(h => h.count >= 6 && h.count <= 10).length,
          large: allHolders.filter(h => h.count >= 11 && h.count <= 19).length,
          whales: allHolders.filter(h => h.count >= 20).length,  // ✅ FIXED: Whales = 20+ NFTs (real data)
        };

        const topWhales = allHolders.sort((a, b) => b.count - a.count).slice(0, 10);

        // Calculate statistics
        const totalNFTs = allHolders.reduce((sum, h) => sum + h.count, 0);
        const averagePerHolder = totalNFTs / allHolders.length;
        const sortedCounts = allHolders.map(h => h.count).sort((a, b) => a - b);
        const medianPerHolder = sortedCounts[Math.floor(sortedCounts.length / 2)];

        // Get collection stats from OpenSea (floor price + 24h volume)
        let floorPrice = 0;
        let volume24h = 0;
        let sales24h = 0;
        try {
          const alchemyProvider = getAlchemySDKProvider();
          const stats = await alchemyProvider.getCollectionStats('0x60E4d786628Fea6478F785A6d7e704777c86a7c6');
          floorPrice = stats.floorPrice || 0;
          volume24h = stats.volume24h || 0;
          sales24h = stats.sales24h || 0;
          logger.info(`✅ OpenSea stats - Floor: ${floorPrice} ETH, 24h Vol: ${volume24h} ETH, Sales: ${sales24h}`);
        } catch (error) {
          logger.warn('Failed to get OpenSea stats in analytics', error);
        }

        const totalMarketCap = (floorPrice || 0) * 19423; // MAYC total supply
        const whale90Concentration = (topWhales.slice(0, Math.min(10, topWhales.length)).reduce((sum, h) => sum + h.count, 0) / totalNFTs) * 100;

        res.json({
          topWhales: [],
          distribution,
          statistics: {
            totalHolders: allHolders.length,
            totalNFTs,
            averagePerHolder: parseFloat(averagePerHolder.toFixed(2)),
            medianPerHolder,
          },
          totalHolders: allHolders.length,
          floorPrice,
          totalMarketCap: parseFloat(totalMarketCap.toFixed(2)),
          whale90Concentration: parseFloat(whale90Concentration.toFixed(2)),
          volume24h, // ✅ Real 24h volume from OpenSea
          sales24h,  // ✅ Real 24h sales count from OpenSea
          lastUpdated: new Date(),
        });
      } catch (error) {
        logger.error('Error fetching analytics', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
      }
    });

    this.express.get('/api/whales/stats', async (req, res) => {
      try {
        logger.info('Fetching stats from blockchain...');
        const MAYC_CONTRACT = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';

        // ✅ Use getOwnersForContract to get ALL current holders
        const alchemyProvider = getAlchemySDKProvider();
        const ownersData = await alchemyProvider.getOwnersForContractWithTokenCount(MAYC_CONTRACT);

        const allHolders = ownersData.map(owner => ({
          address: owner.address,
          count: owner.tokenBalance,
        }));

        // Get collection stats from OpenSea (floor price + 24h volume)
        let floorPrice: number | null = null;
        let totalVolume: number | null = null;
        try {
          const stats = await alchemyProvider.getCollectionStats(MAYC_CONTRACT);
          floorPrice = stats.floorPrice;
          totalVolume = stats.volume24h; // ✅ Real 24h volume from OpenSea
          logger.info(`📊 Stats endpoint - Floor: ${floorPrice} ETH, 24h Vol: ${totalVolume} ETH`);
        } catch (error) {
          logger.warn('Failed to get OpenSea stats', error);
          floorPrice = 0.025;
        }

        res.json({
          totalHolders: allHolders.length,
          floorPrice,
          totalVolume, // ✅ Now returns real 24h volume from OpenSea
          lastUpdated: new Date(),
          cachedAt: false,
        });
      } catch (error) {
        logger.error('Error fetching stats', error);
        res.status(500).json({
          error: 'Failed to fetch stats',
          details: (error as any)?.message,
        });
      }
    });

    // ===== WHALE ACTIVITY HISTORY =====
    this.express.get('/api/whales/:address/activity', async (req, res) => {
      try {
        const { address } = req.params;
        if (!address.match(/^0x[a-fA-F0-9]{40}$/i)) {
          return res.status(400).json({ error: 'Invalid Ethereum address' });
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const addrLower = address.toLowerCase();
        const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

        const events = await blockchainService.getAllTransferEvents(0);
        const allHolders = analyticsService.buildHoldersList(events);
        const holder = allHolders.find(h => h.address.toLowerCase() === addrLower);

        // Filter events for this address (both as sender and receiver)
        const addressEvents = events.filter((e: any) =>
          e.from.toLowerCase() === addrLower || e.to.toLowerCase() === addrLower
        );

        // Classify and format
        const allActivity = addressEvents
          .map((e: any) => {
            let action: 'buy' | 'sell' | 'mint' | 'transfer_in' | 'transfer_out';
            let counterparty: string;

            if (e.from.toLowerCase() === ZERO_ADDRESS && e.to.toLowerCase() === addrLower) {
              action = 'mint';
              counterparty = ZERO_ADDRESS;
            } else if (e.to.toLowerCase() === addrLower) {
              action = e.priceETH ? 'buy' : 'transfer_in';
              counterparty = e.from;
            } else {
              action = e.priceETH ? 'sell' : 'transfer_out';
              counterparty = e.to;
            }

            return {
              timestamp: typeof e.timestamp === 'number'
                ? new Date(e.timestamp * 1000).toISOString()
                : new Date(e.timestamp).toISOString(),
              action,
              tokenId: e.tokenId,
              counterparty,
              priceETH: e.priceETH || null,
              txHash: e.transactionHash || e.txHash || null,
            };
          })
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Summary stats
        const buys = allActivity.filter((a: any) => a.action === 'buy' || a.action === 'transfer_in').length;
        const sells = allActivity.filter((a: any) => a.action === 'sell' || a.action === 'transfer_out').length;
        const mints = allActivity.filter((a: any) => a.action === 'mint').length;
        const volumeETH = allActivity
          .filter((a: any) => a.priceETH)
          .reduce((sum: number, a: any) => sum + a.priceETH, 0);

        // Rank
        const sorted = allHolders.sort((a, b) => b.count - a.count);
        const rank = sorted.findIndex(h => h.address.toLowerCase() === addrLower) + 1;

        // Paginate
        const paginated = allActivity.slice(offset, offset + limit);

        res.json({
          address,
          ensName: holder?.ensName || null,
          currentHoldings: holder?.count || 0,
          rank: rank > 0 ? rank : null,
          activity: paginated,
          summary: {
            buys,
            sells,
            mints,
            totalEvents: allActivity.length,
            volumeETH: parseFloat(volumeETH.toFixed(4)),
          },
          pagination: {
            offset,
            limit,
            total: allActivity.length,
          },
          _source: 'real_blockchain_data',
          lastUpdated: new Date(),
        });
      } catch (error) {
        logger.error('Error fetching whale activity', error);
        res.status(500).json({ error: 'Failed to fetch whale activity' });
      }
    });

    // ===== NFT METADATA ENDPOINT (MUTANT FINDER) =====
    this.express.get('/api/nft/:tokenId', async (req, res) => {
      try {
        const tokenId = req.params.tokenId;
        const tokenIdNum = parseInt(tokenId);

        if (isNaN(tokenIdNum) || tokenIdNum < 0 || tokenIdNum > 29999) {
          return res.status(400).json({ error: 'Invalid token ID. Must be 0-29999.' });
        }

        logger.info(`GET /api/nft/${tokenId}`);

        const MAYC_CONTRACT = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';

        // Check cache first
        const cached = getCacheService().getNftMetadata(tokenId);
        if (cached) {
          logger.info(`Cache hit for NFT #${tokenId}`);
          return res.json(cached);
        }

        // Fetch metadata from Alchemy SDK
        const { getAlchemySDKProvider } = await import('./providers/alchemy-sdk.provider');
        const alchemySDK = getAlchemySDKProvider();
        const metadata = await alchemySDK.getNftMetadata(MAYC_CONTRACT, tokenId);

        // Get transfer history for this tokenId from cached events
        const events = await blockchainService.getAllTransferEvents(0);
        const tokenEvents = events.filter((e: any) => String(e.tokenId) === tokenId);
        const history = tokenEvents
          .sort((a: any, b: any) => {
            const timeA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime() / 1000;
            const timeB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime() / 1000;
            return timeB - timeA;
          })
          .map((e: any) => ({
            timestamp: typeof e.timestamp === 'number' ? new Date(e.timestamp * 1000).toISOString() : e.timestamp,
            from: e.from,
            to: e.to,
            priceETH: e.priceETH || null,
            txHash: e.txHash || '',
          }));

        // Determine current owner from most recent transfer
        const latestTransfer = history[0];
        const owner = latestTransfer?.to || null;

        // Resolve owner ENS
        let ownerENS: string | null = null;
        if (owner) {
          try {
            const ensData = await getENSService().resolveAddress(owner);
            ownerENS = ensData?.ensName || null;
          } catch { /* ignore ENS errors */ }
        }

        // Get last sale price
        const salesWithPrice = history.filter((h: any) => h.priceETH && h.priceETH > 0);
        const lastSalePrice = salesWithPrice.length > 0 ? salesWithPrice[0].priceETH : null;

        // Get floor price from recent sales
        const allSales = events.filter((e: any) => e.priceETH && e.priceETH > 0);
        const floorPrice = allSales.length > 0
          ? parseFloat(Math.min(...allSales.map((e: any) => e.priceETH)).toFixed(4))
          : null;

        const result = {
          tokenId: tokenIdNum,
          contractAddress: MAYC_CONTRACT,
          name: metadata.name.toLowerCase().includes('mutant') ? metadata.name : `Mutant Ape Yacht Club ${metadata.name.startsWith('#') ? metadata.name : '#' + tokenId}`,
          description: metadata.description,
          image: metadata.image,
          owner,
          ownerENS,
          traits: metadata.traits,
          history: history.slice(0, 50),
          lastSalePrice,
          floorPrice,
        };

        // Cache the result
        getCacheService().setNftMetadata(tokenId, result);

        res.json(result);
      } catch (error) {
        logger.error(`Error fetching NFT metadata for #${req.params.tokenId}`, error);
        res.status(500).json({ error: 'Failed to fetch NFT metadata' });
      }
    });

    // ===== REVERSE IMAGE SEARCH ENDPOINT =====
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and AVIF are allowed.'));
        }
      },
    });

    this.express.post('/api/nft/search-by-image', upload.single('image'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No image file provided' });
        }

        const limit = parseInt(req.query.limit as string) || 10;
        const threshold = parseInt(req.query.threshold as string) || 70;

        logger.info(`Reverse image search: ${req.file.size} bytes, limit=${limit}, threshold=${threshold}%`);

        const imageSearchService = getImageSearchService();
        const results = await imageSearchService.searchByImage(req.file.buffer, limit, threshold);

        // Fetch metadata for matching NFTs
        const { getAlchemySDKProvider } = await import('./providers/alchemy-sdk.provider');
        const alchemySDK = getAlchemySDKProvider();
        const MAYC_CONTRACT = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';

        const matches = await Promise.all(
          results.map(async (result) => {
            try {
              const metadata = await alchemySDK.getNftMetadata(MAYC_CONTRACT, String(result.tokenId));
              return {
                tokenId: result.tokenId,
                name: `Mutant Ape Yacht Club #${result.tokenId}`,
                image: metadata.image,
                similarity: result.similarity,
                hammingDistance: result.hammingDistance,
              };
            } catch (error) {
              logger.warn(`Failed to fetch metadata for NFT #${result.tokenId}`, error);
              return null;
            }
          })
        );

        const validMatches = matches.filter((m) => m !== null);

        res.json({
          matches: validMatches,
          count: validMatches.length,
          threshold,
          uploadedImageSize: req.file.size,
        });
      } catch (error) {
        logger.error('Reverse image search failed', error);
        res.status(500).json({ error: 'Image search failed' });
      }
    });

    // ===== FIND OWNER BY IMAGE (Image Search + Owner Lookup) =====
    this.express.post('/api/nft/find-owner-by-image', upload.single('image'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No image file provided' });
        }

        logger.info(`Find owner by image: ${req.file.size} bytes`);

        // Step 1: Find most similar NFT (high threshold for accuracy)
        const imageSearchService = getImageSearchService();
        const results = await imageSearchService.searchByImage(req.file.buffer, 5, 85); // Top 5, 85% threshold

        if (results.length === 0) {
          return res.status(404).json({
            error: 'No matching NFT found',
            message: 'Try uploading a clearer image or lower the threshold'
          });
        }

        // Step 2: Get the best match (highest similarity)
        const bestMatch = results[0];
        const tokenId = bestMatch.tokenId;

        logger.info(`Best match: Token #${tokenId} with ${bestMatch.similarity.toFixed(2)}% similarity`);

        // Step 3: Get current owner from Alchemy API
        const alchemySDK = getAlchemySDKProvider();
        const MAYC_CONTRACT = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';

        const owners = await alchemySDK.getOwnersForNft(MAYC_CONTRACT, String(tokenId));

        if (!owners || owners.length === 0) {
          return res.status(404).json({
            error: 'No owner found',
            tokenId,
            message: 'This token may be burned or not minted yet'
          });
        }

        const owner = owners[0];

        // Step 4: Resolve ENS name for owner
        let ownerENS: string | null = null;
        try {
          const ensData = await getENSService().resolveAddress(owner);
          ownerENS = ensData?.ensName || null;
        } catch (error) {
          logger.warn(`Failed to resolve ENS for ${owner}`);
        }

        // Step 5: Get NFT metadata
        const metadata = await alchemySDK.getNftMetadata(MAYC_CONTRACT, String(tokenId));

        res.json({
          success: true,
          tokenId,
          name: `Mutant Ape Yacht Club #${tokenId}`,
          image: metadata.image,
          similarity: bestMatch.similarity,
          hammingDistance: bestMatch.hammingDistance,
          owner: {
            address: owner,
            ensName: ownerENS,
          },
          message: ownerENS
            ? `This NFT belongs to ${ownerENS} (${owner})`
            : `This NFT belongs to ${owner}`,
          confidence: bestMatch.similarity >= 95 ? 'Very High' : bestMatch.similarity >= 90 ? 'High' : 'Medium',
          openseaUrl: `https://opensea.io/assets/ethereum/${MAYC_CONTRACT}/${tokenId}`,
          etherscanUrl: `https://etherscan.io/address/${owner}`,
        });
      } catch (error) {
        logger.error('Find owner by image failed', error);
        res.status(500).json({ error: 'Failed to find token owner' });
      }
    });

    // ===== REAL METRICS ENDPOINT WITH ACTUAL BLOCKCHAIN DATA =====
    this.express.get('/api/metrics', async (req, res) => {
      try {
        const period = req.query.period || '24h';
        logger.info(`📊 Fetching REAL metrics for period: ${period}`);

        // Parse period to hours
        let hours = 24;
        if (period === '7d') hours = 168;
        if (period === '30d') hours = 720;

        // Fetch REAL transfer events from blockchain
        const events = await blockchainService.getAllTransferEvents(0);
        logger.info(`✅ Got ${events.length} real transfer events from blockchain`);

        // Filter events within time window
        const now = Math.floor(Date.now() / 1000);
        const cutoffTime = now - (hours * 3600);
        const eventsInWindow = events.filter((e: any) => {
          const eventTime = typeof e.timestamp === 'number' ? e.timestamp : new Date(e.timestamp).getTime() / 1000;
          return eventTime >= cutoffTime;
        });

        logger.info(`✅ ${eventsInWindow.length} events within ${hours}h window`);

        // Calculate REAL unique buyers and sellers
        const buyers = new Set<string>();
        const sellers = new Set<string>();
        let totalVolumeETH = 0;
        let salePriceSum = 0;
        let saleCount = 0;

        eventsInWindow.forEach((event: any) => {
          sellers.add(event.from.toLowerCase());
          buyers.add(event.to.toLowerCase());

          // Sum up volumes if price data available
          if (event.priceETH) {
            totalVolumeETH += event.priceETH;
            salePriceSum += event.priceETH;
            saleCount++;
          }
        });

        const avgPrice = saleCount > 0 ? salePriceSum / saleCount : 0;
        const floorPrice = saleCount > 0 ? Math.min(...eventsInWindow.filter((e: any) => e.priceETH > 0).map((e: any) => e.priceETH)) : 0;

        res.json({
          period,
          metrics: {
            transactionCount: eventsInWindow.length,        // ✅ REAL transaction count
            volume: parseFloat(totalVolumeETH.toFixed(2)),  // ✅ REAL volume in ETH
            avgPrice: parseFloat(avgPrice.toFixed(2)),      // ✅ REAL average price
            floorPrice,
            uniqueBuyers: buyers.size,                       // ✅ REAL unique buyers
            uniqueSellers: sellers.size,                     // ✅ REAL unique sellers
          },
          _source: 'real_blockchain_data',
          lastUpdated: new Date(),
        });
      } catch (error) {
        logger.error('Error fetching metrics', error);
        res.status(500).json({
          error: 'Failed to fetch metrics',
          details: error,
        });
      }
    });

    // ===== RECENT TRANSACTIONS ENDPOINT (REAL BLOCKCHAIN DATA + OPENSEA PRICES) =====
    this.express.get('/api/transactions/recent', async (req, res) => {
      try {
        const hours = parseInt(req.query.hours as string) || 24;
        const limit = parseInt(req.query.limit as string) || 100;

        logger.info(`📋 Fetching recent transactions for last ${hours}h, limit ${limit}`);

        // Fetch REAL transfer events from blockchain
        const allEvents = await blockchainService.getAllTransferEvents(0);
        logger.info(`✅ Got ${allEvents.length} real transfer events`);

        // Fetch OpenSea sales events for price enrichment
        const contractAddress = process.env.NFT_CONTRACT_ADDRESS || '';
        const alchemySDK = getAlchemySDKProvider();
        const sales = await alchemySDK.getRecentSales(contractAddress, 300);
        logger.info(`✅ Got ${sales.length} OpenSea sales events`);

        // Create price lookup map by tokenId
        const priceMap = new Map<string, number>();
        sales.forEach((sale: any) => {
          priceMap.set(sale.tokenId, sale.priceETH);
        });

        // Get whale addresses (20+ NFTs threshold)
        const allHolders = analyticsService.buildHoldersList(allEvents);
        const whaleHolders = analyticsService.getTopHolders(allHolders, 9999).filter((h: any) => h.count >= 20);
        const whaleAddresses = new Set(whaleHolders.map((w: any) => w.address.toLowerCase()));
        logger.info(`✅ Identified ${whaleAddresses.size} whale addresses (20+ NFTs)`);

        // Filter events within time window
        const now = Math.floor(Date.now() / 1000);
        const cutoffTime = now - (hours * 3600);
        const eventsInWindow = allEvents.filter((e: any) => {
          const eventTime = typeof e.timestamp === 'number' ? e.timestamp : new Date(e.timestamp).getTime() / 1000;
          return eventTime >= cutoffTime;
        });

        logger.info(`✅ ${eventsInWindow.length} transactions within ${hours}h window`);

        // Convert events to transaction format with price enrichment and whale detection
        const allTransactions = eventsInWindow
          .map((event: any) => {
            const tokenId = event.tokenId.toString();
            const fromAddress = event.from.toLowerCase();
            const toAddress = event.to.toLowerCase();
            const isWhaleFrom = whaleAddresses.has(fromAddress);
            const isWhaleTo = whaleAddresses.has(toAddress);

            return {
              tokenId: event.tokenId,
              from: event.from,
              to: event.to,
              timestamp: typeof event.timestamp === 'number' ? event.timestamp : Math.floor(new Date(event.timestamp).getTime() / 1000),
              txHash: event.transactionHash || event.txHash || undefined,
              type: event.type || 'transfer',
              priceETH: priceMap.get(tokenId) || event.priceETH || undefined,  // Try OpenSea first, fallback to blockchain tx.value
              isWhaleTransaction: isWhaleFrom || isWhaleTo,
              whaleFrom: isWhaleFrom,
              whaleTo: isWhaleTo,
            };
          })
          .sort((a: any, b: any) => b.timestamp - a.timestamp);  // newest first

        const transactions = allTransactions.slice(0, limit);

        const whaleTransactionCount = transactions.filter((t: any) => t.isWhaleTransaction).length;

        res.json({
          count: transactions.length,
          totalInWindow: allTransactions.length,
          whaleTransactionCount,
          limit,
          hours,
          transactions,
          _source: 'blockchain_data_with_opensea_prices',
          lastUpdated: new Date(),
        });
      } catch (error) {
        logger.error('Error fetching recent transactions', error);
        res.status(500).json({
          error: 'Failed to fetch recent transactions',
          details: (error as any)?.message,
        });
      }
    });

    this.express.post('/api/whales/refresh', (req, res) => {
      try {
        getCacheService().clear();
        res.json({ message: 'Cache cleared successfully', timestamp: new Date() });
      } catch (error) {
        logger.error('Error refreshing cache', error);
        res.status(500).json({ error: 'Failed to refresh cache' });
      }
    });

    // ====== ENS Resolution Endpoints ======
    // GET /api/whales/ens/:addressOrName - Resolve ENS for address or reverse lookup
    this.express.get('/api/whales/ens/:addressOrName', async (req, res) => {
      try {
        const { addressOrName } = req.params;
        const ensService = getENSService();

        let result;

        // Check if it's an Ethereum address
        if (addressOrName.match(/^0x[a-fA-F0-9]{40}$/i)) {
          // Forward lookup: address → ENS name
          logger.info(`📍 ENS forward lookup: ${addressOrName}`);
          result = await ensService.resolveAddress(addressOrName);
        } else {
          // Reverse lookup: ENS name → address
          logger.info(`📍 ENS reverse lookup: ${addressOrName}`);
          const address = await ensService.resolveENSName(addressOrName);

          if (!address) {
            return res.status(404).json({
              error: 'ENS name not found',
              name: addressOrName,
            });
          }

          // Get full ENS data for resolved address
          result = await ensService.resolveAddress(address);
        }

        res.json({
          status: 'success',
          ...result,
        });
      } catch (error) {
        logger.error('Error resolving ENS', error);
        res.status(500).json({
          error: 'ENS resolution failed',
          details: (error as any)?.message,
        });
      }
    });

    // GET /api/whales/ens/batch - Batch ENS resolution
    this.express.post('/api/whales/ens/batch', async (req, res) => {
      try {
        const { addresses } = req.body;

        if (!Array.isArray(addresses) || addresses.length === 0) {
          return res.status(400).json({
            error: 'Invalid request',
            message: 'Expected addresses array in body',
          });
        }

        const ensService = getENSService();
        logger.info(`🔍 Batch ENS resolution for ${addresses.length} addresses`);

        const results = await ensService.resolveBatch(addresses);

        res.json({
          status: 'success',
          processed: addresses.length,
          resolved: results.size,
          data: Array.from(results.values()),
        });
      } catch (error) {
        logger.error('Error in batch ENS resolution', error);
        res.status(500).json({
          error: 'Batch ENS resolution failed',
          details: (error as any)?.message,
        });
      }
    });

    // ═══════════════════════════════════════════════════════════════════
    // AUTH ENDPOINTS (Mock authentication)
    // ═══════════════════════════════════════════════════════════════════
    this.express.post('/api/auth/signup', authController.signup);
    this.express.post('/api/auth/verify-otp', authController.verifyOTP);
    this.express.post('/api/auth/login', authController.login);
    this.express.post('/api/auth/reset-password', authController.resetPassword);
    this.express.post('/api/auth/social', authController.socialAuth);
    this.express.post('/api/auth/logout', authController.logout);

    // ═══════════════════════════════════════════════════════════════════
    // IDENTITY RESOLUTION ENDPOINTS (Wallet Identity - ENS, Twitter, etc)
    // ═══════════════════════════════════════════════════════════════════
    this.express.get('/api/identity/stats', identityController.getStats);
    this.express.get('/api/identity/search', identityController.searchIdentity);
    this.express.get('/api/identity/:address', identityController.getIdentity);
    this.express.post('/api/identity/batch', identityController.batchGetIdentity);
    this.express.delete('/api/identity/cache', identityController.clearCache);

    // Use routes from routes.ts for standard endpoints
    this.express.use('/api', routes);

    // Serve a simple dashboard page
    this.express.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>NFT Analytics - MAYC</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
              .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
              h1 { color: #333; }
              p { color: #666; line-height: 1.6; }
              .endpoints { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
              code { background: #e8e8e8; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
              ul { margin: 10px 0; }
              li { margin: 8px 0; }
              .status { color: #27ae60; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🎨 NFT Analytics - Mutant Ape Yacht Club</h1>
              <p class="status">✓ Server is running</p>
              <p>This is a real-time analytics platform for tracking Mutant Ape Yacht Club (MAYC) NFT transactions on Ethereum.</p>

              <h2>API Endpoints</h2>
              <div class="endpoints">
                <ul>
                  <li><code>GET /api/health</code> - Health check</li>
                  <li><code>GET /api/holders/top?limit=50</code> - Top NFT holders</li>
                  <li><code>GET /api/holders/distribution</code> - Holder distribution statistics</li>
                  <li><code>GET /api/holders/:address</code> - Details for specific holder</li>
                  <li><code>GET /api/transactions/recent?hours=24</code> - Recent transactions</li>
                  <li><code>GET /api/metrics?period=24h</code> - Trading metrics (24h, 7d, 30d)</li>
                  <li><code>GET /api/whales?minNFTs=10</code> - Whale addresses</li>
                  <li><code>GET /api/cache/stats</code> - Cache statistics</li>
                  <li><code>POST /api/cache/clear</code> - Clear cache</li>
                </ul>
              </div>

              <h2>WebSocket</h2>
              <div class="endpoints">
                <p>Connect to <code>ws://localhost:3001</code> for real-time updates:</p>
                <ul>
                  <li><strong>new_transfer</strong> - New NFT transfer event</li>
                  <li><strong>whale_alert</strong> - Large holder activity</li>
                  <li><strong>large_sale</strong> - High-value sales</li>
                  <li><strong>metrics_update</strong> - Periodic metric updates</li>
                  <li><strong>top_holders_update</strong> - Top holder changes</li>
                </ul>
              </div>

              <h2>Getting Started</h2>
              <div class="endpoints">
                <ol>
                  <li>Try <code>GET /api/health</code> to verify the server is running</li>
                  <li>Visit <code>GET /api/holders/top</code> to see top NFT holders</li>
                  <li>Check <code>GET /api/metrics?period=24h</code> for trading data</li>
                  <li>Connect WebSocket for real-time monitoring</li>
                </ol>
              </div>
            </div>
          </body>
        </html>
      `);
    });
  }

  /**
   * Initialize WebSocket manager
   */
  private initializeWebSocket(): void {
    try {
      const wsPort = parseInt(process.env.WS_PORT || '3003', 10);
      this.wsManager = new WebSocketManager(this.httpServer, wsPort);
      logger.info(`WebSocket server initialized on port ${wsPort}`);
    } catch (error) {
      logger.error('Failed to initialize WebSocket server (non-critical)', error);
      // Continue without WebSocket - it's not critical for the API to function
    }
  }

  /**
   * Start real-time blockchain monitoring
   */
  private async startBlockchainMonitoring(): Promise<void> {
    try {
      logger.info('🚀 Starting blockchain monitoring with new BlockchainMonitorService...');

      // Import and start the new blockchain monitor
      const { getBlockchainMonitor } = await import('./services/blockchain-monitor.service');
      const monitor = getBlockchainMonitor();
      await monitor.start();

      logger.info('✅ Blockchain monitoring started successfully');
    } catch (error) {
      logger.error('Failed to start blockchain monitoring', error);
      // Don't exit - server can still run without monitoring
    }
  }

  // DEPRECATED: Old monitoring code below (kept for reference)
  private async startBlockchainMonitoringOLD(): Promise<void> {
    try {
      const blockchainService = getBlockchainService();
      const analyticsService = getAnalyticsService();
      const cacheService = getCacheService();

      logger.info('Starting blockchain monitoring...');

      // Subscribe to new transfer events
      await blockchainService.subscribeToTransfers((transaction) => {
        logger.debug(`New transfer detected: Token ${transaction.tokenId} from ${transaction.from} to ${transaction.to}`);

        // Broadcast to WebSocket clients
        if (this.wsManager) {
          this.wsManager.broadcastTransfer(transaction);

          // Add to recent feed
          cacheService.addToRecentTransactionFeed(transaction);

          // Check if it's a whale activity
          const minNFTs = 10;
          // This is simplified - in production you'd check the holder's count
          if (transaction.type === 'sale') {
            // Could add whale detection logic here
          }
        }
      });

      logger.info('Blockchain monitoring started');

      // Periodically update metrics (every 10 minutes)
      setInterval(async () => {
        try {
          logger.info('Updating metrics cache...');
          const events = await blockchainService.getAllTransferEvents(0);
          const metrics24h = analyticsService.calculateMetricsForPeriod(
            analyticsService.getTransactionsInWindow(events, 24)
          );
          cacheService.setMetrics(metrics24h, '24h');

          if (this.wsManager) {
            this.wsManager.broadcastMetricUpdate('24h', metrics24h);
          }
        } catch (error) {
          logger.error('Error updating metrics', error);
        }
      }, 10 * 60 * 1000); // 10 minutes

      // Periodically update top holders (every 30 minutes)
      setInterval(async () => {
        try {
          logger.info('Updating top holders cache...');
          const events = await blockchainService.getAllTransferEvents(0);
          const allHolders = analyticsService.buildHoldersList(events);
          const topHolders = analyticsService.getTopHolders(allHolders, 50);
          cacheService.setTopHolders(topHolders);

          if (this.wsManager) {
            this.wsManager.broadcastTopHoldersUpdate(topHolders);
          }
        } catch (error) {
          logger.error('Error updating top holders', error);
        }
      }, 30 * 60 * 1000); // 30 minutes

      // Periodically update enriched whales data (every 1 hour)
      setInterval(async () => {
        try {
          logger.info('Updating enriched whales data...');
          const enrichmentService = getEnrichmentService();
          const events = await blockchainService.getAllTransferEvents(0);
          const allHolders = analyticsService.buildHoldersList(events);
          const topWhales = analyticsService.getTopHolders(allHolders, 50);

          const enrichedWhales = await enrichmentService.enrichWhales(topWhales);
          cacheService.setEnrichedWhales(enrichedWhales);

          logger.info(`Updated ${enrichedWhales.length} enriched whales`);

          if (this.wsManager) {
            this.wsManager.broadcastEnrichedWhalesUpdate(enrichedWhales);
          }
        } catch (error) {
          logger.error('Error updating enriched whales', error);
        }
      }, 60 * 60 * 1000); // 1 hour
    } catch (error) {
      logger.error('Failed to start blockchain monitoring', error);
    }
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      this.initializeMiddleware();
      this.initializeRoutes();
      this.initializeWebSocket();

      const port = parseInt(process.env.PORT || '3000', 10);

      this.httpServer.listen(port, () => {
        logger.info(`Server is running on http://localhost:${port}`);
        this.isRunning = true;
      });

      // Wait a bit for server to start, then begin monitoring
      await sleep(1000);
      await this.startBlockchainMonitoring();
    } catch (error) {
      logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down...');

    if (this.wsManager) {
      this.wsManager.close();
    }

    this.httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  }
}

// Create and start app
const app = new App();

// Handle graceful shutdown
process.on('SIGINT', () => {
  app.shutdown();
});

process.on('SIGTERM', () => {
  app.shutdown();
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

// Start the application
app.start().catch((error) => {
  logger.error('Failed to start application', error);
  process.exit(1);
});
