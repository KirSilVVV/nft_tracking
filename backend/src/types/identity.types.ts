// Identity Resolution Types - Wallet Identity Resolution System

export type WalletLabel =
  | 'whale'
  | 'mega_whale'
  | 'known_collector'
  | 'fund'
  | 'exchange'
  | 'new_whale'
  | 'selling'
  | 'buying';

export type IdentitySource = 'ens' | 'web3bio' | 'etherscan' | 'local_db';

export interface WalletIdentity {
  address: string; // 0x... Ethereum address

  // ENS Data
  ensName: string | null; // e.g. 'pranksy.eth'
  ensAvatar: string | null; // URL to avatar image

  // Social Profiles
  twitter: string | null; // @handle (without @)
  farcaster: string | null; // Farcaster username
  lens: string | null; // Lens handle
  website: string | null; // Personal URL
  email: string | null; // Email from ENS

  // Labels & Tags
  labels: WalletLabel[]; // e.g. ['whale','known_collector']
  displayName: string | null; // Best available name

  // Meta
  identityScore: number; // 0-100 confidence score
  sources: IdentitySource[]; // Which providers contributed
  resolvedAt: string; // ISO timestamp
  expiresAt: string; // Cache expiry
}

export interface LocalWalletEntry {
  displayName: string;
  twitter?: string;
  labels: WalletLabel[];
  note?: string;
}

export interface Web3BioProfile {
  platform: string;
  identity: string;
  displayName?: string;
  avatar?: string;
  description?: string;
  links?: Array<{
    platform: string;
    handle: string;
    url: string;
  }>;
}

export interface IdentityResolverOptions {
  /**
   * Skip expensive lookups (Web3.bio, Etherscan)
   * Only use ENS + Local DB
   */
  quick?: boolean;

  /**
   * Force refresh cached data
   */
  forceRefresh?: boolean;

  /**
   * Maximum time to wait for resolution (ms)
   */
  timeout?: number;
}
