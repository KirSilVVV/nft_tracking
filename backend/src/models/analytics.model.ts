import { Holder, HolderStats } from './holder.model';
import { Transaction, TransactionMetrics } from './transaction.model';

export interface AnalyticsData {
  holders: Holder[];
  holderStats: HolderStats;
  recentTransactions: Transaction[];
  metrics: TransactionMetrics;
  lastUpdated: Date;
}

export interface PeriodMetrics {
  period: string; // '24h', '7d', '30d'
  startDate: Date;
  endDate: Date;
  metrics: TransactionMetrics;
}

export interface ContractEvent {
  eventName: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  address: string;
  args: {
    from?: string;
    to?: string;
    tokenId?: string;
  };
}
