// ============================================
// LOADING HOOKS FOR NFT-TRACKER
// Custom React hooks for managing loading states
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface LoadingState {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface AsyncState<T> {
  execute: (...params: any[]) => Promise<T>;
  loading: boolean;
  error: string | null;
  data: T | null;
}

export interface AsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  immediate?: boolean;
}

export interface StepsState {
  currentStep: number;
  currentStepName: string;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetSteps: () => void;
  progress: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  totalSteps: number;
}

export interface BlockchainTransactionState {
  execute: (...params: any[]) => Promise<any>;
  isLoading: boolean;
  currentStep: number;
  currentStepName: string;
  progress: number;
  txHash: string | null;
  error: string | null;
  reset: () => void;
}

export interface RetryState<T> {
  execute: (...params: any[]) => Promise<T>;
  retryCount: number;
  isRetrying: boolean;
  maxRetries: number;
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, maxRetries: number) => void;
}

export interface PollingState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stop: () => void;
}

export interface PollingOptions {
  interval?: number;
  enabled?: boolean;
}

// ============================================
// 1. Basic Loading Hook
// ============================================

/**
 * Simple loading state management
 * @param initialState - Initial loading state
 * @returns { isLoading, startLoading, stopLoading, setLoading }
 */
export const useLoading = (initialState: boolean = false): LoadingState => {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  return {
    isLoading,
    startLoading,
    stopLoading,
    setLoading: setIsLoading
  };
};

// ============================================
// 2. Async Operation Hook
// ============================================

/**
 * Manage async operations with loading and error states
 * @param asyncFn - Async function to execute
 * @param options - { onSuccess, onError, immediate }
 * @returns { execute, loading, error, data }
 */
export const useAsync = <T = any>(
  asyncFn: (...params: any[]) => Promise<T>,
  options: AsyncOptions<T> = {}
): AsyncState<T> => {
  const { onSuccess, onError, immediate = false } = options;

  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    data: T | null;
  }>({
    loading: false,
    error: null,
    data: null
  });

  const execute = useCallback(
    async (...params: any[]): Promise<T> => {
      setState({ loading: true, error: null, data: null });

      try {
        const response = await asyncFn(...params);
        setState({ loading: false, error: null, data: response });

        if (onSuccess) {
          onSuccess(response);
        }

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState({ loading: false, error: errorMessage, data: null });

        if (onError && error instanceof Error) {
          onError(error);
        }

        throw error;
      }
    },
    [asyncFn, onSuccess, onError]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    execute,
    loading: state.loading,
    error: state.error,
    data: state.data
  };
};

// ============================================
// 3. Multi-Step Loading Hook
// ============================================

/**
 * Manage multi-step blockchain operations
 * @param steps - Array of step names
 * @returns { currentStep, nextStep, resetSteps, progress }
 */
export const useSteps = (steps: string[] = []): StepsState => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  }, [steps.length]);

  const resetSteps = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const progress = ((currentStep + 1) / steps.length) * 100;

  return {
    currentStep,
    currentStepName: steps[currentStep] || '',
    nextStep,
    prevStep,
    goToStep,
    resetSteps,
    progress,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    totalSteps: steps.length
  };
};

// ============================================
// 4. Blockchain Transaction Hook
// ============================================

/**
 * Manage blockchain transaction lifecycle
 * @param transactionFn - Function that returns transaction
 * @returns Transaction state and control functions
 */
export const useBlockchainTransaction = (
  transactionFn: (...params: any[]) => Promise<any>
): BlockchainTransactionState => {
  const steps = [
    'Preparing',
    'Waiting for Wallet',
    'Broadcasting',
    'Confirming',
    'Complete'
  ];

  const { currentStep, nextStep, resetSteps, progress } = useSteps(steps);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...params: any[]) => {
      setIsLoading(true);
      setError(null);
      resetSteps();

      try {
        // Step 1: Preparing
        nextStep();
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 2: Waiting for wallet approval
        nextStep();
        const tx = await transactionFn(...params);

        // Step 3: Broadcasting
        nextStep();
        if (tx && tx.hash) {
          setTxHash(tx.hash);
        }

        // Step 4: Confirming
        nextStep();
        const receipt = tx && tx.wait ? await tx.wait() : tx;

        // Step 5: Complete
        nextStep();
        setIsLoading(false);

        return receipt;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        setError(errorMessage);
        setIsLoading(false);
        throw err;
      }
    },
    [transactionFn, nextStep, resetSteps]
  );

  return {
    execute,
    isLoading,
    currentStep,
    currentStepName: steps[currentStep] || '',
    progress,
    txHash,
    error,
    reset: resetSteps
  };
};

// ============================================
// 5. Debounced Loading Hook
// ============================================

/**
 * Prevent showing loading for very quick operations
 * @param loading - Actual loading state
 * @param delay - Minimum delay in ms (default: 300)
 * @returns Debounced loading state
 */
export const useDebouncedLoading = (loading: boolean, delay: number = 300): boolean => {
  const [debouncedLoading, setDebouncedLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (loading) {
      // Show loading after delay
      timeoutRef.current = setTimeout(() => {
        setDebouncedLoading(true);
      }, delay);
    } else {
      // Clear timeout and hide loading
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setDebouncedLoading(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading, delay]);

  return debouncedLoading;
};

// ============================================
// 6. Retry Hook
// ============================================

/**
 * Add retry logic to async operations
 * @param asyncFn - Async function to execute
 * @param options - { maxRetries, retryDelay, onRetry }
 * @returns Execute function and retry state
 */
export const useRetry = <T = any>(
  asyncFn: (...params: any[]) => Promise<T>,
  options: RetryOptions = {}
): RetryState<T> => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(
    async (...params: any[]): Promise<T> => {
      let lastError: any;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await asyncFn(...params);
          setRetryCount(0);
          setIsRetrying(false);
          return result;
        } catch (error) {
          lastError = error;

          if (attempt < maxRetries) {
            setRetryCount(attempt + 1);
            setIsRetrying(true);

            if (onRetry) {
              onRetry(attempt + 1, maxRetries);
            }

            await new Promise(resolve =>
              setTimeout(resolve, retryDelay * (attempt + 1))
            );
          }
        }
      }

      setIsRetrying(false);
      throw lastError;
    },
    [asyncFn, maxRetries, retryDelay, onRetry]
  );

  return {
    execute: executeWithRetry,
    retryCount,
    isRetrying,
    maxRetries
  };
};

// ============================================
// 7. Polling Hook
// ============================================

/**
 * Poll data at regular intervals
 * @param fetchFn - Function to fetch data
 * @param options - { interval, enabled }
 * @returns Data and control functions
 */
export const usePolling = <T = any>(
  fetchFn: () => Promise<T>,
  options: PollingOptions = {}
): PollingState<T> => {
  const { interval = 5000, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fetch failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (enabled) {
      fetchData(); // Initial fetch

      intervalRef.current = setInterval(fetchData, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchData, interval, enabled]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    stop
  };
};

// ============================================
// EXPORT ALL
// ============================================

export default {
  useLoading,
  useAsync,
  useSteps,
  useBlockchainTransaction,
  useDebouncedLoading,
  useRetry,
  usePolling
};
