"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Post, Profile } from "@/types";
import { MediaRenderer, useStorageUpload } from "@thirdweb-dev/react";
import TextareaAutosize from "react-textarea-autosize";
import { useSolanaWallet } from "@/app/context/WalletContext";
import { env } from "@/env.mjs";
import { Button } from "@/components/ui/button";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { useODB } from "@/app/context/OrbisContext";

const CONTEXT_ID = env.NEXT_PUBLIC_CONTEXT_ID ?? "";
const POST_ID = env.NEXT_PUBLIC_POST_ID ?? "";
const PROFILE_ID = env.NEXT_PUBLIC_PROFILE_ID ?? "";

export function PostModules() {
  const [file, setFile] = useState<File | undefined>(undefined);
  const { mutateAsync: upload } = useStorageUpload();
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [body, setBody] = useState<string | undefined>(undefined);
  const [post, setPost] = useState<Post | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const { orbis } = useODB();
  const { connected, publicKey, connectWallet, disconnectWallet } = useSolanaWallet();

  const uploadToIpfs = async () => {
    const uploadUrl = await upload({
      data: [file],
      options: { uploadWithGatewayUrl: true, uploadWithoutDirectory: true },
    });
    return uploadUrl[0];
  };

  const getProfile = async (): Promise<void> => {
    try {
      const user = await orbis.getConnectedUser();
      if (user) {
        const profile = orbis
          .select("name", "username", "imageid", "description")
          .from(PROFILE_ID)
          .where({ controller: user.user.did.toLowerCase() })
          .context(CONTEXT_ID);
        const profileResult = await profile.run();
        console.log(profileResult);
        if (profileResult.rows.length) {
          profileResult.rows[0].imageId = profileResult.rows[0].imageid;
          setProfile(profileResult.rows[0] as Profile);
        }
      }
    } catch (error) {
      console.error(error);
      return undefined;
    }
  };

  const createPost = async (): Promise<void> => {
    try {
      if (!title || !body) {
        alert("Please fill in the title and body of the post.");
        return;
      }
      const user = await orbis.getConnectedUser();
      if (user) {
        let imageUrl;
        if (file) {
          imageUrl = await uploadToIpfs();
        }

        const created = new Date().toISOString();
        const createQuery = await orbis
          .insert(POST_ID)
          .value({
            title,
            body,
            imageid: imageUrl ? imageUrl : "",
            created,
          })
          .context(CONTEXT_ID)
          .run();

        console.log(createQuery);

        if (createQuery.content) {
          console.log("Post created successfully");
          setPost({
            title,
            body,
            imageid: imageUrl ? imageUrl : "",
            stream_id: createQuery.content.stream_id,
            profile,
            created,
          });
        }
      }
    } catch (error) {
      console.error(error);
      return undefined;
    }
  };

  useEffect(() => {
    if (publicKey) {
      void getProfile();
    }
  }, [connected, publicKey]);

  return (
    <section className="flex flex-col items-center pb-6 text-center">
      <MaxWidthWrapper>
        <div className="mt-12 grid gap-5 bg-inherit lg:grid-cols-1">
          <div className="relative flex w-full items-center justify-center">
            {!post && (
              <form className="mt-12 flex w-full flex-col items-center justify-center">
                <div className="mb-4 w-full rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
                  <div className="mb-12 rounded-t-lg bg-white px-4 py-2 dark:bg-gray-800">
                    <label htmlFor="comment" className="sr-only">
                      Your post title
                    </label>
                    <TextareaAutosize
                      id="post-title"
                      rows={2}
                      className="mb-2 w-full border-0 bg-white px-0 text-sm font-semibold text-gray-900 focus:ring-0 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                      placeholder="Write your post title..."
                      required
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  {file && (
                    <div className="rounded-t-lg bg-white px-4 py-2 dark:bg-gray-800">
                      <button
                        className="text-xs font-semibold text-gray-300"
                        onClick={() => setFile(undefined)}
                      >
                        Remove Image
                        <label htmlFor="comment" className="sr-only">
                          Image
                        </label>
                        <Image
                          src={URL.createObjectURL(file)}
                          width={200}
                          height={200}
                          alt={""}
                        />
                      </button>
                    </div>
                  )}
                  <div className="rounded-t-lg bg-white px-4 py-2 dark:bg-gray-800">
                    <label htmlFor="comment" className="sr-only">
                      Your post body
                    </label>
                    <TextareaAutosize
                      id="post-body"
                      rows={8}
                      className="min-h-[100px] w-full border-0 bg-white px-0 text-sm text-gray-900 focus:ring-0 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                      placeholder="Write your post body..."
                      required
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t px-3 py-2 dark:border-gray-600">
                    <Button
                      variant={"default"}
                      className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2.5 text-center text-xs font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900"
                      rounded="full"
                      onClick={async (e) => {
                        e.preventDefault();
                        void (await createPost());
                      }}
                    >
                      Publish Post
                    </Button>
                    <div className="flex space-x-1 ps-0 sm:ps-2 rtl:space-x-reverse">
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-2">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-gray-700">
                            Upload an Image
                          </h4>
                        </div>
                        <input
                          type="file"
                          id="doc"
                          name="doc"
                          accept="png, jpg"
                          hidden
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) => {
                            if (e.target.files) {
                              setFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            )}
            {post && (
              <div key={post.title} className="relative grow text-left">
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
                          <Link href="#">
                            <p className="relative text-sm font-semibold text-foreground hover:text-destructive">
                              {post.profile.username}
                            </p>
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="relative grow">
                      <p className="mt-6 pb-6 text-2xl font-bold">
                        {post.title}
                      </p>
                      {post.imageid && (
                        <div className="relative mb-6">
                          <MediaRenderer
                            src={post.imageid}
                            width="25%"
                            height="25%"
                            className="rounded-xl"
                          />
                        </div>
                      )}
                      <p className="relative mt-6 pb-6 text-muted-foreground">
                        {post.body}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
