'use client';
import React, { useEffect, useRef, useState } from 'react';
import ShopPanel, { type ShopPanelHandle } from '../components/shop/ShopPanel';
import type PhaserType from 'phaser';
import { auth } from '../../lib/firebase';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Props {
  roomId?: string | null;
}

export default function PhaserGame({ roomId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PhaserType.Game | null>(null);
  const shopRef = useRef<ShopPanelHandle>(null);
  const aliveRef = useRef(true);
  const [coins, setCoins] = useState<number | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid ?? localStorage.getItem('firebaseUid');
    if (!uid) return;
    fetch(`${BACKEND_URL}/coins/${uid}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.coins != null) setCoins(data.coins); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    aliveRef.current = true;

    (async () => {
      if (!containerRef.current) return;

      const [{ default: Phaser }, { createGameConfig }] = await Promise.all([
        import('phaser'),
        import('./config'),
      ]);

      if (!aliveRef.current || !containerRef.current || gameRef.current) return;

      // Firebase Auth is the source of truth for uid — localStorage fallback for edge cases
      const firebaseUid = auth.currentUser?.uid ?? localStorage.getItem('firebaseUid');
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
    | {
      zoomIn(): void;
      zoomOut(): void;
      enterPlacementMode(itemId: string, pricePaid: number): void;
      toggleEraseMode(): void;
      setRefundHandler(handler: (amount: number) => void): void;
    }
    | undefined;

  const handleBuy = (itemId: string, price: number) => {
    getGameScene()?.enterPlacementMode(itemId, price);
  };

  useEffect(() => {
    const t = window.setInterval(() => {
      const scene = getGameScene();
      if (!scene) return;
      scene.setRefundHandler((amount) => {
        if (amount > 0) shopRef.current?.addCoins(amount);
      });
      window.clearInterval(t);
    }, 200);
    return () => window.clearInterval(t);
  }, []);

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
      <button
        style={{ ...btnStyle, bottom: 16, right: 112, fontSize: 18 }}
        onClick={() => getGameScene()?.toggleEraseMode()}
        title="Toggle erase mode"
      >
        ⌫
      </button>
      <ShopPanel ref={shopRef} coins={coins ?? undefined} onBuy={handleBuy} />
    </div>
  );
}
