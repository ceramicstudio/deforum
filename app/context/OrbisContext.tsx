import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { PublicKey } from "@solana/web3.js";
import {
  OrbisDB,
  type OrbisConnectResult,
  type SiwxAttestation,
} from "@useorbis/db-sdk";
import { OrbisSolanaAuth } from "@useorbis/db-sdk/auth";

type OrbisDBProps = {
  children: ReactNode;
};

const ENV_ID = process.env.NEXT_PUBLIC_ENV_ID ?? "";

declare global {
  interface Window {
    solana?: any;
  }
}

// Configure Orbis Client & create context.
const orbis = new OrbisDB({
  ceramic: {
    gateway: "https://ceramic-orbisdb-mainnet-direct.hirenodes.io/",
  },
  nodes: [
    {
      gateway: "https://studio.useorbis.com",
      env: ENV_ID,
    },
  ],
});

let isAuthenticated = false;

const Context = createContext({ orbis, isAuthenticated });

export const ODB = ({ children }: OrbisDBProps) => {
  const [isAuth, setAuth] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  useEffect(() => {
    const StartOrbisAuth = async (): Promise<
      OrbisConnectResult | undefined
    > => {
      if (window.solana && window.solana.isPhantom) {
        try {
          // first, check if the user is connected to Phantom
          if (!window.solana.isConnected) {
            await window.solana.connect();
          }

          const publicKey = window.solana.publicKey;
          setPublicKey(publicKey);

          // You might need to implement a custom auth provider for Solana
          // This is a placeholder and may need adjustment
          const auth = new OrbisSolanaAuth(window.solana);

          // Authenticate - this option persists the session in local storage
          const authResult: OrbisConnectResult = await orbis.connectUser({
            auth,
          });

          if (authResult.session) {
            console.log("Orbis Auth'd:", authResult.session);
            return authResult;
          }
        } catch (error) {
          console.error("Error connecting to Solana wallet:", error);
        }
      } else {
        console.log("Phantom wallet is not installed!");
      }
      return undefined;
    };

 
      window.solana.connect().then((key) => {
        console.log("Connected to Phantom wallet:", key.publicKey.toString());
        if (localStorage.getItem("orbis:session") && key) {
          const attestation = (
            JSON.parse(
              localStorage.getItem("orbis:session") ?? "{}",
            ) as OrbisConnectResult
          ).session.authAttestation as SiwxAttestation;
          const expTime = attestation.siwx.message.expirationTime;
          console.log("Attestation:", attestation);
          if (attestation.siwx.message.address !== key.publicKey.toString()) {
            console.log("Address mismatch, removing session");
            localStorage.removeItem("orbis:session");
          }
          //@ts-expect-error - This is a placeholder and may need adjustment
          else if (expTime < Date.now()) {
            localStorage.removeItem("orbis:session");
          } else {
            setAuth(true);
            isAuthenticated = true;
            window.dispatchEvent(new Event("loaded"));
          }
        }
        return isAuthenticated;
      }).then((result) => {
        if (!result) {
          StartOrbisAuth().then((authResult) => {
            if (authResult) {
              setAuth(true);
              isAuthenticated = true;
              window.dispatchEvent(new Event("loaded"));
            }
          });
        }
      }
    );

    // Set up listener for wallet disconnection
    if (window.solana) {
      window.solana.on("disconnect", () => {
        setPublicKey(null);
        setAuth(false);
        isAuthenticated = false;
        localStorage.removeItem("orbis:session");
      });
    }

    // Clean up
    return () => {
      if (window.solana) {
        window.solana.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (isAuth) {
      orbis.getConnectedUser().then((user) => {
        console.log("Connected User:", user);
      });
    }
  }, [isAuth]);

  return (
    <Context.Provider value={{ orbis, isAuthenticated }}>
      {children}
    </Context.Provider>
  );
};

export const useODB = () => useContext(Context);
