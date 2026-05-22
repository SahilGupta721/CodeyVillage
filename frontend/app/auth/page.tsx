"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const uid = result.user.uid;
      localStorage.setItem('firebaseUid', uid);

      const idToken = await result.user.getIdToken();
      const hasUsername = localStorage.getItem(`username:${uid}`);

      if (hasUsername) {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, username: hasUsername }),
        }).catch(() => { });
      }

      window.postMessage({
        type: "codey-village-auth",
        uid,
        idToken,
        username: hasUsername || null,
      }, "*");

      router.push(hasUsername ? "/lobby" : "/onboarding");
    } catch (err: any) {
      setError("SIGN IN FAILED. PLEASE TRY AGAIN.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 32 }}>

        {/* Logo / Title */}
        <div style={{ textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12 }}>
          <img
            src="/logo.svg"
            width={64}
            height={64}
            alt="Codey Village"
            style={{ imageRendering: 'pixelated' as const, marginBottom: 4 }}
          />
          <div style={{
            fontFamily: 'var(--font-pixel),monospace',
            fontSize: 18,
            color: '#FFD88A',
            textShadow: '3px 3px 0 #080400',
            letterSpacing: '0.08em',
            lineHeight: 1,
            textTransform: 'uppercase' as const,
            imageRendering: 'pixelated' as const,
          }}>
            CODEY VILLAGE
          </div>
          {/* FIXED: was fontSize 7 — too small to read */}
          <div style={{
            fontFamily: 'var(--font-pixel),monospace',
            fontSize: 11,
            color: '#7A8AAA',
            lineHeight: 1.9,
            letterSpacing: '0.03em',
            imageRendering: 'pixelated' as const,
          }}>
            CODE YOUR WAY TO A MANSION.<br />BUILD YOUR DREAM VILLAGE WITH FRIENDS.
          </div>
        </div>

        {/* Card */}
        <div style={{
          width: '100%',
          background: '#1A1E35',
          border: '3px solid #0D1020',
          boxShadow: 'inset 2px 2px 0 0 #2E3560, inset -2px -2px 0 0 #080A18, 4px 4px 0 0 #050810',
          padding: '28px 24px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: 20,
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
              {/* FIXED: was fontSize 9 */}
              <span style={{
                fontFamily: 'var(--font-pixel),monospace',
                fontSize: 13,
                color: '#A8B8FF',
                textShadow: '2px 2px 0 #0D1020',
                letterSpacing: '0.05em',
                lineHeight: 1,
                paddingTop: 2,
              }}>
                SIGN IN
              </span>
            </div>
            <div style={{ height: 2, marginBottom: 10, backgroundImage: 'repeating-linear-gradient(90deg,#2E3560 0px,#2E3560 6px,transparent 6px,transparent 10px)' }} />
            {/* FIXED: was fontSize 6, color too dark */}
            <p style={{ fontFamily: 'var(--font-pixel),monospace', fontSize: 11, color: '#6A7AAA', lineHeight: 1.9, margin: 0 }}>
              WELCOME BACK, CODER. CONTINUE YOUR VILLAGE.
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(120,30,30,0.4)',
              border: '2px solid #601010',
              boxShadow: 'inset 1px 1px 0 0 #3A0808',
              padding: '10px 12px',
              fontFamily: 'var(--font-pixel),monospace',
              fontSize: 11, // FIXED: was 6
              color: '#FF6868',
              lineHeight: 1.9,
              textAlign: 'center' as const,
            }}>
              !! {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: loading ? '#111525' : '#2A3578',
              border: '3px solid #0D1020',
              boxShadow: loading
                ? 'inset 2px 2px 0 0 #060810'
                : 'inset 2px 2px 0 0 #4A60CC, inset -2px -2px 0 0 #0F1840, 3px 3px 0 0 #050810',
              padding: '13px 16px',
              fontFamily: 'var(--font-pixel),monospace',
              fontSize: 12, // FIXED: was 7
              color: loading ? '#2A3050' : '#A8B8FF',
              textShadow: '2px 2px 0 #0D1020',
              cursor: loading ? 'not-allowed' as const : 'pointer' as const,
              transform: loading ? 'translate(2px,2px)' : 'none',
              width: '100%',
              imageRendering: 'pixelated' as const,
              letterSpacing: '0.04em',
            }}
          >
            {!loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0, imageRendering: 'pixelated' as const }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {loading ? "SIGNING IN..." : "CONTINUE WITH GOOGLE  ▶"}
          </button>

          {/* FIXED: was fontSize 6, color #2E3560 (invisible against dark bg) */}
          <p style={{
            fontFamily: 'var(--font-pixel),monospace',
            fontSize: 10,
            color: '#4A5888',
            lineHeight: 1.9,
            textAlign: 'center' as const,
            margin: 0,
          }}>
            ** BY SIGNING IN YOU AGREE TO GRIND HARDER THAN YOUR FRIENDS.
          </p>
        </div>

      </div>
    </div>
  );
}