import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PublicKey } from '@solana/web3.js';

type PhantomEvent = "disconnect" | "connect" | "accountChanged";

interface PhantomProvider {
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, callback: (args: any) => void) => void;
  isPhantom: boolean;
}

interface SolanaWalletContextState {
  wallet: PhantomProvider | null;
  connected: boolean;
  publicKey: PublicKey | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const SolanaWalletContext = createContext<SolanaWalletContextState | undefined>(undefined);

export const useSolanaWallet = () => {
  const context = useContext(SolanaWalletContext);
  if (context === undefined) {
    throw new Error('useSolanaWallet must be used within a SolanaWalletProvider');
  }
  return context;
};

interface SolanaWalletProviderProps {
  children: ReactNode;
}

export const SolanaWalletProvider: React.FC<SolanaWalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<PhantomProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  useEffect(() => {
    const provider = (window as any)?.solana;
    if (provider?.isPhantom) {
      setWallet(provider);
      // Attempt an eager connection
      provider.connect({ onlyIfTrusted: true }).catch(() => {
        // Handle connection error if needed
      });
    }
  }, []);

  useEffect(() => {
    wallet?.on("connect", (publicKey: PublicKey) => {
      setPublicKey(publicKey);
      setConnected(true);
    });

    wallet?.on("disconnect", () => {
      setPublicKey(null);
      setConnected(false);
    });

    return () => {
      wallet?.disconnect();
    };
  }, [wallet]);

  const connectWallet = async () => {
    try {
      await wallet?.connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const disconnectWallet = async () => {
    try {
      await wallet?.disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  return (
    <SolanaWalletContext.Provider 
      value={{
        wallet,
        connected,
        publicKey,
        connectWallet,
        disconnectWallet
      }}
    >
      {children}
    </SolanaWalletContext.Provider>
  );
};