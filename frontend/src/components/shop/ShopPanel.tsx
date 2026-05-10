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
} from 'react';

import styles from './ShopPanel.module.css';

// ── types ────────────────────────────────────────────────────────────────────

interface ShopItem {
  id:    string;
  name:  string;
  emoji: string;
  price: number;
}

interface ShopCategory {
  id:    string;
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

// ── shop catalogue ───────────────────────────────────────────────────────────

const BASE_CATEGORIES: ShopCategory[] = [
  {
    id:    'nature',
    label: 'Nature',
    emoji: '🌳',
    items: [
      { id: 'tree', name: 'Oak Tree', emoji: '🌳', price: 110 },
    ],
  },
  {
    id:    'furniture',
    label: 'Furniture',
    emoji: '🛋️',
    items: [
      { id: 'wooden-chair',   name: 'Wooden Chair',   emoji: '🪑', price: 80  },
      { id: 'cozy-sofa',      name: 'Cozy Sofa',      emoji: '🛋️', price: 220 },
      { id: 'oak-dresser',    name: 'Oak Dresser',    emoji: '🪞', price: 150 },
      { id: 'feather-bed',    name: 'Feather Bed',    emoji: '🛏️', price: 350 },
      { id: 'pine-table',     name: 'Pine Table',     emoji: '🪵', price: 120 },
      { id: 'rocking-chair',  name: 'Rocking Chair',  emoji: '🪑', price: 95  },
    ],
  },
  {
    id:    'decor',
    label: 'Decor',
    emoji: '🌿',
    items: [
      { id: 'potted-fern',      name: 'Potted Fern',      emoji: '🌱', price: 40  },
      { id: 'candle-set',       name: 'Candle Set',       emoji: '🕯️', price: 60  },
      { id: 'hanging-vine',     name: 'Hanging Vine',     emoji: '🪴', price: 90  },
      { id: 'landscape-print',  name: 'Landscape Print',  emoji: '🖼️', price: 120 },
      { id: 'woven-rug',        name: 'Woven Rug',        emoji: '🧶', price: 75  },
      { id: 'flower-basket',    name: 'Flower Basket',    emoji: '🌸', price: 55  },
    ],
  },
  {
    id:    'structures',
    label: 'Structures',
    emoji: '🪟',
    items: [
      { id: 'stone-window',  name: 'Stone Window',  emoji: '🪟', price: 200 },
      { id: 'carved-door',   name: 'Carved Door',   emoji: '🚪', price: 280 },
      { id: 'cobble-wall',   name: 'Cobble Wall',   emoji: '🧱', price: 160 },
      { id: 'wooden-arch',   name: 'Wooden Arch',   emoji: '🌉', price: 320 },
      { id: 'fence-post',    name: 'Fence Post',    emoji: '🪵', price: 80  },
      { id: 'garden-gate',   name: 'Garden Gate',   emoji: '⛩️', price: 240 },
    ],
  },
  {
    id:    'special',
    label: 'Special',
    emoji: '✨',
    items: [
      { id: 'fairy-lantern',     name: 'Fairy Lantern',     emoji: '🪔', price: 500  },
      { id: 'moon-crystal',      name: 'Moon Crystal',      emoji: '🌙', price: 750  },
      { id: 'mystic-orb',        name: 'Mystic Orb',        emoji: '🔮', price: 1000 },
      { id: 'enchanted-bonsai',  name: 'Enchanted Bonsai',  emoji: '🎋', price: 650  },
      { id: 'star-fragment',     name: 'Star Fragment',     emoji: '⭐', price: 850  },
      { id: 'spirit-bells',      name: 'Spirit Bells',      emoji: '🔔', price: 420  },
    ],
  },
];

const CATEGORIES: ShopCategory[] = BASE_CATEGORIES;

// ── component ────────────────────────────────────────────────────────────────

const ShopPanel = forwardRef<ShopPanelHandle, ShopPanelProps>(
  ({ coins: coinsProp = 10000, onBuy }, ref) => {

    const [isOpen,       setIsOpen]       = useState(false);
    const [coins,        setCoinsState]   = useState(coinsProp);
    const [openCategory, setOpenCategory] = useState<string | null>(null);

    // keep local balance in sync when the parent updates the prop
    useEffect(() => { setCoinsState(coinsProp); }, [coinsProp]);

    useImperativeHandle(ref, () => ({
      setCoins: (amount: number) => setCoinsState(amount),
      addCoins: (delta: number) => setCoinsState(prev => prev + delta),
    }));

    const toggleCategory = (id: string) =>
      setOpenCategory(prev => (prev === id ? null : id));

    const handleBuy = (item: ShopItem) => {
      if (coins < item.price) return;
      setCoinsState(prev => prev - item.price);
      onBuy?.(item.id, item.price);
      // Close the panel so the cursor-follow placement preview is visible.
      setIsOpen(false);
    };

    return (
      <>
        <div className={styles.coinHud}>
          <span className={styles.coinIcon}>🪙</span>
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
                      <span>{cat.emoji}&nbsp;&nbsp;{cat.label}</span>
                      <span className={styles.chevron}>›</span>
                    </button>

                    <div className={`${styles.categoryContent} ${isExpanded ? styles.expanded : ''}`}>
                      <div className={styles.categoryContentInner}>
                        <div className={styles.itemGrid}>
                          {cat.items.map(item => {
                            const canAfford = coins >= item.price;
                            return (
                              <div key={item.id} className={styles.itemCard}>
                                <span className={styles.itemEmoji}>{item.emoji}</span>
                                <span className={styles.itemName}>{item.name}</span>
                                <span className={styles.itemPrice}>🪙 {item.price}</span>
                                <button
                                  className={styles.buyBtn}
                                  disabled={!canAfford}
                                  onClick={() => handleBuy(item)}
                                >
                                  {canAfford ? 'Buy' : "Can't Afford"}
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
