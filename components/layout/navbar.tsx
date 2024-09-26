"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { siteConfig } from "@/config/site";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";


interface NavBarProps {
  scroll?: boolean;
  large?: boolean;
}

export function NavBar({ scroll = false }: NavBarProps) {
  const selectedLayout = useSelectedLayoutSegment();


  const links =
  selectedLayout

  return (
    <header
      className={`sticky top-0 z-40 flex w-full justify-center bg-background/60 backdrop-blur-xl transition-all`}
    >
      <MaxWidthWrapper
        className="flex h-14 items-center justify-between py-4"
      >
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo />
            <span className="font-urban text-xl font-bold">
              {siteConfig.name}
            </span>
          </Link>

          {links && links.length > 0 ? (
            <nav className="hidden gap-6 md:flex">
            </nav>
          ) : null}
        </div>

        <div className="flex items-center space-x-3">

        <ConnectButton
          key="connect"
          showBalance={{
            smallScreen: false,
            largeScreen: false,
          }}
        />
        </div>
      </MaxWidthWrapper>
    </header>
  );
}
