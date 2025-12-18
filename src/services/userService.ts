import { contractService } from '@/contracts/contractService';
import { NetworkName } from '@/contracts/config';

export type UserRole = 'patient' | 'psm' | 'admin';

export interface SmartContractUser {
  address: string;
  role: UserRole;
  isActive: boolean;
  registrationDate: bigint;
  assignmentIds: bigint[];
}

export interface UserRegistrationParams {
  userAddress: string;
  role: UserRole;
  offChainId: string;
}

export class UserService {
  private network: NetworkName;
  private isInitialized: boolean = false;

  constructor(network: NetworkName = 'alfajores') {
    this.network = network;
  }

  async initializeWithSmartWallet(wallet: any) {
    console.log('🔧 UserService: Initializing with smart wallet...');
    await contractService.initializeWithSmartAccount(wallet);
    this.isInitialized = true;
    console.log('✅ UserService: Initialization complete');
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('UserService not initialized. Call initializeWithSmartWallet() first.');
    }
  }

  async registerUserOnChain(params: UserRegistrationParams) {
    try {
      await this.ensureInitialized();
      console.log('🚀 UserService: Registering user on-chain:', params);
      
      // Validate input parameters
      if (!params.userAddress || !params.offChainId || !params.role) {
        throw new Error('Missing required parameters for user registration');
      }
      
      // Ensure address is properly formatted
      const userAddress = params.userAddress.toLowerCase();
      if (!userAddress.startsWith('0x') || userAddress.length !== 42) {
        throw new Error(`Invalid user address format: ${params.userAddress}`);
      }
      
      // Create assignment parameters
      const assignmentParams = {
        userWallet: userAddress,
        psmWallet: '0x0000000000000000000000000000000000000000', // Empty PSM initially
        userOffChainId: String(params.offChainId), // Ensure it's a string
        psmOffChainId: '0', // Empty PSM ID as string
        assignmentType: 'registration',
        therapeuticFocus: params.role === 'patient' ? 'general' : 'therapist'
      };
      
      console.log('📋 UserService: Final assignment parameters:', {
        ...assignmentParams,
        userAddressLength: assignmentParams.userWallet.length,
        psmWalletLength: assignmentParams.psmWallet.length,
        userOffChainIdType: typeof assignmentParams.userOffChainId,
        psmOffChainIdType: typeof assignmentParams.psmOffChainId,
        assignmentTypeType: typeof assignmentParams.assignmentType,
        therapeuticFocusType: typeof assignmentParams.therapeuticFocus
      });
      
      // Use the new V2 contract's registerUser function for self-registration
      const result = await contractService.registerUser(
        assignmentParams.userOffChainId,
        assignmentParams.assignmentType,
        assignmentParams.therapeuticFocus
      );
      
      console.log('✅ UserService: User registration result:', result);

      return result;
    } catch (error) {
      console.error('❌ UserService: Failed to register user on-chain:', error);
      throw error;
    }
  }

  async getUserSmartContractData(userAddress: string): Promise<SmartContractUser | null> {
    try {
      // Get user's active assignments
      const assignmentsResult = await contractService.getUserActiveAssignments(userAddress);
      
      if (!assignmentsResult.success || !assignmentsResult.data || assignmentsResult.data.length === 0) {
        return null; // User not registered on-chain
      }

      // Get the first assignment to check registration
      const firstAssignmentResult = await contractService.getAssignment(assignmentsResult.data[0]);
      
      if (!firstAssignmentResult.success || !firstAssignmentResult.data) {
        return null;
      }

      const assignment = firstAssignmentResult.data;
      
      return {
        address: userAddress,
        role: assignment.therapeuticFocus === 'therapist' ? 'psm' : 'patient',
        isActive: assignment.isActive,
        registrationDate: assignment.startTime,
        assignmentIds: assignmentsResult.data
      };
    } catch (error) {
      console.error('Failed to get user smart contract data:', error);
      return null;
    }
  }

  async isUserRegisteredOnChain(userAddress: string): Promise<boolean> {
    const userData = await this.getUserSmartContractData(userAddress);
    return userData !== null;
  }

  async assignPSMToUser(userAddress: string, psmAddress: string, userOffChainId: string, psmOffChainId: string, therapeuticFocus: string) {
    try {
      const result = await contractService.createAssignment({
        userWallet: userAddress,
        psmWallet: psmAddress,
        userOffChainId,
        psmOffChainId,
        assignmentType: 'therapy',
        therapeuticFocus
      });

      return result;
    } catch (error) {
      console.error('Failed to assign PSM to user:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
