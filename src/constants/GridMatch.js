export const GRID_SIZE = 10;

export const COLORS = {
  empty: '#ECEFF1',
  teal: '#26A69A',
  orange: '#FF9800',
  purple: '#7E57C2',
  pink: '#EC407A',
};

// 🧠 COMPLEX PATTERNS
export const PATTERNS = [
  (r, c) => {
    // Strong outer A border
    if (
      (c === 2 && r >= 1 && r <= 8) ||
      (c === 7 && r >= 1 && r <= 8) ||
      (r === 1 && c >= 2 && c <= 7) ||
      (r === 5 && c >= 2 && c <= 7)
    )
      return COLORS.purple;

    // Main fill
    if (r > 1 && r < 8 && c > 2 && c < 7) return COLORS.orange;
    // Soft outer glow for depth
    if (
      (c === 1 && r >= 1 && r <= 8) ||
      (c === 8 && r >= 1 && r <= 8) ||
      (r === 0 && c >= 2 && c <= 7)
    )
      return COLORS.teal;

    return COLORS.empty;
  },
  (r, c) => {
    if ((c === 1 || c === 2) && r >= 0 && r <= 9) return COLORS.purple;
    if ([0, 1, 4, 5, 8, 9].includes(r) && c >= 2 && c <= 5) return COLORS.purple;
    if (c === 6 && ((r >= 1 && r <= 3) || (r >= 6 && r <= 8))) return COLORS.purple;
    if (c > 2 && c < 6 && ((r > 1 && r < 5) || (r > 5 && r < 8))) return COLORS.orange;
    return COLORS.empty;
  },
  (r, c) => {
    if (
      ((c === 1 || c === 2) && r >= 1 && r <= 8) ||
      ((r === 1 || r === 2 || r === 8) && c >= 2 && c <= 7) ||
      (r === 7 && c >= 2 && c <= 7)
    )
      return COLORS.pink;
    if (c > 2 && c <= 6 && r > 2 && r < 7) return COLORS.orange;
    return COLORS.empty;
  },
  (r, c) => {
    if (c === 2 || (c === 1 && r >= 0 && r <= 9)) return COLORS.pink;
    if ((r === 0 || r === 1 || r === 8 || r === 9) && c >= 2 && c <= 5) return COLORS.pink;
    if (c === 6 && r >= 1 && r <= 8) return COLORS.pink;
    if (c === 7 && r >= 2 && r <= 7) return COLORS.pink;
    if (c > 2 && c < 6 && r > 1 && r < 8) return COLORS.teal;
    return COLORS.empty;
  },
  (r, c) => {
    if (c === 1 || (c === 2 && r >= 1 && r <= 8)) return COLORS.teal;
    if ((r === 0 || r === 1 || r === 4 || r === 5 || r === 8 || r === 9) && c >= 2 && c <= 7)
      return COLORS.teal;
    if (c > 2 && c <= 6 && r > 1 && r < 8) return COLORS.orange;
    if (r === 3 && c === 5) return COLORS.pink;
    return COLORS.empty;
  },
  (r, c) => {
    if (c === 1 || (c === 2 && r >= 1 && r <= 9)) return COLORS.purple;
    if ((r === 0 || r === 1 || r === 5 || r === 4) && c >= 2 && c <= 7) return COLORS.purple;
    if (c > 2 && c <= 6 && r > 1 && r < 8) return COLORS.pink;
    return COLORS.empty;
  },
  (r, c) => {
    if (
      (c === 2 && r >= 1 && r <= 8) ||
      (c === 1 && r >= 1 && r <= 8) ||
      (r === 1 && c >= 2 && c <= 7) ||
      (r === 2 && c >= 2 && c <= 7) ||
      (r === 7 && c >= 2 && c <= 7) ||
      (r === 8 && c >= 2 && c <= 7) ||
      (r === 5 && c >= 4 && c <= 7) ||
      (c === 7 && r >= 5 && r <= 7)
    )
      return COLORS.pink;
    if (c > 2 && c < 7 && r > 2 && r < 7) return COLORS.orange;
    return COLORS.empty;
  },
  (r, c) => {
    if ((c === 1 || c === 8 || c === 2 || c === 7) && r >= 1 && r <= 8) return COLORS.purple;
    if ((r === 4 || r === 5) && c >= 2 && c <= 7) return COLORS.purple;
    if (c > 1 && c < 7 && r > 1 && r < 8) return COLORS.pink;
    return COLORS.empty;
  },
  (r, c) => {
    if ((r < 2 || r > 7) && c >= 3 && c <= 6) return COLORS.purple;
    if (c === 4 || c === 5) return COLORS.orange;
    if (r === 4 && c === 4) return COLORS.pink;
    return COLORS.empty;
  },
  (r, c) => {
    if (c === 1 || c === 2) return COLORS.teal;
    if ((r + c === 7 || r + c === 8) && r >= 0 && r <= 5) return COLORS.pink;
    if ((r - c === 1 || r - c === 2) && r >= 5 && r <= 9) return COLORS.pink;
    return COLORS.empty;
  },
  (r, c) => {
    // Left vertical line (double thickness)
    if ((c === 3 || c === 4) && r >= 0 && r <= 9) return COLORS.purple;

    // Bottom horizontal line (double thickness)
    if ((r === 8 || r === 9) && c >= 3 && c <= 8) return COLORS.orange;

    // Corner highlight (2x2 block)
    if ((r === 8 || r === 9) && (c === 3 || c === 4)) return COLORS.pink;

    return COLORS.empty;
  },
  (r, c) => {
    if (c === 2 && r >= 1 && r <= 8) return COLORS.purple;
    if ((r === 1 || r === 4) && c >= 2 && c <= 6) return COLORS.purple;
    if (c === 6 && r >= 2 && r <= 3) return COLORS.purple;
    if (r - c === 2 && r >= 5 && r <= 8) return COLORS.purple;
    if (c > 2 && c < 6 && r > 1 && r < 4) return COLORS.orange;
    if (r === 2 && c === 4) return COLORS.pink;
    return COLORS.empty;
  },

  (r, c) => {
    if (r < 3) return COLORS.purple;
    if (r > 2 && c > 2 && c < 7) return COLORS.orange;
    return COLORS.empty;
  },

  // 1: Layered square + center cross
  (r, c) => {
    if (r === 0 || r === 9 || c === 0 || c === 9) return COLORS.teal;
    if (r === 2 || r === 7 || c === 2 || c === 7) return COLORS.orange;
    if (r === 4 || r === 5 || c === 4 || c === 5) return COLORS.purple;
    return COLORS.empty;
  },

  // 2: Diagonal X with inner box
  (r, c) => {
    if (r === c || r + c === 9) return COLORS.pink;
    if (r >= 3 && r <= 6 && c >= 3 && c <= 6) return COLORS.orange;
    if (r >= 0 && r < 2 && c > 3 && c <= 5) return COLORS.purple;
    if (c >= 0 && c < 2 && r > 3 && r <= 5) return COLORS.purple;
    if (r >= 8 && c > 3 && c <= 5) return COLORS.purple;
    if (c >= 8 && r > 3 && r <= 5) return COLORS.purple;
    return COLORS.empty;
  },

  // 3: Asymmetric blocks
  (r, c) => {
    if (r < 3 && c < 3) return COLORS.teal;
    if (r > 6 && c > 6) return COLORS.teal;
    if (r >= 4 && r <= 5) return COLORS.orange;
    if (c >= 4 && c <= 5) return COLORS.orange;
    if (c >= 7 && r < 3) return COLORS.pink;
    if (r >= 7 && c < 3) return COLORS.pink;
    return COLORS.empty;
  },

  // 4: Spiral
  (r, c) => {
    if (r === 0 || c === 0 || r === 9 || c === 9) return COLORS.teal;
    if (r === 1 || c === 1 || r === 8 || c === 8) return COLORS.orange;
    if (r === 2 || c === 2 || r === 7 || c === 7) return COLORS.purple;
    if (r === 3 || c === 3 || r === 6 || c === 6) return COLORS.pink;
    return COLORS.empty;
  },
  // 6: Concentric diamonds
  (r, c) => {
    const d = Math.abs(r - 4.5) + Math.abs(c - 4.5);
    if (d < 2) return COLORS.pink;
    if (d < 4) return COLORS.orange;
    if (d < 6) return COLORS.teal;
    return COLORS.empty;
  },

  // 8: Hollow X with center dot
  (r, c) => {
    if (r === c || r + c === 9) return COLORS.teal;
    if (r === c - 1 || r === c + 1 || [7, 8, 9, 10, 11].includes(r + c)) return COLORS.purple;
    if (r === c - 1 || r === c + 1 || [-2, 2].includes(r - c)) return COLORS.purple;
    return COLORS.empty;
  },

  // 9: Quadrant inversion
  (r, c) => {
    if (r < 5 && c < 5) return COLORS.orange;
    if (r < 5 && c >= 5) return COLORS.teal;
    if (r >= 5 && c < 5) return COLORS.purple;
    if (r >= 5 && c >= 5) return COLORS.pink;
  },

  // 10: Cross + border gaps
  (r, c) => {
    if (r === 4 || r === 5 || c === 4 || c === 5) return COLORS.orange;
    if ((r === 0 || r === 9 || c === 0 || c === 9) && (r + c) % 2 === 0) return COLORS.teal;
    return COLORS.empty;
  },

  // 14: Checker rings
  (r, c) => {
    const ring = Math.min(r, c, 9 - r, 9 - c);
    if (ring % 2 === 0) return COLORS.teal;
    return COLORS.purple;
  },

  // 16: Diamond cross
  (r, c) => {
    if (Math.abs(r - 4.5) === Math.abs(c - 4.5)) return COLORS.purple;
    if ([4, 5].includes(r)) return COLORS.orange;
    if ([4, 5].includes(c)) return COLORS.orange;
    return COLORS.empty;
  },

  // 17: Staircase
  (r, c) => {
    if (r > 7) return COLORS.teal;
    if (r > 5 && c < 8) return COLORS.pink;
    if (r > 3 && c < 6) return COLORS.orange;
    if (r > 1 && c < 4) return COLORS.purple;
    if (c < 2) return COLORS.teal;
    return COLORS.empty;
  },

  // 21: Corner anchors
  (r, c) => {
    if ((r < 2 && c < 2) || (r < 2 && c > 7) || (r > 7 && c < 2) || (r > 7 && c > 7))
      return COLORS.teal;
    if ([4, 5].includes(r)) return COLORS.purple;
    if ([4, 5].includes(c)) return COLORS.purple;
    return COLORS.empty;
  },
  // 23: Vertical symmetry bands
  (r, c) => {
    if (Math.abs(c - 4.5) < 1) return COLORS.teal;
    if (Math.abs(c - 4.5) < 3) return COLORS.orange;
    if (Math.abs(c - 4.5) < 5) return COLORS.purple;
    return COLORS.empty;
  },
  // 25: Center explosion
  (r, c) => {
    const d = Math.max(Math.abs(r - 4.5), Math.abs(c - 4.5));
    if (d < 1) return COLORS.pink;
    if (d < 3) return COLORS.orange;
    if (d < 5) return COLORS.teal;
    return COLORS.empty;
  },
];
