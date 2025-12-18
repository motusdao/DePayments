'use client';

import React, { useState } from 'react';
import { contractService } from '@/contracts/contractService';
import { userService } from '@/services/userService';
import { useSmartWallet } from '@/app/providers/AccountAbstraction';

const ContractTest = () => {
  const { kernelClient, smartAccountAddress, isInitializing, error } = useSmartWallet();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, success: boolean, data?: any, error?: string) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toISOString()
    }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Check smart wallet status
    addResult('Smart Wallet Status', !!kernelClient && !!smartAccountAddress, {
      hasClient: !!kernelClient,
      hasAddress: !!smartAccountAddress,
      address: smartAccountAddress,
      isInitializing
    });

    if (!kernelClient || !smartAccountAddress) {
      addResult('Tests Aborted', false, null, 'Smart wallet not ready');
      setIsRunning(false);
      return;
    }

    try {
      // Test 2: Initialize user service
      await userService.initializeWithSmartWallet(kernelClient);
      addResult('User Service Initialization', true);
    } catch (err: any) {
      addResult('User Service Initialization', false, null, err.message);
    }

    try {
      // Test 3: Test contract connectivity
      const connectivityResult = await contractService.testContractConnectivity();
      addResult('Contract Connectivity', connectivityResult.success, connectivityResult.data, connectivityResult.error);
    } catch (err: any) {
      addResult('Contract Connectivity', false, null, err.message);
    }

    try {
      // Test 4: Test function encoding
      const encodingResult = await contractService.testCreateAssignmentCall();
      addResult('Function Encoding', encodingResult.success, { encodedData: encodingResult.encodedData }, encodingResult.error);
    } catch (err: any) {
      addResult('Function Encoding', false, null, err.message);
    }

    try {
      // Test 5: Try actual registration (this is where the error occurs)
      const registrationResult = await userService.registerUserOnChain({
        userAddress: smartAccountAddress,
        role: 'patient',
        offChainId: 'test-user-123'
      });
      addResult('User Registration', registrationResult.success, registrationResult, registrationResult.error);
    } catch (err: any) {
      addResult('User Registration', false, null, err.message);
    }

    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed top-20 right-4 w-96 max-h-96 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Contract Tests</h3>
        <button
          onClick={clearResults}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-600">
          Smart Wallet: {smartAccountAddress ? `${smartAccountAddress.slice(0, 8)}...` : 'Not connected'}
        </p>
        <p className="text-sm text-gray-600">
          Status: {isInitializing ? 'Initializing...' : kernelClient ? 'Ready' : 'Not ready'}
        </p>
      </div>

      <button
        onClick={runTests}
        disabled={isRunning || !kernelClient}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded mb-4 disabled:bg-gray-300"
      >
        {isRunning ? 'Running Tests...' : 'Run Contract Tests'}
      </button>

      <div className="space-y-2">
        {testResults.map((result, index) => (
          <div key={index} className={`p-2 rounded text-sm ${
            result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className="font-medium">
              {result.success ? '✅' : '❌'} {result.test}
            </div>
            {result.error && (
              <div className="text-xs mt-1 opacity-75">
                Error: {result.error}
              </div>
            )}
            {result.data && (
              <details className="text-xs mt-1">
                <summary className="cursor-pointer opacity-75">Data</summary>
                <pre className="mt-1 overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContractTest;
