"use client";

import "@/styles/globals.css";

import { fontGeist, fontHeading, fontSans, fontUrban } from "@/assets/fonts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { env } from "@/env.mjs";
import { ODB } from "./context/OrbisContext";
import { SolanaWalletProvider } from "./context/WalletContext";
import { ThirdwebProvider } from "@thirdweb-dev/react";

interface RootLayoutProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient();

// export const metadata = constructMetadata();

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontUrban.variable,
          fontHeading.variable,
          fontGeist.variable,
        )}
      >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryClientProvider client={queryClient}>
              <SolanaWalletProvider>
                <ODB>
                <ThirdwebProvider activeChain="ethereum" clientId={env.NEXT_PUBLIC_THIRDWEB_ID}>
               {children}
                  </ThirdwebProvider>
                </ODB>
               
              </SolanaWalletProvider>
            </QueryClientProvider>
            <Toaster richColors closeButton />
            <TailwindIndicator />
          </ThemeProvider>
      </body>
    </html>
  );
}
