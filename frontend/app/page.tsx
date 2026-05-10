"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import dynamic from "next/dynamic";

import { auth } from "../lib/firebase";

// Load Phaser only on client
const PhaserGame = dynamic(
  () => import("../src/game/PhaserGame"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#1a6b8a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontFamily: "monospace",
          fontSize: "16px",
        }}
      >
        Loading island...
      </div>
    ),
  }
);

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
    <div className="w-screen h-screen overflow-hidden">
      <PhaserGame />
    </div>
  );
}