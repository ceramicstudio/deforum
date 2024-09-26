"use client";

import { useEffect, useState } from "react";
import { Profile } from "@/types";
import { MediaRenderer } from "@thirdweb-dev/react";
import { Oval } from "react-loader-spinner";

import { env } from "@/env.mjs";
import { Button } from "@/components/ui/button";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { useSolanaWallet } from "@/app/context/WalletContext";
import { useODB } from "@/app/context/OrbisContext";

const PROFILE_ID = env.NEXT_PUBLIC_PROFILE_ID ?? "";
const CONTEXT_ID = env.NEXT_PUBLIC_CONTEXT_ID ?? "";

export function HomeModules() {
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const { orbis } = useODB();
  const { connected, publicKey, } = useSolanaWallet();

  const getProfile = async (): Promise<void> => {
    try {
      const user = await orbis.getConnectedUser();
      if (user) {
        const profile = orbis
          .select("name", "username", "profile_imageid", "description")
          .from(PROFILE_ID)
          .where({ controller: user.user.did.toLowerCase() })
          .context(CONTEXT_ID);
        const profileResult = await profile.run();
        if (profileResult.rows.length) {
          setProfile(profileResult.rows[0] as Profile);
        }
      }
    } catch (error) {
      console.error(error);
      return undefined;
    }
  };

  useEffect(() => {
    window.addEventListener("loaded", function () {
      try {
        void getProfile();
      } catch (error) {
        console.log(error);
      }
    });
    void getProfile();
    if (!connected) {
      setProfile(undefined);
    }
  }, [connected, publicKey]);

  return (
    <section className="flex flex-col items-center pt-12 text-center md:col-span-1 lg:col-span-1">
      <MaxWidthWrapper>
        <div className="mt-6 grid justify-items-center gap-5 bg-inherit lg:grid-cols-1">
          <div
            className="relative flex w-2/3 flex-col overflow-hidden rounded-3xl border-2 shadow-sm"
            key={"Home"}
          >
            <div className="items-start space-y-4 bg-muted/50 p-6">
              <p className="flex font-urban text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Home
              </p>
              <div className="flex flex-col">
                <div className="flex flex-row">
                  <div className="flex items-end">
                    {profile && (
                      <div className="flex text-left text-3xl font-semibold leading-6">
                        <MediaRenderer
                          src={profile.profile_imageid}
                          width="4rem"
                          height="4rem"
                          className="rounded-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
                {profile ? (
                  <p className="mt-4 text-left text-2xl font-semibold leading-6">
                    Welcome back,{" "}
                    <span className="text-pink-500">{profile.username}</span>
                  </p>
                ) : !profile && connected ? (
                  <p className="mt-4 text-left text-2xl font-semibold leading-6">
                    Welcome! Please set up your profile
                  </p>
                ) : connected ? (
                  <div className="w-full items-center justify-center">
                    <Oval
                      visible={true}
                      height="80"
                      width="80"
                      color="#4fa94d"
                      ariaLabel="oval-loading"
                      wrapperStyle={{}}
                      wrapperClass=""
                    />
                  </div>
                ) : (
                  <p className="mt-4 text-left text-2xl font-semibold leading-6">
                    Welcome! Please connect your wallet
                  </p>
                )}
                {profile ? (
                  <div className="mt-4 text-left text-sm text-muted-foreground">
                    Create a new post or edit your profile
                  </div>
                ) : !profile && connected ? (
                  <div className="mt-4 text-left text-sm text-muted-foreground">
                    Set up a profile in order to create posts and comments
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex h-full flex-col justify-between gap-4 p-6">
              {profile && (
                <Button
                  variant={"default"}
                  rounded="full"
                  onClick={() => (window.location.href = "/post")}
                >
                  Create a Post
                </Button>
              )}
              {connected && (
                <Button
                  variant={"outline"}
                  rounded="full"
                  onClick={() => (window.location.href = "/profile")}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
