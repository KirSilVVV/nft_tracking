import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whaleAPI } from '../services/api';

/**
 * Hook to fetch top whales
 */
export const useTopWhales = (limit: number = 50) => {
  return useQuery({
    queryKey: ['whales', 'top', limit],
    queryFn: () => whaleAPI.getTopWhales(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  } as const);
};

/**
 * Hook to search whale by address
 */
export const useSearchWhale = (address: string) => {
  const isValidAddress = !!(address && address.match(/^0x[a-fA-F0-9]{40}$/i));

  return useQuery({
    queryKey: ['whale', 'search', address],
    queryFn: () => whaleAPI.searchWhale(address),
    enabled: isValidAddress,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  } as const);
};

/**
 * Hook to fetch analytics
 */
export const useAnalytics = () => {
  return useQuery({
    queryKey: ['whales', 'analytics'],
    queryFn: () => whaleAPI.getAnalytics(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  } as const);
};

/**
 * Hook to fetch quick stats
 */
export const useQuickStats = () => {
  return useQuery({
    queryKey: ['whales', 'stats'],
    queryFn: () => whaleAPI.getQuickStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  } as const);
};

/**
 * Hook to refresh cache
 */
export const useRefreshCache = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: whaleAPI.refreshCache,
    onSuccess: () => {
      // Invalidate all whale queries
      queryClient.invalidateQueries({ queryKey: ['whales'] });
    },
  });
};

/**
 * Hook to fetch whale activity history
 */
export const useWhaleActivity = (address: string, limit: number = 50, offset: number = 0) => {
  const isValidAddress = !!(address && address.match(/^0x[a-fA-F0-9]{40}$/i));

  return useQuery({
    queryKey: ['whale', 'activity', address, limit, offset],
    queryFn: () => whaleAPI.getWhaleActivity(address, limit, offset),
    enabled: isValidAddress,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  } as const);
};

/**
 * Hook to fetch NFT metadata by token ID
 */
export const useNftMetadata = (tokenId: number | null) => {
  return useQuery({
    queryKey: ['nft', 'metadata', tokenId],
    queryFn: () => whaleAPI.getNftMetadata(tokenId!),
    enabled: tokenId !== null && tokenId >= 0,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  } as const);
};

/**
 * Hook to fetch enriched whale data (portfolio, ETH balance, ENS)
 */
export const useWhaleEnriched = (address: string) => {
  const isValidAddress = !!(address && address.match(/^0x[a-fA-F0-9]{40}$/i));

  return useQuery({
    queryKey: ['whale', 'enriched', address],
    queryFn: () => whaleAPI.getWhaleEnriched(address),
    enabled: isValidAddress,
    staleTime: 1000 * 60 * 60, // 1 hour (enriched data is expensive)
    gcTime: 1000 * 60 * 120, // 2 hours
  } as const);
};
