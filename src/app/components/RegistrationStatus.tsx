'use client'
import { useUserManagement } from '@/hooks/useUserManagement';
import { CheckCircle, AlertCircle, User, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function RegistrationStatus() {
  const {
    authenticated,
    smartAccountAddress,
    offChainUserData,
    isRegisteredOnChain,
    isLoading,
    getUserRole
  } = useUserManagement();

  if (!authenticated) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center">
          <Wallet className="w-8 h-8 text-blue-500 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800">Connect Your Wallet</h3>
            <p className="text-blue-600 text-sm">Please connect your wallet to see your registration status</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <p className="text-gray-600">Loading registration status...</p>
        </div>
      </div>
    );
  }

  const userRole = getUserRole();

  // Fully registered (both on-chain and off-chain)
  if (isRegisteredOnChain && offChainUserData) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Registration Complete
              </h3>
              <p className="text-green-600 text-sm">
                You're fully registered as a {userRole === 'psm' ? 'therapist' : 'patient'} on MotusDAO
              </p>
            </div>
          </div>
          <Link 
            href="/profile"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    );
  }

  // Partially registered (only off-chain data) - this is actually fine for using the app
  if (offChainUserData && !isRegisteredOnChain) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-800">
                Welcome Back!
              </h3>
              <p className="text-blue-600 text-sm">
                Your profile is ready. You can use most features. Complete blockchain registration for full access.
              </p>
            </div>
          </div>
          <Link 
            href="/profile"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    );
  }

  // Not registered at all
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <User className="w-8 h-8 text-blue-500 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800">Welcome to MotusDAO</h3>
            <p className="text-blue-600 text-sm">
              Get started by registering as a patient or therapist
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link 
            href="/user-register"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Join as Patient
          </Link>
          <Link 
            href="/psms-register"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Join as Therapist
          </Link>
        </div>
      </div>
    </div>
  );
}
