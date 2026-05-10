"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";

/**
 * Root route only redirects — do not mount Phaser here.
 * A bare <PhaserGame /> had no roomId, so GameScene logged
 * "No roomId or uid — single-player" and wasted a full game boot.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const hasUsername = localStorage.getItem(
          `username:${user.uid}`
        );

        router.push(
          hasUsername ? "/lobby" : "/onboarding"
        );
      } else {
        router.push("/auth");
      }
    });

    return () => unsub();
  }, [router]);

  return (
    <div
      className="w-screen h-screen overflow-hidden flex items-center justify-center"
      style={{
        background: "#1a6b8a",
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "16px",
      }}
    >
      Loading...
    </div>
  );
}