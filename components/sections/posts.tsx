"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Post } from "@/types";
import { MediaRenderer } from "@thirdweb-dev/react";
import { useAccountEffect } from "wagmi";
import { formatDate } from "@/lib/utils";
import { env } from "@/env.mjs";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import { CeramicClient } from "@ceramic-sdk/http-client";
import { StreamID } from "@ceramic-sdk/identifiers";
import { asDIDString } from '@didtools/codecs'
import { getAuthenticatedDID } from '@didtools/key-did'
import { eventFromCAR, InitEventPayload, signedEventToCAR, signEvent, eventToCAR, eventToString, decodeSignedEvent } from "@ceramic-sdk/events";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { useODB } from "@/app/context/OrbisContext";

export default function Posts() {
  const [allMessages, setAllMessages] = useState<Post[] | undefined>(undefined);
  const [posts, setPosts] = useState<Post[] | undefined>();
  const { orbis } = useODB();
  const [pagination, setPagination] = useState<number>(1);
  const [loaded, setLoaded] = useState<boolean>(false);

  useAccountEffect({
    onDisconnect() {
      setAllMessages([]);
      setPosts([]);
      setPagination(1);
    },
  });

  const getPosts = async (): Promise<void> => {
    try {
      const client = new CeramicClient({ url: "http://localhost:5222" });
      const v = await client.getVersion();
      const did = await getAuthenticatedDID(new Uint8Array(32))
      console.log(did)
      const model = StreamID.fromString("kjzl6hvfrbw6c5he7fxl3oakeckm2kchkqboqug08inkh1tmfqpd8v3oceriml2")
      const eventPayload: InitEventPayload = {
        data: {
          body: "This is a simple message",
        },
        header: {
          controllers: [asDIDString(did.id)],
          model,
          sep: "test",
        },
      };
      console.log()
      const encodedPayload = InitEventPayload.encode(eventPayload);
      const unsignedCar = eventToCAR(InitEventPayload, eventPayload);
      console.log(unsignedCar)
      const unsignedEvent = eventFromCAR(InitEventPayload, unsignedCar);
      console.log(unsignedEvent)  
      // Sign the event
      const signedEvent = await signEvent(did, encodedPayload);
      console.log(signedEvent)
      const event2 = signedEventToCAR(signedEvent)
      const signedEventFromCar = eventFromCAR(InitEventPayload, event2)
      console.log(signedEventFromCar)
      const res = await client.postEventCAR(event2)
      console.log(res);
      const modelId = "kjzl6hvfrbw6c5he7fxl3oakeckm2kchkqboqug08inkh1tmfqpd8v3oceriml2";
      const register = await client.registerInterestModel(modelId);
      const events = await client.getEventsFeed({
        resumeAt: "101",
      });
      console.log(events) 
      const event = await client.getEventCAR(events.events[99].id);
      const fromCar = eventFromCAR(InitEventPayload, event)
      const decoded = decodeSignedEvent(fromCar)
      console.log(decoded)
      console.log(fromCar)
      console.log(event)
      const user = await orbis.getConnectedUser();
      if (user) {
        const query = await orbis
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
          setPosts(queryResult.slice(0, 10));
          setAllMessages(queryResult);
        }
      }
    } catch (error) {
      console.error(error);
      return undefined;
    }
  };

  const alterPosts = (direction: string) => {
    try {
      switch (direction) {
        case "next":
          setPagination(pagination + 1);
          setPosts(allMessages?.slice(pagination * 10, pagination * 10 + 10));
          break;
        case "previous":
          setPagination(pagination - 1);
          setPosts(
            allMessages?.slice((pagination - 2) * 10, (pagination - 1) * 10),
          );
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(error);
    }
  };

  // First useEffect for setting the loaded state when the window event fires
  useEffect(() => {
    const handleLoaded = () => {
      try {
        setLoaded(true);
      } catch (error) {
        console.error(error);
      }
    };

    window.addEventListener("loaded", handleLoaded);
    return () => {
      window.removeEventListener("loaded", handleLoaded);
      setAllMessages([]);
      setPosts([]);
      setLoaded(false);
    };
  }, []); // Empty dependency array to run only on mount and unmount

  // Second useEffect for fetching posts when 'loaded' is true
  useEffect(() => {
    if (loaded) {
      (async () => {
        await getPosts();
      })();
    }
  }, [loaded]); // Dependency on 'loaded' to trigger this effect when it changes

  return (
    <section className="col-span-2">
      <div className="pb-6 pt-12">
        <MaxWidthWrapper>
          <div className="mt-12 grid gap-3 sm:grid-cols-1 lg:grid-cols-1">
            {posts &&
              posts.map((post, index) => (
                <div key={`${post.title}-${index}`} className="relative grow">
                  <div className="group relative grow overflow-hidden rounded-2xl border bg-background p-5 md:p-8">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 aspect-video -translate-y-1/2 rounded-full border bg-gradient-to-b from-purple-500/80 to-white opacity-25 blur-2xl duration-300 group-hover:-translate-y-1/4 dark:from-white dark:to-white dark:opacity-5 dark:group-hover:opacity-10"
                    />
                    <div className="relative">
                      <div className="relative flex items-center gap-3">
                        {post.profile?.profile_imageid ? (
                          <>
                            <MediaRenderer
                              src={post.profile?.profile_imageid}
                              width="2rem"
                              height="2rem"
                              className="rounded-full"
                            />
                            <Link href={`/users/${post.profile.stream_id}`}>
                              <p className="relative text-sm font-semibold text-foreground hover:text-destructive">
                                {post.profile.username}
                              </p>
                            </Link>
                          </>
                        ) : (
                          <>
                            <MediaRenderer
                              src="/profile-icon.png"
                              width="2rem"
                              height="2rem"
                              className="rounded-full"
                            />
                            <Link href={`/users/${post.profile?.stream_id}`}>
                              <p className="relative text-sm font-semibold text-foreground hover:text-destructive">
                                {post.profile?.username}
                              </p>
                            </Link>
                          </>
                        )}
                      </div>
                      <div className="relative grow">
                        <div className="flex items-center space-x-4">
                          <time
                            dateTime={new Date().toISOString()}
                            className="text-sm font-medium text-muted-foreground"
                          >
                            {formatDate(new Date().toISOString())}
                          </time>
                        </div>
                        <p className="mt-6 pb-6 text-2xl font-bold">
                          {post.title}
                        </p>
                        {post.imageid && (
                          <div className="relative mb-6">
                            <MediaRenderer
                              src={post.imageid}
                              width="50%"
                              height="50%"
                              className="rounded-xl"
                            />
                          </div>
                        )}
                        <p className="relative mt-6 pb-6 text-muted-foreground">
                          {post.body}
                        </p>
                      </div>
                      <div className="relative -mb-5 flex gap-3 border-t border-muted py-4 md:-mb-7">
                        <Button
                          variant="secondary"
                          size="sm"
                          rounded="xl"
                          className="px-4"
                        >
                          <Link
                            href={`/post/${post.stream_id}`}
                            className="flex items-center gap-2"
                          >
                            <span>Thread</span>
                            <Icons.arrowUpRight className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            {!posts && (
              <div className="flex flex-col space-y-4 pb-16">
                <p>Loading...</p>
              </div>
            )}
            {posts && posts.length ? (
              <p className="mt-6 text-center text-muted-foreground">
                Showing Posts {pagination * 10 - 9} - {pagination * 10}
              </p>
            ) : (
              <p className="mt-6 text-center text-muted-foreground">
                No posts available.
              </p>
            )}
            <div className="mb-6 flex justify-center gap-3">
              {allMessages && pagination * 10 < allMessages.length && (
                <Button
                  onClick={() => alterPosts("next")}
                  variant="default"
                  size="sm"
                  rounded="xl"
                  className="min-w-[150px] px-4"
                >
                  Next 10 Posts
                </Button>
              )}
              {pagination > 1 && (
                <Button
                  onClick={() => alterPosts("previous")}
                  variant="default"
                  size="sm"
                  rounded="xl"
                  className="min-w-[150px] px-4"
                >
                  Previous 10 Posts
                </Button>
              )}
            </div>
          </div>
        </MaxWidthWrapper>
      </div>
    </section>
  );
}
