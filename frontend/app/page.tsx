"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const hasUsername = localStorage.getItem(`username:${user.uid}`);
        router.push(hasUsername ? "/lobby" : "/onboarding");
      } else {
        setChecking(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (checking) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-slate-600 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col">

      {/* Nav */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" width={28} height={28} alt="Codey Village" className="rounded" />
          <span className="text-white font-bold text-lg tracking-tight">Codey Village</span>
        </div>
        <button
          onClick={() => router.push("/auth")}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Sign in →
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img src="/logo.svg" width={80} height={80} alt="Codey Village" className="rounded-2xl shadow-lg shadow-indigo-900/40" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
            Code your way to a mansion.
          </h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto mb-8">
            Solve LeetCode, push commits, and apply to jobs. Earn coins and build your island with friends.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <span className="text-yellow-400 font-semibold">⚡ +50 🪙 per LeetCode solve</span>
            <span className="text-slate-700">·</span>
            <span className="text-yellow-400 font-semibold">📦 +25 🪙 per commit</span>
            <span className="text-slate-700">·</span>
            <span className="text-yellow-400 font-semibold">💼 +25 🪙 per job app</span>
          </div>
        </div>

        {/* Install section */}
        <div className="w-full max-w-2xl">

          {/* Download button */}
          <div className="bg-[#111827] border border-indigo-700 rounded-2xl p-8 mb-6 text-center">
            <p className="text-slate-400 text-sm mb-4">Step 1 — Get the extension</p>
            <a
              href="/extension"
              className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Extension (.zip)
            </a>
            <p className="text-slate-600 text-xs mt-3">Chrome only · ~50 KB</p>
          </div>

          {/* Detailed instructions */}
          <div className="bg-[#111827] border border-slate-700 rounded-2xl p-8 mb-6">
            <p className="text-slate-400 text-sm mb-6">Step 2 — Install in Chrome</p>
            <ol className="flex flex-col gap-5">
              <Instruction
                number="1"
                title="Unzip the downloaded file"
                detail='Find "codey-village-extension.zip" in your Downloads folder and double-click it to unzip. You will get a folder called "extension".'

              />
              <Instruction
                number="2"
                title='Open Chrome and go to chrome://extensions'
                detail={
                  <>
                    Paste{" "}
                    <code className="bg-[#0a0e1a] border border-slate-700 text-indigo-400 text-xs px-1.5 py-0.5 rounded">
                      chrome://extensions
                    </code>{" "}
                    into your address bar and press Enter.
                  </>
                }
              />
              <Instruction
                number="3"
                title="Enable Developer Mode"
                detail='In the top-right corner of the Extensions page, toggle on "Developer mode". This unlocks the ability to load extensions from your computer.'
              />
              <Instruction
                number="4"
                title='Click "Load unpacked"'
                detail='A new button will appear in the top-left — click "Load unpacked", then navigate to and select the "extension" folder you unzipped in step 1.'
              />
              <Instruction
                number="5"
                title="Pin the extension (optional but recommended)"
                detail='Click the puzzle icon 🧩 in your Chrome toolbar and click the pin icon next to "Codey Village" so it stays visible in your toolbar.'
              />
            </ol>
          </div>

          {/* Sign in CTA */}
          <div className="bg-[#111827] border border-slate-700 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm mb-2">Step 3 — Create your account</p>
            <p className="text-slate-500 text-xs mb-5">Sign in with Google to start earning coins and building your island.</p>
            <button
              onClick={() => router.push("/auth")}
              className="inline-flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

        </div>
      </main>

    </div>
  );
}

function Instruction({ number, title, detail }: { number: string; title: string; detail: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-600/40 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <div className="text-white text-sm font-semibold mb-1">{title}</div>
        <div className="text-slate-500 text-xs leading-relaxed">{detail}</div>
      </div>
    </li>
  );
}
