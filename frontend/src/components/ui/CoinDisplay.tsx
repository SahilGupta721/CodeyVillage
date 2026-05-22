interface CoinDisplayProps {
  coins: number;
}

export default function CoinDisplay({ coins }: CoinDisplayProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "#9B6B2F",
        border: "3px solid #2A1208",
        boxShadow:
          "inset 2px 2px 0 0 #C89A3A, inset -2px -2px 0 0 #5C3010, 3px 3px 0 0 #1A0800",
        padding: "6px 12px 6px 8px",
        imageRendering: "pixelated",
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          backgroundColor: "#FFD700",
          border: "2px solid #B8860B",
          boxShadow: "inset -3px -3px 0 0 #B8860B, inset 2px 2px 0 0 #FFE566",
          flexShrink: 0,
          imageRendering: "pixelated",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-pixel), monospace",
          color: "#FFFDE7",
          fontSize: "11px",
          textShadow: "2px 2px 0 #2A1208",
          lineHeight: 1,
          paddingTop: "2px",
        }}
      >
        {coins}
      </span>
    </div>
  );
}
