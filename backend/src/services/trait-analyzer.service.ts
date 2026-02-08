import { getAlchemySDKProvider } from '../providers/alchemy-sdk.provider';
import { getCacheService } from './cache.service';
import { logger } from '../utils/logger';

interface TraitCount {
  traitType: string;
  value: string;
  count: number;
  percentage: number;
}

interface TraitAnalysis {
  totalNFTs: number;
  topTraits: TraitCount[];
  traitTypes: string[];
  lastUpdated: Date;
}

const MAYC_CONTRACT = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';
const SAMPLE_SIZE = 500; // Analyze first 500 NFTs for trait distribution

export class TraitAnalyzerService {
  private static instance: TraitAnalyzerService;

  private constructor() {}

  static getInstance(): TraitAnalyzerService {
    if (!TraitAnalyzerService.instance) {
      TraitAnalyzerService.instance = new TraitAnalyzerService();
    }
    return TraitAnalyzerService.instance;
  }

  /**
   * Analyze trait distribution across sample of MAYC collection
   */
  async analyzeTraits(): Promise<TraitAnalysis> {
    const cacheKey = 'trait_analysis';
    const cached = getCacheService().get<TraitAnalysis>(cacheKey);

    if (cached) {
      logger.info('Returning cached trait analysis');
      return cached;
    }

    logger.info(`Analyzing traits for ${SAMPLE_SIZE} MAYC NFTs...`);

    const alchemySDK = getAlchemySDKProvider();
    const traitMap = new Map<string, number>();
    const traitTypes = new Set<string>();
    let processedCount = 0;

    // Process in batches
    for (let i = 0; i < SAMPLE_SIZE; i += 20) {
      const batch = Array.from({ length: Math.min(20, SAMPLE_SIZE - i) }, (_, j) => i + j);

      await Promise.all(
        batch.map(async (tokenId) => {
          try {
            const metadata = await alchemySDK.getNftMetadata(MAYC_CONTRACT, String(tokenId));

            if (metadata.traits && metadata.traits.length > 0) {
              metadata.traits.forEach((attr) => {
                if (attr.trait_type && attr.value) {
                  const key = `${attr.trait_type}:${attr.value}`;
                  traitMap.set(key, (traitMap.get(key) || 0) + 1);
                  traitTypes.add(attr.trait_type);
                }
              });
              processedCount++;
            }
          } catch (error) {
            logger.warn(`Failed to fetch metadata for NFT #${tokenId}`);
          }
        })
      );

      // Rate limiting
      await this.sleep(200);

      if ((i + 20) % 100 === 0) {
        logger.info(`Trait analysis progress: ${Math.min(i + 20, SAMPLE_SIZE)}/${SAMPLE_SIZE}`);
      }
    }

    // Convert map to array and sort by count
    const topTraits: TraitCount[] = Array.from(traitMap.entries())
      .map(([key, count]) => {
        const [traitType, value] = key.split(':');
        return {
          traitType,
          value,
          count,
          percentage: (count / processedCount) * 100,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 traits

    const analysis: TraitAnalysis = {
      totalNFTs: processedCount,
      topTraits,
      traitTypes: Array.from(traitTypes),
      lastUpdated: new Date(),
    };

    // Cache for 24 hours (traits don't change)
    getCacheService().set(cacheKey, analysis, 86400);

    logger.info(`Trait analysis complete: ${topTraits.length} traits from ${processedCount} NFTs`);
    return analysis;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function getTraitAnalyzerService(): TraitAnalyzerService {
  return TraitAnalyzerService.getInstance();
}
