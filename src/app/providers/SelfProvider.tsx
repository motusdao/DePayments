
//@ts-nocheck
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SelfAppBuilder, SelfQRcodeWrapper, SelfApp } from '@selfxyz/qrcode';
import { countries } from '@selfxyz/core'; // For country codes
import { useWallets } from '@privy-io/react-auth';

// Define context type
interface SelfContextType {
    isVerified: boolean;
    verificationError: string | null;
    userData: any | null; // Customize based on your discloseOutput (e.g., { nationality, ageValid })
    startVerification: () => void;
    loading: boolean;
}

// SelfHappyBirthday contract address deployed on Celo Alfajores testnet
const HAPPY_BIRTHDAY_CONTRACT_ADDRESS = "0x97d01A133c9Bfd77D6b7147d36bAA005b48735aa";

// Default context
const SelfContext = createContext<SelfContextType | undefined>(undefined);

// Hook for using context
export const useSelf = () => {
    const context = useContext(SelfContext);
    if (!context) {
        throw new Error('useSelf must be used within SelfProvider');
    }
    return context;
};

// Provider component
interface SelfProviderProps {
    children: ReactNode;
    // Config props (customize as needed)
    appName: string;
    scope: string;
    endpoint: string;
    logoBase64?: string;
    minimumAge?: number;
    excludedCountries?: string[];
}

export const SelfProvider: React.FC<SelfProviderProps> = ({
    children,
    appName,
    scope,
    endpoint,
    logoBase64 = 'https://your-logo-url.com/logo.png', // Default logo
    minimumAge = 18,
    excludedCountries = [countries.NORTH_KOREA, countries.IRAN],
}) => {
    const{wallets} = useWallets();
    const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
    const [isVerified, setIsVerified] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [userData, setUserData] = useState<any | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const address = wallets?.[0]?.address;

    // Initialize SelfApp on mount
    useEffect(() => {
        if(address){
            try {
                const app = new SelfAppBuilder({
                    appName: "Self Playground",
                    scope: "self-playground",
                    endpoint: "https://playground.self.xyz/api/verify",
                    // endpoint: "https://c622-118-169-75-84.ngrok-free.app/api/verify",
                    endpointType: "https",
                    logoBase64: "https://i.imgur.com/Rz8B3s7.png",
                    userId: address,
                    userIdType: "hex",
                    disclosures: {
                        minimumAge: 18,
                    },
                    version: 2, 
                    userDefinedData: "Motus",
                    devMode: false,
                }
                    // devMode: true, // Uncomment for testing with mock data
                ).build();
    
                setSelfApp(app);
            } catch (error) {
                console.error('Failed to initialize SelfApp:', error);
                setVerificationError('Initialization failed');
            }
        }
    }, [address]);

    // Function to start verification (show QR modal)
    const startVerification = () => {
        console.log("what  sup")
        setShowQRModal(true);
        setLoading(false);
        setVerificationError(null);
    };

    // Handle successful verification
    const handleSuccess = (data: any) => { // Data from backend/onSuccess callback
        setIsVerified(true);
        setUserData(data); // Store verified data (e.g., from discloseOutput)
        setShowQRModal(false);
        setLoading(false);
    };

    // Handle error
    const handleError = (error: { error_code?: string; reason?: string }) => {
        setVerificationError(error.reason || 'Verification failed');
        setShowQRModal(false);
        setLoading(false);
    };

    return (
        <SelfContext.Provider
            value={{ isVerified, verificationError, userData, startVerification, loading }}
        >
            {children}
            {/* QR Modal (render conditionally) */}
            {showQRModal && selfApp && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl mb-4">Scan with Self App</h2>
                        <SelfQRcodeWrapper
                            selfApp={selfApp}
                            onSuccess={() => handleSuccess({ /* Mock or fetch real data */ })}
                            onError={handleError}
                            size={256}
                            darkMode={false} // Customize as needed
                        />
                        <button
                            className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
                            onClick={() => setShowQRModal(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </SelfContext.Provider>
    );
};