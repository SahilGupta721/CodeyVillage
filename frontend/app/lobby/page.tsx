"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function LobbyPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      const stored = localStorage.getItem(`username:${user.uid}`);
      if (!stored) {
        router.push("/onboarding");
        return;
      }
      setUid(user.uid);
      setUsername(stored);
    });
    return () => unsub();
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = roomName.trim();
    if (!name || !uid) return;
    setLoading("create");
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/rooms/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, host_id: uid }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      router.push(`/room/${data.room_id}`);
    } catch (err: any) {
      setError("Failed to create room. Is the backend running?");
    } finally {
      setLoading(null);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code || !uid) return;
    setLoading("join");
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, user_id: uid }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      router.push(`/room/${data.room_id}`);
    } catch (err: any) {
      setError("Room not found or invalid code.");
    } finally {
      setLoading(null);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    router.push("/auth");
  }

  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏝️</span>
          <span className="text-white font-bold text-lg tracking-tight">ProductivityIsland</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">
            Hey, <span className="text-white font-medium">{username}</span>
          </span>
          <button
            onClick={handleSignOut}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl flex flex-col gap-8">

          <div className="text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">Game Lobby</h1>
            <p className="text-slate-400 mt-2 text-sm">
              Create a room or join an existing one to start competing.
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Room */}
            <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-white font-semibold text-base">Create a room</h2>
                <p className="text-slate-500 text-xs mt-1">Start a new island and invite friends.</p>
              </div>
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Room name"
                  maxLength={32}
                  className="bg-[#0a0e1a] border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={loading === "create" || !roomName.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors text-sm"
                >
                  {loading === "create" ? "Creating..." : "Create room →"}
                </button>
              </form>
            </div>

            {/* Join Room */}
            <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-white font-semibold text-base">Join a room</h2>
                <p className="text-slate-500 text-xs mt-1">Enter the 6-character code to jump in.</p>
              </div>
              <form onSubmit={handleJoin} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. XK7P2M"
                  maxLength={6}
                  className="bg-[#0a0e1a] border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 tracking-widest font-mono uppercase"
                />
                <button
                  type="submit"
                  disabled={loading === "join" || joinCode.trim().length !== 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors text-sm"
                >
                  {loading === "join" ? "Joining..." : "Join room →"}
                </button>
              </form>
            </div>
          </div>

          {/* Coin summary placeholder */}
          <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-base">Your stats</h2>
              <span className="text-yellow-400 text-sm font-medium">🪙 0 coins</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-[#0a0e1a] rounded-xl p-3">
                <div className="text-white font-bold text-xl">0</div>
                <div className="text-slate-500 text-xs mt-1">LeetCode solved</div>
              </div>
              <div className="bg-[#0a0e1a] rounded-xl p-3">
                <div className="text-white font-bold text-xl">0</div>
                <div className="text-slate-500 text-xs mt-1">Commits pushed</div>
              </div>
              <div className="bg-[#0a0e1a] rounded-xl p-3">
                <div className="text-white font-bold text-xl">0</div>
                <div className="text-slate-500 text-xs mt-1">Jobs applied</div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
