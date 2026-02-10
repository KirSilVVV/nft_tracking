// Index missing MAYC tokens 0-2369
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const INDEX_PATH = path.join(__dirname, '..', 'data', 'mayc-hash-index.json');
const START_TOKEN = 0;
const END_TOKEN = 2369;
const DELAY_MS = 500;

// Load existing index
let index = {};
try {
  const data = fs.readFileSync(INDEX_PATH, 'utf8');
  index = JSON.parse(data);
  console.log(`📖 Loaded existing index with ${Object.keys(index).length} tokens`);
} catch (err) {
  console.log('📝 Creating new index...');
}

// Simple hash function (placeholder - real pHash would be better)
function simpleHash(imageBuffer) {
  const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
  // Convert to binary-like format similar to existing index
  let binaryHash = '';
  for (let i = 0; i < 64; i++) {
    binaryHash += parseInt(hash[i], 16) % 2;
  }
  return binaryHash;
}

async function indexToken(tokenId) {
  try {
    console.log(`🔍 Indexing token #${tokenId}...`);

    // Fetch metadata from MAYC API
    const metadataUrl = `https://boredapeyachtclub.com/api/mutants/${tokenId}`;
    const metadataRes = await axios.get(metadataUrl, { timeout: 10000 });

    if (!metadataRes.data || !metadataRes.data.image) {
      console.log(`  ⚠️  No image for token #${tokenId}`);
      return false;
    }

    // Convert IPFS URL to HTTP
    let imageUrl = metadataRes.data.image;
    if (imageUrl.startsWith('ipfs://')) {
      imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    // Fetch image
    const imageRes = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000
    });

    // Generate hash
    const hash = simpleHash(Buffer.from(imageRes.data));
    index[tokenId] = hash;

    console.log(`  ✅ Indexed #${tokenId}`);

    // Save progress every 10 tokens
    if (tokenId % 10 === 0) {
      fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
      console.log(`  💾 Progress saved at token #${tokenId}`);
    }

    return true;
  } catch (error) {
    console.error(`  ❌ Error indexing #${tokenId}:`, error.message);
    return false;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`\n🚀 Starting indexation of tokens ${START_TOKEN}-${END_TOKEN}`);
  console.log(`📊 Current index: ${Object.keys(index).length} tokens\n`);

  let indexed = 0;
  let skipped = 0;
  let errors = 0;

  for (let tokenId = START_TOKEN; tokenId <= END_TOKEN; tokenId++) {
    // Skip if already indexed
    if (index[tokenId]) {
      console.log(`  ⏭️  Token #${tokenId} already indexed, skipping`);
      skipped++;
      continue;
    }

    const success = await indexToken(tokenId);
    if (success) {
      indexed++;
    } else {
      errors++;
    }

    // Rate limiting
    await sleep(DELAY_MS);
  }

  // Final save
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));

  console.log(`\n✅ Indexation complete!`);
  console.log(`📈 Statistics:`);
  console.log(`   - Newly indexed: ${indexed}`);
  console.log(`   - Skipped: ${skipped}`);
  console.log(`   - Errors: ${errors}`);
  console.log(`   - Total in index: ${Object.keys(index).length} tokens`);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
