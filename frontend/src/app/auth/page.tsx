'use client';
import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      // ExtensionAuthBridge fires postMessage automatically via onAuthStateChanged
      router.push('/');
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0e1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      color: '#e2e8f0',
      gap: '16px',
    }}>
      <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
        <rect width="64" height="64" rx="12" fill="#0d1117"/>
        <rect x="6"  y="6"  width="2" height="2" fill="#fff8c0"/>
        <rect x="52" y="8"  width="2" height="2" fill="#fff8c0"/>
        <rect x="30" y="4"  width="2" height="2" fill="#fff8c0"/>
        <rect x="8"  y="16" width="48" height="22" fill="#7c3aed"/>
        <rect x="8"  y="16" width="48" height="3"  fill="#9d5cf6"/>
        <rect x="8"  y="35" width="48" height="3"  fill="#5b21b6"/>
        <rect x="8"  y="34" width="16" height="20" fill="#7c3aed"/>
        <rect x="8"  y="34" width="3"  height="20" fill="#9d5cf6"/>
        <rect x="40" y="34" width="16" height="20" fill="#7c3aed"/>
        <rect x="53" y="34" width="3"  height="20" fill="#5b21b6"/>
        <rect x="18" y="20" width="4"  height="4"  fill="#e2e8f0"/>
        <rect x="14" y="24" width="4"  height="4"  fill="#e2e8f0"/>
        <rect x="18" y="24" width="4"  height="4"  fill="#cbd5e1"/>
        <rect x="22" y="24" width="4"  height="4"  fill="#e2e8f0"/>
        <rect x="18" y="28" width="4"  height="4"  fill="#e2e8f0"/>
        <rect x="40" y="20" width="4"  height="4"  fill="#facc15"/>
        <rect x="36" y="24" width="4"  height="4"  fill="#60a5fa"/>
        <rect x="44" y="24" width="4"  height="4"  fill="#f87171"/>
        <rect x="40" y="28" width="4"  height="4"  fill="#4ade80"/>
        <rect x="12" y="39" width="8"  height="8"  fill="#4c1d95"/>
        <rect x="14" y="41" width="4"  height="4"  fill="#6d28d9"/>
        <rect x="44" y="39" width="8"  height="8"  fill="#4c1d95"/>
        <rect x="46" y="41" width="4"  height="4"  fill="#6d28d9"/>
      </svg>

      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#818cf8', letterSpacing: '-0.01em' }}>
        Codey Village
      </h1>
      <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
        Code. Earn coins. Beat your friends.
      </p>

      <button
        onClick={handleSignIn}
        disabled={loading}
        style={{
          marginTop: 8,
          padding: '11px 28px',
          background: loading ? '#3730a3' : '#4f46e5',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'monospace',
          transition: 'background 0.15s',
        }}
      >
        {loading ? 'Signing in…' : 'Sign in with Google'}
      </button>

      {error && (
        <p style={{ color: '#f87171', fontSize: 11, maxWidth: 280, textAlign: 'center', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
