import React, { createContext, useContext, useEffect, useState } from "react";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import { createPublicClient, createWalletClient, http, custom } from "viem";
import {
  createZeroDevPaymasterClient,
  createKernelAccount,
  createKernelAccountClient,
} from "@zerodev/sdk";
import { getEntryPoint, KERNEL_V3_1 } from '@zerodev/sdk/constants';
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { celoAlfajores } from "viem/chains";


type SmartWalletContextType = {
  kernelClient: any; // Replace with proper type from ZeroDev SDK
  smartAccountAddress: `0x${string}` | null;
  isInitializing: boolean;
  error: Error | null;
};

const SmartWalletContext = createContext<SmartWalletContextType>({
  kernelClient: null,
  smartAccountAddress: null,
  isInitializing: false,
  error: null,
});

export const LocalSmartWalletProvider = ({
  children,
  zeroDevProjectId = "e46f4ac3-404e-42fc-a3d3-1c75846538a8",
}: {
  children: React.ReactNode;
  zeroDevProjectId: string;
}) => {
  const { wallets } = useWallets();
  const { authenticated,exportWallet } = usePrivy();
  const [kernelClient, setKernelClient] = useState<any>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<
    `0x${string}` | null
  >(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);



  useEffect(() => {
    const initializeSmartWallet = async () => {
      if (!authenticated || !wallets || wallets.length === 0) {
        setKernelClient(null);
        setSmartAccountAddress(null);
        setIsInitializing(false);
        return;
      }

      try {
        setIsInitializing(true);
        setError(null);
        console.log('🔄 Initializing smart wallet with wallets:', wallets);
        
        // Get EntryPoint v0.7 from ZeroDev SDK
        const entryPoint = getEntryPoint('0.7');
        
        // Look for either embedded wallet (email login) or connected wallet (MetaMask login)
        const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
        const connectedWallet = wallets.find((wallet) => wallet.walletClientType !== 'privy');
        
        const walletToUse = embeddedWallet || connectedWallet;
        if (!walletToUse) {
          console.log('⚠️ No wallet found for smart account creation');
          setIsInitializing(false);
          return;
        }
        
        console.log('🔧 Found wallet:', {
          address: walletToUse.address,
          type: walletToUse.walletClientType,
          isEmbedded: !!embeddedWallet,
          isConnected: !!connectedWallet
        });
        
        // Get the EIP1193 provider from the selected wallet
        const provider = await walletToUse.getEthereumProvider();
        if (!provider) {
          throw new Error('Failed to get Ethereum provider from wallet');
        }

        console.log('🔐 Creating ECDSA Kernel smart account...');
        
        // Create public client for blockchain interactions
        const publicClient = createPublicClient({
          chain: celoAlfajores,
          transport: http(),
        });
        
        // Create wallet client from the EIP-1193 provider
        const walletClient = createWalletClient({
          chain: celoAlfajores,
          transport: custom(provider),
        });
        
        console.log('🔐 Creating ECDSA validator...');
        
        // Create ECDSA validator using ZeroDev SDK
        const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
          signer: walletClient as any, // Type assertion for compatibility
          entryPoint: entryPoint,
          kernelVersion: KERNEL_V3_1,
        });
        
        console.log('🔐 Creating Kernel account...');
        
        // Create Kernel account using ZeroDev SDK with proper version for EntryPoint v0.7
        const account = await createKernelAccount(publicClient, {
          plugins: {
            sudo: ecdsaValidator,
          },
          entryPoint: entryPoint,
          kernelVersion: KERNEL_V3_1,
        });

        console.log('🔧 Created smart account:', account.address);

        const bundlerUrl = `https://rpc.zerodev.app/api/v3/${zeroDevProjectId}/chain/${celoAlfajores.id}`;
        const paymasterUrl = `https://rpc.zerodev.app/api/v3/${zeroDevProjectId}/chain/${celoAlfajores.id}`;

        console.log('🔐 Creating paymaster client...');
        
        // Create paymaster client following ZeroDev docs pattern
        const paymasterClient = createZeroDevPaymasterClient({
          chain: celoAlfajores,
          transport: http(paymasterUrl),
        });
        
        console.log('🔐 Creating Kernel account client...');
        
        // Create Kernel client using ZeroDev SDK with paymaster
        const client = createKernelAccountClient({
          account,
          chain: celoAlfajores,
          bundlerTransport: http(bundlerUrl),
          paymaster: paymasterClient,
          client: publicClient,
        });
        
        console.log("✅ Smart account client created:", client.account.address);
        console.log("Chain ID:", await client.getChainId());

        setKernelClient(client);
        setSmartAccountAddress(account.address);
      } catch (err) {
        console.error("❌ Error initializing smart wallet:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsInitializing(false);
      }
    };
    initializeSmartWallet();
  }, [authenticated, wallets, zeroDevProjectId]);

  return (
    <SmartWalletContext.Provider
      value={{ kernelClient, smartAccountAddress, isInitializing, error }}
    >
      {error && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-blue-50 border border-blue-300 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛠️</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">Smart Wallet Setup</h3>
              <p className="text-xs text-blue-700 mt-1">
                Your smart wallet is being configured. This is normal for first-time setup. You can browse therapists while this completes.
              </p>
              <p className="text-xs text-blue-600 mt-2 font-medium">
                Features like booking sessions will be available once setup is complete.
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-blue-600 hover:text-blue-800 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
      {children}
    </SmartWalletContext.Provider>
  );
};

export const useSmartWallet = () => {
  const context = useContext(SmartWalletContext);
  if (context === undefined) {
    throw new Error("useSmartWallet must be used within a LocalSmartWalletProvider");
  }
  return context;
};
