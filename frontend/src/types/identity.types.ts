// Identity Types - Frontend
// Mirrors backend identity types for type safety

export interface WalletIdentity {
  address: string;
  ensName: string | null;
  ensAvatar: string | null;
  twitter: string | null;
  farcaster: string | null;
  lens: string | null;
  website: string | null;
  email: string | null;
  labels: WalletLabel[];
  displayName: string | null;
  identityScore: number; // 0-100 confidence score
  sources: IdentitySource[];
  resolvedAt: string;
  expiresAt: string;
}

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

export interface IdentityAPI {
  success: boolean;
  data?: WalletIdentity;
  count?: number;
  message?: string;
  error?: string;
}

export interface BatchIdentityAPI {
  success: boolean;
  count: number;
  data: Record<string, WalletIdentity>;
}

export interface IdentitySearchResult {
  address: string;
  displayName: string;
  twitter: string | null;
  ensName: string | null;
  labels: WalletLabel[];
  identityScore: number;
}

export interface IdentitySearchAPI {
  success: boolean;
  query: string;
  count: number;
  results: IdentitySearchResult[];
}
