import { signal, type Signal } from "@preact/signals-react";
import type { DIDSession } from "did-session";
import { type OrbisDB } from "@useorbis/db-sdk";
import { env } from "@/env.mjs";
import { type Post } from "@/types";
import { useSignals } from "@preact/signals-react/runtime";
import { useCeramicSession } from "@/services/session";
import { useEffect, useMemo } from "react";

type Underlying = {
  posts: Post[] | undefined;
  messages: Post[] | undefined;
  pagination: number;
};

export class PostsModuleState {
  private readonly session: DIDSession | undefined;
  private readonly signal: Signal<Underlying>;
  private readonly orbis: OrbisDB;

  constructor(session: DIDSession | undefined, orbis: OrbisDB) {
    this.session = session;
    this.orbis = orbis;
    this.signal = signal<Underlying>({
      posts: undefined,
      messages: undefined,
      pagination: 1,
    });
    void this.getPosts();
  }

  getPosts = async (): Promise<void> => {
    try {
      const user = await this.orbis.getConnectedUser();
      if (user) {
        const query = await this.orbis
          .select()
          .raw(
            `SELECT
              *,  
                (
                  SELECT json_build_object( 'name', name, 'username', username, 'description', description, 'profile_imageid', profile_imageid, 'stream_id', stream_id)
                  FROM ${env.NEXT_PUBLIC_PROFILE_ID} as profile
                  WHERE profile.controller = post.controller
                ) as profile
              FROM ${env.NEXT_PUBLIC_POST_ID} as post
              ORDER BY created DESC`,
          )
          .run();
        const queryResult = query.rows as Post[];
        if (queryResult.length) {
          this.signal.value = {
            ...this.signal.value,
            posts: queryResult.slice(0, 10),
            messages: queryResult,
          };
        }
      }
    } catch (error) {
      console.error(error);
      return undefined;
    }
  };

  alterPosts = (direction: string) => {
    try {
      switch (direction) {
        case "next":
          this.signal.value = {
            ...this.signal.value,
            pagination: this.signal.value.pagination + 1,
            posts: this.signal.value.messages?.slice(
              this.signal.value.pagination * 10,
              this.signal.value.pagination * 10 + 10,
            ),
          };
          break;
        case "previous":
          this.signal.value = {
            ...this.signal.value,
            pagination: this.signal.value.pagination - 1,
            posts: this.signal.value.messages?.slice(
              (this.signal.value.pagination - 2) * 10,
              (this.signal.value.pagination - 1) * 10,
            ),
          };
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(error);
    }
  };

  reset = (): void => {
    this.signal.value = {
      posts: undefined,
      messages: undefined,
      pagination: 1,
    };
  }

  get posts() {
    return this.signal.value.posts;
  }
  get messages() {
    return this.signal.value.messages;
  }
  get pagination() {    
    return this.signal.value.pagination;
  }
}

export function usePosts() {
    useSignals();
    const {session, orbis} = useCeramicSession();
    const state = useMemo(() => new PostsModuleState(session.didSession, orbis), [session, orbis]);
    useEffect(() => {
        return () => {
            state.reset();
        };
    } , [state]);
    return state;
}