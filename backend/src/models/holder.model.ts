export interface Holder {
  address: string;
  tokenIds: number[];
  count: number;
  ensName?: string;
  label?: string; // Etherscan verified label
  firstSeen: Date;
  lastActivity: Date;
  percentageOfCollection?: number;
  // ENS metadata (populated by lazy loading)
  ensAvatar?: string | null;
  twitter?: string | null;
  email?: string | null;
}

export interface HolderStats {
  totalHolders: number;
  totalSupply: number;
  averageNFTsPerHolder: number;
  distribution: {
    single: number;      // 1 NFT
    small: number;       // 2-5 NFT
    medium: number;      // 6-10 NFT
    whales: number;      // 10+ NFT
  };
}
