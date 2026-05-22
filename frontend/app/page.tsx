"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

interface S {
  bg: string; border: string; hi: string; lo: string;
  drop: string; accent: string; text: string; dim: string;
}

// ← dim colors are now bright enough to read
const AMBER: S = { bg: '#2D1F0A', border: '#180E04', hi: '#5A3A10', lo: '#110800', drop: '#080400', accent: '#7A5220', text: '#FFD88A', dim: '#C8922A' };
const SAPPHIRE: S = { bg: '#1A1E35', border: '#0D1020', hi: '#2E3560', lo: '#080A18', drop: '#050810', accent: '#4A5888', text: '#A8B8FF', dim: '#8A9ABB' };
const PURPLE: S = { bg: '#2E1A2A', border: '#170D14', hi: '#5A3050', lo: '#110810', drop: '#0A0508', accent: '#8A4568', text: '#FFCCE8', dim: '#C890A8' };

function PixelCard({ s, step, heading, children }: { s: S; step: string; heading: string; children: React.ReactNode }) {
  return (
    <div style={{ background: s.bg, border: `3px solid ${s.border}`, boxShadow: `inset 2px 2px 0 0 ${s.hi},inset -2px -2px 0 0 ${s.lo},4px 4px 0 0 ${s.drop}`, padding: 20, position: 'relative', imageRendering: 'pixelated' as const }}>
      <div style={{ position: 'absolute', top: 6, left: 6, width: 12, height: 2, background: s.accent }} />
      <div style={{ position: 'absolute', top: 6, left: 6, width: 2, height: 12, background: s.accent }} />
      <div style={{ position: 'absolute', top: 6, right: 6, width: 12, height: 2, background: s.accent }} />
      <div style={{ position: 'absolute', top: 6, right: 6, width: 2, height: 12, background: s.accent }} />
      <div style={{ position: 'absolute', bottom: 6, left: 6, width: 12, height: 2, background: s.accent }} />
      <div style={{ position: 'absolute', bottom: 6, left: 6, width: 2, height: 12, background: s.accent }} />
      <div style={{ position: 'absolute', bottom: 6, right: 6, width: 12, height: 2, background: s.accent }} />
      <div style={{ position: 'absolute', bottom: 6, right: 6, width: 2, height: 12, background: s.accent }} />
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
            <div style={{ width: 14, height: 3, background: s.accent }} />
            <div style={{ width: 10, height: 3, background: s.accent, opacity: 0.6 }} />
            <div style={{ width: 6, height: 3, background: s.accent, opacity: 0.3 }} />
          </div>
          <span style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 7, color: s.dim, letterSpacing: '0.05em', lineHeight: 1, paddingTop: 2 }}>
            STEP {step}
          </span>
          <span style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 9, color: s.text, textShadow: `2px 2px 0 ${s.border}`, letterSpacing: '0.05em', lineHeight: 1, paddingTop: 2 }}>
            {heading}
          </span>
        </div>
        <div style={{ height: 2, backgroundImage: `repeating-linear-gradient(90deg,${s.accent} 0px,${s.accent} 6px,transparent 6px,transparent 10px)` }} />
      </div>
      {children}
    </div>
  );
}

function PixelStep({ n, s, title, children }: { n: string; s: S; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0, width: 18, height: 18, background: s.bg, border: `2px solid ${s.accent}`, boxShadow: `inset 1px 1px 0 0 ${s.hi}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-pixel),monospace', fontSize: 7, color: s.text, lineHeight: 1, marginTop: 1 }}>
        {n}
      </div>
      <div>
        {/* title stays same size, just kept readable */}
        <div style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 7, color: s.text, letterSpacing: '0.03em', lineHeight: 1, marginBottom: 6 }}>
          {title}
        </div>
        {/* description: fontSize 6→8, dim color is now bright */}
        <div style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 8, color: s.dim, lineHeight: 1.9, letterSpacing: '0.02em' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

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
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a' }}>
        <div style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 8, color: '#7A8AAA' }}>LOADING...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', flexDirection: 'column' as const }}>

      <header style={{ borderBottom: '1px solid #1A2030', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.svg" width={28} height={28} alt="Codey Village" style={{ imageRendering: 'pixelated' as const }} />
          <span style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 10, color: '#FFD88A', textShadow: '2px 2px 0 #080400', letterSpacing: '0.05em' }}>
            CODEY VILLAGE
          </span>
        </div>
        <button
          onClick={() => router.push("/auth")}
          style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 7, color: '#A8B8FF', background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.05em', textShadow: '1px 1px 0 #0D1020' }}
        >
          SIGN IN  ▶
        </button>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '48px 24px' }}>

        <div style={{ textAlign: 'center' as const, marginBottom: 48, maxWidth: 600 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <img src="/logo.svg" width={72} height={72} alt="Codey Village" style={{ imageRendering: 'pixelated' as const }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 18, color: '#FFD88A', textShadow: '3px 3px 0 #080400', letterSpacing: '0.08em', lineHeight: 1.5, textTransform: 'uppercase' as const, margin: '0 0 16px', imageRendering: 'pixelated' as const }}>
            CODE YOUR WAY<br />TO A MANSION.
          </h1>
          {/* fontSize 7→8, color brightened */}
          <p style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 8, color: '#7A8AAA', lineHeight: 1.9, letterSpacing: '0.03em', marginBottom: 28 }}>
            SOLVE LEETCODE, PUSH COMMITS, AND APPLY TO JOBS.<br />
            EARN COINS AND BUILD YOUR DREAM VILLAGE WITH FRIENDS.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' as const }}>
            {([
              ['+50 COINS / LEETCODE', '#FFD36E', '#1A1500', '#3A2D00'],
              ['+25 COINS / COMMIT', '#5BFFD8', '#001A14', '#003A28'],
              ['+25 COINS / JOB APP', '#C090FF', '#10091A', '#2A1A40'],
            ] as const).map(([label, color, bg, border]) => (
              <div key={label} style={{ background: bg, border: `2px solid ${border}`, boxShadow: `inset 1px 1px 0 0 ${color}22`, padding: '7px 10px', fontFamily: 'var(--font-pixel),monospace', fontSize: 8, color, letterSpacing: '0.03em', lineHeight: 1 }}>
                ◆ {label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column' as const, gap: 20 }}>

          <PixelCard s={AMBER} step="01" heading="GET THE EXTENSION">
            {/* fontSize 6→8, dim color now bright */}
            <p style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 8, color: AMBER.dim, lineHeight: 1.9, margin: '0 0 16px' }}>
              DOWNLOAD THE CHROME EXTENSION TO START TRACKING<br />
              YOUR PROGRESS AND EARNING COINS.
            </p>
            <a
              href="/extension"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#7A4A10', border: '3px solid #180E04', boxShadow: 'inset 2px 2px 0 0 #C07A20,inset -2px -2px 0 0 #3A1A00,3px 3px 0 0 #080400', padding: '11px 16px', fontFamily: 'var(--font-pixel),monospace', fontSize: 7, color: '#FFD88A', textShadow: '2px 2px 0 #180E04', textDecoration: 'none', letterSpacing: '0.04em', imageRendering: 'pixelated' as const }}
            >
              ↓ DOWNLOAD EXTENSION (.ZIP)  ▶
            </a>
            <div style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 8, color: AMBER.accent, marginTop: 10, letterSpacing: '0.03em' }}>
              CHROME ONLY · ~50 KB
            </div>
          </PixelCard>

          <PixelCard s={SAPPHIRE} step="02" heading="INSTALL IN CHROME">
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
              <PixelStep n="1" s={SAPPHIRE} title="UNZIP THE DOWNLOADED FILE">
                FIND THE ZIP IN YOUR DOWNLOADS AND DOUBLE-CLICK TO UNZIP. YOU WILL GET A FOLDER CALLED "EXTENSION".
              </PixelStep>
              <PixelStep n="2" s={SAPPHIRE} title="OPEN CHROME EXTENSIONS">
                <>
                  PASTE{' '}
                  <span style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 8, color: '#A8B8FF', background: '#0D1020', padding: '1px 5px', border: '1px solid #4A5888' }}>
                    chrome://extensions
                  </span>
                  {' '}INTO YOUR ADDRESS BAR AND PRESS ENTER.
                </>
              </PixelStep>
              <PixelStep n="3" s={SAPPHIRE} title="ENABLE DEVELOPER MODE">
                TOGGLE ON "DEVELOPER MODE" IN THE TOP-RIGHT CORNER OF THE EXTENSIONS PAGE.
              </PixelStep>
              <PixelStep n="4" s={SAPPHIRE} title='CLICK "LOAD UNPACKED"'>
                CLICK "LOAD UNPACKED" AND SELECT THE "EXTENSION" FOLDER YOU UNZIPPED IN STEP 1.
              </PixelStep>
              <PixelStep n="5" s={SAPPHIRE} title="PIN THE EXTENSION (OPTIONAL)">
                CLICK 🧩 IN YOUR TOOLBAR AND PIN "CODEY VILLAGE" SO IT STAYS VISIBLE.
              </PixelStep>
            </div>
          </PixelCard>

          <PixelCard s={PURPLE} step="03" heading="CREATE YOUR ACCOUNT">
            {/* fontSize 6→8, dim color now bright */}
            <p style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 8, color: PURPLE.dim, lineHeight: 1.9, margin: '0 0 16px' }}>
              SIGN IN WITH GOOGLE TO START EARNING COINS<br />
              AND BUILDING YOUR DREAM VILLAGE.
            </p>
            <button
              onClick={() => router.push("/auth")}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#6A2848', border: '3px solid #170D14', boxShadow: 'inset 2px 2px 0 0 #9A3A68,inset -2px -2px 0 0 #350C20,3px 3px 0 0 #0A0508', padding: '11px 16px', fontFamily: 'var(--font-pixel),monospace', fontSize: 7, color: '#FFCCE8', textShadow: '2px 2px 0 #170D14', cursor: 'pointer', letterSpacing: '0.04em', imageRendering: 'pixelated' as const }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              CONTINUE WITH GOOGLE  ▶
            </button>
          </PixelCard>

        </div>
      </main>
    </div>
  );
}