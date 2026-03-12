// components/landing/BookStrip.tsx
// Auto-scrolling horizontal film strip of illustrated book pages.
// Phase 1: SVG placeholder tiles. Phase 2: swap in real generated page images.

interface Props {
  images?: string[]   // Optional array of image URLs. If provided, replaces SVG placeholders.
}

// 8 SVG illustrated placeholder tiles — each ~148×196px portrait card
const SVG_TILES = [
  // Tile 1: Jungle scene
  `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
    <rect width="148" height="196" fill="#d4edda"/>
    <ellipse cx="74" cy="160" rx="60" ry="20" fill="#a8d5a2" opacity="0.6"/>
    <rect x="20" y="80" width="8" height="100" fill="#5a8a3c" rx="4"/>
    <ellipse cx="24" cy="75" rx="20" ry="25" fill="#7ab648" opacity="0.9"/>
    <rect x="110" y="60" width="8" height="120" fill="#5a8a3c" rx="4"/>
    <ellipse cx="114" cy="55" rx="22" ry="28" fill="#7ab648" opacity="0.9"/>
    <circle cx="74" cy="100" r="22" fill="#fde68a"/>
    <circle cx="74" cy="90" r="14" fill="#f59e0b"/>
    <line x1="74" y1="104" x2="74" y2="140" stroke="#92400e" stroke-width="3"/>
    <line x1="74" y1="115" x2="55" y2="130" stroke="#92400e" stroke-width="3"/>
    <line x1="74" y1="115" x2="93" y2="130" stroke="#92400e" stroke-width="3"/>
    <line x1="74" y1="140" x2="60" y2="165" stroke="#92400e" stroke-width="3"/>
    <line x1="74" y1="140" x2="88" y2="165" stroke="#92400e" stroke-width="3"/>
    <text x="74" y="185" text-anchor="middle" font-size="9" fill="#3d6b30" font-family="sans-serif">Lost in the Jungle</text>
  </svg>`,
  // Tile 2: Space scene
  `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
    <rect width="148" height="196" fill="#1e1b4b"/>
    <circle cx="20" cy="30" r="2" fill="white" opacity="0.8"/>
    <circle cx="50" cy="15" r="1.5" fill="white" opacity="0.6"/>
    <circle cx="100" cy="25" r="2" fill="white" opacity="0.9"/>
    <circle cx="130" cy="10" r="1.5" fill="white" opacity="0.7"/>
    <circle cx="10" cy="80" r="1" fill="white" opacity="0.5"/>
    <circle cx="140" cy="60" r="2" fill="white" opacity="0.8"/>
    <ellipse cx="74" cy="100" rx="18" ry="30" fill="#f59e0b"/>
    <polygon points="74,55 60,85 88,85" fill="#d97706"/>
    <circle cx="74" cy="100" r="8" fill="#bfdbfe" opacity="0.9"/>
    <polygon points="58,125 44,145 62,138" fill="#f97316"/>
    <polygon points="90,125 104,145 86,138" fill="#f97316"/>
    <text x="74" y="185" text-anchor="middle" font-size="9" fill="#a5b4fc" font-family="sans-serif">Space Mission</text>
  </svg>`,
  // Tile 3: Dragon
  `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
    <rect width="148" height="196" fill="#fce7f3"/>
    <polygon points="74,30 20,150 128,150" fill="#d1d5db"/>
    <polygon points="74,50 35,150 113,150" fill="#e5e7eb"/>
    <circle cx="90" cy="75" r="25" fill="#a78bfa"/>
    <polygon points="90,50 100,65 80,65" fill="#7c3aed"/>
    <circle cx="83" cy="72" r="4" fill="#fbbf24"/>
    <circle cx="97" cy="72" r="4" fill="#fbbf24"/>
    <path d="M 82 82 Q 90 88 98 82" stroke="#7c3aed" stroke-width="2" fill="none"/>
    <polygon points="110,60 125,45 120,62 135,55" fill="#f59e0b" opacity="0.8"/>
    <text x="74" y="175" text-anchor="middle" font-size="8" fill="#7c3aed" font-family="sans-serif">The Dragon Who</text>
    <text x="74" y="187" text-anchor="middle" font-size="8" fill="#7c3aed" font-family="sans-serif">Was Different</text>
  </svg>`,
  // Tile 4: Ocean
  `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
    <rect width="148" height="196" fill="#dbeafe"/>
    <rect x="0" y="110" width="148" height="86" fill="#3b82f6" opacity="0.7"/>
    <path d="M 0 110 Q 37 100 74 110 Q 111 120 148 110" fill="#bfdbfe" opacity="0.6"/>
    <rect x="50" y="80" width="50" height="35" fill="#92400e" rx="3"/>
    <polygon points="75,40 50,80 100,80" fill="#fde68a"/>
    <rect x="72" y="50" width="3" height="35" fill="#78350f"/>
    <circle cx="74" cy="90" r="10" fill="#fde68a"/>
    <circle cx="74" cy="82" r="7" fill="#f59e0b"/>
    <text x="74" y="185" text-anchor="middle" font-size="9" fill="#1e40af" font-family="sans-serif">The Great Ocean Voyage</text>
  </svg>`,
  // Tile 5: Castle
  `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
    <rect width="148" height="196" fill="#fef3c7"/>
    <rect x="10" y="40" width="130" height="140" fill="#d1d5db" rx="4"/>
    <rect x="0" y="30" width="45" height="60" fill="#9ca3af"/>
    <rect x="103" y="30" width="45" height="60" fill="#9ca3af"/>
    <rect x="5" y="10" width="10" height="25" fill="#6b7280"/>
    <rect x="20" y="10" width="10" height="25" fill="#6b7280"/>
    <rect x="108" y="10" width="10" height="25" fill="#6b7280"/>
    <rect x="123" y="10" width="10" height="25" fill="#6b7280"/>
    <rect x="50" y="100" width="48" height="80" fill="#7c3aed" rx="24 24 0 0"/>
    <circle cx="90" cy="142" r="5" fill="#f59e0b"/>
    <text x="74" y="190" text-anchor="middle" font-size="9" fill="#92400e" font-family="sans-serif">The Forbidden Door</text>
  </svg>`,
  // Tile 6: Forest
  `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
    <rect width="148" height="196" fill="#d1fae5"/>
    <ellipse cx="30" cy="60" rx="28" ry="35" fill="#059669"/>
    <ellipse cx="118" cy="50" rx="32" ry="40" fill="#059669"/>
    <ellipse cx="74" cy="40" rx="20" ry="28" fill="#34d399"/>
    <path d="M 55 196 Q 74 140 93 196" fill="#fde68a" opacity="0.8"/>
    <circle cx="74" cy="130" r="14" fill="#fde68a"/>
    <circle cx="74" cy="122" r="9" fill="#f59e0b"/>
    <circle cx="30" cy="80" r="5" fill="#fbbf24" opacity="0.8"/>
    <circle cx="118" cy="70" r="4" fill="#fbbf24" opacity="0.8"/>
    <text x="74" y="185" text-anchor="middle" font-size="8" fill="#065f46" font-family="sans-serif">Into the Enchanted Forest</text>
  </svg>`,
  // Tile 7: Hero
  `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
    <rect width="148" height="196" fill="#fef3c7"/>
    <circle cx="74" cy="55" r="45" fill="#fde68a" opacity="0.5"/>
    <circle cx="74" cy="50" r="16" fill="#fde68a"/>
    <circle cx="74" cy="42" r="10" fill="#f59e0b"/>
    <line x1="74" y1="66" x2="74" y2="110" stroke="#92400e" stroke-width="4"/>
    <path d="M 74 70 Q 50 90 40 110 Q 74 100 108 110 Q 98 90 74 70" fill="#ef4444" opacity="0.9"/>
    <line x1="74" y1="80" x2="50" y2="100" stroke="#92400e" stroke-width="3"/>
    <line x1="74" y1="80" x2="98" y2="100" stroke="#92400e" stroke-width="3"/>
    <line x1="74" y1="110" x2="58" y2="145" stroke="#92400e" stroke-width="3"/>
    <line x1="74" y1="110" x2="90" y2="145" stroke="#92400e" stroke-width="3"/>
    <text x="74" y="175" text-anchor="middle" font-size="9" fill="#92400e" font-family="sans-serif">Everyday Hero</text>
  </svg>`,
  // Tile 8: Friends
  `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
    <rect width="148" height="196" fill="#fef9c3"/>
    <ellipse cx="74" cy="165" rx="65" ry="15" fill="#fde68a" opacity="0.4"/>
    <circle cx="90" cy="80" r="16" fill="#fde68a"/>
    <circle cx="90" cy="72" r="10" fill="#f59e0b"/>
    <line x1="90" y1="96" x2="90" y2="135" stroke="#92400e" stroke-width="3"/>
    <line x1="90" y1="108" x2="75" y2="122" stroke="#92400e" stroke-width="3"/>
    <line x1="90" y1="108" x2="105" y2="122" stroke="#92400e" stroke-width="3"/>
    <line x1="90" y1="135" x2="80" y2="160" stroke="#92400e" stroke-width="3"/>
    <line x1="90" y1="135" x2="100" y2="160" stroke="#92400e" stroke-width="3"/>
    <ellipse cx="50" cy="128" rx="16" ry="12" fill="#fbbf24"/>
    <circle cx="50" cy="116" r="10" fill="#f59e0b"/>
    <ellipse cx="44" cy="110" rx="5" ry="8" fill="#f59e0b"/>
    <ellipse cx="56" cy="110" rx="5" ry="8" fill="#f59e0b"/>
    <circle cx="47" cy="116" r="2" fill="#1c1917"/>
    <circle cx="53" cy="116" r="2" fill="#1c1917"/>
    <text x="74" y="185" text-anchor="middle" font-size="9" fill="#92400e" font-family="sans-serif">The Unexpected Friend</text>
  </svg>`,
]

export function BookStrip({ images }: Props) {
  // If real images are provided, use them; otherwise use SVG placeholders
  const tiles = images && images.length > 0 ? images : SVG_TILES.map(svg =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  )

  // Duplicate tiles for seamless infinite scroll
  const allTiles = [...tiles, ...tiles]

  return (
    <div className="relative w-full overflow-hidden py-4">
      {/* Fade masks — left and right */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgb(255,251,245), transparent)',
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to left, rgb(255,251,245), transparent)',
        }}
      />

      {/* Scrolling strip */}
      <div
        className="flex gap-4 w-max animate-scroll-left"
        style={{ willChange: 'transform' }}
      >
        {allTiles.map((src, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[148px] h-[196px] rounded-2xl overflow-hidden shadow-md shadow-amber-100 border border-amber-100"
          >
            <img
              src={src}
              alt=""
              aria-hidden="true"
              width={148}
              height={196}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
