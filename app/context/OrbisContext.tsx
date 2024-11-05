import {
  createContext,
  useRef,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Cacao } from "@didtools/cacao";
import { OrbisDB, type OrbisConnectResult } from "@useorbis/db-sdk";
import { OrbisEVMAuth } from "@useorbis/db-sdk/auth";
import { useWalletClient, useAccountEffect } from "wagmi";
import { env } from "@/env.mjs";

type OrbisDBProps = {
  children: ReactNode;
};

const ENV_ID = env.NEXT_PUBLIC_ENV_ID ?? "";

declare global {
  interface Window {
    ethereum?: any;
  }
}

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

export const OrbisProvider = ({ children }: OrbisDBProps) => {
  const { data: walletClient } = useWalletClient();
  const connection = useRef(false); // Persist across renders

  // Memoize the authentication function to avoid recreation
  const StartOrbisAuth = useCallback(async () => {
    if (connection.current) return; // Prevent multiple calls

    const auth = new OrbisEVMAuth(window.ethereum);
    const authResult: OrbisConnectResult = await orbis.connectUser({ auth });

    if (authResult.auth.session) {
      connection.current = true;
      console.log("Orbis Auth'd:", authResult.auth.session);
      isAuthenticated = true;
      window.dispatchEvent(new Event("loaded"));
    }
  }, []);

  useAccountEffect({
    onDisconnect() {
      localStorage.removeItem("orbis:session");
      isAuthenticated = false;
      connection.current = false; // Reset the connection
    },
  });

  // Main effect to handle authentication logic
  useEffect(() => {
    if (walletClient && !connection.current) {
      const storedSession = localStorage.getItem("orbis:session");

      if (storedSession && walletClient.account.address) {
        const { cacao } = JSON.parse(
          Buffer.from(storedSession, "base64").toString(),
        ) as { cacao: Cacao };

        const expTime = cacao.p.exp;
        const sessionAddress = cacao.p.iss
          .replace("did:pkh:eip155:1:", "")
          .toLowerCase();

        if (
          sessionAddress !== walletClient.account.address.toLowerCase() ||
          //@ts-ignore
          expTime > Date.now()
        ) {
          console.log("Invalid session, removing...");
          localStorage.removeItem("orbis:session");
        } else {
          isAuthenticated = true;
          connection.current = true;
          window.dispatchEvent(new Event("loaded"));
        }
      } else if (!isAuthenticated) {
        StartOrbisAuth();
      }

      orbis.getConnectedUser().then((user) => {
        console.log("Connected User:", user);
      });
    }
  }, [walletClient, StartOrbisAuth]);

  return (
    <Context.Provider value={{ orbis, isAuthenticated }}>
      {children}
    </Context.Provider>
  );
};

export const useODB = () => useContext(Context);
