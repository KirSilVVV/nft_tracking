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
