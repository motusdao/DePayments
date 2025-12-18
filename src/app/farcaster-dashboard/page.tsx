//@ts-nocheck
"use client";
import { Users, Wallet, Activity, TrendingUp } from 'lucide-react';
import React from 'react';
import { usePrivy, useWallets, useFarcasterSigner } from '@privy-io/react-auth';

export default function FarcasterDashboard() {
  const { user } = usePrivy();
  const farcasterAccount = user?.linkedAccounts?.find((account) => account.type === 'farcaster');

  // Use farcasterAccount for user data
  const fcUser = farcasterAccount || {};
  const fcClient = {}; // No client data available, default to empty
  console.log("farcaster", farcasterAccount);

  // Truncate wallet address for mobile display
  const truncateAddress = (address) => {
    if (!address) return "Wallet";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Farcaster-themed stats (mocked; integrate real fetches via Neynar or similar for production)
  const stats = [
    { label: 'Total Followers', value: '150', icon: Users, color: 'text-secondary' }, // Mock; use real from API
    { label: 'Wallet Balance', value: '1.45 ETH', icon: Wallet, color: 'text-info' },
    { label: 'Active Channels', value: '5', icon: Activity, color: 'text-primary' },
    { label: 'Total Casts', value: '200', icon: TrendingUp, color: 'text-secondary' },
  ];

  return (
    <div className="space-y-8 px-4 py-8 max-w-screen-md mx-auto" style={{ background: 'linear-gradient(135deg, #f7f7f8 0%, #e0c3fc 100%)', minHeight: '100vh' }}>
      {/* Farcaster Profile Header – Centered and mobile-friendly */}
      <div className="text-center space-y-2">
        <img
          src={fcUser.pfp || 'https://via.placeholder.com/100'}
          alt="Profile Picture"
          className="w-24 h-24 rounded-full mx-auto border-4 border-[#635BFF] shadow-md"
        />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222' }}>
          {fcUser.displayName || 'Farcaster User'}
        </h1>
        <h4 className="text-sm text-gray-600">{truncateAddress(fcUser.ownerAddress)}</h4>
        <p className="text-lg" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#635BFF' }}>
          @{fcUser.username || 'unknown'} (FID: {fcUser.fid || 'N/A'})
        </p>
        {fcUser.location?.description && (
          <p className="text-sm" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#888' }}>
            Location: {fcUser.location.description}
          </p>
        )}
        <p className="text-sm" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#888' }}>
          Powered by {fcClient.platformType || 'Farcaster'} Client
        </p>
      </div>

      {/* Stats Grid – Responsive for mobile */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className="w-full h-48 sm:h-52 md:h-56 lg:h-60"
            style={{
              background: '#f8f9fa',
              borderRadius: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              border: '1px solid #f3f3f3',
            }}
          >
            <div style={{
              width: '100%',
              height: '70%',
              borderRadius: 15,
              background: idx % 2 === 0
                ? 'linear-gradient(to bottom left, #e0c3fc, #f5f2f9)'
                : 'linear-gradient(to bottom, #c3cfe2, #e7c3e4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              padding: 12,
              position: 'relative',
            }}>
              <stat.icon className="w-5 h-5 mb-2 text-[#635BFF]" style={{ position: 'absolute', top: 12, left: 12 }} />
              {stat.label === 'Wallet Balance' ? (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: '#000', margin: 0, zIndex: 1, lineHeight: 1, fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>{stat.value.split(' ')[0]}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#000', margin: 0, zIndex: 1, lineHeight: 1, letterSpacing: 1, fontFamily: 'Jura, Arial, Helvetica, sans-serif', marginLeft: 4 }}>{stat.value.split(' ')[1] || 'ETH'}</span>
                </div>
              ) : (
                <h1 style={{ fontSize: 18, fontWeight: 600, color: '#000', margin: 0, zIndex: 1, fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>{stat.value}</h1>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#333', textAlign: 'left', marginTop: 8, marginBottom: 0, fontWeight: 400, fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity and Quick Actions – Stacked on mobile */}
      <div className="space-y-8 mt-8 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#111' }}>Recent Casts</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-sm" style={{ color: '#111' }}>Cast #{i} in /farcaster</p>
                  <p className="text-xs" style={{ color: '#888' }}>2 hours ago</p>
                </div>
                <span className="font-medium text-sm" style={{ color: '#635BFF' }}>Likes: 5</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#111' }}>Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full rounded-full bg-[#635BFF] hover:bg-[#7d4875] text-white py-3 px-4 font-bold transition text-sm" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>
              Browse Channels
            </button>
            <button className="w-full rounded-full bg-[#635BFF] hover:bg-[#7d4875] text-white py-3 px-4 font-bold transition text-sm" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>
              Cast Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}