'use client'
import { useUserManagement } from '@/hooks/useUserManagement';
import { usePrivy } from '@privy-io/react-auth';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function UserStateDebug() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { authenticated, user } = usePrivy();
  const {
    smartAccountAddress,
    userOnChainData,
    isRegisteredOnChain,
    offChainUserData,
    isLoading,
    error,
    getUserRole
  } = useUserManagement();

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg max-w-sm z-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span>Debug: User State</span>
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      
      {isExpanded && (
        <div className="p-3 border-t border-gray-200 text-xs space-y-2 max-h-80 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Authenticated:</strong>
              <span className={authenticated ? 'text-green-600' : 'text-red-600'}>
                {authenticated ? ' ✓' : ' ✗'}
              </span>
            </div>
            
            <div>
              <strong>Loading:</strong>
              <span className={isLoading ? 'text-yellow-600' : 'text-gray-600'}>
                {isLoading ? ' ⏳' : ' ✓'}
              </span>
            </div>
            
            <div>
              <strong>Smart Wallet:</strong>
              <span className={smartAccountAddress ? 'text-green-600' : 'text-red-600'}>
                {smartAccountAddress ? ' ✓' : ' ✗'}
              </span>
            </div>
            
            <div>
              <strong>On-chain:</strong>
              <span className={isRegisteredOnChain ? 'text-green-600' : 'text-red-600'}>
                {isRegisteredOnChain ? ' ✓' : ' ✗'}
              </span>
            </div>
            
            <div>
              <strong>Off-chain:</strong>
              <span className={offChainUserData ? 'text-green-600' : 'text-red-600'}>
                {offChainUserData ? ' ✓' : ' ✗'}
              </span>
            </div>
            
            <div>
              <strong>Role:</strong>
              <span className="text-blue-600">
                {getUserRole() || 'None'}
              </span>
            </div>
          </div>
          
          {error && (
            <div className="text-red-600 text-xs">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {smartAccountAddress && (
            <div className="text-gray-600">
              <strong>Address:</strong>
              <div className="break-all text-xs">{smartAccountAddress}</div>
            </div>
          )}
          
          {offChainUserData && (
            <div className="text-gray-600">
              <strong>Off-chain Data:</strong>
              <div className="text-xs bg-gray-100 p-2 rounded mt-1">
                {JSON.stringify({
                  id: offChainUserData.id,
                  nombre: offChainUserData.nombre,
                  email: offChainUserData.email,
                  wallet: offChainUserData.wallet
                }, null, 2)}
              </div>
            </div>
          )}
          
          {userOnChainData && (
            <div className="text-gray-600">
              <strong>On-chain Data:</strong>
              <div className="text-xs bg-gray-100 p-2 rounded mt-1">
                {JSON.stringify(userOnChainData, null, 2)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
