/**
 * Root page — renders the Phaser game full-screen.
 *
 * PhaserGame is wrapped with next/dynamic + ssr:false so Phaser's
 * browser-only code never executes on the server.
 * The `ssr: false` dynamic call lives inside this Client Component per
 * Next.js App Router guidance.
 */

'use client';

import dynamic from 'next/dynamic';

const PhaserGame = dynamic(
  () => import('../game/PhaserGame'),
  {
    ssr:     false,
    loading: () => (
      <div style={{
        width:          '100vw',
        height:         '100vh',
        background:     '#1a6b8a',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          '#ffffff',
        fontFamily:     'monospace',
        fontSize:       '16px',
        letterSpacing:  '0.05em',
      }}>
        Loading island…
      </div>
    ),
  },
);

export default function Page() {
  return <PhaserGame />;
}
