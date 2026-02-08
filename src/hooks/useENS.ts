import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface ENSData {
  status: string;
  address: string;
  ensName: string | null;
  avatar?: string | null;
  twitter?: string | null;
  email?: string | null;
  resolvedAt: number;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:6252/api/whales';

/**
 * Fetch ENS data for an address
 */
export function useENS(address: string) {
  return useQuery<ENSData>({
    queryKey: ['ens', address.toLowerCase()],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE_URL.replace('/api/whales', '')}/api/whales/ens/${address}`);
        return response.data;
      } catch (error) {
        console.warn(`Failed to fetch ENS data for ${address}:`, error);
        // Return null data instead of throwing
        return {
          status: 'error',
          address: address.toLowerCase(),
          ensName: null,
          resolvedAt: Date.now(),
        };
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
  });
}

/**
 * Batch fetch ENS data for multiple addresses
 */
export function useENSBatch(addresses: string[]) {
  return useQuery<ENSData[]>({
    queryKey: ['ens-batch', addresses.join(',')],
    queryFn: async () => {
      try {
        const response = await axios.post(`${API_BASE_URL.replace('/api/whales', '')}/api/whales/ens/batch`, {
          addresses,
        });

        return response.data.data || [];
      } catch (error) {
        console.warn(`Failed to batch fetch ENS data:`, error);
        // Return empty results
        return addresses.map(addr => ({
          status: 'error',
          address: addr.toLowerCase(),
          ensName: null,
          resolvedAt: Date.now(),
        }));
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
  });
}
