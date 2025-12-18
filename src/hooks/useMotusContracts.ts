import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSmartWallet } from '@/app/providers/AccountAbstraction';
import { contractService } from '@/contracts/contractService';
import {
  Assignment,
  CreateAssignmentParams,
  RecordPaymentParams,
  ContractTransactionResult,
  ContractReadResult,
} from '@/contracts/types';
import { NetworkName } from '@/contracts/config';

export function useMotusContracts(network: NetworkName = 'alfajores') {
  const { user, authenticated } = usePrivy();
  const { kernelClient, smartAccountAddress, isInitializing, error: walletError } = useSmartWallet();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize contract service with RPC for read operations
  useEffect(() => {
    const initializeContracts = async () => {
      try {
        setIsLoading(true);
        contractService.setNetwork(network);
        await contractService.initializeWithRPC();
        setIsInitialized(true);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize contracts');
      } finally {
        setIsLoading(false);
      }
    };

    initializeContracts();
  }, [network]);

  // Initialize with ZeroDev Kernel client when available
  useEffect(() => {
    const initializeWithKernelClient = async () => {
      if (authenticated && kernelClient && smartAccountAddress && !isInitializing) {
        try {
          setIsLoading(true);
          console.log('🔧 Initializing contract service with ZeroDev Kernel client...');
          
          await contractService.initializeWithSmartAccount(kernelClient);
          console.log('✅ Contract service initialized with ZeroDev Kernel client:', smartAccountAddress);
        } catch (err: any) {
          console.error('❌ Failed to initialize contract service with kernel client:', err);
          setError(err.message || 'Failed to initialize kernel client');
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeWithKernelClient();
  }, [authenticated, kernelClient, smartAccountAddress, isInitializing]);

  // Contract interaction methods
  const createAssignment = useCallback(async (
    params: CreateAssignmentParams
  ): Promise<ContractTransactionResult> => {
    if (!authenticated || !smartAccountAddress || !kernelClient) {
      return { success: false, error: 'ZeroDev smart wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Creating assignment with ZeroDev Kernel client:', smartAccountAddress);
      const result = await contractService.createAssignment(params);
      if (!result.success) {
        setError(result.error || 'Transaction failed');
      }
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create assignment';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, smartAccountAddress, kernelClient]);

  const getAssignment = useCallback(async (
    assignmentId: bigint
  ): Promise<ContractReadResult<Assignment>> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await contractService.getAssignment(assignmentId);
      if (!result.success) {
        setError(result.error || 'Failed to get assignment');
      }
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get assignment';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserAssignments = useCallback(async (
    userWallet?: string
  ): Promise<ContractReadResult<bigint[]>> => {
    const walletAddress = userWallet || smartAccountAddress;
    if (!walletAddress) {
      return { success: false, error: 'No smart account address available' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await contractService.getUserActiveAssignments(walletAddress);
      if (!result.success) {
        setError(result.error || 'Failed to get user assignments');
      }
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get user assignments';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [smartAccountAddress]);

  const recordPayment = useCallback(async (
    params: RecordPaymentParams
  ): Promise<ContractTransactionResult> => {
    if (!authenticated || !smartAccountAddress || !kernelClient) {
      return { success: false, error: 'ZeroDev smart wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('💰 Recording payment with ZeroDev smart wallet:', smartAccountAddress);
      const result = await contractService.recordSessionPayment(params);
      if (!result.success) {
        setError(result.error || 'Payment transaction failed');
      }
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to record payment';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, smartAccountAddress, kernelClient]);

  // Utility methods
  const formatCelo = useCallback((amount: bigint): string => {
    return contractService.formatCelo(amount);
  }, []);

  const parseCelo = useCallback((amount: string): bigint => {
    return contractService.parseCelo(amount);
  }, []);

  const getContractInfo = useCallback(() => {
    return {
      addresses: contractService.getContractAddresses(),
      network: contractService.getNetworkConfig(),
    };
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isInitialized,
    isLoading: isLoading || isInitializing,
    error: error || (walletError ? walletError.message : null),
    smartAccountAddress,
    authenticated,
    hasSmartAccount: !!smartAccountAddress && !!kernelClient,

    // Contract methods
    createAssignment,
    getAssignment,
    getUserAssignments,
    recordPayment,

    // Utility methods
    formatCelo,
    parseCelo,
    getContractInfo,
    clearError,

    // Network info
    network,
  };
}
