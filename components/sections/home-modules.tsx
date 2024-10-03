"use client";

import { useMemo } from "react";
import { DisplayWhen } from "@/components/display-when";
import { MediaRenderer } from "@thirdweb-dev/react";
import { Oval } from "react-loader-spinner";
import { Button } from "@/components/ui/button";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { useCeramicSession } from "../../services/session";
import  { HomeModuleState, useHomeModuleState } from "./home-modules.state";
import { useComputed, useSignals } from "@preact/signals-react/runtime";

export function HomeModules(props: { stateFactory: () => HomeModuleState }) {
  useSignals();
  const { session, stage, orbis } = useCeramicSession();
  const state = useHomeModuleState( session.didSession, orbis)

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
                    <DisplayWhen
                      isTrue={
                        state.profile !== undefined &&
                       state.profile.profile_imageid !== undefined
                      }
                    >
                      <div className="flex text-left text-3xl font-semibold leading-6">
                        <MediaRenderer
                          src={state.profile?.profile_imageid}
                          width="4rem"
                          height="4rem"
                          className="rounded-full"
                        />
                      </div>
                    </DisplayWhen>
                  </div>
                </div>
                <DisplayWhen isTrue={session.isLoggedIn}>
                  <DisplayWhen
                    isTrue={
                      state.profile !== undefined &&
                      state.profile.username !== undefined
                    }
                  >
                    <p className="mt-4 text-left text-2xl font-semibold leading-6">
                      Welcome back,{" "}
                      <span className="text-pink-500">
                        {state.profile?.username}
                      </span>
                    </p>
                  </DisplayWhen>

                  <DisplayWhen isTrue={state.profile == undefined}>
                    <p className="mt-4 text-left text-2xl font-semibold leading-6">
                      Welcome! Please set up your profile
                    </p>
                  </DisplayWhen>
                  <DisplayWhen isTrue={stage == 0}>
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
                  </DisplayWhen>
                </DisplayWhen>
                <DisplayWhen isTrue={session.isLoggedOut}>
                  <p className="mt-4 text-left text-2xl font-semibold leading-6">
                    Welcome! Please connect your wallet
                  </p>
                </DisplayWhen>
                <DisplayWhen isTrue={session.isLoggedIn}>
                  <DisplayWhen isTrue={state.profile !== undefined}>
                    <div className="mt-4 text-left text-sm text-muted-foreground">
                      Create a new post or edit your profile
                    </div>
                  </DisplayWhen>
                  <DisplayWhen isTrue={state.profile == undefined}>
                    <div className="mt-4 text-left text-sm text-muted-foreground">
                      Set up a profile in order to create posts and comments
                    </div>
                  </DisplayWhen>
                </DisplayWhen>
              </div>
            </div>
            <div className="flex h-full flex-col justify-between gap-4 p-6">
              <DisplayWhen isTrue={session.isLoggedIn}>
                <DisplayWhen isTrue={state.profile !== undefined}>
                  <Button
                    variant={"default"}
                    rounded="full"
                    onClick={() => (window.location.href = "/post")}
                  >
                    Create a Post
                  </Button>
                </DisplayWhen>
                <Button
                  variant={"outline"}
                  rounded="full"
                  onClick={() => (window.location.href = "/profile")}
                >
                  Edit Profile
                </Button>
              </DisplayWhen>
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
