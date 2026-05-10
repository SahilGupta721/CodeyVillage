"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const PhaserGame = dynamic(() => import("../../src/game/PhaserGame"), {
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
});

function GamePageInner() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room_id");

  return (
    <div className="w-screen h-screen overflow-hidden">
      <PhaserGame roomId={roomId} />
    </div>
  );
}

export default function GameTestPage() {
  return (
    <Suspense fallback={
      <div style={{
        width: "100vw",
        height: "100vh",
        background: "#1a6b8a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "16px",
      }}>
        Loading island...
      </div>
    }>
      <GamePageInner />
    </Suspense>
  );
}