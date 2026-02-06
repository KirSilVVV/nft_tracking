import { ethers } from 'ethers';

export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export function normalizeAddress(address: string): string {
  return ethers.getAddress(address);
}

export function convertWeiToEth(wei: string | number): number {
  return parseFloat(ethers.formatEther(wei.toString()));
}

export function convertEthToWei(eth: number): string {
  return ethers.parseEther(eth.toString()).toString();
}

export function getDateRangeInSeconds(hours: number): { from: number; to: number } {
  const now = Math.floor(Date.now() / 1000);
  const from = now - hours * 3600;
  return { from, to: now };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Process array in batches with rate limiting
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10,
  delayMs: number = 200
): Promise<R[]> {
  const results: R[] = [];
  const chunks = chunkArray(items, batchSize);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const batchResults = await Promise.all(chunk.map((item) => processor(item)));
    results.push(...batchResults);

    // Delay between batches
    if (i < chunks.length - 1) {
      await sleep(delayMs);
    }
  }

  return results;
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }

  throw new Error('Max retries exceeded');
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatNumber(num: number, decimals: number = 2): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(decimals) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(decimals) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(decimals) + 'K';
  }
  return num.toFixed(decimals);
}

/**
 * Truncate Ethereum address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address || address.length < chars * 2) {
    return address;
  }
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
