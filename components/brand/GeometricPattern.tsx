// Decorative tile pattern in the brand palette (circles, leaves, half and quarter circles on square tiles)

const C = {
  ink: '#191918',
  teal: '#294248',
  cyan: '#64ccd0',
  sage: '#879983',
};

type Anchor = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'c';
// leaf: two opposite quarter-circle arcs; `at` names the corner the leaf points to (tl/br diagonal or tr/bl diagonal)
type Tile = { bg: string; shape?: 'circle' | 'quarter' | 'half' | 'dot' | 'leaf'; color?: string; at?: Anchor };

const S = 100; // tile size
const COLS = 4;

// 4 columns x 6 rows
const tiles: Tile[] = [
  { bg: C.ink, shape: 'leaf', color: C.cyan, at: 'tr' },
  { bg: C.ink, shape: 'quarter', color: C.sage, at: 'bl' },
  { bg: C.sage, shape: 'leaf', color: C.teal, at: 'tr' },
  { bg: C.teal },

  { bg: C.sage, shape: 'half', color: C.teal, at: 'r' },
  { bg: C.sage, shape: 'quarter', color: C.cyan, at: 'tl' },
  { bg: C.cyan, shape: 'quarter', color: C.sage, at: 'br' },
  { bg: C.teal, shape: 'quarter', color: C.sage, at: 'bl' },

  { bg: C.cyan, shape: 'circle', color: C.teal },
  { bg: C.teal, shape: 'dot', color: C.cyan, at: 'c' },
  { bg: C.sage, shape: 'quarter', color: C.teal, at: 'tl' },
  { bg: C.ink, shape: 'leaf', color: C.sage, at: 'tl' },

  { bg: C.teal },
  { bg: C.ink, shape: 'half', color: C.cyan, at: 'b' },
  { bg: C.cyan, shape: 'quarter', color: C.ink, at: 'br' },
  { bg: C.teal, shape: 'half', color: C.sage, at: 'l' },

  { bg: C.sage, shape: 'quarter', color: C.teal, at: 'tr' },
  { bg: C.cyan, shape: 'leaf', color: C.teal, at: 'tl' },
  { bg: C.teal, shape: 'circle', color: C.sage },
  { bg: C.sage, shape: 'quarter', color: C.ink, at: 'br' },

  { bg: C.cyan },
  { bg: C.teal, shape: 'quarter', color: C.cyan, at: 'bl' },
  { bg: C.ink, shape: 'half', color: C.sage, at: 't' },
  { bg: C.sage, shape: 'dot', color: C.teal, at: 'c' },
];

const ROWS = Math.ceil(tiles.length / COLS);

// Shapes are drawn as paths that stay inside their tile, so no clipPath ids are needed
// (the pattern can appear twice on a page without id collisions).
function shapePath(tile: Tile, x: number, y: number): string | null {
  const h = S / 2;
  // Quarter circle of radius S centered on a tile corner: [corner, arc start, arc end]
  const quarter: Record<string, [number, number][]> = {
    tl: [[x, y], [x + S, y], [x, y + S]],
    tr: [[x + S, y], [x + S, y + S], [x, y]],
    br: [[x + S, y + S], [x, y + S], [x + S, y]],
    bl: [[x, y + S], [x, y], [x + S, y + S]],
  };
  // Half circle of radius S/2 centered on an edge midpoint: [arc start, arc end]
  const half: Record<string, [number, number][]> = {
    t: [[x + S, y], [x, y]],
    b: [[x, y + S], [x + S, y + S]],
    l: [[x, y], [x, y + S]],
    r: [[x + S, y + S], [x + S, y]],
  };

  switch (tile.shape) {
    case 'quarter': {
      const [c, p1, p2] = quarter[tile.at ?? 'tl'];
      return `M${c} L${p1} A${S} ${S} 0 0 1 ${p2} Z`;
    }
    case 'half': {
      const [p1, p2] = half[tile.at ?? 't'];
      return `M${p1} A${h} ${h} 0 0 1 ${p2} Z`;
    }
    case 'leaf': {
      // Arcs of radius S centered on the two corners off the diagonal
      const [a, b] =
        tile.at === 'tl' || tile.at === 'br'
          ? [[x, y], [x + S, y + S]]
          : [[x, y + S], [x + S, y]];
      return `M${a} A${S} ${S} 0 0 1 ${b} A${S} ${S} 0 0 1 ${a} Z`;
    }
    default:
      return null;
  }
}

export function GeometricPattern({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${COLS * S} ${ROWS * S}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      {tiles.map((tile, i) => {
        const x = (i % COLS) * S;
        const y = Math.floor(i / COLS) * S;
        const path = shapePath(tile, x, y);
        return (
          <g key={i}>
            <rect x={x} y={y} width={S} height={S} fill={tile.bg} />
            {path && <path d={path} fill={tile.color} />}
            {tile.shape === 'circle' && <circle cx={x + S / 2} cy={y + S / 2} r={S / 2} fill={tile.color} />}
            {tile.shape === 'dot' && <circle cx={x + S / 2} cy={y + S / 2} r={S / 8} fill={tile.color} />}
          </g>
        );
      })}
    </svg>
  );
}
