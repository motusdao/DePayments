'use client';
import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Wallet, Shield, Zap, CheckCircle } from 'lucide-react';

export default function LoginPrompt() {
  const { login, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!ready) return;
    
    setIsConnecting(true);
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#635BFF]"></div>
      </div>
    );
  }

  if (authenticated) {
    return null; // Don't show if already authenticated
  }

  return (
    <div className="space-y-8 px-4 py-8" style={{ background: 'linear-gradient(135deg, #f7f7f8 0%, #e0c3fc 100%)', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222' }}>
            Welcome to MotusDAO
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            The future of decentralized mental health care
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Shield className="w-16 h-16 text-[#635BFF] mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>
              Secure & Private
            </h3>
            <p className="text-gray-600 text-sm">
              Your data is protected by blockchain technology and end-to-end encryption
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Zap className="w-16 h-16 text-[#635BFF] mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>
              Smart Contracts
            </h3>
            <p className="text-gray-600 text-sm">
              Transparent, trustless payments and certifications powered by smart contracts
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-[#635BFF] mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>
              Verified Therapists
            </h3>
            <p className="text-gray-600 text-sm">
              All therapists are verified and certified through our blockchain-based system
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto">
          <Wallet className="w-20 h-20 text-[#635BFF] mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222' }}>
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-8 text-sm">
            Connect your wallet to get started with MotusDAO. We'll create a smart wallet for you that's secure and easy to use.
          </p>
          
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full rounded-full bg-[#635BFF] hover:bg-[#7d4875] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 px-6 font-bold text-lg transition-colors flex items-center justify-center"
            style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5 mr-2" />
                Connect Wallet
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            New to crypto? Don't worry! We'll guide you through the process.
          </p>
        </div>
      </div>
    </div>
  );
}
