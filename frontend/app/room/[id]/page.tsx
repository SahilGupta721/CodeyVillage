"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import dynamic from "next/dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const PhaserGame = dynamic(() => import("../../../src/game/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100vw", height: "100vh", background: "#1a6b8a",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontFamily: "monospace", fontSize: "16px",
    }}>
      Loading island...
    </div>
  ),
});

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/auth"); return; }

      const username = localStorage.getItem(`username:${user.uid}`);
      if (!username) { router.push("/onboarding"); return; }

      // Verify the room exists
      try {
        const res = await fetch(`${BACKEND_URL}/rooms/${roomId}`);
        if (!res.ok) { setError("Room not found."); return; }
      } catch {
        setError("Could not reach server.");
        return;
      }

      setReady(true);
    });
    return () => unsub();
  }, [roomId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0e1a] gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={() => router.push("/lobby")} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Back to lobby
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{
        width: "100vw", height: "100vh", background: "#1a6b8a",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontFamily: "monospace", fontSize: "16px",
      }}>
        Loading island...
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden">
      <PhaserGame roomId={roomId} />
    </div>
  );
}
