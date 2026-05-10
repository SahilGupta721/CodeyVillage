"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, linkWithPopup, GithubAuthProvider } from "firebase/auth";
import { auth, githubProvider } from "../../lib/firebase";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function OnboardingPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [step, setStep] = useState<"username" | "github">("username");

  const [username, setUsername] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubLogin, setGithubLogin] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/auth");
      else setUid(user.uid);
    });
    return () => unsub();
  }, [router]);

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    if (trimmed.length < 3) return setUsernameError("Username must be at least 3 characters");
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return setUsernameError("Only letters, numbers, and underscores allowed");

    setUsernameLoading(true);
    setUsernameError(null);
    try {
      if (uid) {
        localStorage.setItem(`username:${uid}`, trimmed);

        fetch(`${BACKEND_URL}/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, username: trimmed }),
        }).catch(() => {});

        window.postMessage({ type: "productivity-island-auth", uid, idToken: null, username: trimmed }, "*");
      }
      setStep("github");
    } catch {
      setUsernameError("Something went wrong. Please try again.");
    } finally {
      setUsernameLoading(false);
    }
  }

  async function handleConnectGithub() {
    if (!auth.currentUser || !uid) return;
    setGithubLoading(true);
    setGithubError(null);
    try {
      const result = await linkWithPopup(auth.currentUser, githubProvider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (!token) throw new Error("No token");

      const res = await fetch(`${BACKEND_URL}/users/connect-github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, github_token: token }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setGithubLogin(data.github_login);
    } catch (err: any) {
      if (err.code === "auth/credential-already-in-use" || err.code === "auth/provider-already-linked") {
        setGithubError("This GitHub account is already linked to another user.");
      } else {
        setGithubError("Could not connect GitHub. You can do this later from the lobby.");
      }
    } finally {
      setGithubLoading(false);
    }
  }

  function handleFinish() {
    router.push("/lobby");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
      <div className="w-full max-w-md px-8 py-12 flex flex-col items-center gap-8">

        {/* Step indicators */}
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${step === "username" ? "bg-indigo-500" : "bg-indigo-500"}`} />
          <div className={`w-8 h-px ${step === "github" ? "bg-indigo-500" : "bg-slate-700"}`} />
          <div className={`w-2 h-2 rounded-full ${step === "github" ? "bg-indigo-500" : "bg-slate-700"}`} />
        </div>

        {step === "username" && (
          <>
            <div className="text-center">
              <div className="text-5xl mb-4">🏗️</div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Set your username</h1>
              <p className="text-slate-400 mt-2 text-sm">This is how other players will know you.</p>
            </div>

            <form onSubmit={handleUsernameSubmit} className="w-full bg-[#111827] border border-slate-700 rounded-2xl p-8 flex flex-col gap-5">
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
                {usernameError && <p className="text-red-400 text-xs">{usernameError}</p>}
                <p className="text-slate-600 text-xs">{username.length}/20 · letters, numbers, underscores only</p>
              </div>

              <button
                type="submit"
                disabled={usernameLoading || username.trim().length < 3}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
              >
                {usernameLoading ? "Saving..." : "Continue →"}
              </button>
            </form>
          </>
        )}

        {step === "github" && (
          <>
            <div className="text-center">
              <div className="text-5xl mb-4">🐙</div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Connect GitHub</h1>
              <p className="text-slate-400 mt-2 text-sm">
                Earn <span className="text-yellow-400 font-medium">🪙 5 coins</span> per commit automatically.
              </p>
            </div>

            <div className="w-full bg-[#111827] border border-slate-700 rounded-2xl p-8 flex flex-col gap-5">
              {githubLogin ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-emerald-400 text-4xl">✓</div>
                  <p className="text-white font-medium">Connected as <span className="text-emerald-400">@{githubLogin}</span></p>
                  <p className="text-slate-500 text-xs text-center">Webhooks created on all your repos. Every push earns coins.</p>
                  <button
                    onClick={handleFinish}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Start playing →
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3 text-slate-400 text-sm">
                      <span className="text-slate-600 mt-0.5">•</span>
                      Webhooks are automatically set up on all your repos
                    </div>
                    <div className="flex items-start gap-3 text-slate-400 text-sm">
                      <span className="text-slate-600 mt-0.5">•</span>
                      Every git push earns you coins, no matter the client
                    </div>
                  </div>

                  {githubError && <p className="text-red-400 text-xs">{githubError}</p>}

                  <button
                    onClick={handleConnectGithub}
                    disabled={githubLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 font-medium py-3 rounded-xl transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    {githubLoading ? "Connecting..." : "Connect GitHub"}
                  </button>

                  <button
                    onClick={handleFinish}
                    className="text-slate-500 hover:text-slate-400 text-sm text-center transition-colors"
                  >
                    Skip for now
                  </button>
                </>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
