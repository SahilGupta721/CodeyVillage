"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, linkWithPopup, GithubAuthProvider } from "firebase/auth";
import { auth, githubProvider } from "../../lib/firebase";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function LobbyPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  const [coins, setCoins] = useState(0);
  const [stats, setStats] = useState({ leetcode_solved: 0, commits: 0, jobs_applied: 0 });

  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | "leave" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<{ room_id: string; name: string; code: string; host_id: string } | null>(null);

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

      // Load user data from backend
      fetch(`${BACKEND_URL}/users/${user.uid}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.github_username) setGithubLogin(data.github_username);
          if (data?.coins != null) setCoins(data.coins);
        })
        .catch(() => {});

      fetch(`${BACKEND_URL}/users/${user.uid}/stats`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setStats(data); })
        .catch(() => {});

      fetch(`${BACKEND_URL}/rooms/user/${user.uid}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { setActiveRoom(data ?? null); })
        .catch(() => {});
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? "Failed to create room.");
      }
      const data = await res.json();
      router.push(`/room/${data.room_id}`);
    } catch (err: any) {
      setError(err.message);
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? "Room not found or invalid code.");
      }
      const data = await res.json();
      router.push(`/room/${data.room_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleLeaveActive() {
    if (!activeRoom || !uid) return;
    setLoading("leave");
    setError(null);
    try {
      await fetch(`${BACKEND_URL}/rooms/${activeRoom.room_id}/leave?user_id=${uid}`, { method: "DELETE" });
      setActiveRoom(null);
    } catch {
      setError("Failed to leave room.");
    } finally {
      setLoading(null);
    }
  }

  async function handleConnectGithub() {
    if (!auth.currentUser || !uid) return;
    setGithubLoading(true);
    setGithubError(null);
    try {
      const result = await linkWithPopup(auth.currentUser, githubProvider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      const githubToken = credential?.accessToken;
      if (!githubToken) throw new Error("No token returned");

      const res = await fetch(`${BACKEND_URL}/users/connect-github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, github_token: githubToken }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setGithubLogin(data.github_login);
    } catch (err: any) {
      if (err.code === "auth/credential-already-in-use" || err.code === "auth/provider-already-linked") {
        setGithubError("This GitHub account is already linked.");
      } else {
        setGithubError("Failed to connect GitHub. Try again.");
      }
    } finally {
      setGithubLoading(false);
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

          {activeRoom ? (
            <div className="bg-[#111827] border border-indigo-700 rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-white font-semibold text-base">Your current room</h2>
                <p className="text-slate-500 text-xs mt-1">You're already in a room. Leave it to create or join another.</p>
              </div>
              <div className="flex items-center justify-between bg-[#0a0e1a] rounded-xl px-4 py-3">
                <div>
                  <div className="text-white font-medium">{activeRoom.name}</div>
                  <div className="text-slate-400 text-xs font-mono tracking-widest mt-0.5">{activeRoom.code}</div>
                </div>
                {activeRoom.host_id === uid && (
                  <span className="text-xs text-yellow-400">host</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/room/${activeRoom.room_id}`)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-colors text-sm"
                >
                  Rejoin →
                </button>
                <button
                  onClick={handleLeaveActive}
                  disabled={loading === "leave"}
                  className="flex-1 bg-slate-700 hover:bg-red-900 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-red-400 font-medium py-3 rounded-xl transition-colors text-sm"
                >
                  {loading === "leave" ? "Leaving..." : "Leave room"}
                </button>
              </div>
            </div>
          ) : (
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
          )}

          {/* GitHub connect */}
          <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-white font-semibold text-base">GitHub</h2>
              <p className="text-slate-500 text-xs mt-1">
                {githubLogin
                  ? `Connected as @${githubLogin} — commits are being tracked`
                  : "Connect to track commits and earn coins automatically"}
              </p>
              {githubError && <p className="text-red-400 text-xs mt-1">{githubError}</p>}
            </div>
            {githubLogin ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                @{githubLogin}
              </div>
            ) : (
              <button
                onClick={handleConnectGithub}
                disabled={githubLoading}
                className="shrink-0 flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                {githubLoading ? "Connecting..." : "Connect GitHub"}
              </button>
            )}
          </div>

          {/* Coin summary placeholder */}
          <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-base">Your stats</h2>
              <span className="text-yellow-400 text-sm font-medium">🪙 {coins} coins</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-[#0a0e1a] rounded-xl p-3">
                <div className="text-white font-bold text-xl">{stats.leetcode_solved}</div>
                <div className="text-slate-500 text-xs mt-1">LeetCode solved</div>
              </div>
              <div className="bg-[#0a0e1a] rounded-xl p-3">
                <div className="text-white font-bold text-xl">{stats.commits}</div>
                <div className="text-slate-500 text-xs mt-1">Commits pushed</div>
              </div>
              <div className="bg-[#0a0e1a] rounded-xl p-3">
                <div className="text-white font-bold text-xl">{stats.jobs_applied}</div>
                <div className="text-slate-500 text-xs mt-1">Jobs applied</div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
