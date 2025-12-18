import React, { useState } from 'react';
import { useMotusContracts } from '../../hooks/useMotusContracts';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSmartWallet } from '../providers/AccountAbstraction';

const SmartWalletTest: React.FC = () => {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { kernelClient, smartAccountAddress, isInitializing, error: walletError } = useSmartWallet();
  const { createAssignment, error: contractError, isLoading } = useMotusContracts();
  const [testResult, setTestResult] = useState<string>('');

  const testCreateAssignment = async () => {
    if (!smartAccountAddress) {
      setTestResult('❌ No smart account address available');
      return;
    }

    try {
      setTestResult('🔄 Testing assignment creation...');
      
      const result = await createAssignment({
        userWallet: smartAccountAddress,
        psmWallet: '0x0000000000000000000000000000000000000000', // Test with zero address
        userOffChainId: 'test-user-123',
        psmOffChainId: '0',
        assignmentType: 'registration',
        therapeuticFocus: 'general'
      });

      if (result.success) {
        setTestResult(`✅ Assignment created successfully! TX: ${result.transactionHash}`);
      } else {
        setTestResult(`❌ Assignment creation failed: ${result.error}`);
      }
    } catch (error: any) {
      setTestResult(`❌ Assignment creation error: ${error.message}`);
    }
  };

  if (!authenticated) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50">
        <h3 className="text-lg font-semibold mb-2">Smart Wallet Test</h3>
        <p className="mb-4">Please login to test smart wallet functionality</p>
        <button
          onClick={login}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Login
        </button>
      </div>
    );
  }

  // Get wallet info for display
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">ZeroDev + Privy Smart Wallet Test</h3>
      
      <div className="space-y-2 mb-4">
        <div>
          <strong>Authentication Status:</strong>{' '}
          <span className={authenticated ? 'text-green-600' : 'text-red-600'}>
            {authenticated ? '✅ Authenticated' : '❌ Not authenticated'}
          </span>
        </div>
        
        <div>
          <strong>Wallet Status:</strong>{' '}
          <span className={isInitializing ? 'text-yellow-600' : smartAccountAddress ? 'text-green-600' : 'text-red-600'}>
            {isInitializing ? '🔄 Initializing...' : smartAccountAddress ? '✅ Ready' : '❌ Not available'}
          </span>
        </div>
        
        <div>
          <strong>Smart Account Address:</strong>{' '}
          <span className="font-mono text-sm">
            {smartAccountAddress || 'Not available'}
          </span>
        </div>
        
        <div>
          <strong>Embedded Wallet:</strong>{' '}
          <span className={embeddedWallet ? 'text-green-600' : 'text-red-600'}>
            {embeddedWallet ? `✅ ${embeddedWallet.address}` : '❌ Not available'}
          </span>
        </div>
        
        <div>
          <strong>ZeroDev Kernel Client:</strong>{' '}
          <span className={kernelClient ? 'text-green-600' : 'text-red-600'}>
            {kernelClient ? '✅ Available' : '❌ Not available'}
          </span>
        </div>
        
        {walletError && (
          <div className="text-red-600">
            <strong>Wallet Error:</strong> {walletError.message}
          </div>
        )}
        
        {contractError && (
          <div className="text-red-600">
            <strong>Contract Error:</strong> {contractError}
          </div>
        )}
      </div>

      <div className="mb-4">
        <button
          onClick={testCreateAssignment}
          disabled={!smartAccountAddress || isLoading || isInitializing}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Testing...' : 'Test Create Assignment'}
        </button>
      </div>

      {testResult && (
        <div className="p-3 bg-white border rounded">
          <strong>Test Result:</strong>
          <div className="mt-1">{testResult}</div>
        </div>
      )}
    </div>
  );
};

export default SmartWalletTest;
