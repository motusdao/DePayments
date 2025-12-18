import { ethers } from 'ethers';
import { getContractAddresses, getNetworkConfig, NetworkName } from './config';
import MotusAssignmentsABI from './abis/MotusAssignmentsV2.json';
import {
  Assignment,
  CreateAssignmentParams,
  RecordPaymentParams,
  ContractTransactionResult,
  ContractReadResult,
} from './types';

export class ContractService {
  private provider: ethers.Provider | null = null;
  private smartAccountSigner: any = null; // Smart account signer from Privy
  private network: NetworkName;

  constructor(network: NetworkName = 'alfajores') {
    this.network = network;
  }

  // Initialize with ZeroDev Kernel client from Privy integration
  async initializeWithSmartAccount(kernelClient: any) {
    try {
      console.log('🔧 ContractService: Attempting to initialize with ZeroDev Kernel client:', {
        hasAccount: !!kernelClient?.account,
        hasSendTransaction: !!kernelClient?.sendTransaction,
        accountAddress: kernelClient?.account?.address,
      });

      if (kernelClient && kernelClient.account && kernelClient.sendTransaction) {
        // Initialize RPC provider for read operations
        const networkConfig = getNetworkConfig(this.network);
        this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
        
        // Store the kernel client directly - it's a drop-in replacement for viem Wallet Client
        this.smartAccountSigner = kernelClient;
        
        console.log('✅ Initialized with ZeroDev Kernel client:', kernelClient.account.address);
        console.log('🔧 Client type:', kernelClient.constructor.name);
      } else {
        console.error('❌ Invalid kernel client. Expected ZeroDev Kernel client with account and sendTransaction.');
        console.error('Available properties:', Object.keys(kernelClient || {}));
        throw new Error('Invalid kernel client - missing account or sendTransaction methods');
      }
    } catch (error) {
      console.error('❌ Failed to initialize with kernel client:', error);
      throw error;
    }
  }

  // Initialize with RPC provider
  async initializeWithRPC() {
    const networkConfig = getNetworkConfig(this.network);
    this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
  }

  // Get contract instances
  private getAssignmentsContract(withSigner = false) {
    const addresses = getContractAddresses(this.network);
    if (!this.provider) throw new Error('Provider not initialized');
    
    const providerOrSigner = withSigner && this.smartAccountSigner ? this.smartAccountSigner : this.provider;
    return new ethers.Contract(addresses.assignments, MotusAssignmentsABI, providerOrSigner);
  }

  // Assignments contract methods
  async createAssignment(params: CreateAssignmentParams): Promise<ContractTransactionResult> {
    try {
      console.log('📝 ContractService: Creating assignment with params:', params);
      
      if (!this.smartAccountSigner) {
        console.error('❌ ContractService: No smart wallet signer available');
        throw new Error('Smart wallet signer required for transactions');
      }
      
      // Use the kernel client since we're using ZeroDev integration with Privy
      console.log('🔧 ContractService: Using ZeroDev Kernel client for transaction');
      return await this.createAssignmentWithKernel(params);
    } catch (error: any) {
      console.error('❌ ContractService: Create assignment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create assignment'
      };
    }
  }

  // NEW: Register user using the V2 contract's registerUser function (allows self-registration)
  async registerUser(userOffChainId: string, assignmentType: string, therapeuticFocus: string): Promise<ContractTransactionResult> {
    try {
      console.log('👤 ContractService: Registering user with V2 contract:', {
        userOffChainId,
        assignmentType,
        therapeuticFocus
      });
      
      if (!this.smartAccountSigner) {
        console.error('❌ ContractService: No smart wallet signer available');
        throw new Error('Smart wallet signer required for transactions');
      }
      
      return await this.registerUserWithKernel(userOffChainId, assignmentType, therapeuticFocus);
    } catch (error: any) {
      console.error('❌ ContractService: Register user error:', error);
      return {
        success: false,
        error: error.message || 'Failed to register user'
      };
    }
  }

  // Register user using ZeroDev Kernel client (V2 contract function)
  private async registerUserWithKernel(userOffChainId: string, assignmentType: string, therapeuticFocus: string): Promise<ContractTransactionResult> {
    const addresses = getContractAddresses(this.network);
    
    console.log('🚀 Registering user with ZeroDev Kernel client:', this.smartAccountSigner.account.address);
    console.log('📋 Registration params:', {
      userOffChainId,
      assignmentType,
      therapeuticFocus
    });
    
    try {
      // Validate contract address
      if (!addresses.assignments || addresses.assignments.trim() === '') {
        throw new Error(`Contract address not found for network: ${this.network}`);
      }
      
      console.log('📍 Contract address (V2):', addresses.assignments);
      
      // Generate encoded data for registerUser function
      const encodedData = this.encodeRegisterUserData(userOffChainId, assignmentType, therapeuticFocus);
      console.log('🔒 Encoded registerUser data:', encodedData);
      console.log('📏 Encoded data length:', encodedData.length);
      
      // The kernel client is a drop-in replacement for viem's wallet client
      // Use sendTransaction directly - ZeroDev will handle the user operation creation
      const hash = await this.smartAccountSigner.sendTransaction({
        to: addresses.assignments as `0x${string}`,
        data: encodedData,
        value: BigInt(0)
      });
      
      console.log('✅ ZeroDev user registration sent:', hash);
      
      return {
        success: true,
        transactionHash: hash,
      };
    } catch (error: any) {
      console.error('❌ ZeroDev user registration failed:', {
        error: error.message,
        code: error.code,
        details: error.details,
        data: error.data
      });
      
      throw error;
    }
  }

  // Encode function call data for registerUser (V2 contract)
  private encodeRegisterUserData(userOffChainId: string, assignmentType: string, therapeuticFocus: string): `0x${string}` {
    const contract = new ethers.Contract(ethers.ZeroAddress, MotusAssignmentsABI);
    const data = contract.interface.encodeFunctionData('registerUser', [
      userOffChainId,
      assignmentType,
      therapeuticFocus
    ]);
    return data as `0x${string}`;
  }

  // Create assignment using ZeroDev Kernel client (following Privy's approach)
  private async createAssignmentWithKernel(params: CreateAssignmentParams): Promise<ContractTransactionResult> {
    const addresses = getContractAddresses(this.network);
    
    console.log('🚀 Creating assignment with ZeroDev Kernel client:', this.smartAccountSigner.account.address);
    console.log('📋 Assignment params:', {
      userWallet: params.userWallet,
      psmWallet: params.psmWallet,
      userOffChainId: params.userOffChainId,
      psmOffChainId: params.psmOffChainId,
      assignmentType: params.assignmentType,
      therapeuticFocus: params.therapeuticFocus
    });
    
    try {
      // Validate contract address
      if (!addresses.assignments || addresses.assignments.trim() === '') {
        throw new Error(`Contract address not found for network: ${this.network}`);
      }
      
      console.log('📍 Contract address:', addresses.assignments);
      
      // Validate all parameters are properly formatted
      console.log('🔍 Parameter validation:', {
        userWalletValid: ethers.isAddress(params.userWallet),
        psmWalletValid: ethers.isAddress(params.psmWallet),
        userOffChainIdType: typeof params.userOffChainId,
        psmOffChainIdType: typeof params.psmOffChainId,
        assignmentTypeType: typeof params.assignmentType,
        therapeuticFocusType: typeof params.therapeuticFocus,
        userOffChainIdLength: params.userOffChainId?.length,
        psmOffChainIdLength: params.psmOffChainId?.length
      });
      
      // Generate encoded data with detailed logging
      const encodedData = this.encodeCreateAssignmentData(params);
      console.log('🔒 Encoded transaction data:', encodedData);
      console.log('📏 Encoded data length:', encodedData.length);
      
      // The kernel client is a drop-in replacement for viem's wallet client
      // Use sendTransaction directly - ZeroDev will handle the user operation creation
      const hash = await this.smartAccountSigner.sendTransaction({
        to: addresses.assignments as `0x${string}`,
        data: encodedData,
        value: BigInt(0)
      });
      
      console.log('✅ ZeroDev user operation sent:', hash);
      
      // The kernel client automatically waits for the transaction to be mined
      // No need to manually create a public client and wait for receipt
      
      return {
        success: true,
        transactionHash: hash,
        // Receipt will be available from the kernel client if needed
      };
    } catch (error: any) {
      console.error('❌ ZeroDev user operation failed:', {
        error: error.message,
        code: error.code,
        details: error.details,
        data: error.data
      });
      
      // Try to decode the revert reason if possible
      if (error.details && error.details.includes('0x118cdaa7')) {
        console.error('❌ Contract execution reverted - likely invalid function arguments or contract state');
      }
      
      throw error;
    }
  }
  
  // Encode function call data for createAssignment
  private encodeCreateAssignmentData(params: CreateAssignmentParams): `0x${string}` {
    const contract = new ethers.Contract(ethers.ZeroAddress, MotusAssignmentsABI);
    const data = contract.interface.encodeFunctionData('createAssignment', [
      params.userWallet,
      params.psmWallet,
      params.userOffChainId,
      params.psmOffChainId,
      params.assignmentType,
      params.therapeuticFocus
    ]);
    return data as `0x${string}`;
  }

  // Create assignment using ethers signer (fallback)
  private async createAssignmentWithEthers(params: CreateAssignmentParams): Promise<ContractTransactionResult> {
    const contract = this.getAssignmentsContract(true);
    
    console.log('📝 Creating assignment with ethers signer:', await this.smartAccountSigner.getAddress());
    
    const tx = await contract.createAssignment(
      params.userWallet,
      params.psmWallet,
      params.userOffChainId,
      params.psmOffChainId,
      params.assignmentType,
      params.therapeuticFocus
    );
    
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: tx.hash,
      receipt
    };
  }

  async getAssignment(assignmentId: bigint): Promise<ContractReadResult<Assignment>> {
    try {
      const contract = this.getAssignmentsContract();
      const result = await contract.assignments(assignmentId);
      
      const assignment: Assignment = {
        id: result.id,
        userWallet: result.userWallet,
        psmWallet: result.psmWallet,
        userOffChainId: result.userOffChainId,
        psmOffChainId: result.psmOffChainId,
        startTime: result.startTime,
        assignmentType: result.assignmentType,
        therapeuticFocus: result.therapeuticFocus,
        isActive: result.isActive,
        sessionCount: result.sessionCount,
        totalPaid: result.totalPaid,
      };
      
      return {
        success: true,
        data: assignment
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get assignment'
      };
    }
  }

  async getUserActiveAssignments(userWallet: string): Promise<ContractReadResult<bigint[]>> {
    try {
      const contract = this.getAssignmentsContract();
      const assignmentIds = await contract.getUserActiveAssignments(userWallet);
      
      return {
        success: true,
        data: assignmentIds
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get user assignments'
      };
    }
  }

  async recordSessionPayment(params: RecordPaymentParams): Promise<ContractTransactionResult> {
    try {
      if (!this.smartAccountSigner) throw new Error('Smart wallet signer required for transactions');
      
      const contract = this.getAssignmentsContract(true);
      
      console.log('Recording payment with smart wallet:', await this.smartAccountSigner.getAddress());
      console.log('Payment params:', params);
      
      const tx = await contract.recordSessionPayment(
        params.assignmentId,
        params.platformFeePercent,
        { value: params.paymentAmount }
      );
      
      console.log('Payment transaction sent:', tx.hash);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: tx.hash,
        receipt
      };
    } catch (error: any) {
      console.error('Record payment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to record payment'
      };
    }
  }

  // Utility methods
  formatCelo(amount: bigint): string {
    return ethers.formatEther(amount);
  }

  parseCelo(amount: string): bigint {
    return ethers.parseEther(amount);
  }

  // Get contract addresses for current network
  getContractAddresses() {
    return getContractAddresses(this.network);
  }

  // Get network config
  getNetworkConfig() {
    return getNetworkConfig(this.network);
  }

  // Switch network
  setNetwork(network: NetworkName) {
    this.network = network;
    // Reset provider and smart wallet signer when switching networks
    this.provider = null;
    this.smartAccountSigner = null;
  }

  // Get smart account address
  async getSmartAccountAddress(): Promise<string | null> {
    if (!this.smartAccountSigner) return null;
    try {
      const address = await this.smartAccountSigner.getAddress();
      console.log('🔍 Smart wallet address:', address);
      return address;
    } catch (error) {
      console.error('❌ Failed to get smart wallet address:', error);
      return null;
    }
  }

  // Test contract connectivity with a simple read-only call
  async testContractConnectivity(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      if (!this.provider) {
        await this.initializeWithRPC();
      }
      
      const addresses = getContractAddresses(this.network);
      console.log('🧪 Testing contract connectivity...', {
        contractAddress: addresses.assignments,
        networkName: this.network,
        hasProvider: !!this.provider
      });
      
      // Try a simple read call first
      const contract = this.getAssignmentsContract();
      
      // Test if we can call a view function (owner() should exist in OpenZeppelin Ownable)
      const owner = await contract.owner();
      console.log('✅ Contract connectivity test passed. Owner address:', owner);
      
      // Compare with smart account address if available
      const smartAccountAddress = await this.getSmartAccountAddress();
      const isOwner = smartAccountAddress && owner.toLowerCase() === smartAccountAddress.toLowerCase();
      
      console.log('🔍 Ownership check:', {
        contractOwner: owner,
        smartAccount: smartAccountAddress,
        isSmartAccountOwner: isOwner
      });
      
      return {
        success: true,
        data: { 
          owner, 
          contractAddress: addresses.assignments,
          smartAccountAddress,
          isSmartAccountOwner: isOwner
        }
      };
    } catch (error: any) {
      console.error('❌ Contract connectivity test failed:', error);
      return {
        success: false,
        error: error.message || 'Contract connectivity test failed'
      };
    }
  }

  // Test creating assignment with minimal data to isolate encoding issues
  async testCreateAssignmentCall(): Promise<{ success: boolean; encodedData?: string; error?: string }> {
    try {
      const testParams = {
        userWallet: '0x1234567890123456789012345678901234567890',
        psmWallet: '0x0000000000000000000000000000000000000000',
        userOffChainId: 'test123',
        psmOffChainId: '0',
        assignmentType: 'registration',
        therapeuticFocus: 'general'
      };
      
      console.log('🧪 Testing createAssignment encoding with test data:', testParams);
      
      const encodedData = this.encodeCreateAssignmentData(testParams);
      console.log('✅ Function encoding test passed. Encoded data:', encodedData);
      
      return {
        success: true,
        encodedData
      };
    } catch (error: any) {
      console.error('❌ Function encoding test failed:', error);
      return {
        success: false,
        error: error.message || 'Function encoding test failed'
      };
    }
  }
}

// Export singleton instance
export const contractService = new ContractService();
