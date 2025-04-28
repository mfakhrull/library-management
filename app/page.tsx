"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  const showSession = () => {
    if (status === "authenticated") {
      return (
        <Button
          onClick={() => {
            signOut({ redirect: false }).then(() => {
              router.push("/");
            });
          }}
        >
          Sign Out
        </Button>
      );
    } else if (status === "loading") {
      return <span className="text-[#888] text-sm mt-7">Loading...</span>;
    } else {
      return (
        <Button>
          <Link href="/login">Sign In</Link>
        </Button>
      );
    }
  };
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-xl">Home</h1>
        {showSession()}
      </main>
    </>
  );
}
