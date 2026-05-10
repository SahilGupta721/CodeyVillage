'use client';

/**
 * PhaserGame — React client component that mounts a Phaser.Game instance.
 *
 * Phaser and all scene modules are imported dynamically inside useEffect so
 * they never run on the server (Next.js App Router SSR safety).
 */

import React, { useEffect, useRef } from 'react';
import type PhaserType from 'phaser';

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef      = useRef<PhaserType.Game | null>(null);
  const aliveRef     = useRef(true);

  useEffect(() => {
    aliveRef.current = true;

    (async () => {
      if (!containerRef.current) return;

      // Both imports are deferred to client-side only
      const [{ default: Phaser }, { createGameConfig }] = await Promise.all([
        import('phaser'),
        import('./config'),
      ]);

      // Guard against StrictMode double-mount / unmount races
      if (!aliveRef.current || !containerRef.current || gameRef.current) return;

      gameRef.current = new Phaser.Game(createGameConfig(containerRef.current));
    })();

    return () => {
      aliveRef.current = false;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const getGameScene = () =>
    gameRef.current?.scene.getScene('GameScene') as
      | { zoomIn(): void; zoomOut(): void }
      | undefined;

  const btnStyle: React.CSSProperties = {
    position:     'absolute',
    width:        40,
    height:       40,
    background:   '#333355',
    color:        '#ffffff',
    border:       '2px solid #9999bb',
    borderRadius: 4,
    fontSize:     22,
    fontFamily:   'monospace',
    cursor:       'pointer',
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
    userSelect:   'none',
  };

  return (
    <div className="game-container" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div
        ref={containerRef}
        style={{
          width:      '100%',
          height:     '100%',
          overflow:   'hidden',
          background: '#1a6b8a',
        }}
      />
      <button style={{ ...btnStyle, bottom: 16, right: 16 }} onClick={() => getGameScene()?.zoomIn()}>+</button>
      <button style={{ ...btnStyle, bottom: 16, right: 64 }} onClick={() => getGameScene()?.zoomOut()}>−</button>
    </div>
  );
}
