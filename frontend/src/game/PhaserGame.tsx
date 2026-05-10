'use client';
import React, { useEffect, useRef } from 'react';
import ShopPanel from '../components/shop/ShopPanel';
import type PhaserType from 'phaser';

interface Props {
  roomId?: string | null;
}

export default function PhaserGame({ roomId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PhaserType.Game | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;

    (async () => {
      if (!containerRef.current) return;

      const [{ default: Phaser }, { createGameConfig }] = await Promise.all([
        import('phaser'),
        import('./config'),
      ]);

      if (!aliveRef.current || !containerRef.current || gameRef.current) return;

      // 👇 Read from localStorage HERE in React, not inside Phaser preBoot
      const firebaseUid = localStorage.getItem('firebaseUid');
      const username = firebaseUid ? localStorage.getItem(`username:${firebaseUid}`) : null;

      gameRef.current = new Phaser.Game(
        createGameConfig(containerRef.current, roomId ?? null, firebaseUid, username)
      );
    })();

    return () => {
      aliveRef.current = false;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [roomId]);

  const getGameScene = () =>
    gameRef.current?.scene.getScene('GameScene') as
    | { zoomIn(): void; zoomOut(): void }
    | undefined;

  const btnStyle: React.CSSProperties = {
    position: 'absolute',
    width: 40,
    height: 40,
    background: '#333355',
    color: '#ffffff',
    border: '2px solid #9999bb',
    borderRadius: 4,
    fontSize: 22,
    fontFamily: 'monospace',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
  };

  return (
    <div className="game-container" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: '#1a6b8a',
        }}
      />
      <button style={{ ...btnStyle, bottom: 16, right: 16 }} onClick={() => getGameScene()?.zoomIn()}>+</button>
      <button style={{ ...btnStyle, bottom: 16, right: 64 }} onClick={() => getGameScene()?.zoomOut()}>−</button>
      <ShopPanel />
    </div>
  );
}