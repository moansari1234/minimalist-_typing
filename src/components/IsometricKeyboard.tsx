import { useState, useEffect, type CSSProperties } from 'react';

/* ---------- isometric projection helpers ---------- */
const U = 26; // 1 key unit in px
const CX = 0.9; // x-axis screen slope
const SY = 0.5; // y-axis screen slope

const P = (x: number, y: number, z: number): readonly [number, number] => [
  +((x - y) * CX).toFixed(2),
  +((x + y) * SY - z).toFixed(2),
];

const poly = (pts: (readonly [number, number])[]) =>
  'M' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';

/* deterministic pseudo-random */
const rnd = (i: number, salt: number) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/* Renders one extruded keycap (top + two visible sides) */
function KeyCap({
  x,
  y,
  w,
  d,
  zb,
  zt,
  isSpecial,
  char,
  colors,
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  zb: number;
  zt: number;
  isSpecial: boolean;
  char?: string;
  colors: any;
}) {
  const x1 = x + w;
  const y1 = y + d;
  const top = poly([P(x, y, zt), P(x1, y, zt), P(x1, y1, zt), P(x, y1, zt)]);
  const right = poly([P(x1, y, zt), P(x1, y, zb), P(x1, y1, zb), P(x1, y1, zt)]);
  const front = poly([P(x, y1, zt), P(x1, y1, zt), P(x1, y1, zb), P(x, y1, zb)]);
  
  const { INK, TOP_LIGHT, TOP_DARK, SIDE_A, SIDE_B, SIDE_A_DARK, SIDE_B_DARK, ACCENT, SPECIAL_CHAR } = colors;
  
  const topColor = isSpecial ? TOP_DARK : TOP_LIGHT;
  const sideA = isSpecial ? SIDE_A_DARK : SIDE_A;
  const sideB = isSpecial ? SIDE_B_DARK : SIDE_B;
  const rightSide = isSpecial ? SIDE_B_DARK : SIDE_B; // could be slightly different
  
  const legendColor = isSpecial ? SPECIAL_CHAR : ACCENT;
  const cx_unproj = x + w / 2;
  const cy_unproj = y + d / 2;

  return (
    <g stroke={INK} strokeWidth="1" strokeLinejoin="round">
      <path d={front} fill={sideB} />
      <path d={right} fill={rightSide} />
      <path d={top} fill={topColor} />
      {char && (
        <g transform={`matrix(${CX}, ${SY}, ${-CX}, ${SY}, 0, ${-zt})`}>
          <text
            x={cx_unproj}
            y={cy_unproj}
            fill={legendColor}
            stroke="none"
            fontSize={char.length > 1 ? "5" : "8"}
            fontFamily="var(--brand-font, monospace)"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
            opacity={0.8}
            style={{ userSelect: 'none' }}
          >
            {char}
          </text>
        </g>
      )}
    </g>
  );
}

/* 60% keyboard layout — key widths per row (each row sums to 15u) */
const ROWS: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
];

const KEY_CHARS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'BACK'],
  ['TAB', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['CAPS', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'ENTER'],
  ['SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'SHIFT'],
  ['CTRL', 'WIN', 'ALT', '', 'ALT', 'WIN', 'MENU', 'CTRL'],
];

/* which keys hover above the board (exploded view), keyed by "row-col" */
const POPPED: Record<string, number> = {
  '0-3': 46, '0-6': 60, '0-10': 40, '0-13': 30,
  '1-2': 34, '1-5': 52, '1-9': 42, '1-12': 28,
  '2-4': 38, '2-8': 55, '2-0': 26,
  '3-3': 44, '3-7': 32, '3-11': 24,
  '4-3': 36, '4-6': 48,
};

export default function ExplodedKeyboard() {
  const [exploded, setExploded] = useState(false);
  
  const colors = {
    INK: 'var(--brand-ink)',
    TOP_LIGHT: 'color-mix(in srgb, var(--brand-bg), var(--brand-ink) 10%)',
    SIDE_A: '#9ca3af',
    SIDE_B: '#6b7280',
    TOP_DARK: 'var(--brand-accent)',
    SIDE_A_DARK: '#9ca3af',
    SIDE_B_DARK: '#6b7280',
    PLATE_TOP: 'color-mix(in srgb, var(--brand-bg), var(--brand-ink) 15%)',
    PLATE_SIDE1: 'color-mix(in srgb, var(--brand-bg), var(--brand-ink) 25%)',
    PLATE_SIDE2: 'color-mix(in srgb, var(--brand-bg), var(--brand-ink) 35%)',
    BLOB: 'color-mix(in srgb, var(--brand-bg), var(--brand-ink) 4%)',
    ACCENT: 'var(--brand-accent)',
    SPECIAL_CHAR: 'color-mix(in srgb, var(--brand-bg), var(--brand-ink) 10%)'
  };

  const plateH = 10;
  const capH = 11;
  const boardW = 15 * U;
  const boardD = 5 * U;

  /* base plate */
  const bx0 = -10, by0 = -10, bx1 = boardW + 10, by1 = boardD + 10;
  const plateTop = poly([P(bx0, by0, plateH), P(bx1, by0, plateH), P(bx1, by1, plateH), P(bx0, by1, plateH)]);
  const plateRight = poly([P(bx1, by0, plateH), P(bx1, by0, -6), P(bx1, by1, -6), P(bx1, by1, plateH)]);
  const plateFront = poly([P(bx0, by1, plateH), P(bx1, by1, plateH), P(bx1, by1, -6), P(bx0, by1, -6)]);

  /* build key list */
  const keys: {
    id: string; x: number; y: number; w: number; lift: number; isSpecial: boolean; char: string; i: number;
  }[] = [];
  let idx = 0;
  ROWS.forEach((row, r) => {
    let cursor = 0;
    row.forEach((w, c) => {
      const id = `${r}-${c}`;
      keys.push({
        id,
        x: cursor * U + 2,
        y: r * U + 2,
        w: w * U - 4,
        lift: POPPED[id] ?? 0,
        isSpecial: w > 1 || (r === 0 && c > 9),
        char: KEY_CHARS[r]?.[c] || '',
        i: idx++,
      });
      cursor += w;
    });
  });

  const explodeVars = (i: number): CSSProperties => {
    const a = rnd(i, 1) * Math.PI * 2;
    const dist = 30 + rnd(i, 2) * 90;
    return {
      '--ex': `${(Math.cos(a) * dist).toFixed(0)}px`,
      '--ey': `${(-20 - rnd(i, 3) * 100).toFixed(0)}px`,
      '--er': `${((rnd(i, 4) - 0.5) * 40).toFixed(0)}deg`,
    } as CSSProperties;
  };

  const floatVars = (i: number, amt: number): CSSProperties =>
    ({
      '--dur': `${(3 + rnd(i, 5) * 3).toFixed(2)}s`,
      '--delay': `-${(rnd(i, 6) * 4).toFixed(2)}s`,
      '--float': `${-amt.toFixed(1)}px`,
    }) as CSSProperties;

  return (
    <div className="select-none flex flex-col items-center justify-center w-full h-full min-h-[400px]">
      <style>{`
        .shape-drift {
          animation: drift var(--dur) ease-in-out infinite alternate var(--delay, 0s);
        }
        .key-float {
          animation: float var(--dur) ease-in-out infinite alternate var(--delay, 0s);
        }
        @keyframes drift {
          0% { transform: translate(0, 0) rotate(0); }
          100% { transform: translate(var(--sx), var(--sy)) rotate(var(--sr)); }
        }
        @keyframes float {
          0% { transform: translateY(0); }
          100% { transform: translateY(var(--float)); }
        }
        .key-mover {
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: center;
        }
        .key-mover.exploded {
          transform: translate(var(--ex), var(--ey)) rotate(var(--er));
        }
      `}</style>
      <svg
        viewBox="-240 -170 720 540"
        className="w-[90%] md:w-[85%] max-w-4xl h-auto cursor-pointer max-h-[85%]"
        onClick={() => setExploded((e) => !e)}
        role="img"
        aria-label="Exploded isometric keyboard illustration — click to explode"
      >
        {/* soft blob behind */}
        <rect
          x="-90" y="-40" width="480" height="290" rx="90"
          fill={colors.BLOB}
          transform="rotate(-12 150 105)"
        />

        {/* decorative shapes */}
        <g className="shape-drift" style={{ '--sx': '5px', '--sy': '-9px', '--sr': '4deg', '--dur': '6s' } as CSSProperties}>
          <path d="M 285 -78 A 38 38 0 0 1 361 -78 Z" fill={colors.TOP_DARK} stroke={colors.INK} strokeWidth="1.2" />
          <line x1="323" y1="-74" x2="323" y2="-38" stroke={colors.INK} strokeWidth="1.2" />
        </g>
        <g className="shape-drift" style={{ '--sx': '-6px', '--sy': '6px', '--sr': '-10deg', '--dur': '8s', '--delay': '-2s' } as CSSProperties}>
          <path d="M -128 -84 L -100 -98 L -100 -70 Z" fill={colors.SIDE_A} stroke={colors.INK} strokeWidth="1.2" />
        </g>
        <g className="shape-drift" style={{ '--sx': '4px', '--sy': '-6px', '--sr': '14deg', '--dur': '7s', '--delay': '-4s' } as CSSProperties}>
          <path d="M 410 218 L 438 232 L 410 246 Z" fill="none" stroke={colors.INK} strokeWidth="1.2" />
        </g>
        <circle cx="-150" cy="96" r="9" fill="none" stroke={colors.INK} strokeWidth="1.2" className="shape-drift" style={{ '--sy': '-10px', '--dur': '5s' } as CSSProperties} />
        <circle cx="-132" cy="128" r="4" fill={colors.SIDE_B} stroke={colors.INK} strokeWidth="1" className="shape-drift" style={{ '--sy': '8px', '--dur': '6s', '--delay': '-1s' } as CSSProperties} />

        {/* floating mini cube, bottom-left */}
        <g className="shape-drift" style={{ '--sx': '-4px', '--sy': '-10px', '--sr': '-6deg', '--dur': '6.5s' } as CSSProperties}>
          <g transform="translate(-118 210)">
            <KeyCap x={0} y={0} w={26} d={22} zb={0} zt={12} isSpecial={true} char="FN" colors={colors} />
          </g>
        </g>

        {/* floating detached keycaps outside the board */}
        <g className="key-float" style={floatVars(97, 7)}>
          <g transform="translate(-64 -104) rotate(-9)">
            <KeyCap x={0} y={0} w={24} d={22} zb={0} zt={11} isSpecial={false} char="W" colors={colors} />
          </g>
        </g>
        <g className="key-float" style={floatVars(53, 8)}>
          <g transform="translate(20 -128) rotate(7)">
            <KeyCap x={0} y={0} w={24} d={22} zb={0} zt={11} isSpecial={true} char="ESC" colors={colors} />
          </g>
        </g>
        <g className="key-float" style={floatVars(71, 6)}>
          <g transform="translate(150 258) rotate(-6)">
            <KeyCap x={0} y={0} w={48} d={22} zb={0} zt={11} isSpecial={false} char="SPACE" colors={colors} />
          </g>
        </g>

        {/* keyboard base plate */}
        <g stroke={colors.INK} strokeWidth="1.2" strokeLinejoin="round">
          <path d={plateFront} fill={colors.PLATE_SIDE2} />
          <path d={plateRight} fill={colors.PLATE_SIDE1} />
          <path d={plateTop} fill={colors.PLATE_TOP} />
        </g>

        {/* keycaps */}
        {keys.map((k) => {
          const popped = k.lift > 0;
          const zb = plateH + k.lift + (popped ? 8 : 0);
          const inner = (
            <g
              className={`key-mover ${exploded ? 'exploded' : ''}`}
              style={explodeVars(k.i)}
            >
              <KeyCap
                x={k.x}
                y={k.y}
                w={k.w}
                d={U - 4}
                zb={zb}
                zt={zb + capH}
                isSpecial={k.isSpecial}
                char={k.char}
                colors={colors}
              />
              {popped && (
                <line
                  x1={P(k.x + k.w / 2, k.y + (U - 4) / 2, zb)[0]}
                  y1={P(k.x + k.w / 2, k.y + (U - 4) / 2, zb)[1]}
                  x2={P(k.x + k.w / 2, k.y + (U - 4) / 2, plateH + 2)[0]}
                  y2={P(k.x + k.w / 2, k.y + (U - 4) / 2, plateH + 2)[1]}
                  stroke={colors.INK}
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                  opacity="0.45"
                />
              )}
            </g>
          );
          return popped ? (
            <g key={k.id} className="key-float" style={floatVars(k.i, 3 + rnd(k.i, 7) * 5)}>
              {inner}
            </g>
          ) : (
            <g key={k.id}>{inner}</g>
          );
        })}
      </svg>
      <p className="text-center font-mono text-[11px] tracking-[0.2em] opacity-60 mt-1 uppercase">
        {exploded ? '[ click to reassemble ]' : '[ click keyboard to explode ]'}
      </p>
    </div>
  );
}
