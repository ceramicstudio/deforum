"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { type Post } from "@/types";
import { MediaRenderer } from "@thirdweb-dev/react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { type PostsModuleState, usePosts } from "./post-modules.state";
import { useComputed, useSignals } from "@preact/signals-react/runtime";

export default function Posts(props: { stateFactory: () => PostsModuleState }) {
  useSignals();
  const state = useMemo(() => props.stateFactory(), [props]);
  const {posts, messages, pagination} = usePosts();

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
                        {post.profile?.profile_imageid && (
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
                Showing Posts {pagination * 10 - 9} -{" "}
                {pagination * 10}
              </p>
            ) : (
              <p className="mt-6 text-center text-muted-foreground">
                No posts available.
              </p>
            )}
            <div className="mb-6 flex justify-center gap-3">
              {messages &&
                pagination * 10 < messages.length && (
                  <Button
                    onClick={() => state.alterPosts("next")}
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
                  onClick={() => state.alterPosts("previous")}
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
