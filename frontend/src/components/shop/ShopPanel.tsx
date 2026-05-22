/*
 * ShopPanel — slide-in shop overlay for Cozy Village.
 *
 * Props
 *   coins?  number                    Starting/current coin balance (default 1 250).
 *   onBuy?  (itemId: string) => void  Called when the player buys an item.
 *                                     The component deducts the price locally;
 *                                     the parent should also update its own state
 *                                     and pass the new value back via `coins`.
 *
 * Imperative API — forward a ref typed as ShopPanelHandle:
 *   ref.current.setCoins(amount)      Overwrite the displayed balance from game logic
 *                                     without triggering a full prop re-render cycle.
 *
 * Quick-start
 *   const shopRef = useRef<ShopPanelHandle>(null)
 *   <ShopPanel ref={shopRef} coins={playerCoins} onBuy={id => dispatch({ type:'BUY', id })} />
 *   // from Phaser scene:
 *   shopRef.current?.setCoins(newBalance)
 */

'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type ReactNode,
} from 'react';

import styles from './ShopPanel.module.css';

// ── types ────────────────────────────────────────────────────────────────────

interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  icon?: ReactNode;
  price: number;
}

interface ShopCategory {
  id: string;
  label: string;
  emoji: string;
  items: ShopItem[];
}

export interface ShopPanelHandle {
  setCoins: (amount: number) => void;
  addCoins: (delta: number) => void;
}

export interface ShopPanelProps {
  coins?: number;
  onBuy?: (itemId: string, price: number) => void;
}

// ── pixel coin icon ──────────────────────────────────────────────────────────

function PixelCoin() {
  const K = '#1A0A00'; // black outline
  const D = '#9B6000'; // dark gold ring
  const G = '#FFD700'; // bright gold
  const H = '#FFFACD'; // top-left highlight
  const M = '#C89000'; // bottom-right shadow
  const _ = null;

  const grid = [
    [_, _, _, K, K, K, K, K, K, _, _, _],
    [_, _, K, D, G, G, G, G, D, K, _, _],
    [_, K, D, G, H, H, G, G, G, D, K, _],
    [K, D, G, G, H, G, G, G, G, M, D, K],
    [K, D, G, H, G, G, G, G, G, M, D, K],
    [K, D, G, G, G, G, G, G, G, M, D, K],
    [K, D, G, G, G, G, G, G, G, M, D, K],
    [K, D, G, G, G, G, G, G, M, M, D, K],
    [_, K, D, G, G, G, M, M, M, D, K, _],
    [_, _, K, D, D, M, M, M, D, K, _, _],
    [_, _, _, K, K, K, K, K, K, _, _, _],
  ];

  return (
    <svg
      width="20" height="20"
      viewBox="0 0 12 11"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}
    >
      {grid.flatMap((row, y) =>
        row.map((color, x) =>
          color ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null
        )
      )}
    </svg>
  );
}

// ── pine table icon ──────────────────────────────────────────────────────────

function PineTableIcon() {
  return (
    <svg
      width="32" height="28"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}
    >
      {/* shadow */}
      <rect x="4" y="28" width="24" height="4" fill="rgba(0,0,0,0.22)" />
      {/* legs — dark outline */}
      <rect x="4" y="16" width="6" height="12" fill="#4A3010" />
      <rect x="22" y="16" width="6" height="12" fill="#4A3010" />
      {/* legs — mid tone */}
      <rect x="5" y="17" width="4" height="10" fill="#B08828" />
      <rect x="23" y="17" width="4" height="10" fill="#B08828" />
      {/* legs — highlight */}
      <rect x="5" y="17" width="2" height="6" fill="#DEB84C" />
      <rect x="23" y="17" width="2" height="6" fill="#DEB84C" />
      {/* cross stretcher */}
      <rect x="9" y="22" width="14" height="4" fill="#4A3010" />
      <rect x="10" y="23" width="12" height="2" fill="#B08828" />
      <rect x="11" y="23" width="5" height="1" fill="#DEB84C" />
      {/* apron */}
      <rect x="2" y="13" width="28" height="4" fill="#2A1C08" />
      <rect x="3" y="14" width="26" height="3" fill="#6A4C18" />
      <rect x="4" y="14" width="14" height="1" fill="#A07828" />
      {/* tabletop border */}
      <rect x="1" y="6" width="30" height="8" fill="#2A1C08" />
      {/* pine surface */}
      <rect x="2" y="7" width="28" height="6" fill="#C49038" />
      <rect x="3" y="7" width="22" height="5" fill="#DEB84C" />
      <rect x="4" y="7" width="12" height="3" fill="#EED068" />
      {/* grain */}
      <rect x="4" y="9" width="24" height="1" fill="#9A7228" />
      <rect x="6" y="11" width="20" height="1" fill="#9A7228" />
      {/* knot */}
      <rect x="21" y="8" width="3" height="2" fill="#7A5018" />
      <rect x="22" y="9" width="1" height="1" fill="#7A5018" />
      {/* brightest top edge */}
      <rect x="2" y="7" width="28" height="1" fill="#F4DC80" />
    </svg>
  );
}

// ── rocking chair icon ────────────────────────────────────────────────────────

function RockingChairIcon() {
  return (
    <svg
      width="32" height="32"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}
    >
      {/* shadow */}
      <rect x="3" y="28" width="26" height="3" fill="rgba(0,0,0,0.22)" />
      {/* left rocker */}
      <rect x="2" y="22" width="3" height="6" fill="#3D2010" />
      <rect x="2" y="26" width="13" height="2" fill="#3D2010" />
      <rect x="12" y="22" width="3" height="6" fill="#3D2010" />
      <rect x="3" y="23" width="1" height="4" fill="#8B5E3C" />
      <rect x="3" y="27" width="10" height="1" fill="#8B5E3C" />
      <rect x="13" y="23" width="1" height="4" fill="#8B5E3C" />
      {/* right rocker */}
      <rect x="17" y="22" width="3" height="6" fill="#3D2010" />
      <rect x="17" y="26" width="13" height="2" fill="#3D2010" />
      <rect x="27" y="22" width="3" height="6" fill="#3D2010" />
      <rect x="18" y="23" width="1" height="4" fill="#8B5E3C" />
      <rect x="18" y="27" width="10" height="1" fill="#8B5E3C" />
      <rect x="28" y="23" width="1" height="4" fill="#8B5E3C" />
      {/* legs */}
      <rect x="8" y="18" width="4" height="9" fill="#3D2010" />
      <rect x="20" y="18" width="4" height="9" fill="#3D2010" />
      <rect x="9" y="19" width="2" height="7" fill="#8B5E3C" />
      <rect x="21" y="19" width="2" height="7" fill="#8B5E3C" />
      <rect x="9" y="19" width="1" height="3" fill="#B07040" />
      <rect x="21" y="19" width="1" height="3" fill="#B07040" />
      {/* seat */}
      <rect x="5" y="13" width="22" height="7" fill="#3D2010" />
      <rect x="6" y="13" width="20" height="5" fill="#8B5E3C" />
      <rect x="7" y="14" width="9" height="2" fill="#B07040" />
      <rect x="5" y="17" width="22" height="3" fill="#5C3C20" />
      {/* armrests */}
      <rect x="4" y="11" width="5" height="5" fill="#3D2010" />
      <rect x="23" y="11" width="5" height="5" fill="#3D2010" />
      <rect x="5" y="11" width="3" height="3" fill="#8B5E3C" />
      <rect x="24" y="11" width="3" height="3" fill="#8B5E3C" />
      <rect x="5" y="11" width="2" height="1" fill="#B07040" />
      <rect x="24" y="11" width="2" height="1" fill="#B07040" />
      {/* backrest */}
      <rect x="7" y="2" width="18" height="12" fill="#3D2010" />
      <rect x="8" y="3" width="16" height="9" fill="#4A2A14" />
      <rect x="10" y="4" width="3" height="8" fill="#8B5E3C" />
      <rect x="15" y="4" width="3" height="8" fill="#8B5E3C" />
      <rect x="20" y="4" width="3" height="8" fill="#8B5E3C" />
      <rect x="11" y="4" width="1" height="8" fill="#B07040" />
      <rect x="16" y="4" width="1" height="8" fill="#B07040" />
      <rect x="21" y="4" width="1" height="8" fill="#B07040" />
      {/* top rail */}
      <rect x="7" y="2" width="18" height="3" fill="#3D2010" />
      <rect x="8" y="2" width="16" height="2" fill="#8B5E3C" />
      <rect x="9" y="2" width="9" height="1" fill="#B07040" />
    </svg>
  );
}

// ── wooden chair icon ────────────────────────────────────────────────────────

function WoodenChairIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      <rect x="7" y="28" width="18" height="3" fill="rgba(0,0,0,0.22)" />
      {/* back legs */}
      <rect x="8" y="6" width="3" height="10" fill="#3D2010" />
      <rect x="21" y="6" width="3" height="10" fill="#3D2010" />
      {/* backrest frame */}
      <rect x="7" y="4" width="18" height="13" fill="#3D2010" />
      <rect x="8" y="5" width="16" height="11" fill="#7A4A22" />
      {/* backrest rails */}
      <rect x="9" y="9" width="14" height="2" fill="#3D2010" />
      <rect x="9" y="14" width="14" height="1" fill="#3D2010" />
      {/* highlight */}
      <rect x="9" y="6" width="7" height="2" fill="#B07040" />
      {/* seat */}
      <rect x="6" y="16" width="20" height="9" fill="#3D2010" />
      <rect x="7" y="17" width="18" height="7" fill="#7A4A22" />
      <rect x="8" y="18" width="9" height="2" fill="#B07040" />
      <rect x="7" y="22" width="18" height="2" fill="#5A3018" />
      {/* front legs */}
      <rect x="7" y="24" width="4" height="5" fill="#3D2010" />
      <rect x="21" y="24" width="4" height="5" fill="#3D2010" />
      <rect x="8" y="25" width="2" height="4" fill="#7A4A22" />
      <rect x="22" y="25" width="2" height="4" fill="#7A4A22" />
    </svg>
  );
}

// ── cozy sofa icon ────────────────────────────────────────────────────────────

function CozySofaIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      <rect x="3" y="29" width="26" height="3" fill="rgba(0,0,0,0.22)" />
      {/* base */}
      <rect x="3" y="26" width="26" height="3" fill="#2A1C10" />
      <rect x="4" y="27" width="24" height="1" fill="#7A5C3C" />
      {/* left armrest */}
      <rect x="0" y="8" width="5" height="18" fill="#2A1C10" />
      <rect x="1" y="9" width="3" height="16" fill="#7A5C3C" />
      <rect x="1" y="9" width="2" height="10" fill="#AA8458" />
      <rect x="0" y="5" width="6" height="4" fill="#2A1C10" />
      <rect x="1" y="6" width="4" height="2" fill="#D0A870" />
      <rect x="1" y="6" width="3" height="1" fill="#F8E0C0" />
      {/* right armrest */}
      <rect x="27" y="8" width="5" height="18" fill="#2A1C10" />
      <rect x="28" y="9" width="3" height="16" fill="#7A5C3C" />
      <rect x="29" y="9" width="2" height="10" fill="#AA8458" />
      <rect x="26" y="5" width="6" height="4" fill="#2A1C10" />
      <rect x="27" y="6" width="4" height="2" fill="#D0A870" />
      <rect x="28" y="6" width="3" height="1" fill="#F8E0C0" />
      {/* back cushion block */}
      <rect x="5" y="2" width="22" height="13" fill="#2A1C10" />
      <rect x="12" y="2" width="1" height="13" fill="#2A1C10" />
      <rect x="19" y="2" width="1" height="13" fill="#2A1C10" />
      {/* headrest top roll */}
      <rect x="6" y="2" width="6" height="1" fill="#E8C090" />
      <rect x="13" y="2" width="6" height="1" fill="#E8C090" />
      <rect x="20" y="2" width="6" height="1" fill="#E8C090" />
      <rect x="6" y="3" width="6" height="1" fill="#7A5C3C" />
      <rect x="13" y="3" width="6" height="1" fill="#7A5C3C" />
      <rect x="20" y="3" width="6" height="1" fill="#7A5C3C" />
      {/* left back cushion */}
      <rect x="6" y="4" width="6" height="9" fill="#D0A870" />
      <rect x="6" y="4" width="5" height="5" fill="#E8C090" />
      <rect x="6" y="4" width="4" height="2" fill="#F8E0C0" />
      <rect x="6" y="12" width="6" height="2" fill="#AA8458" />
      {/* center back cushion */}
      <rect x="13" y="4" width="6" height="9" fill="#D0A870" />
      <rect x="13" y="4" width="5" height="5" fill="#E8C090" />
      <rect x="13" y="4" width="4" height="2" fill="#F8E0C0" />
      <rect x="13" y="12" width="6" height="2" fill="#AA8458" />
      {/* right back cushion */}
      <rect x="20" y="4" width="6" height="9" fill="#D0A870" />
      <rect x="20" y="4" width="5" height="5" fill="#E8C090" />
      <rect x="20" y="4" width="4" height="2" fill="#F8E0C0" />
      <rect x="20" y="12" width="6" height="2" fill="#AA8458" />
      {/* back-seat welt */}
      <rect x="6" y="14" width="20" height="1" fill="#7A5C3C" />
      {/* seat cushion block */}
      <rect x="5" y="15" width="22" height="8" fill="#2A1C10" />
      <rect x="12" y="15" width="1" height="8" fill="#2A1C10" />
      <rect x="19" y="15" width="1" height="8" fill="#2A1C10" />
      {/* left seat */}
      <rect x="6" y="16" width="6" height="6" fill="#D0A870" />
      <rect x="6" y="16" width="5" height="3" fill="#E8C090" />
      <rect x="6" y="16" width="4" height="1" fill="#F8E0C0" />
      <rect x="6" y="21" width="6" height="2" fill="#AA8458" />
      {/* center seat */}
      <rect x="13" y="16" width="6" height="6" fill="#D0A870" />
      <rect x="13" y="16" width="5" height="3" fill="#E8C090" />
      <rect x="13" y="16" width="4" height="1" fill="#F8E0C0" />
      <rect x="13" y="21" width="6" height="2" fill="#AA8458" />
      {/* right seat */}
      <rect x="20" y="16" width="6" height="6" fill="#D0A870" />
      <rect x="20" y="16" width="5" height="3" fill="#E8C090" />
      <rect x="20" y="16" width="4" height="1" fill="#F8E0C0" />
      <rect x="20" y="21" width="6" height="2" fill="#AA8458" />
      {/* seat front welt */}
      <rect x="6" y="22" width="20" height="1" fill="#7A5C3C" />
      {/* lower recliner panels */}
      <rect x="5" y="23" width="22" height="3" fill="#2A1C10" />
      <rect x="12" y="23" width="1" height="3" fill="#2A1C10" />
      <rect x="19" y="23" width="1" height="3" fill="#2A1C10" />
      <rect x="6" y="23" width="6" height="3" fill="#AA8458" />
      <rect x="13" y="23" width="6" height="3" fill="#AA8458" />
      <rect x="20" y="23" width="6" height="3" fill="#AA8458" />
      <rect x="6" y="23" width="5" height="2" fill="#D0A870" />
      <rect x="13" y="23" width="5" height="2" fill="#D0A870" />
      <rect x="20" y="23" width="5" height="2" fill="#D0A870" />
    </svg>
  );
}

// ── oak dresser icon ──────────────────────────────────────────────────────────

function OakDresserIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      <rect x="4" y="28" width="24" height="4" fill="rgba(0,0,0,0.22)" />
      {/* body */}
      <rect x="4" y="4" width="24" height="24" fill="#5A3818" />
      <rect x="5" y="5" width="22" height="22" fill="#9A6A3A" />
      <rect x="6" y="5" width="12" height="3" fill="#C09058" />
      {/* drawer 1 */}
      <rect x="7" y="9" width="18" height="5" fill="#5A3818" />
      <rect x="8" y="10" width="16" height="3" fill="#8A5A2A" />
      <rect x="9" y="10" width="6" height="1" fill="#C09058" />
      <rect x="14" y="11" width="5" height="2" fill="#E8C060" />
      <rect x="15" y="11" width="3" height="1" fill="#FFF0A0" />
      {/* drawer 2 */}
      <rect x="7" y="15" width="18" height="5" fill="#5A3818" />
      <rect x="8" y="16" width="16" height="3" fill="#8A5A2A" />
      <rect x="9" y="16" width="6" height="1" fill="#C09058" />
      <rect x="14" y="17" width="5" height="2" fill="#E8C060" />
      <rect x="15" y="17" width="3" height="1" fill="#FFF0A0" />
      {/* drawer 3 */}
      <rect x="7" y="21" width="18" height="5" fill="#5A3818" />
      <rect x="8" y="22" width="16" height="3" fill="#8A5A2A" />
      <rect x="9" y="22" width="6" height="1" fill="#C09058" />
      <rect x="14" y="23" width="5" height="2" fill="#E8C060" />
      <rect x="15" y="23" width="3" height="1" fill="#FFF0A0" />
    </svg>
  );
}

// ── feather bed icon ──────────────────────────────────────────────────────────

function FeatherBedIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      <rect x="2" y="29" width="28" height="3" fill="rgba(0,0,0,0.22)" />
      {/* headboard */}
      <rect x="3" y="3" width="26" height="10" fill="#5A3818" />
      <rect x="4" y="4" width="24" height="8" fill="#9A6A3A" />
      <rect x="5" y="5" width="12" height="3" fill="#C09058" />
      <rect x="8" y="5" width="2" height="6" fill="#5A3818" />
      <rect x="22" y="5" width="2" height="6" fill="#5A3818" />
      {/* frame sides */}
      <rect x="3" y="12" width="4" height="16" fill="#5A3818" />
      <rect x="25" y="12" width="4" height="16" fill="#5A3818" />
      <rect x="4" y="13" width="2" height="14" fill="#9A6A3A" />
      <rect x="26" y="13" width="2" height="14" fill="#9A6A3A" />
      {/* mattress */}
      <rect x="5" y="13" width="22" height="14" fill="#D8D0C0" />
      <rect x="5" y="13" width="22" height="2" fill="#B09080" />
      {/* pillow */}
      <rect x="8" y="14" width="16" height="5" fill="#FFFFFF" />
      <rect x="9" y="15" width="14" height="3" fill="#EEE8E0" />
      <rect x="8" y="18" width="16" height="1" fill="#D8D0C8" />
      {/* blanket */}
      <rect x="5" y="20" width="22" height="7" fill="#C8C0B0" />
      <rect x="5" y="22" width="22" height="1" fill="#B0A898" />
      <rect x="5" y="25" width="22" height="1" fill="#B0A898" />
      <rect x="13" y="20" width="1" height="7" fill="#B0A898" />
      <rect x="19" y="20" width="1" height="7" fill="#B0A898" />
      {/* footboard */}
      <rect x="3" y="26" width="26" height="4" fill="#5A3818" />
      <rect x="4" y="27" width="24" height="2" fill="#9A6A3A" />
    </svg>
  );
}

// ── potted fern icon ─────────────────────────────────────────────────────────

function PottedFernIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      <rect x="9" y="29" width="14" height="3" fill="rgba(0,0,0,0.22)" />
      {/* pot */}
      <rect x="10" y="21" width="12" height="8" fill="#7A4A22" />
      <rect x="11" y="22" width="10" height="6" fill="#C06030" />
      <rect x="12" y="22" width="4" height="2" fill="#E08050" />
      {/* rim */}
      <rect x="9" y="19" width="14" height="3" fill="#7A4A22" />
      <rect x="10" y="20" width="12" height="2" fill="#C06030" />
      {/* stems */}
      <rect x="10" y="7" width="3" height="13" fill="#1A5008" />
      <rect x="19" y="5" width="3" height="15" fill="#1A5008" />
      <rect x="15" y="9" width="2" height="11" fill="#1A5008" />
      {/* fronds */}
      <rect x="5" y="9" width="7" height="3" fill="#368A14" />
      <rect x="3" y="13" width="9" height="3" fill="#368A14" />
      <rect x="5" y="17" width="6" height="3" fill="#368A14" />
      <rect x="21" y="7" width="7" height="3" fill="#368A14" />
      <rect x="21" y="11" width="8" height="3" fill="#368A14" />
      <rect x="22" y="15" width="6" height="3" fill="#368A14" />
      <rect x="12" y="4" width="8" height="4" fill="#368A14" />
      {/* highlights */}
      <rect x="6" y="10" width="3" height="1" fill="#54B42A" />
      <rect x="4" y="14" width="4" height="1" fill="#54B42A" />
      <rect x="22" y="8" width="3" height="1" fill="#54B42A" />
      <rect x="22" y="12" width="4" height="1" fill="#54B42A" />
      <rect x="13" y="5" width="5" height="1" fill="#54B42A" />
    </svg>
  );
}

// ── candle set icon ───────────────────────────────────────────────────────────

function CandleSetIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      {/* pillar shadows */}
      <rect x="9" y="25" width="2" height="4" fill="rgba(0,0,0,0.22)" />
      <rect x="15" y="25" width="2" height="6" fill="rgba(0,0,0,0.22)" />
      <rect x="21" y="25" width="2" height="3" fill="rgba(0,0,0,0.22)" />
      {/* holder */}
      <rect x="6" y="22" width="20" height="4" fill="#8A6A30" />
      <rect x="7" y="23" width="18" height="2" fill="#C89A50" />
      {/* center candle */}
      <rect x="14" y="8" width="4" height="14" fill="#E8E0D0" />
      <rect x="15" y="9" width="2" height="12" fill="#F8F0E0" />
      {/* left candle */}
      <rect x="8" y="13" width="4" height="9" fill="#D0E8E0" />
      <rect x="9" y="14" width="2" height="7" fill="#E8F8F0" />
      {/* right candle */}
      <rect x="20" y="15" width="4" height="7" fill="#E8D0D0" />
      <rect x="21" y="16" width="2" height="5" fill="#F8E8E8" />
      {/* flames */}
      <rect x="15" y="5" width="2" height="3" fill="#FF8820" />
      <rect x="9" y="10" width="2" height="3" fill="#FF8820" />
      <rect x="21" y="12" width="2" height="3" fill="#FF8820" />
      <rect x="15" y="5" width="2" height="2" fill="#FFCC00" />
      <rect x="9" y="10" width="2" height="2" fill="#FFCC00" />
      <rect x="21" y="12" width="2" height="2" fill="#FFCC00" />
      <rect x="15" y="5" width="2" height="1" fill="#FFFFFF" />
      <rect x="9" y="10" width="2" height="1" fill="#FFFFFF" />
      <rect x="21" y="12" width="2" height="1" fill="#FFFFFF" />
      {/* wicks */}
      <rect x="15" y="8" width="2" height="1" fill="#3A2010" />
      <rect x="9" y="13" width="2" height="1" fill="#3A2010" />
      <rect x="21" y="15" width="2" height="1" fill="#3A2010" />
    </svg>
  );
}

// ── hanging vine icon ─────────────────────────────────────────────────────────

function HangingVineIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      <rect x="10" y="29" width="12" height="3" fill="rgba(0,0,0,0.15)" />
      {/* hook */}
      <rect x="14" y="2" width="4" height="3" fill="#6A4820" />
      {/* main stem */}
      <rect x="15" y="4" width="2" height="22" fill="#3A7A20" />
      {/* branch stems */}
      <rect x="10" y="9" width="6" height="2" fill="#3A7A20" />
      <rect x="17" y="14" width="6" height="2" fill="#3A7A20" />
      <rect x="9" y="20" width="7" height="2" fill="#3A7A20" />
      <rect x="17" y="24" width="6" height="2" fill="#3A7A20" />
      {/* leaf clusters */}
      <rect x="5" y="8" width="6" height="4" fill="#4AAA28" />
      <rect x="21" y="13" width="6" height="4" fill="#4AAA28" />
      <rect x="4" y="19" width="6" height="4" fill="#4AAA28" />
      <rect x="21" y="23" width="6" height="4" fill="#4AAA28" />
      <rect x="13" y="25" width="6" height="4" fill="#4AAA28" />
      {/* highlights */}
      <rect x="6" y="9" width="2" height="2" fill="#70CC40" />
      <rect x="22" y="14" width="2" height="2" fill="#70CC40" />
      <rect x="5" y="20" width="2" height="2" fill="#70CC40" />
      <rect x="22" y="24" width="2" height="2" fill="#70CC40" />
      <rect x="14" y="26" width="2" height="2" fill="#70CC40" />
      {/* stem nodes */}
      <rect x="14" y="11" width="4" height="2" fill="#2A6018" />
      <rect x="14" y="17" width="4" height="2" fill="#2A6018" />
      <rect x="14" y="23" width="4" height="2" fill="#2A6018" />
    </svg>
  );
}

// ── woven rug icon ────────────────────────────────────────────────────────────

function WovenRugIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      <rect x="2" y="29" width="28" height="3" fill="rgba(0,0,0,0.18)" />
      {/* rug base */}
      <rect x="2" y="6" width="28" height="22" fill="#C04820" />
      {/* border */}
      <rect x="2" y="6" width="28" height="3" fill="#8A3010" />
      <rect x="2" y="25" width="28" height="3" fill="#8A3010" />
      <rect x="2" y="6" width="3" height="22" fill="#8A3010" />
      <rect x="27" y="6" width="3" height="22" fill="#8A3010" />
      {/* gold inner stripe */}
      <rect x="4" y="9" width="24" height="2" fill="#E8C040" />
      <rect x="4" y="23" width="24" height="2" fill="#E8C040" />
      <rect x="4" y="9" width="2" height="16" fill="#E8C040" />
      <rect x="26" y="9" width="2" height="16" fill="#E8C040" />
      {/* center medallion */}
      <rect x="12" y="14" width="8" height="6" fill="#8A3010" />
      <rect x="10" y="15" width="12" height="4" fill="#8A3010" />
      <rect x="13" y="15" width="6" height="4" fill="#E8C040" />
      <rect x="12" y="16" width="8" height="2" fill="#E8C040" />
      <rect x="15" y="16" width="2" height="2" fill="#FFFFFF" />
      {/* fringe top & bottom */}
      {[4,7,10,13,16,19,22,25].map(x => (
        <g key={x}>
          <rect x={x} y={5} width={2} height={2} fill="#D06030" />
          <rect x={x} y={28} width={2} height={2} fill="#D06030" />
        </g>
      ))}
    </svg>
  );
}

// ── flower basket icon ────────────────────────────────────────────────────────

function FlowerBasketIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      <rect x="8" y="28" width="16" height="3" fill="rgba(0,0,0,0.22)" />
      {/* basket body */}
      <rect x="9" y="18" width="14" height="10" fill="#8B5E2A" />
      <rect x="10" y="19" width="12" height="8" fill="#C89048" />
      {/* weave */}
      <rect x="10" y="21" width="12" height="2" fill="#A07030" />
      <rect x="10" y="24" width="12" height="2" fill="#A07030" />
      <rect x="12" y="19" width="2" height="8" fill="#A07030" />
      <rect x="17" y="19" width="2" height="8" fill="#A07030" />
      {/* rim */}
      <rect x="9" y="16" width="14" height="3" fill="#8B5E2A" />
      <rect x="10" y="17" width="12" height="2" fill="#C89048" />
      {/* red flower */}
      <rect x="9" y="10" width="5" height="5" fill="#E02020" />
      <rect x="10" y="11" width="3" height="3" fill="#FF5050" />
      <rect x="11" y="12" width="2" height="2" fill="#FFD040" />
      {/* pink flower */}
      <rect x="14" y="8" width="5" height="5" fill="#D050A0" />
      <rect x="15" y="9" width="3" height="3" fill="#FF90C0" />
      <rect x="16" y="10" width="2" height="2" fill="#FFEE60" />
      {/* yellow flower */}
      <rect x="19" y="11" width="5" height="5" fill="#D0B010" />
      <rect x="20" y="12" width="3" height="3" fill="#FFE060" />
      <rect x="21" y="13" width="2" height="2" fill="#FFFFFF" />
      {/* stems & leaves */}
      <rect x="11" y="14" width="2" height="4" fill="#3A8A18" />
      <rect x="16" y="12" width="2" height="6" fill="#3A8A18" />
      <rect x="21" y="15" width="2" height="3" fill="#3A8A18" />
      <rect x="8" y="13" width="4" height="2" fill="#3A8A18" />
      <rect x="22" y="14" width="5" height="2" fill="#3A8A18" />
    </svg>
  );
}

// ── structure icons ──────────────────────────────────────────────────────────

function CarvedDoorIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      <rect x="0" y="29" width="32" height="3" fill="rgba(0,0,0,0.25)" />
      <rect x="0" y="1" width="32" height="30" fill="#2A1408" />
      <rect x="1" y="2" width="30" height="27" fill="#5A3018" />
      <rect x="2" y="3" width="28" height="25" fill="#7A4A22" />
      <rect x="2" y="9" width="28" height="1" fill="#5A3018" />
      <rect x="2" y="16" width="28" height="1" fill="#5A3018" />
      <rect x="2" y="23" width="28" height="1" fill="#5A3018" />
      <rect x="3" y="4" width="26" height="10" fill="#5A3018" />
      <rect x="4" y="5" width="24" height="8" fill="#8A5A2A" />
      <rect x="3" y="17" width="26" height="10" fill="#5A3018" />
      <rect x="4" y="18" width="24" height="8" fill="#8A5A2A" />
      <rect x="2" y="3" width="2" height="25" fill="#B07840" />
      <rect x="25" y="14" width="3" height="3" fill="#E8C040" />
      <rect x="26" y="14" width="2" height="2" fill="#FFF090" />
    </svg>
  );
}

function CobbleWallIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      {/* grout */}
      <rect x="0" y="0" width="32" height="32" fill="#5A5450" />
      {/* row 1 */}
      <rect x="1"  y="0"  width="14" height="10" fill="#8A8078" />
      <rect x="16" y="0"  width="15" height="10" fill="#8A8078" />
      <rect x="2"  y="1"  width="12" height="8"  fill="#A09890" />
      <rect x="17" y="1"  width="13" height="8"  fill="#A09890" />
      <rect x="2"  y="1"  width="4"  height="2"  fill="#C0B8B0" />
      <rect x="17" y="1"  width="4"  height="2"  fill="#C0B8B0" />
      {/* row 2 offset */}
      <rect x="1"  y="11" width="7"  height="10" fill="#8A8078" />
      <rect x="9"  y="11" width="14" height="10" fill="#8A8078" />
      <rect x="24" y="11" width="7"  height="10" fill="#8A8078" />
      <rect x="2"  y="12" width="5"  height="8"  fill="#A09890" />
      <rect x="10" y="12" width="12" height="8"  fill="#A09890" />
      <rect x="25" y="12" width="5"  height="8"  fill="#A09890" />
      <rect x="2"  y="12" width="3"  height="2"  fill="#C0B8B0" />
      <rect x="10" y="12" width="4"  height="2"  fill="#C0B8B0" />
      <rect x="25" y="12" width="3"  height="2"  fill="#C0B8B0" />
      {/* row 3 */}
      <rect x="1"  y="22" width="14" height="10" fill="#8A8078" />
      <rect x="16" y="22" width="15" height="10" fill="#8A8078" />
      <rect x="2"  y="23" width="12" height="8"  fill="#A09890" />
      <rect x="17" y="23" width="13" height="8"  fill="#A09890" />
      <rect x="2"  y="23" width="4"  height="2"  fill="#C0B8B0" />
      <rect x="17" y="23" width="4"  height="2"  fill="#C0B8B0" />
    </svg>
  );
}

function WoodenArchIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      <rect x="3" y="28" width="26" height="4" fill="rgba(0,0,0,0.22)" />
      <rect x="4" y="8" width="7" height="20" fill="#3D2010" />
      <rect x="5" y="9" width="5" height="18" fill="#8B5E3C" />
      <rect x="6" y="9" width="2" height="10" fill="#B07040" />
      <rect x="21" y="8" width="7" height="20" fill="#3D2010" />
      <rect x="22" y="9" width="5" height="18" fill="#8B5E3C" />
      <rect x="23" y="9" width="2" height="10" fill="#B07040" />
      <rect x="4" y="4" width="24" height="7" fill="#3D2010" />
      <rect x="5" y="5" width="22" height="5" fill="#8B5E3C" />
      <rect x="6" y="6" width="12" height="2" fill="#B07040" />
      <rect x="5" y="11" width="5" height="2" fill="#3D2010" />
      <rect x="22" y="11" width="5" height="2" fill="#3D2010" />
      <rect x="10" y="19" width="12" height="5" fill="#3D2010" />
      <rect x="11" y="20" width="10" height="3" fill="#8B5E3C" />
      <rect x="12" y="20" width="5" height="1" fill="#B07040" />
    </svg>
  );
}

function FencePostIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      <rect x="2" y="26" width="28" height="1" fill="rgba(0,0,0,0.20)" />
      {[0,1,2,3,4].map(i => (
        <rect key={i} x={4 + i * 6} y="26" width="4" height="4" fill="rgba(0,0,0,0.20)" />
      ))}
      {[0,1,2,3,4].map(i => {
        const bx = 4 + i * 6;
        return (
          <g key={i}>
            <rect x={bx} y="6" width="4" height="20" fill="#3D2010" />
            <rect x={bx + 1} y="7" width="2" height="18" fill="#8B5E3C" />
            <rect x={bx + 1} y="4" width="2" height="3" fill="#3D2010" />
            <rect x={bx + 1} y="5" width="2" height="2" fill="#8B5E3C" />
          </g>
        );
      })}
      <rect x="2" y="12" width="28" height="4" fill="#3D2010" />
      <rect x="2" y="20" width="28" height="4" fill="#3D2010" />
      <rect x="3" y="13" width="26" height="2" fill="#8B5E3C" />
      <rect x="3" y="21" width="26" height="2" fill="#8B5E3C" />
      <rect x="3" y="13" width="14" height="1" fill="#B07040" />
      <rect x="3" y="21" width="14" height="1" fill="#B07040" />
    </svg>
  );
}

function GardenGateIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', flexShrink: 0 } as React.CSSProperties}>
      <rect x="3" y="28" width="26" height="4" fill="rgba(0,0,0,0.22)" />
      <rect x="3" y="4" width="5" height="24" fill="#3D2010" />
      <rect x="24" y="4" width="5" height="24" fill="#3D2010" />
      <rect x="4" y="5" width="3" height="22" fill="#8B5E3C" />
      <rect x="25" y="5" width="3" height="22" fill="#8B5E3C" />
      <rect x="3" y="4" width="26" height="5" fill="#3D2010" />
      <rect x="4" y="5" width="24" height="3" fill="#8B5E3C" />
      {[9, 12, 15, 18, 21].map(x => (
        <g key={x}>
          <rect x={x} y="9" width="2" height="18" fill="#5A3018" />
          <rect x={x} y="9" width="1" height="18" fill="#8B5E3C" />
        </g>
      ))}
      <rect x="8" y="18" width="16" height="3" fill="#5A3018" />
      <rect x="9" y="19" width="14" height="1" fill="#8B5E3C" />
      <rect x="22" y="13" width="3" height="3" fill="#D8A030" />
      <rect x="23" y="14" width="2" height="1" fill="#FFD060" />
    </svg>
  );
}

// ── shop catalogue ───────────────────────────────────────────────────────────

const BASE_CATEGORIES: ShopCategory[] = [
  {
    id: 'nature',
    label: 'Nature',
    emoji: '🌳',
    items: [
      { id: 'tree', name: 'Oak Tree', emoji: '🌳', price: 110 },
    ],
  },
  {
    id: 'furniture',
    label: 'Furniture',
    emoji: '🛋️',
    items: [
      { id: 'wooden-chair', name: 'Wooden Chair', emoji: '🪑', icon: <WoodenChairIcon />, price: 80 },
      { id: 'cozy-sofa', name: 'Cozy Sofa', emoji: '🛋️', icon: <CozySofaIcon />, price: 220 },
      { id: 'oak-dresser', name: 'Oak Dresser', emoji: '🪞', icon: <OakDresserIcon />, price: 150 },
      { id: 'feather-bed', name: 'Feather Bed', emoji: '🛏️', icon: <FeatherBedIcon />, price: 350 },
      { id: 'pine-table', name: 'Pine Table', emoji: '🪵', icon: <PineTableIcon />, price: 120 },
      { id: 'rocking-chair', name: 'Rocking Chair', emoji: '🪑', icon: <RockingChairIcon />, price: 95 },
    ],
  },
  {
    id: 'decor',
    label: 'Decor',
    emoji: '🌿',
    items: [
      { id: 'potted-fern', name: 'Potted Fern', emoji: '🌱', icon: <PottedFernIcon />, price: 40 },
      { id: 'candle-set', name: 'Candle Set', emoji: '🕯️', icon: <CandleSetIcon />, price: 60 },
      { id: 'hanging-vine', name: 'Hanging Vine', emoji: '🪴', icon: <HangingVineIcon />, price: 90 },
      { id: 'woven-rug', name: 'Woven Rug', emoji: '🧶', icon: <WovenRugIcon />, price: 75 },
      { id: 'flower-basket', name: 'Flower Basket', emoji: '🌸', icon: <FlowerBasketIcon />, price: 55 },
    ],
  },
  {
    id: 'structures',
    label: 'Structures',
    emoji: '🪟',
    items: [
      { id: 'carved-door', name: 'Carved Door', emoji: '🚪', icon: <CarvedDoorIcon />, price: 280 },
      { id: 'cobble-wall', name: 'Cobble Wall', emoji: '🧱', icon: <CobbleWallIcon />, price: 160 },
      { id: 'wooden-arch', name: 'Wooden Arch', emoji: '🌉', icon: <WoodenArchIcon />, price: 320 },
      { id: 'fence-post', name: 'Fence Post', emoji: '🪵', icon: <FencePostIcon />, price: 80 },
      { id: 'garden-gate', name: 'Garden Gate', emoji: '⛩️', icon: <GardenGateIcon />, price: 240 },
    ],
  },
  {
    id: 'special',
    label: 'Special',
    emoji: '✨',
    items: [
      { id: 'fairy-lantern', name: 'Fairy Lantern', emoji: '🪔', price: 500 },
      { id: 'moon-crystal', name: 'Moon Crystal', emoji: '🌙', price: 750 },
      { id: 'mystic-orb', name: 'Mystic Orb', emoji: '🔮', price: 1000 },
      { id: 'enchanted-bonsai', name: 'Enchanted Bonsai', emoji: '🎋', price: 650 },
      { id: 'star-fragment', name: 'Star Fragment', emoji: '⭐', price: 850 },
      { id: 'spirit-bells', name: 'Spirit Bells', emoji: '🔔', price: 420 },
    ],
  },
];

const CATEGORIES: ShopCategory[] = BASE_CATEGORIES;

// ── component ────────────────────────────────────────────────────────────────

const ShopPanel = forwardRef<ShopPanelHandle, ShopPanelProps>(
  ({ coins: coinsProp = 10000, onBuy }, ref) => {

    const [isOpen, setIsOpen] = useState(false);
    const [coins, setCoinsState] = useState(coinsProp);
    const [openCategory, setOpenCategory] = useState<string | null>(null);

    // keep local balance in sync when the parent updates the prop
    useEffect(() => { setCoinsState(coinsProp); }, [coinsProp]);

    useImperativeHandle(ref, () => ({
      setCoins: (amount: number) => setCoinsState(amount),
      addCoins: (delta: number) => setCoinsState(prev => prev + delta),
    }));

    const toggleCategory = (id: string) =>
      setOpenCategory(prev => (prev === id ? null : id));

    const handleBuy = async (item: ShopItem) => {
      if (coins < item.price) return;

      // Optimistic update: deduct immediately and enter placement mode so
      // buying works even when the backend is unreachable or the user is a guest.
      setCoinsState(prev => prev - item.price);
      onBuy?.(item.id, item.price);
      setIsOpen(false);

      // Best-effort backend sync — reconcile balance if the server responds.
      try {
        const uid = localStorage.getItem('firebaseUid') ||
          Object.keys(localStorage).find(k => k.startsWith('username:'))?.split(':')[1];
        if (!uid) return;

        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

        const res = await fetch(`${BACKEND_URL}/coins/spend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, amount: item.price, item: item.id }),
        });

        if (res.ok) {
          const data = await res.json();
          setCoinsState(data.coins); // reconcile with authoritative balance
        }
      } catch {
        // backend unreachable — local deduction stands
      }
    };

    return (
      <>
        <div className={styles.coinHud}>
          <PixelCoin />
          {coins.toLocaleString()}
        </div>

        {/* transparent overlay — closes panel when clicking outside */}
        {isOpen && (
          <div
            className={styles.overlay}
            onClick={() => setIsOpen(false)}
          />
        )}

        <div className={`${styles.shopRoot} ${isOpen ? styles.open : ''}`}>

          {/* ── handle tab ── */}
          <button
            className={styles.handle}
            onClick={() => setIsOpen(prev => !prev)}
            aria-label={isOpen ? 'Close shop' : 'Open shop'}
          >
            <span className={styles.handleIcon}>🏪</span>
            <span className={styles.handleLabel}>MARKET</span>
          </button>

          {/* ── panel body ── */}
          <div className={styles.panel}>

            <div className={styles.topBar}>
              <span className={styles.shopTitle}>Village Market</span>
            </div>

            {/* category accordions */}
            <div className={styles.categories}>
              {CATEGORIES.map(cat => {
                const isExpanded = openCategory === cat.id;
                return (
                  <div key={cat.id} className={styles.category}>
                    <button
                      className={`${styles.categoryHeader} ${isExpanded ? styles.categoryOpen : ''}`}
                      onClick={() => toggleCategory(cat.id)}
                      aria-expanded={isExpanded}
                    >
                      <span>{cat.label}</span>
                      <span className={styles.chevron}>▶</span>
                    </button>

                    <div className={`${styles.categoryContent} ${isExpanded ? styles.expanded : ''}`}>
                      <div className={styles.categoryContentInner}>
                        <div className={styles.itemGrid}>
                          {cat.items.map(item => {
                            const canAfford = coins >= item.price;
                            return (
                              <div key={item.id} className={styles.itemCard}>
                                <span className={styles.itemEmoji}>{item.icon ?? item.emoji}</span>
                                <span className={styles.itemName}>{item.name}</span>
                                <span className={styles.itemPrice}>◆ {item.price}</span>
                                <button
                                  className={styles.buyBtn}
                                  disabled={!canAfford}
                                  onClick={() => handleBuy(item)}
                                >
                                  {canAfford ? 'BUY ▶' : 'LOCKED'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  },
);

ShopPanel.displayName = 'ShopPanel';
export default ShopPanel;
