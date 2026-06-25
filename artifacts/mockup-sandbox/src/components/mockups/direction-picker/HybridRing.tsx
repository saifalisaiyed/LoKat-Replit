import { useState, useRef, useCallback } from "react";
import { DARK_MAP, GRAY_105, GRAY_110, GRAY_170, GRAY_450, GRAY_900, PURPLE, PURPLE_A08, WHITE } from "@/constants/colors.js";

const SEGMENT_COUNT = 16;
const SEG_DEG = 360 / SEGMENT_COUNT; // 22.5°

const MAIN_LABELS: Record<number, string> = {
  0: "N", 1: "NNE", 2: "NE", 3: "ENE",
  4: "E", 5: "ESE", 6: "SE", 7: "SSE",
  8: "S", 9: "SSW", 10: "SW", 11: "WSW",
  12: "W", 13: "WNW", 14: "NW", 15: "NNW",
};

const FULL_NAMES: Record<string, string> = {
  N: "North", NNE: "North-Northeast", NE: "Northeast", ENE: "East-Northeast",
  E: "East", ESE: "East-Southeast", SE: "Southeast", SSE: "South-Southeast",
  S: "South", SSW: "South-Southwest", SW: "Southwest", WSW: "West-Southwest",
  W: "West", WNW: "West-Northwest", NW: "Northwest", NNW: "North-Northwest",
};

const PRIMARY = new Set([0, 2, 4, 6, 8, 10, 12, 14]);

// Compass bearing → SVG coordinate
// North (0°) = up, East (90°) = right
function polarToXY(bearingDeg: number, r: number, cx: number, cy: number) {
  const rad = ((bearingDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function HybridRing() {
  const [selected, setSelected] = useState<number>(0);
  const ringRef = useRef<SVGSVGElement>(null);

  const SIZE = 260;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R_OUTER = 118;
  const R_INNER = 76;
  const R_LABEL = 98;
  const R_NEEDLE = 64;
  const GAP = 1.8; // degrees of gap between segments

  const handleRingClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!ringRef.current) return;
    const rect = ringRef.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < R_INNER - 8 || dist > R_OUTER + 10) return;
    // atan2 gives math angle; convert to compass bearing
    const bearing = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
    setSelected(Math.round(bearing / SEG_DEG) % SEGMENT_COUNT);
  }, []);

  const handleRingTouch = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!ringRef.current) return;
    const touch = e.touches[0];
    const rect = ringRef.current.getBoundingClientRect();
    const dx = touch.clientX - (rect.left + rect.width / 2);
    const dy = touch.clientY - (rect.top + rect.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < R_INNER - 8 || dist > R_OUTER + 10) return;
    const bearing = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
    setSelected(Math.round(bearing / SEG_DEG) % SEGMENT_COUNT);
  }, []);

  const selectedBearing = selected * SEG_DEG;
  const selectedLabel = MAIN_LABELS[selected];

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      background: GRAY_105,
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Mock map-picker header */}
        <div style={{
          background: DARK_MAP,
          borderRadius: "16px 16px 0 0",
          padding: "14px 16px 12px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: PURPLE }} />
          <span style={{ color: WHITE, fontSize: 13, fontWeight: 600 }}>Select exact spot</span>
        </div>

        {/* Mock map area */}
        <div style={{
          height: 130,
          background: "linear-gradient(135deg, #2a2d4a 0%, #1e2035 100%)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.15,
            backgroundImage: "repeating-linear-gradient(0deg,#7C3AED 0,#7C3AED 1px,transparent 0,transparent 50%),repeating-linear-gradient(90deg,#7C3AED 0,#7C3AED 1px,transparent 0,transparent 50%)",
            backgroundSize: "40px 40px",
          }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
            {/* Direction cone follows selected bearing */}
            <div style={{
              position: "absolute", left: "50%", top: "50%",
              transform: `translate(-50%,-50%) rotate(${selectedBearing}deg)`,
              transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
              <div style={{
                width: 0, height: 0,
                borderLeft: "16px solid transparent",
                borderRight: "16px solid transparent",
                borderBottom: "58px solid rgba(124,58,237,0.4)",
                marginLeft: -16, marginTop: -58,
                filter: "blur(1px)",
              }} />
            </div>
            <div style={{
              width: 26, height: 26,
              borderRadius: "50% 50% 50% 0",
              background: PURPLE,
              transform: "rotate(-45deg)",
              border: "3px solid #fff",
              boxShadow: "0 4px 12px rgba(124,58,237,0.5)",
              position: "relative", zIndex: 2,
            }} />
          </div>
        </div>

        {/* Bottom sheet */}
        <div style={{
          background: WHITE,
          borderRadius: "0 0 16px 16px",
          padding: "18px 16px 16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}>
          <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: GRAY_900 }}>
            Photo facing direction — <span style={{ color: GRAY_450, fontWeight: 400 }}>tap the ring</span>
          </p>

          {/* Ring picker */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <svg
              ref={ringRef}
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              onClick={handleRingClick}
              onTouchStart={handleRingTouch}
              style={{ cursor: "pointer", overflow: "visible" }}
            >
              {Array.from({ length: SEGMENT_COUNT }, (_, i) => {
                // Each segment is CENTERED on its compass bearing (i * SEG_DEG)
                // so N (0°) is exactly at the top, E (90°) exactly right, etc.
                const centerBearing = i * SEG_DEG;
                const startBearing = centerBearing - SEG_DEG / 2 + GAP;
                const endBearing   = centerBearing + SEG_DEG / 2 - GAP;

                const isSelected = i === selected;
                const isAdjacent = Math.min(
                  Math.abs(i - selected),
                  SEGMENT_COUNT - Math.abs(i - selected)
                ) === 1;

                // Build donut-slice path
                const so = polarToXY(startBearing, R_OUTER, CX, CY);
                const eo = polarToXY(endBearing,   R_OUTER, CX, CY);
                const ei = polarToXY(endBearing,   R_INNER, CX, CY);
                const si = polarToXY(startBearing, R_INNER, CX, CY);
                const pathD = [
                  `M ${so.x} ${so.y}`,
                  `A ${R_OUTER} ${R_OUTER} 0 0 1 ${eo.x} ${eo.y}`,
                  `L ${ei.x} ${ei.y}`,
                  `A ${R_INNER} ${R_INNER} 0 0 0 ${si.x} ${si.y}`,
                  "Z",
                ].join(" ");

                const segColor = isSelected
                  ? PURPLE
                  : isAdjacent ? "#DDD6FE" : GRAY_110;

                // Label sits at the CENTER of the segment
                const lp = polarToXY(centerBearing, R_LABEL, CX, CY);
                const isPrimary = PRIMARY.has(i);

                return (
                  <g key={i}>
                    <path
                      d={pathD}
                      fill={segColor}
                      style={{ transition: "fill 0.15s ease" }}
                    />
                    {isPrimary && (
                      <text
                        x={lp.x}
                        y={lp.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={isSelected ? 10 : 8.5}
                        fontWeight={isSelected ? 800 : 600}
                        fill={isSelected ? WHITE : GRAY_450}
                        fontFamily="Inter, sans-serif"
                        style={{ transition: "all 0.15s", pointerEvents: "none", userSelect: "none" }}
                      >
                        {MAIN_LABELS[i]}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Inner circle */}
              <circle cx={CX} cy={CY} r={R_INNER - 2} fill={WHITE} />
              <circle cx={CX} cy={CY} r={R_INNER - 2} fill="none" stroke={GRAY_170} strokeWidth={1} />

              {/* Needle — rotates to selectedBearing; 0° = straight up = North */}
              <g style={{
                transform: `rotate(${selectedBearing}deg)`,
                transformOrigin: `${CX}px ${CY}px`,
                transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              }}>
                <line
                  x1={CX} y1={CY}
                  x2={CX} y2={CY - R_NEEDLE}
                  stroke={PURPLE} strokeWidth={2.5} strokeLinecap="round"
                />
                <polygon
                  points={`${CX},${CY - R_NEEDLE - 7} ${CX - 5},${CY - R_NEEDLE + 3} ${CX + 5},${CY - R_NEEDLE + 3}`}
                  fill={PURPLE}
                />
              </g>

              {/* Center hub */}
              <circle cx={CX} cy={CY} r={14} fill={PURPLE} />
              <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" fontSize={14}>📷</text>
            </svg>
          </div>

          {/* Result */}
          <div style={{
            background: PURPLE_A08,
            border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 10, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 14,
          }}>
            <span style={{ fontSize: 16 }}>🧭</span>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: GRAY_450, fontWeight: 500 }}>Camera will face</p>
              <p style={{ margin: 0, fontSize: 14, color: GRAY_900, fontWeight: 700 }}>
                {FULL_NAMES[selectedLabel]}
              </p>
            </div>
          </div>

          <button style={{
            width: "100%", padding: "14px", borderRadius: 12,
            background: PURPLE, border: "none", cursor: "pointer",
            color: WHITE, fontSize: 15, fontWeight: 700,
          }}>
            Confirm Direction
          </button>
        </div>
      </div>
    </div>
  );
}
