import { useState, useRef, useCallback, useEffect } from "react";

const DIRS = [
  { label: "N",  angle: 0   },
  { label: "NE", angle: 45  },
  { label: "E",  angle: 90  },
  { label: "SE", angle: 135 },
  { label: "S",  angle: 180 },
  { label: "SW", angle: 225 },
  { label: "W",  angle: 270 },
  { label: "NW", angle: 315 },
];

const FULL_NAMES: Record<string, string> = {
  N: "North", NE: "Northeast", E: "East", SE: "Southeast",
  S: "South", SW: "Southwest", W: "West", NW: "Northwest",
};

function snapToNearest(angle: number) {
  const norm = ((angle % 360) + 360) % 360;
  return DIRS.reduce((best, cur) => {
    const bDiff = Math.min(Math.abs(best.angle - norm), 360 - Math.abs(best.angle - norm));
    const cDiff = Math.min(Math.abs(cur.angle - norm), 360 - Math.abs(cur.angle - norm));
    return cDiff < bDiff ? cur : best;
  });
}

export function RotationDial() {
  const [rawAngle, setRawAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);
  const snapped = snapToNearest(rawAngle);

  const getAngle = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return 0;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return ((Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90 + 360) % 360;
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setRawAngle(getAngle(e.clientX, e.clientY));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [isDragging, getAngle]);

  const displayAngle = isDragging ? rawAngle : snapped.angle;

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
            height: 130,
            background: "linear-gradient(135deg, #2a2d4a 0%, #1e2035 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0, opacity: 0.15,
            backgroundImage: "repeating-linear-gradient(0deg, #7C3AED 0, #7C3AED 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #7C3AED 0, #7C3AED 1px, transparent 0, transparent 50%)",
            backgroundSize: "40px 40px"
          }} />
          {/* Pin + direction arrow */}
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
            {/* Direction cone */}
            <div style={{
              position: "absolute", left: "50%", top: "50%",
              transform: `translate(-50%, -50%) rotate(${displayAngle}deg)`,
              transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              transformOrigin: "center",
            }}>
              <div style={{
                width: 0, height: 0,
                borderLeft: "14px solid transparent",
                borderRight: "14px solid transparent",
                borderBottom: "52px solid rgba(249,115,22,0.35)",
                marginLeft: -14,
                marginTop: -52,
                filter: "blur(1px)",
              }} />
            </div>
            {/* Pin */}
            <div style={{ width: 26, height: 26, borderRadius: "50% 50% 50% 0", background: "#7C3AED", transform: "rotate(-45deg)", border: "3px solid #fff", boxShadow: "0 4px 12px rgba(124,58,237,0.5)", position: "relative", zIndex: 2 }} />
          </div>
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
          <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "#111827" }}>
            Photo facing direction — <span style={{ color: "#9CA3AF", fontWeight: 400 }}>drag the dial</span>
          </p>

          {/* Dial */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div
              ref={dialRef}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDragging(true);
                setRawAngle(getAngle(e.clientX, e.clientY));
              }}
              onTouchStart={(e) => {
                setIsDragging(true);
                setRawAngle(getAngle(e.touches[0].clientX, e.touches[0].clientY));
              }}
              onTouchMove={(e) => {
                if (isDragging) setRawAngle(getAngle(e.touches[0].clientX, e.touches[0].clientY));
              }}
              onTouchEnd={() => setIsDragging(false)}
              style={{
                width: 220, height: 220, borderRadius: "50%",
                background: "radial-gradient(circle at 60% 35%, #f0edff, #e8e4ff 50%, #ddd8ff)",
                border: "2.5px solid rgba(124,58,237,0.25)",
                boxShadow: isDragging
                  ? "0 0 0 4px rgba(124,58,237,0.15), 0 8px 32px rgba(124,58,237,0.2)"
                  : "0 4px 24px rgba(124,58,237,0.12)",
                position: "relative",
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: "none",
                transition: "box-shadow 0.2s",
              }}
            >
              {/* Compass direction labels */}
              {DIRS.map((dir) => {
                const rad = ((dir.angle - 90) * Math.PI) / 180;
                const r = 82;
                const x = 110 + r * Math.cos(rad);
                const y = 110 + r * Math.sin(rad);
                const isActive = snapped.label === dir.label;
                return (
                  <div
                    key={dir.label}
                    style={{
                      position: "absolute",
                      left: x, top: y,
                      transform: "translate(-50%, -50%)",
                      fontSize: isActive ? 13 : 10,
                      fontWeight: isActive ? 800 : 500,
                      color: isActive ? "#7C3AED" : "#9CA3AF",
                      transition: "all 0.2s",
                      pointerEvents: "none",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {dir.label}
                  </div>
                );
              })}

              {/* Tick marks */}
              {DIRS.map((dir) => {
                const rad = ((dir.angle - 90) * Math.PI) / 180;
                const r1 = 95, r2 = 104;
                const x1 = 110 + r1 * Math.cos(rad);
                const y1 = 110 + r1 * Math.sin(rad);
                const x2 = 110 + r2 * Math.cos(rad);
                const y2 = 110 + r2 * Math.sin(rad);
                return (
                  <svg key={`tick-${dir.label}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={snapped.label === dir.label ? "#7C3AED" : "#C4B5FD"} strokeWidth={snapped.label === dir.label ? 2.5 : 1.5} />
                  </svg>
                );
              })}

              {/* Rotating needle */}
              <div
                style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transform: `rotate(${displayAngle}deg)`,
                  transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                  pointerEvents: "none",
                }}
              >
                {/* Needle shaft */}
                <div style={{
                  position: "absolute",
                  width: 3, height: 68,
                  background: "linear-gradient(to top, transparent 0%, #7C3AED 40%, #5B21B6 100%)",
                  borderRadius: 3,
                  bottom: "50%", left: "50%",
                  marginLeft: -1.5,
                  transformOrigin: "bottom center",
                }} />
                {/* Needle tip arrowhead */}
                <div style={{
                  position: "absolute",
                  bottom: "calc(50% + 64px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 0, height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderBottom: "10px solid #5B21B6",
                }} />
              </div>

              {/* Center hub */}
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "#7C3AED",
                  border: "3px solid #fff",
                  boxShadow: "0 2px 10px rgba(124,58,237,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14,
                }}>
                  📷
                </div>
              </div>
            </div>
          </div>

          {/* Result pill */}
          <div style={{
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.25)",
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
                {FULL_NAMES[snapped.label]}
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
