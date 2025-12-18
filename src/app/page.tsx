"use client";
import { Users, Wallet, Activity, TrendingUp, CheckCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sdk as miniAppSdk } from '@farcaster/miniapp-sdk';  // For detection
import frameSdk from '@farcaster/frame-sdk';  // For signing (as in Privy docs)
import DepositModal from './components/DepositModal';
import { usePrivy, useWallets } from '@privy-io/react-auth';  // Updated Privy hooks
import { useLoginToFrame } from "@privy-io/react-auth/farcaster";
import RegistrationStatus from './components/RegistrationStatus';
import ClientOnly from './components/ClientOnly';

import { VerifyButton } from "./components/VerificationButton";
import { useSelf } from './providers/SelfProvider';
import { useUserManagement } from '@/hooks/useUserManagement';
import LoginPrompt from './components/LoginPrompt';

export default function Dashboard() {
  const { startVerification, isVerified, verificationError } = useSelf();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const { ready, authenticated, user } = usePrivy();  // Add ready and authenticated
  const { wallets } = useWallets();
  const address = wallets?.[0]?.address;
  const { initLoginToFrame, loginToFrame } = useLoginToFrame();  // Privy Mini App hook

  // User management with smart contract integration
  const {
    smartAccountAddress,
    userOnChainData,
    isRegisteredOnChain,
    offChainUserData,
    isLoading: userLoading,
    error: userError,
    getUserRole,
    shouldShowView
  } = useUserManagement();

  const userRole = getUserRole();
  const isPsychologist = userRole === 'psm';
  const userId = offChainUserData?.id || user?.id || "user-id-demo";
  const userWallet = smartAccountAddress || address;
  const psmWallet = undefined;
  const treasuryWallet = undefined;

  // Dynamic stats based on user role and data
  const getStatsForUser = () => {
    if (isPsychologist) {
      return [
        { label: 'Total Patients', value: offChainUserData?.totalSesiones?.toString() || '0', icon: Users, color: 'text-secondary' },
        { label: 'Wallet Balance', value: '1.45 CELO', icon: Wallet, color: 'text-info' },
        { label: 'Active Sessions', value: '3', icon: Activity, color: 'text-primary' },
        { label: 'Total Earnings', value: `$${offChainUserData?.totalIngresos?.toString() || '0'}`, icon: TrendingUp, color: 'text-secondary' },
      ];
    } else {
      return [
        { label: 'Current PSM', value: offChainUserData?.currentPsm ? '1' : '0', icon: Users, color: 'text-secondary' },
        { label: 'Wallet Balance', value: '1.45 CELO', icon: Wallet, color: 'text-info' },
        { label: 'Sessions Left', value: '4', icon: Activity, color: 'text-primary' },
        { label: 'Total Spent', value: '$180', icon: TrendingUp, color: 'text-secondary' },
      ];
    }
  };

  const stats = getStatsForUser();

  const router = useRouter();
  const [isMiniApp, setIsMiniApp] = useState(false);  // State for async detection
  const [isLoading, setIsLoading] = useState(true);  // Handle async loading
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    
    console.log("motus")
    const checkMiniAppAndLogin = async () => {
      try {
        const inMiniApp = await miniAppSdk.isInMiniApp();  // Detect Mini App context
        setIsMiniApp(inMiniApp);
        console.log("mini app config",inMiniApp, ready,authenticated)
        if (inMiniApp && ready) {
          // Auto-login using Privy Mini App recipe
          const { nonce } = await initLoginToFrame();
          const result = await frameSdk.actions.signIn({ nonce });  // Sign with SDK (seamless in context)
          await loginToFrame({
            message: result.message,
            signature: result.signature,
          });
          console.log('Auto-login complete in Mini App context');
        }

        if (inMiniApp) {
          router.push('/farcaster-dashboard');  // Redirect if in Mini App
        }
      } catch (error) {
        console.error('Mini App detection/login error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkMiniAppAndLogin();
  }, [ready, authenticated, router, hasMounted]);

  // Redirect unregistered users to appropriate registration flow
  useEffect(() => {
    if (!userLoading && authenticated && smartAccountAddress && !isRegisteredOnChain) {
      // Show registration options instead of full dashboard
      console.log('User not registered on-chain, showing registration options');
    }
  }, [userLoading, authenticated, smartAccountAddress, isRegisteredOnChain]);

  if (!hasMounted || isLoading || isMiniApp) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#635BFF] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );  // Loading state during detection/redirect
  }

  if (!authenticated) {
    return <LoginPrompt />;
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#635BFF] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Show registration interface ONLY if user has no profile data at all
  // If they have offChainUserData, they should see the dashboard
  if (!offChainUserData) {
    return (
      <div className="space-y-8 px-4 py-8" style={{ background: 'linear-gradient(135deg, #f7f7f8 0%, #e0c3fc 100%)', minHeight: '100vh' }}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222' }}>
            Welcome to MotusDAO
          </h1>
          <p className="text-gray-600 mb-6">
            Connect with certified mental health professionals in our decentralized therapeutic network
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <RegistrationStatus />
          
          {userError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-red-800 text-sm">{userError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full dashboard for registered users
  return (
    <div className="space-y-8 px-4 py-8" style={{ background: 'linear-gradient(135deg, #f7f7f8 0%, #e0c3fc 100%)', minHeight: '100vh' }}>
      <div className="flex justify-between items-center">
        <h1 className="text-center" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222', fontSize: '1rem', fontWeight: 500 }}>
          {isPsychologist ? 'Therapist Dashboard' : 'Patient Dashboard'}
        </h1>
        
        {isRegisteredOnChain && (
          <div className="flex items-center text-green-600 text-sm">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>Registered on-chain</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            style={{
              width: 160,
              height: 200,
              background: '#f8f9fa',
              borderRadius: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              border: '1px solid #f3f3f3',
            }}
          >
            <div style={{
              width: '100%',
              height: 130,
              borderRadius: 15,
              background: idx % 2 === 0
                ? 'linear-gradient(to bottom left, #e0c3fc, #f5f2f9)'
                : 'linear-gradient(to bottom, #c3cfe2, #e7c3e4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              padding: 16,
              position: 'relative',
            }}>
              <stat.icon className="w-6 h-6 mb-2 text-[#635BFF]" style={{ position: 'absolute', top: 16, left: 16 }} />
              {stat.label.includes('Balance') ? (
                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 4}}>
                  <span style={{ fontSize: 20, fontWeight: 600, color: '#000', margin: 0, zIndex: 1, lineHeight: 1, fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>{stat.value.split(' ')[0]}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#000', margin: 0, zIndex: 1, lineHeight: 1, letterSpacing: 1, fontFamily: 'Jura, Arial, Helvetica, sans-serif', marginLeft: 4 }}>{stat.value.split(' ')[1] || 'CELO'}</span>
                </div>
              ) : (
                <h1 style={{ fontSize: 20, fontWeight: 600, color: '#000', margin: 0, zIndex: 1, fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>{stat.value}</h1>
              )}
            </div>
            <p style={{ fontSize: 14, color: '#333', textAlign: 'left', marginTop: 12, marginBottom: 0, fontWeight: 400, fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>{stat.label}</p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#111' }}>Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium" style={{ color: '#111' }}>
                    {isPsychologist ? `Session with Patient #${i}` : `Session with ${offChainUserData?.currentPsm?.nombre || 'PSM'} #${i}`}
                  </p>
                  <p className="text-sm" style={{ color: '#888' }}>2 hours ago</p>
                </div>
                <span className="font-medium" style={{ color: '#635BFF' }}>0.1 CELO</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#111' }}>Quick Actions</h3>
          <div className="space-y-3">
            {isPsychologist ? (
              <>
                <button 
                  onClick={() => router.push('/psms')}
                  className="w-full rounded-full bg-[#635BFF] hover:bg-[#7d4875] text-white py-3 px-4 font-bold transition" 
                  style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
                >
                  Manage Patients
                </button>
                <button
                  onClick={() => router.push('/payments')}
                  className="w-full rounded-full bg-[#F7F7F8] border border-[#EDEDED] hover:bg-[#EDEDED] text-[#111] py-3 px-4 font-bold transition"
                  style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
                >
                  View Earnings
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => router.push('/psms')}
                  className="w-full rounded-full bg-[#635BFF] hover:bg-[#7d4875] text-white py-3 px-4 font-bold transition" 
                  style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
                >
                  Find Therapist
                </button>
                <button
                  onClick={() => router.push('/current-hire')}
                  className="w-full rounded-full bg-[#F7F7F8] border border-[#EDEDED] hover:bg-[#EDEDED] text-[#111] py-3 px-4 font-bold transition"
                  style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
                >
                  My Therapist
                </button>
              </>
            )}
            
            <button
              disabled={!isVerified}
              className="w-full rounded-full bg-[#F7F7F8] border border-[#EDEDED] hover:bg-[#EDEDED] text-[#111] py-3 px-4 font-bold transition"
              style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
              onClick={() => setShowDepositModal(true)}
            >
              Deposit Funds
            </button>
            <VerifyButton/>
          </div>
        </div>
      </div>
      
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        isPsychologist={isPsychologist}
        userId={userId}
        userWallet={userWallet}
        psmWallet={psmWallet}
        treasuryWallet={treasuryWallet}
      />
    </div>
  );
}