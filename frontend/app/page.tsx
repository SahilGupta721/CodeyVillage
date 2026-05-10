'use client';

import dynamic from 'next/dynamic';

const PhaserGame = dynamic(
  () => import('../src/game/PhaserGame'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width: '100vw', height: '100vh',
        background: '#1a6b8a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#ffffff', fontFamily: 'monospace', fontSize: '16px',
      }}>
        Loading island…
      </div>
    ),
  },
);

export default function Page() {
  return <PhaserGame />;
}
