import sharp from 'sharp';
import axios from 'axios';
import { logger } from '../utils/logger';
import { getCacheService } from './cache.service';
import { getAlchemySDKProvider } from '../providers/alchemy-sdk.provider';

interface ImageHashResult {
  tokenId: number;
  hash: string;
  hammingDistance: number;
  similarity: number;
}

/**
 * ImageSearchService - Reverse image search for NFTs
 * Uses perceptual hashing (pHash) for visual similarity comparison
 */
export class ImageSearchService {
  private static instance: ImageSearchService;
  private readonly MAYC_CONTRACT = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';
  private readonly HASH_SIZE = 8; // 8x8 DCT hash

  private constructor() {
    logger.info('ImageSearchService initialized');
  }

  static getInstance(): ImageSearchService {
    if (!ImageSearchService.instance) {
      ImageSearchService.instance = new ImageSearchService();
    }
    return ImageSearchService.instance;
  }

  /**
   * Generate perceptual hash from image buffer
   * Algorithm: Convert to grayscale → Resize to 8x8 → Calculate DCT → Compare to median
   */
  async generatePerceptualHash(imageBuffer: Buffer): Promise<string> {
    try {
      // Resize to 8x8 grayscale and get raw pixel data
      const { data, info } = await sharp(imageBuffer)
        .resize(this.HASH_SIZE, this.HASH_SIZE, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Simple average hash (faster than DCT for our use case)
      const pixels = Array.from(data);
      const avg = pixels.reduce((sum, val) => sum + val, 0) / pixels.length;

      // Generate binary hash: 1 if pixel > avg, 0 otherwise
      let hash = '';
      for (const pixel of pixels) {
        hash += pixel > avg ? '1' : '0';
      }

      return hash;
    } catch (error) {
      logger.error('Failed to generate perceptual hash', error);
      throw new Error('Image processing failed');
    }
  }

  /**
   * Generate perceptual hash from image URL
   */
  async generateHashFromUrl(imageUrl: string): Promise<string> {
    try {
      logger.info(`Fetching image from URL: ${imageUrl}`);
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      const buffer = Buffer.from(response.data);
      return await this.generatePerceptualHash(buffer);
    } catch (error) {
      logger.error(`Failed to fetch/hash image from URL: ${imageUrl}`, error);
      throw new Error('Failed to process image URL');
    }
  }

  /**
   * Calculate Hamming distance between two binary hashes
   * Returns number of differing bits (0 = identical, 64 = completely different)
   */
  calculateHammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
      throw new Error('Hash lengths must match');
    }

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) distance++;
    }
    return distance;
  }

  /**
   * Convert Hamming distance to similarity percentage
   */
  calculateSimilarity(hammingDistance: number): number {
    const maxDistance = this.HASH_SIZE * this.HASH_SIZE;
    return ((maxDistance - hammingDistance) / maxDistance) * 100;
  }

  /**
   * Search for visually similar NFTs by uploaded image
   * @param uploadedImageBuffer - Uploaded image buffer
   * @param limit - Max results to return
   * @param threshold - Minimum similarity % (default 70%)
   */
  async searchByImage(
    uploadedImageBuffer: Buffer,
    limit: number = 10,
    threshold: number = 70
  ): Promise<ImageHashResult[]> {
    try {
      logger.info('Starting reverse image search');

      // Generate hash for uploaded image
      const uploadedHash = await this.generatePerceptualHash(uploadedImageBuffer);
      logger.info(`Generated hash for uploaded image: ${uploadedHash}`);

      // Get cached NFT hashes or build index
      const nftHashes = await this.getOrBuildHashIndex();
      logger.info(`Comparing against ${nftHashes.size} indexed NFTs`);

      // Compare uploaded hash with all NFT hashes
      const results: ImageHashResult[] = [];
      for (const [tokenId, nftHash] of nftHashes) {
        const distance = this.calculateHammingDistance(uploadedHash, nftHash);
        const similarity = this.calculateSimilarity(distance);

        if (similarity >= threshold) {
          results.push({
            tokenId,
            hash: nftHash,
            hammingDistance: distance,
            similarity,
          });
        }
      }

      // Sort by similarity (highest first)
      results.sort((a, b) => b.similarity - a.similarity);

      logger.info(`Found ${results.length} matches above ${threshold}% threshold`);
      return results.slice(0, limit);
    } catch (error) {
      logger.error('Image search failed', error);
      throw error;
    }
  }

  /**
   * Get or build hash index for MAYC collection
   * Strategy: Use pre-built index file if exists, otherwise build incrementally
   */
  private async getOrBuildHashIndex(): Promise<Map<number, string>> {
    const cacheKey = 'mayc_hash_index';
    const cached = getCacheService().get<Map<number, string>>(cacheKey);

    if (cached) {
      logger.info('Using cached hash index');
      return cached;
    }

    // Try loading from pre-built index file
    const fs = await import('fs/promises');
    const path = await import('path');
    const indexPath = path.join(__dirname, '..', '..', 'data', 'mayc-hash-index.json');

    try {
      const fileData = await fs.readFile(indexPath, 'utf-8');
      const indexData = JSON.parse(fileData);
      const hashes = new Map<number, string>(Object.entries(indexData).map(([k, v]) => [parseInt(k), v as string]));

      logger.info(`Loaded pre-built hash index: ${hashes.size} NFTs`);

      // Cache for 24 hours
      getCacheService().set(cacheKey, hashes, 86400);
      return hashes;
    } catch (error) {
      logger.warn('Pre-built index not found, building sample index...');
    }

    // Fallback: Build small sample index (first 200 NFTs for better coverage)
    logger.info('Building sample hash index (200 NFTs)...');
    const hashes = new Map<number, string>();
    const sampleSize = 200;
    const sampleTokenIds = Array.from({ length: sampleSize }, (_, i) => i);

    const alchemySDK = getAlchemySDKProvider();

    // Process in batches of 10 for better performance
    for (let i = 0; i < sampleTokenIds.length; i += 10) {
      const batch = sampleTokenIds.slice(i, i + 10);

      await Promise.all(batch.map(async (tokenId) => {
        try {
          const metadata = await alchemySDK.getNftMetadata(this.MAYC_CONTRACT, String(tokenId));

          if (metadata.image) {
            const hash = await this.generateHashFromUrl(metadata.image);
            hashes.set(tokenId, hash);
          }
        } catch (error) {
          logger.warn(`Failed to index NFT #${tokenId}`, error);
        }
      }));

      // Rate limiting between batches
      await this.sleep(200);

      logger.info(`Indexed ${Math.min(i + 10, sampleSize)}/${sampleSize} NFTs...`);
    }

    // Cache for 24 hours
    getCacheService().set(cacheKey, hashes, 86400);
    logger.info(`Hash index built: ${hashes.size} NFTs indexed`);

    // Optionally save to file for next time
    try {
      const dataDir = path.join(__dirname, '..', '..', 'data');
      await fs.mkdir(dataDir, { recursive: true });

      const indexData = Object.fromEntries(hashes.entries());
      await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
      logger.info(`Saved hash index to ${indexPath}`);
    } catch (error) {
      logger.warn('Failed to save hash index to file', error);
    }

    return hashes;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function getImageSearchService(): ImageSearchService {
  return ImageSearchService.getInstance();
}
