export interface Transaction {
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  from: string;
  to: string;
  tokenId: number;
  type: 'mint' | 'sale' | 'transfer';
  priceETH?: number;
  marketplace?: string; // 'opensea', 'blur', 'looksrare', etc.
}

export interface TransactionMetrics {
  transactionCount: number;
  volume: number; // in ETH
  avgPrice?: number;
  medianPrice?: number;
  uniqueBuyers: number;
  uniqueSellers: number;
  floorPrice?: number;
  topTransaction?: {
    tokenId: number;
    priceETH: number;
  };
}

export interface WhaleActivity {
  address: string;
  action: 'buy' | 'sell';
  tokenIds: number[];
  totalNFTs: number;
  timestamp: Date;
  txHash: string;
}
