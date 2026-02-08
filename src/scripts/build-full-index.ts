#!/usr/bin/env node
/**
 * Full NFT Image Index Builder
 * Builds perceptual hash index for ALL 19,423 MAYC NFTs
 *
 * Features:
 * - Incremental saving (saves every 100 NFTs)
 * - Resume from last checkpoint
 * - Rate limiting (Alchemy API)
 * - Progress reporting
 *
 * Usage: node dist/scripts/build-full-index.js
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import { getAlchemySDKProvider } from '../providers/alchemy-sdk.provider';
import { getImageSearchService } from '../services/image-search.service';
import { logger } from '../utils/logger';

const MAYC_CONTRACT = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';
const TOTAL_SUPPLY = 19423;
const BATCH_SIZE = 10; // Process 10 at a time
const SAVE_INTERVAL = 100; // Save every 100 NFTs
const DELAY_BETWEEN_BATCHES = 300; // 300ms delay between batches

interface IndexProgress {
  lastProcessedTokenId: number;
  totalIndexed: number;
  startedAt: string;
  lastSavedAt: string;
}

async function main() {
  logger.info('🚀 Starting full MAYC image index builder');
  logger.info(`Total NFTs to index: ${TOTAL_SUPPLY}`);

  const dataDir = path.join(__dirname, '..', '..', 'data');
  const indexPath = path.join(dataDir, 'mayc-hash-index.json');
  const progressPath = path.join(dataDir, 'index-progress.json');

  // Ensure data directory exists
  await fs.mkdir(dataDir, { recursive: true });

  // Load existing index and progress
  let index = new Map<number, string>();
  let progress: IndexProgress = {
    lastProcessedTokenId: -1,
    totalIndexed: 0,
    startedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
  };

  try {
    const existingData = await fs.readFile(indexPath, 'utf-8');
    const parsed = JSON.parse(existingData);
    index = new Map(Object.entries(parsed).map(([k, v]) => [parseInt(k), v as string]));
    logger.info(`✅ Loaded existing index: ${index.size} NFTs`);
  } catch {
    logger.info('📝 Starting fresh index');
  }

  try {
    const progressData = await fs.readFile(progressPath, 'utf-8');
    progress = JSON.parse(progressData);
    logger.info(`✅ Resuming from token ID ${progress.lastProcessedTokenId + 1}`);
  } catch {
    logger.info('📝 Starting from token ID 0');
  }

  const alchemySDK = getAlchemySDKProvider();
  const imageSearch = getImageSearchService();

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  const startTokenId = progress.lastProcessedTokenId + 1;
  const startTime = Date.now();

  logger.info(`\n🔨 Processing tokens ${startTokenId} to ${TOTAL_SUPPLY - 1}`);
  logger.info(`Batch size: ${BATCH_SIZE}, Save interval: ${SAVE_INTERVAL}\n`);

  for (let i = startTokenId; i < TOTAL_SUPPLY; i += BATCH_SIZE) {
    const batchStart = i;
    const batchEnd = Math.min(i + BATCH_SIZE, TOTAL_SUPPLY);
    const batch = Array.from({ length: batchEnd - batchStart }, (_, idx) => batchStart + idx);

    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map(async (tokenId) => {
        // Skip if already indexed
        if (index.has(tokenId)) {
          skippedCount++;
          return { tokenId, skipped: true };
        }

        try {
          const metadata = await alchemySDK.getNftMetadata(MAYC_CONTRACT, String(tokenId));

          if (!metadata.image) {
            logger.warn(`Token ${tokenId}: No image URL`);
            errorCount++;
            return { tokenId, error: 'no_image' };
          }

          // Generate hash from image URL
          const hash = await imageSearch.generateHashFromUrl(metadata.image);
          index.set(tokenId, hash);
          successCount++;

          return { tokenId, success: true, hash };
        } catch (error: any) {
          logger.error(`Token ${tokenId}: ${error.message}`);
          errorCount++;
          return { tokenId, error: error.message };
        }
      })
    );

    // Update progress
    progress.lastProcessedTokenId = batchEnd - 1;
    progress.totalIndexed = index.size;
    progress.lastSavedAt = new Date().toISOString();

    // Save periodically
    if (index.size % SAVE_INTERVAL === 0 || batchEnd >= TOTAL_SUPPLY) {
      await saveIndex(index, indexPath);
      await saveProgress(progress, progressPath);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (successCount / parseFloat(elapsed)).toFixed(2);
      const remaining = TOTAL_SUPPLY - batchEnd;
      const eta = remaining > 0 ? ((remaining / parseFloat(rate)) / 60).toFixed(1) : '0';

      logger.info(
        `📊 Progress: ${index.size}/${TOTAL_SUPPLY} (${((index.size / TOTAL_SUPPLY) * 100).toFixed(1)}%) | ` +
        `✅ ${successCount} | ❌ ${errorCount} | ⏭️ ${skippedCount} | ` +
        `⏱️ ${rate} NFTs/sec | ETA: ${eta}min`
      );
    }

    // Rate limiting delay
    if (batchEnd < TOTAL_SUPPLY) {
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  // Final save
  await saveIndex(index, indexPath);
  await saveProgress(progress, progressPath);

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  logger.info('\n✅ Indexing complete!');
  logger.info(`📦 Total indexed: ${index.size}/${TOTAL_SUPPLY}`);
  logger.info(`✅ Success: ${successCount}`);
  logger.info(`❌ Errors: ${errorCount}`);
  logger.info(`⏭️ Skipped (already indexed): ${skippedCount}`);
  logger.info(`⏱️ Total time: ${totalTime} minutes`);
  logger.info(`💾 Index saved to: ${indexPath}`);

  // Clean up progress file if fully complete
  if (index.size === TOTAL_SUPPLY) {
    try {
      await fs.unlink(progressPath);
      logger.info('🧹 Cleaned up progress file (indexing complete)');
    } catch {}
  }
}

async function saveIndex(index: Map<number, string>, filePath: string) {
  const data = Object.fromEntries(index.entries());
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function saveProgress(progress: IndexProgress, filePath: string) {
  await fs.writeFile(filePath, JSON.stringify(progress, null, 2));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the script
main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
