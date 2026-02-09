/**
 * React Query hooks for Alerts API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertAPI } from '../services/api';
import { CreateAlertRequest, UpdateAlertRequest } from '../types/alert.types';

/**
 * Hook to fetch all alert rules
 */
export const useAlertRules = () => {
  return useQuery({
    queryKey: ['alerts', 'rules'],
    queryFn: () => alertAPI.getRules(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to fetch specific alert rule
 */
export const useAlertRule = (id: string) => {
  return useQuery({
    queryKey: ['alerts', 'rule', id],
    queryFn: () => alertAPI.getRule(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });
};

/**
 * Hook to fetch alert statistics
 */
export const useAlertStats = () => {
  return useQuery({
    queryKey: ['alerts', 'stats'],
    queryFn: () => alertAPI.getStats(),
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to fetch alert history
 */
export const useAlertHistory = (limit: number = 50) => {
  return useQuery({
    queryKey: ['alerts', 'history', limit],
    queryFn: () => alertAPI.getHistory(limit),
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to create new alert rule
 */
export const useCreateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAlertRequest) => alertAPI.createRule(data),
    onSuccess: () => {
      // Invalidate and refetch alert rules and stats
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'stats'] });
    },
  });
};

/**
 * Hook to update alert rule
 */
export const useUpdateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertRequest }) =>
      alertAPI.updateRule(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rule', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'stats'] });
    },
  });
};

/**
 * Hook to delete alert rule
 */
export const useDeleteAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertAPI.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'stats'] });
    },
  });
};

/**
 * Hook to toggle alert rule status
 */
export const useToggleAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertAPI.toggleRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'stats'] });
    },
  });
};

/**
 * Hook to acknowledge alert
 */
export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertAPI.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'history'] });
    },
  });
};
