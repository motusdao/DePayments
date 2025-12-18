import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSmartWallet } from '@/app/providers/AccountAbstraction';
import { userService, UserRole, SmartContractUser, UserRegistrationParams } from '@/services/userService';

export function useUserManagement() {
  const { authenticated, user } = usePrivy();
  const { kernelClient, smartAccountAddress: smartWalletAddress, isInitializing, error: smartWalletError } = useSmartWallet();
  
  const [userOnChainData, setUserOnChainData] = useState<SmartContractUser | null>(null);
  const [isRegisteredOnChain, setIsRegisteredOnChain] = useState<boolean>(false);
  const [offChainUserData, setOffChainUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user service when ZeroDev Kernel client is ready
  useEffect(() => {
    const initializeUserService = async () => {
      if (kernelClient && smartWalletAddress && !isInitializing) {
        try {
          console.log('🔧 Initializing user service with ZeroDev Kernel client:', smartWalletAddress);
          
          await userService.initializeWithSmartWallet(kernelClient);
          console.log('✅ User service initialized with ZeroDev smart wallet:', smartWalletAddress);
        } catch (err: any) {
          console.error('❌ Failed to initialize user service with ZeroDev smart wallet:', err);
          setError(`User service initialization failed: ${err.message}`);
        }
      }
    };

    initializeUserService();
  }, [kernelClient, smartWalletAddress, isInitializing]);

  // Load user data from both on-chain and off-chain sources
  const loadUserData = useCallback(async () => {
    if (!smartWalletAddress) {
      // If no smart wallet, still try to load data using user ID or other methods
      setIsLoading(false);
      setIsRegisteredOnChain(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load off-chain data from API first (faster)
      console.log('🔍 Querying user data for wallet:', smartWalletAddress);
      const response = await fetch(`/api/users?wallet=${smartWalletAddress}`);
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('📄 Raw API response:', userData);
        if (userData && userData.id) {
          setOffChainUserData(userData);
          console.log('✅ Off-chain user data found:', userData);
        } else {
          console.log('❌ No off-chain user data found (null or empty response)');
          setOffChainUserData(null);
        }
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', response.status, errorText);
        console.log('❌ No existing user data found for wallet:', smartWalletAddress);
        setOffChainUserData(null);
      }

      // Load on-chain data
      try {
        const onChainData = await userService.getUserSmartContractData(smartWalletAddress);
        setUserOnChainData(onChainData);
        setIsRegisteredOnChain(onChainData !== null);
        console.log('On-chain data:', { onChain: onChainData, registered: onChainData !== null });
      } catch (onChainError) {
        console.log('Failed to load on-chain data (this is normal if not registered yet):', onChainError);
        setUserOnChainData(null);
        setIsRegisteredOnChain(false);
      }
      
    } catch (err: any) {
      console.error('Failed to load user data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [smartWalletAddress]);

  // Handle authentication state
  useEffect(() => {
    if (!authenticated) {
      setIsLoading(false);
      setUserOnChainData(null);
      setIsRegisteredOnChain(false);
      setOffChainUserData(null);
      setError(null);
    }
  }, [authenticated]);

  // Load user data when smart account is available
  useEffect(() => {
    if (smartWalletAddress && !isInitializing) {
      loadUserData();
    } else if (authenticated && !isInitializing) {
      // If authenticated but no smart wallet, still finish loading
      setIsLoading(false);
    }
  }, [smartWalletAddress, loadUserData, authenticated, isInitializing]);

  // Wait for smart wallet to be fully initialized
  const waitForSmartWallet = useCallback(async (timeoutMs = 30000): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkWallet = () => {
        if (smartWalletAddress && !isInitializing) {
          console.log('✅ Smart wallet is ready:', smartWalletAddress);
          resolve();
        } else if (Date.now() - startTime > timeoutMs) {
          reject(new Error('Timeout waiting for smart wallet initialization'));
        } else {
          console.log('⏳ Waiting for smart wallet... address:', smartWalletAddress, 'initializing:', isInitializing);
          setTimeout(checkWallet, 500);
        }
      };
      
      checkWallet();
    });
  }, [smartWalletAddress, isInitializing]);

  // Register user on smart contract
  const registerOnChain = useCallback(async (role: UserRole, offChainId?: string) => {
    if (!smartWalletAddress) {
      throw new Error('Smart wallet not connected');
    }

    if (!offChainId && !offChainUserData?.id) {
      throw new Error('User must be registered off-chain first');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Wait for smart wallet to be fully initialized
      console.log('🔄 Ensuring smart wallet is ready for transaction...');
      await waitForSmartWallet();
      
      // Double-check that user service has the signer
      if (!userService) {
        throw new Error('User service not ready');
      }

      const params: UserRegistrationParams = {
        userAddress: smartWalletAddress,
        role,
        offChainId: offChainId || offChainUserData.id
      };

      console.log('🚀 Starting on-chain registration with params:', params);
      const result = await userService.registerUserOnChain(params);
      
      if (result.success) {
        // Reload user data to reflect changes
        await loadUserData();
        return result;
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (err: any) {
      console.error('❌ On-chain registration failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [smartWalletAddress, offChainUserData, loadUserData, waitForSmartWallet]);

  // Register user off-chain (database)
  const registerOffChain = useCallback(async (userData: any) => {
    if (!smartWalletAddress) {
      throw new Error('Smart wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          wallet: smartWalletAddress,
          owner: smartWalletAddress,
        }),
      });

      if (response.status === 409) {
        // User already exists, let's fetch their data instead
        console.log('User already exists, fetching existing data...');
        const existingUserResponse = await fetch(`/api/users?wallet=${smartWalletAddress}`);
        if (existingUserResponse.ok) {
          const existingUser = await existingUserResponse.json();
          setOffChainUserData(existingUser);
          return existingUser;
        } else {
          throw new Error('User already exists but could not fetch existing data');
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register user off-chain');
      }

      const result = await response.json();
      setOffChainUserData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [smartWalletAddress]);

  // Complete registration flow (both on-chain and off-chain)
  const completeRegistration = useCallback(async (userData: any, role: UserRole) => {
    try {
      // Step 1: Register off-chain first
      const offChainResult = await registerOffChain(userData);
      
      // Step 2: Register on-chain with the off-chain ID
      const onChainResult = await registerOnChain(role, offChainResult.id);
      
      return { offChain: offChainResult, onChain: onChainResult };
    } catch (error) {
      console.error('Complete registration failed:', error);
      throw error;
    }
  }, [registerOffChain, registerOnChain]);

  // Update user profile
  const updateProfile = useCallback(async (updatedData: any) => {
    if (!smartWalletAddress) {
      throw new Error('Smart wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedData,
          wallet: smartWalletAddress,
          owner: smartWalletAddress,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      setOffChainUserData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [smartWalletAddress]);

  // Determine user role based on available data
  const getUserRole = useCallback((): UserRole | null => {
    if (userOnChainData?.role) {
      return userOnChainData.role;
    }
    // Could also check off-chain data for role determination
    return null;
  }, [userOnChainData]);

  // Check if user should see certain views
  const shouldShowView = useCallback((viewType: 'dashboard' | 'registration' | 'profile') => {
    const role = getUserRole();
    
    switch (viewType) {
      case 'dashboard':
        return isRegisteredOnChain && role !== null;
      case 'registration':
        // Show registration if no off-chain data OR not registered on-chain
        return !offChainUserData || !isRegisteredOnChain;
      case 'profile':
        return authenticated && smartWalletAddress !== null;
      default:
        return false;
    }
  }, [isRegisteredOnChain, getUserRole, authenticated, smartWalletAddress, offChainUserData]);

  return {
    // State
    smartAccountAddress: smartWalletAddress,
    userOnChainData,
    isRegisteredOnChain,
    offChainUserData,
    isLoading,
    error,
    authenticated,
    
    // Actions
    registerOnChain,
    registerOffChain,
    completeRegistration,
    updateProfile,
    loadUserData,
    
    // Utility
    getUserRole,
    shouldShowView,
    
    // Clear error
    clearError: () => setError(null),
  };
}
