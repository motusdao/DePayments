"use client";

import "./globals.css";
import { PrivyProvider } from "@privy-io/react-auth";
import { useState, useEffect, ReactNode } from "react";
import { LocalSmartWalletProvider } from "./providers/AccountAbstraction";
import { SelfProvider } from "./providers/SelfProvider";
import { MiniAppProvider } from '@neynar/react';
import { celoAlfajores } from 'viem/chains';
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import UserStateDebug from "./components/UserStateDebug";
import ClientOnly from "./components/ClientOnly";
import ErrorBoundary from "./components/ErrorBoundary";
import ContractTest from "./components/ContractTest";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="fc:frame" content="vNext" />
        <link
          href="https://fonts.googleapis.com/css2?family=Jura:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gray-50">
        <MiniAppProvider analyticsEnabled={true}>
          <PrivyProvider
            appId={appId}
            clientId={clientId}
            config={{
              appearance: {
                theme: 'light',
                accentColor: '#635BFF',
                walletList: ['metamask', 'detected_wallets'],
                showWalletLoginFirst: false,
              },
              loginMethods: ['email', 'wallet'],
              embeddedWallets: {
                createOnLogin: 'users-without-wallets',
                requireUserPasswordOnCreate: false,
              },
              defaultChain: celoAlfajores,
              supportedChains: [celoAlfajores],
            }}
          >
            <LocalSmartWalletProvider zeroDevProjectId="e46f4ac3-404e-42fc-a3d3-1c75846538a8">
              <ErrorBoundary fallback={
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 text-sm">⚠️ Smart wallet initialization in progress. Some features may be limited.</p>
                </div>
              }>
                <SelfProvider
                  appName="MyCeloApp"
                  scope="my-celo-app-scope"
                  endpoint="https://your-app.com/api/verify"
                  minimumAge={21}
                  excludedCountries={['IRN', 'PRK']}
                >
                  <FrameSafeLayout>{children}</FrameSafeLayout>
                </SelfProvider>
              </ErrorBoundary>
            </LocalSmartWalletProvider>
          </PrivyProvider>
        </MiniAppProvider>
      </body>
    </html>
  );
}

interface LayoutProps {
  children: ReactNode;
}

function FrameSafeLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFrame, setIsFrame] = useState(false);

  // Check if we're in a frame after hydration to avoid SSR mismatch
  useEffect(() => {
    setIsFrame(window.self !== window.top);
  }, []);

  return (
    <div className={`flex ${isFrame ? 'h-auto' : 'h-screen'} bg-gray-50`}>
      {/* Conditional sidebar rendering - hidden in frames */}
      {!isFrame && (
        <>
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/40 md:hidden transition-opacity duration-300"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </>
      )}

      <div className="flex-1 flex flex-col max-w-full overflow-hidden">
        {/* Conditional topbar - hidden in frames */}
        {!isFrame && <Topbar onSidebarToggle={() => setSidebarOpen(true)} />}
        
        <main className={`flex-1 p-4 ${isFrame ? 'overflow-visible' : 'overflow-auto'}`}>
          {/* Frame-optimized container */}
          <div className={`
            ${isFrame ? 
              'w-full max-w-[400px] mx-auto bg-white rounded-xl shadow-sm p-4' : 
              'w-full'}
          `}>
            {children}
          </div>
        </main>
      </div>
      
      {/* Debug components - only show in development */}
      <ClientOnly fallback={
        <div className="fixed bottom-4 right-4 opacity-0 transition-opacity">
          {/* Hidden placeholder for UserStateDebug during SSR */}
        </div>
      }>
        <UserStateDebug />
        <ContractTest />
      </ClientOnly>
    </div>
  );
}
