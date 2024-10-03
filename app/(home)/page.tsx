"use client";

import { HomeModules } from "@/components/sections/home-modules";
import { HomeModuleState } from "@/components/sections/home-modules.state";
import { PostsModuleState } from "@/components/sections/post-modules.state";
import Posts from "@/components/sections/posts";
import { useCeramicSession } from "../../services/session";

export default function IndexPage() {
  const { session } = useCeramicSession();
  return (
    <div>
      <HomeModules
        stateFactory={() => {
          return new HomeModuleState(session.didSession, session.orbis);
        }}
      />
      <Posts
        stateFactory={() => {
          return new PostsModuleState(session.didSession, session.orbis);
        }}
      />
    </div>
  );
}
