import { signal, type Signal } from "@preact/signals-react";
import { Profile } from "@/types";
import type { DIDSession } from "did-session";
import { type OrbisDB } from "@useorbis/db-sdk";
import { env } from "@/env.mjs";
import { useSignals } from "@preact/signals-react/runtime";
import { useEffect, useMemo, useState } from "react";

const PROFILE_ID = env.NEXT_PUBLIC_PROFILE_ID ?? "";
const CONTEXT_ID = env.NEXT_PUBLIC_CONTEXT_ID ?? "";

type Underlying = {
  profile: Profile | undefined;
};

export class HomeModuleState {
  public session: DIDSession | undefined;
  private readonly signal: Signal<Underlying>;
  private readonly orbis: OrbisDB;

  constructor(session: DIDSession | undefined, orbis: OrbisDB) {
    this.session = session;
    this.orbis = orbis;
    this.signal = signal<Underlying>({
      profile: undefined,
    });
    void this.getProfile();
  }

  getProfile = async (): Promise<void> => {
    try {
      const user = await this.orbis.getConnectedUser();
      if (user) {
        const profile = this.orbis
          .select("name", "username", "profile_imageid", "description")
          .from(PROFILE_ID)
          .where({ controller: user.user.did.toLowerCase() })
          .context(CONTEXT_ID);
        const profileResult = await profile.run();
        if (profileResult.rows.length) {
          this.signal.value = {
            ...this.signal.value,
            profile: profileResult.rows[0] as Profile,
          };
        }
      }
    } catch (error) {
      console.error(error);
      return undefined;
    }
  };

  reset = (): void => {
    this.signal.value = {
      profile: undefined,
    };
  };

  updateSession = (newSession: DIDSession | undefined): void => {
    this.session = newSession;
    void this.getProfile();
  };

  get profile() {
    return this.signal.value.profile;
  }
  get state() {
    return this.signal.value;
  }
}

export function useHomeModuleState(
  initialSession: DIDSession | undefined,
  orbis: OrbisDB,
) {
  const [homeModuleState] = useState(
    () => new HomeModuleState(initialSession, orbis),
  );

  useEffect(() => {
    homeModuleState.updateSession(initialSession);
  }, [initialSession, homeModuleState]);

  useSignals();

  return useMemo(
    () => ({
      profile: homeModuleState.profile,
      state: homeModuleState.state,
      getProfile: homeModuleState.getProfile,
      reset: homeModuleState.reset,
    }),
    [homeModuleState],
  );
}
