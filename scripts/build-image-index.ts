/**
 * Script to pre-build image hash index for all MAYC NFTs
 * Run: npx ts-node scripts/build-image-index.ts
 *
 * This will create data/mayc-hash-index.json with perceptual hashes for all 19,423 NFTs
 * Estimated time: ~2-3 hours (with rate limiting)
 */

import 'dotenv/config';
import { getAlchemySDKProvider } from '../src/providers/alchemy-sdk.provider';
import { getImageSearchService } from '../src/services/image-search.service';
import * as fs from 'fs/promises';
import * as path from 'path';

const MAYC_CONTRACT = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';
const TOTAL_SUPPLY = 19423;
const BATCH_SIZE = 10;
const DELAY_MS = 200;

async function buildFullIndex() {
  console.log('🚀 Starting MAYC image hash index builder');
  console.log(`📊 Total NFTs to index: ${TOTAL_SUPPLY}`);
  console.log(`⚙️  Batch size: ${BATCH_SIZE}`);
  console.log(`⏱️  Delay between batches: ${DELAY_MS}ms`);
  console.log('');

  const alchemySDK = getAlchemySDKProvider();
  const imageSearchService = getImageSearchService();

  const hashes = new Map<number, string>();
  let processed = 0;
  let failed = 0;

  const startTime = Date.now();

  // Process all token IDs in batches
  for (let i = 0; i < TOTAL_SUPPLY; i += BATCH_SIZE) {
    const batch = Array.from({ length: Math.min(BATCH_SIZE, TOTAL_SUPPLY - i) }, (_, j) => i + j);

    await Promise.all(batch.map(async (tokenId) => {
      try {
        const metadata = await alchemySDK.getNftMetadata(MAYC_CONTRACT, String(tokenId));

        if (metadata.image) {
          const hash = await (imageSearchService as any).generateHashFromUrl(metadata.image);
          hashes.set(tokenId, hash);
          processed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.warn(`❌ Failed to index NFT #${tokenId}:`, (error as Error).message);
        failed++;
      }
    }));

    // Progress update every 100 NFTs
    if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= TOTAL_SUPPLY) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processed / elapsed;
      const remaining = TOTAL_SUPPLY - processed - failed;
      const eta = remaining / rate;

      console.log(`✅ Progress: ${processed}/${TOTAL_SUPPLY} (${((processed / TOTAL_SUPPLY) * 100).toFixed(1)}%)`);
      console.log(`   Failed: ${failed}, Rate: ${rate.toFixed(1)} NFTs/sec, ETA: ${(eta / 60).toFixed(1)} min`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }

  // Save to file
  const dataDir = path.join(__dirname, '..', 'data');
  await fs.mkdir(dataDir, { recursive: true });

  const indexPath = path.join(dataDir, 'mayc-hash-index.json');
  const indexData = Object.fromEntries(hashes.entries());
  await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));

  const totalTime = (Date.now() - startTime) / 1000;

  console.log('');
  console.log('🎉 Index build complete!');
  console.log(`📁 Saved to: ${indexPath}`);
  console.log(`✅ Successfully indexed: ${processed} NFTs`);
  console.log(`❌ Failed: ${failed} NFTs`);
  console.log(`⏱️  Total time: ${(totalTime / 60).toFixed(1)} minutes`);
  console.log(`📊 File size: ${((JSON.stringify(indexData).length) / 1024).toFixed(1)} KB`);
}

// Run
buildFullIndex().catch(console.error);
