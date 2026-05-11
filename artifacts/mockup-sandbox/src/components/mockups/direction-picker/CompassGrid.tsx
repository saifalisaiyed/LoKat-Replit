import { useState } from "react";

const DIRECTIONS = [
  { label: "NW", angle: 315, row: 0, col: 0 },
  { label: "N",  angle: 0,   row: 0, col: 1 },
  { label: "NE", angle: 45,  row: 0, col: 2 },
  { label: "W",  angle: 270, row: 1, col: 0 },
  { label: "E",  angle: 90,  row: 1, col: 2 },
  { label: "SW", angle: 225, row: 2, col: 0 },
  { label: "S",  angle: 180, row: 2, col: 1 },
  { label: "SE", angle: 135, row: 2, col: 2 },
];

const FULL_NAMES: Record<string, string> = {
  N: "North", NE: "Northeast", E: "East", SE: "Southeast",
  S: "South", SW: "Southwest", W: "West", NW: "Northwest",
};

export function CompassGrid() {
  const [selected, setSelected] = useState<string>("N");

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "#F5F5F7",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Mock map-picker header */}
        <div
          style={{
            background: "#1A1B2E",
            borderRadius: "16px 16px 0 0",
            padding: "14px 16px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" }} />
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Select exact spot</span>
        </div>

        {/* Mock map area */}
        <div
          style={{
            height: 140,
            background: "linear-gradient(135deg, #2a2d4a 0%, #1e2035 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0, opacity: 0.15,
            backgroundImage: "repeating-linear-gradient(0deg, #7C3AED 0, #7C3AED 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #7C3AED 0, #7C3AED 1px, transparent 0, transparent 50%)",
            backgroundSize: "40px 40px"
          }} />
          {/* Pin */}
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -100%)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50% 50% 50% 0", background: "#7C3AED", transform: "rotate(-45deg)", border: "3px solid #fff", boxShadow: "0 4px 12px rgba(124,58,237,0.5)" }} />
          </div>
          {/* Direction arrow overlay on map */}
          {selected && (
            <div style={{
              position: "absolute", left: "50%", top: "50%",
              transform: `translate(-50%, -50%) rotate(${DIRECTIONS.find(d => d.label === selected)?.angle ?? 0}deg)`,
              transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              pointerEvents: "none",
            }}>
              <div style={{ width: 2, height: 40, background: "rgba(249,115,22,0.9)", borderRadius: 2, marginLeft: -1, marginTop: -40 }} />
              <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "10px solid rgba(249,115,22,0.9)", marginLeft: -4, marginTop: -42 }} />
            </div>
          )}
        </div>

        {/* Bottom sheet */}
        <div
          style={{
            background: "#fff",
            borderRadius: "0 0 16px 16px",
            padding: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#111827" }}>
            Photo facing direction
          </p>

          {/* 3×3 Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
            {[0, 1, 2].map((row) =>
              [0, 1, 2].map((col) => {
                if (row === 1 && col === 1) {
                  return (
                    <div
                      key="center"
                      style={{
                        aspectRatio: "1",
                        borderRadius: 12,
                        background: "#F9FAFB",
                        border: "1.5px solid #E5E7EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#D1D5DB" }} />
                    </div>
                  );
                }
                const dir = DIRECTIONS.find((d) => d.row === row && d.col === col);
                if (!dir) return null;
                const isSelected = selected === dir.label;
                return (
                  <button
                    key={dir.label}
                    onClick={() => setSelected(dir.label)}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 12,
                      border: isSelected ? "2px solid #7C3AED" : "1.5px solid #E5E7EB",
                      background: isSelected ? "#7C3AED" : "#F9FAFB",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                      transition: "all 0.15s ease",
                      transform: isSelected ? "scale(1.04)" : "scale(1)",
                      boxShadow: isSelected ? "0 4px 16px rgba(124,58,237,0.3)" : "none",
                      padding: 0,
                    }}
                  >
                    <span style={{
                      fontSize: 16,
                      display: "inline-block",
                      transform: `rotate(${dir.angle}deg)`,
                      color: isSelected ? "#fff" : "#6B7280",
                      lineHeight: 1,
                    }}>↑</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isSelected ? "#fff" : "#374151",
                      letterSpacing: "0.02em",
                    }}>{dir.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Result pill */}
          <div style={{
            background: selected ? "rgba(124,58,237,0.08)" : "#F9FAFB",
            border: selected ? "1px solid rgba(124,58,237,0.25)" : "1px solid #E5E7EB",
            borderRadius: 10,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}>
            <span style={{ fontSize: 16 }}>🧭</span>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Camera will face</p>
              <p style={{ margin: 0, fontSize: 14, color: "#111827", fontWeight: 700 }}>
                {selected ? FULL_NAMES[selected] : "Tap a direction"}
              </p>
            </div>
          </div>

          <button style={{
            width: "100%", padding: "14px", borderRadius: 12,
            background: "#7C3AED", border: "none", cursor: "pointer",
            color: "#fff", fontSize: 15, fontWeight: 700,
          }}>
            Confirm Direction
          </button>
        </div>
      </div>
    </div>
  );
}
