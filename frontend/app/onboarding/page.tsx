"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth");
      } else {
        setUid(user.uid);
      }
    });
    return () => unsub();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    if (trimmed.length < 3) return setError("Username must be at least 3 characters");
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return setError("Only letters, numbers, and underscores allowed");

    setLoading(true);
    setError(null);
    try {
      if (uid) {
        localStorage.setItem(`username:${uid}`, trimmed);
        window.postMessage({
          type: "productivity-island-auth",
          uid,
          idToken: null,
          username: trimmed,
        }, "*");
      }
      router.push("/lobby");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
      <div className="w-full max-w-md px-8 py-12 flex flex-col items-center gap-8">

        <div className="text-center">
          <div className="text-5xl mb-4">🏗️</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Set your username</h1>
          <p className="text-slate-400 mt-2 text-sm">
            This is how other players will know you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full bg-[#111827] border border-slate-700 rounded-2xl p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-slate-300 text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. grindmaster99"
              maxLength={20}
              className="bg-[#0a0e1a] border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <p className="text-slate-600 text-xs">{username.length}/20 · letters, numbers, underscores only</p>
          </div>

          <button
            type="submit"
            disabled={loading || username.trim().length < 3}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
          >
            {loading ? "Setting up your island..." : "Start playing →"}
          </button>
        </form>

      </div>
    </div>
  );
}
