"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, signInWithPopup, GithubAuthProvider } from "firebase/auth";
import { auth, githubProvider } from "../../lib/firebase";
import CoinDisplay from "@/src/components/ui/CoinDisplay";

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
        .catch(() => { });

      fetch(`${BACKEND_URL}/users/${user.uid}/stats`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setStats(data); })
        .catch(() => { });

      fetch(`${BACKEND_URL}/rooms/user/${user.uid}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { setActiveRoom(data ?? null); })
        .catch(() => { });
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
      const result = await signInWithPopup(auth, githubProvider);
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
      setGithubError("Failed to connect GitHub. Try again.");
    } finally {
      setGithubLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    router.push("/");
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
          <img src="/logo.svg" width={28} height={28} alt="Codey Village" className="rounded" />
          <span className="text-white font-bold text-lg tracking-tight">Codey Village</span>
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

              {/* Create Room — warm amber */}
              <div style={{
                background: '#2D1F0A',
                border: '3px solid #180E04',
                boxShadow: 'inset 2px 2px 0 0 #5A3A10, inset -2px -2px 0 0 #110800, 4px 4px 0 0 #080400',
                padding: '20px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column' as const,
                gap: 16,
                imageRendering: 'pixelated' as const,
              }}>
                {/* Corner accents */}
                <div style={{ position: 'absolute', top: 6, left: 6, width: 12, height: 2, background: '#7A5220' }} />
                <div style={{ position: 'absolute', top: 6, left: 6, width: 2, height: 12, background: '#7A5220' }} />
                <div style={{ position: 'absolute', top: 6, right: 6, width: 12, height: 2, background: '#7A5220' }} />
                <div style={{ position: 'absolute', top: 6, right: 6, width: 2, height: 12, background: '#7A5220' }} />
                <div style={{ position: 'absolute', bottom: 6, left: 6, width: 12, height: 2, background: '#7A5220' }} />
                <div style={{ position: 'absolute', bottom: 6, left: 6, width: 2, height: 12, background: '#7A5220' }} />
                <div style={{ position: 'absolute', bottom: 6, right: 6, width: 12, height: 2, background: '#7A5220' }} />
                <div style={{ position: 'absolute', bottom: 6, right: 6, width: 2, height: 12, background: '#7A5220' }} />

                {/* Header */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
                      <div style={{ width: 14, height: 3, background: '#7A5220' }} />
                      <div style={{ width: 10, height: 3, background: '#7A5220', opacity: 0.6 }} />
                      <div style={{ width: 6, height: 3, background: '#7A5220', opacity: 0.3 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 9, color: '#FFD88A', textShadow: '2px 2px 0 #180E04', letterSpacing: '0.05em', lineHeight: 1, paddingTop: 2 }}>
                      CREATE ROOM
                    </span>
                  </div>
                  <div style={{ height: 2, marginBottom: 10, backgroundImage: 'repeating-linear-gradient(90deg,#4A2E08 0px,#4A2E08 6px,transparent 6px,transparent 10px)' }} />
                  <p style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 6, color: '#7A5220', lineHeight: 1.9, margin: 0, whiteSpace: 'pre-line' as const }}>
                    {'START A NEW ISLAND AND\nINVITE FRIENDS'}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="ROOM NAME..."
                    maxLength={32}
                    style={{
                      background: '#1A1005',
                      border: '2px solid #180E04',
                      boxShadow: 'inset 2px 2px 0 0 #0C0800,inset -1px -1px 0 0 #4A3010',
                      color: '#FFD88A',
                      fontFamily: 'var(--font-pixel),monospace',
                      fontSize: 8,
                      padding: '11px 12px',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box' as const,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading === "create" || !roomName.trim()}
                    style={{
                      background: loading === "create" || !roomName.trim() ? '#1F1508' : '#7A4A10',
                      border: '3px solid #180E04',
                      boxShadow: loading === "create" || !roomName.trim()
                        ? 'inset 2px 2px 0 0 #0C0800'
                        : 'inset 2px 2px 0 0 #C07A20,inset -2px -2px 0 0 #3A1A00,3px 3px 0 0 #080400',
                      padding: '11px 10px',
                      fontFamily: 'var(--font-pixel),monospace',
                      fontSize: 7,
                      color: loading === "create" || !roomName.trim() ? '#4A2E08' : '#FFD88A',
                      textShadow: '2px 2px 0 #180E04',
                      cursor: loading === "create" || !roomName.trim() ? 'not-allowed' as const : 'pointer' as const,
                      transform: loading === "create" || !roomName.trim() ? 'translate(2px,2px)' : 'none',
                      width: '100%',
                      imageRendering: 'pixelated' as const,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {loading === "create" ? "CREATING..." : "CREATE ROOM  ▶"}
                  </button>
                </form>
              </div>

              {/* Join Room — deep sapphire */}
              <div style={{
                background: '#1A1E35',
                border: '3px solid #0D1020',
                boxShadow: 'inset 2px 2px 0 0 #2E3560, inset -2px -2px 0 0 #080A18, 4px 4px 0 0 #050810',
                padding: '20px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column' as const,
                gap: 16,
                imageRendering: 'pixelated' as const,
              }}>
                {/* Corner accents */}
                <div style={{ position: 'absolute', top: 6, left: 6, width: 12, height: 2, background: '#4A5888' }} />
                <div style={{ position: 'absolute', top: 6, left: 6, width: 2, height: 12, background: '#4A5888' }} />
                <div style={{ position: 'absolute', top: 6, right: 6, width: 12, height: 2, background: '#4A5888' }} />
                <div style={{ position: 'absolute', top: 6, right: 6, width: 2, height: 12, background: '#4A5888' }} />
                <div style={{ position: 'absolute', bottom: 6, left: 6, width: 12, height: 2, background: '#4A5888' }} />
                <div style={{ position: 'absolute', bottom: 6, left: 6, width: 2, height: 12, background: '#4A5888' }} />
                <div style={{ position: 'absolute', bottom: 6, right: 6, width: 12, height: 2, background: '#4A5888' }} />
                <div style={{ position: 'absolute', bottom: 6, right: 6, width: 2, height: 12, background: '#4A5888' }} />

                {/* Header */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
                      <div style={{ width: 14, height: 3, background: '#4A5888' }} />
                      <div style={{ width: 10, height: 3, background: '#4A5888', opacity: 0.6 }} />
                      <div style={{ width: 6, height: 3, background: '#4A5888', opacity: 0.3 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 9, color: '#A8B8FF', textShadow: '2px 2px 0 #0D1020', letterSpacing: '0.05em', lineHeight: 1, paddingTop: 2 }}>
                      JOIN ROOM
                    </span>
                  </div>
                  <div style={{ height: 2, marginBottom: 10, backgroundImage: 'repeating-linear-gradient(90deg,#2E3560 0px,#2E3560 6px,transparent 6px,transparent 10px)' }} />
                  <p style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 6, color: '#4A5888', lineHeight: 1.9, margin: 0, whiteSpace: 'pre-line' as const }}>
                    {'ENTER THE 6-CHAR CODE\nTO JUMP IN'}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="_ _ _ _ _ _"
                    maxLength={6}
                    style={{
                      background: '#0F1225',
                      border: '2px solid #0D1020',
                      boxShadow: 'inset 2px 2px 0 0 #060810,inset -1px -1px 0 0 #2A3058',
                      color: '#A8B8FF',
                      fontFamily: 'var(--font-pixel),monospace',
                      fontSize: 11,
                      letterSpacing: '0.35em',
                      textTransform: 'uppercase' as const,
                      padding: '11px 12px',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box' as const,
                      textAlign: 'center' as const,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading === "join" || joinCode.trim().length !== 6}
                    style={{
                      background: loading === "join" || joinCode.trim().length !== 6 ? '#111525' : '#2A3578',
                      border: '3px solid #0D1020',
                      boxShadow: loading === "join" || joinCode.trim().length !== 6
                        ? 'inset 2px 2px 0 0 #060810'
                        : 'inset 2px 2px 0 0 #4A60CC,inset -2px -2px 0 0 #0F1840,3px 3px 0 0 #050810',
                      padding: '11px 10px',
                      fontFamily: 'var(--font-pixel),monospace',
                      fontSize: 7,
                      color: loading === "join" || joinCode.trim().length !== 6 ? '#2A3050' : '#A8B8FF',
                      textShadow: '2px 2px 0 #0D1020',
                      cursor: loading === "join" || joinCode.trim().length !== 6 ? 'not-allowed' as const : 'pointer' as const,
                      transform: loading === "join" || joinCode.trim().length !== 6 ? 'translate(2px,2px)' : 'none',
                      width: '100%',
                      imageRendering: 'pixelated' as const,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {loading === "join" ? "JOINING..." : "JOIN ROOM  ▶"}
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* GitHub connect — pixel-art redesign */}
          <div style={{
            background: '#2E1A2A',
            border: '3px solid #170D14',
            boxShadow: 'inset 2px 2px 0 0 #5A3050, inset -2px -2px 0 0 #110810, 4px 4px 0 0 #0A0508',
            padding: '20px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            imageRendering: 'pixelated' as const,
          }}>
            {/* Corner accents */}
            <div style={{ position: 'absolute', top: 6, left: 6, width: 12, height: 2, background: '#8A4568' }} />
            <div style={{ position: 'absolute', top: 6, left: 6, width: 2, height: 12, background: '#8A4568' }} />
            <div style={{ position: 'absolute', top: 6, right: 6, width: 12, height: 2, background: '#8A4568' }} />
            <div style={{ position: 'absolute', top: 6, right: 6, width: 2, height: 12, background: '#8A4568' }} />
            <div style={{ position: 'absolute', bottom: 6, left: 6, width: 12, height: 2, background: '#8A4568' }} />
            <div style={{ position: 'absolute', bottom: 6, left: 6, width: 2, height: 12, background: '#8A4568' }} />
            <div style={{ position: 'absolute', bottom: 6, right: 6, width: 12, height: 2, background: '#8A4568' }} />
            <div style={{ position: 'absolute', bottom: 6, right: 6, width: 2, height: 12, background: '#8A4568' }} />

            {/* Left: title + description */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
                  <div style={{ width: 14, height: 3, background: '#8A4568' }} />
                  <div style={{ width: 10, height: 3, background: '#8A4568', opacity: 0.6 }} />
                  <div style={{ width: 6, height: 3, background: '#8A4568', opacity: 0.3 }} />
                </div>
                <span style={{
                  fontFamily: 'var(--font-pixel),monospace',
                  fontSize: 9,
                  color: '#FFCCE8',
                  textShadow: '2px 2px 0 #170D14',
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                  paddingTop: 2,
                }}>
                  GITHUB
                </span>
              </div>

              {/* Pixel dotted divider */}
              <div style={{
                height: 2,
                marginBottom: 10,
                backgroundImage: 'repeating-linear-gradient(90deg,#5A3050 0px,#5A3050 6px,transparent 6px,transparent 10px)',
              }} />

              <p style={{
                fontFamily: 'var(--font-pixel),monospace',
                fontSize: 6,
                color: '#9A6080',
                lineHeight: 1.9,
                margin: 0,
                whiteSpace: 'pre-line' as const,
              }}>
                {githubLogin
                  ? `CONNECTED AS @${githubLogin.toUpperCase()}\nCOMMITS ARE BEING TRACKED`
                  : 'LINK YOUR ACCOUNT TO TRACK\nCOMMITS AND EARN COINS'}
              </p>
              {githubError && (
                <p style={{
                  fontFamily: 'var(--font-pixel),monospace',
                  fontSize: 6,
                  color: '#FF6868',
                  lineHeight: 1.9,
                  margin: '6px 0 0',
                }}>
                  !! {githubError.toUpperCase()}
                </p>
              )}
            </div>

            {/* Right: connected badge or connect button */}
            {githubLogin ? (
              <div style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#1A2E1F',
                border: '2px solid #0D1A10',
                boxShadow: 'inset 1px 1px 0 0 #2A5A35,inset -1px -1px 0 0 #0A1810,2px 2px 0 0 #050C08',
                padding: '8px 12px',
              }}>
                {/* Pixel status dot */}
                <div style={{
                  width: 8, height: 8, flexShrink: 0,
                  background: '#66FF88',
                  boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.45),inset -2px -2px 0 #1A8A35,0 0 0 1px #0D1A10',
                  imageRendering: 'pixelated' as const,
                }} />
                <span style={{
                  fontFamily: 'var(--font-pixel),monospace',
                  fontSize: 7,
                  color: '#FFCCE8',
                  textShadow: '1px 1px 0 #170D14',
                  lineHeight: 1,
                  whiteSpace: 'nowrap' as const,
                }}>
                  @{githubLogin}
                </span>
              </div>
            ) : (
              <button
                onClick={handleConnectGithub}
                disabled={githubLoading}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: githubLoading ? '#3A1428' : '#6A2848',
                  border: '3px solid #170D14',
                  boxShadow: githubLoading
                    ? 'inset 2px 2px 0 0 #350C20'
                    : 'inset 2px 2px 0 0 #9A3A68,inset -2px -2px 0 0 #350C20,3px 3px 0 0 #0A0508',
                  padding: '9px 14px',
                  cursor: githubLoading ? 'not-allowed' as const : 'pointer' as const,
                  opacity: githubLoading ? 0.6 : 1,
                  transform: githubLoading ? 'translate(2px,2px)' : 'none',
                  fontFamily: 'var(--font-pixel),monospace',
                  fontSize: 7,
                  color: '#FFCCE8',
                  textShadow: '2px 2px 0 #170D14',
                  lineHeight: 1,
                  imageRendering: 'pixelated' as const,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#FFCCE8">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                {githubLoading ? 'CONNECTING...' : 'CONNECT'}
              </button>
            )}
          </div>

          {/* Stats — pixel-art redesign */}
          <div style={{
            background: '#1A3535',
            border: '3px solid #0D1F1F',
            boxShadow: 'inset 2px 2px 0 0 #2E6060, inset -2px -2px 0 0 #0A1818, 4px 4px 0 0 #050C0C',
            padding: '20px',
            position: 'relative',
            imageRendering: 'pixelated' as const,
          }}>
            {/* Corner accents */}
            <div style={{ position: 'absolute', top: 6, left: 6, width: 12, height: 2, background: '#4A9898' }} />
            <div style={{ position: 'absolute', top: 6, left: 6, width: 2, height: 12, background: '#4A9898' }} />
            <div style={{ position: 'absolute', top: 6, right: 6, width: 12, height: 2, background: '#4A9898' }} />
            <div style={{ position: 'absolute', top: 6, right: 6, width: 2, height: 12, background: '#4A9898' }} />
            <div style={{ position: 'absolute', bottom: 6, left: 6, width: 12, height: 2, background: '#4A9898' }} />
            <div style={{ position: 'absolute', bottom: 6, left: 6, width: 2, height: 12, background: '#4A9898' }} />
            <div style={{ position: 'absolute', bottom: 6, right: 6, width: 12, height: 2, background: '#4A9898' }} />
            <div style={{ position: 'absolute', bottom: 6, right: 6, width: 2, height: 12, background: '#4A9898' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
                  <div style={{ width: 14, height: 3, background: '#4A9898' }} />
                  <div style={{ width: 10, height: 3, background: '#4A9898', opacity: 0.6 }} />
                  <div style={{ width: 6, height: 3, background: '#4A9898', opacity: 0.3 }} />
                </div>
                <span style={{
                  fontFamily: 'var(--font-pixel),monospace',
                  fontSize: 9,
                  color: '#A8FFE8',
                  textShadow: '2px 2px 0 #0D1F1F',
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                  paddingTop: 2,
                }}>
                  YOUR STATS
                </span>
              </div>
              <CoinDisplay coins={coins} />
            </div>

            {/* Pixel dotted divider */}
            <div style={{
              height: 2,
              marginBottom: 14,
              backgroundImage: 'repeating-linear-gradient(90deg,#2E6060 0px,#2E6060 6px,transparent 6px,transparent 10px)',
            }} />

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { value: stats.leetcode_solved, label: 'LEETCODE\nSOLVED', accent: '#FFD36E', gem: '#8B6200' },
                { value: stats.commits, label: 'COMMITS\nPUSHED', accent: '#5BFFD8', gem: '#1A7060' },
                { value: stats.jobs_applied, label: 'JOBS\nAPPLIED', accent: '#C090FF', gem: '#5A2A9A' },
              ].map(({ value, label, accent, gem }) => (
                <div key={label} style={{
                  background: '#0F2828',
                  backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.12) 0px,rgba(0,0,0,0.12) 1px,transparent 1px,transparent 4px)',
                  border: '2px solid #0D1F1F',
                  boxShadow: 'inset 2px 2px 0 0 #081818,inset -1px -1px 0 0 #2A5050',
                  padding: '14px 6px 12px',
                  textAlign: 'center' as const,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  gap: 7,
                }}>
                  {/* Gem indicator */}
                  <div style={{
                    width: 10, height: 10,
                    background: accent,
                    boxShadow: `inset 2px 2px 0 rgba(255,255,255,0.45),inset -2px -2px 0 ${gem},0 0 0 1px #0D1F1F`,
                    imageRendering: 'pixelated' as const,
                  }} />
                  {/* Value */}
                  <div style={{
                    fontFamily: 'var(--font-pixel),monospace',
                    fontSize: 16,
                    color: accent,
                    textShadow: '2px 2px 0 #0D1F1F',
                    lineHeight: 1,
                  }}>
                    {value}
                  </div>
                  {/* Three-dot separator */}
                  <div style={{ display: 'flex', gap: 3 }}>
                    <div style={{ width: 2, height: 2, background: accent, opacity: 0.35 }} />
                    <div style={{ width: 2, height: 2, background: accent, opacity: 0.7 }} />
                    <div style={{ width: 2, height: 2, background: accent, opacity: 0.35 }} />
                  </div>
                  {/* Label */}
                  <div style={{
                    fontFamily: 'var(--font-pixel),monospace',
                    fontSize: 6,
                    color: '#3A8878',
                    letterSpacing: '0.02em',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-line' as const,
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
