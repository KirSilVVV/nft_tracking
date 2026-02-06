/**
 * Whale (крупный держатель MAYC NFT)
 */
export interface Whale {
  // Идентификация
  address: string;              // Ethereum адрес (0x...)
  ensName: string | null;       // ENS имя (example.eth)
  rank: number;                 // Позиция в рейтинге

  // Холдинги
  nftCount: number;             // Количество MAYC NFT
  nftIds: number[];             // ID всех NFT
  percentageOfCollection: number; // % от всей коллекции

  // Финансовые данные
  floorPrice: number;           // Текущий floor price (в ETH)
  estimatedValueETH: number;    // Расчетная стоимость портфолио (ETH)
  estimatedValueUSD: number;    // Расчетная стоимость портфолио (USD)
  ethBalance: number;           // Баланс ETH на кошельке

  // Активность
  firstSeen: Date;              // Дата первого получения NFT
  lastActivity: Date;           // Дата последней активности

  // Опциональные данные
  twitterHandle?: string;       // Twitter (для будущего использования)
  label?: string;               // Etherscan label
  isVerified?: boolean;         // Верифицирован ли
}

export interface WhaleListResponse {
  whales: Whale[];
  totalCount: number;
  totalUniqueHolders: number;
  floorPrice: number;
  lastUpdated: Date;
  cachedAt: boolean;            // Данные из кэша или свежие
}

export interface WhaleSearchResult {
  whale: Whale | null;
  found: boolean;
  message: string;
}

export interface WhaleAnalytics {
  topWhales: Whale[];
  distribution: {
    single: number;             // Адреса с 1 NFT
    small: number;              // 2-5 NFT
    medium: number;             // 6-10 NFT
    large: number;              // 11-50 NFT
    whales: number;             // 50+ NFT
  };
  statistics: {
    totalHolders: number;
    totalNFTs: number;
    averagePerHolder: number;
    medianPerHolder: number;
    maxHeld: number;
    minHeld: number;
  };
  floorPrice: number;
  totalMarketCap: number;       // Всей коллекции
  whale90Concentration: number; // % топ 90 китов от всего объема
}
