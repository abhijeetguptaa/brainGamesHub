export const COLOR_NAMES: { [key: string]: string } = {
  '#FFFDD0': 'Cream',
  '#ADFF2F': 'Lime',
  '#FFCC00': 'Yellow',
  '#87CEEB': 'Sky Blue',
  '#D3997E': 'Skin',
  '#FF00FF': 'Magenta',
  '#FF3B30': 'Red',
  multi: 'Magic Color',
  '#007AFF': 'Blue',
  '#FF2D55': 'Pink',
  '#FF9500': 'Orange',
  '#34C759': 'Green',
  '#8E8E93': 'Gray',
  '#AF52DE': 'Purple',
  '#964B00': 'Brown',
  '#76423A': 'Chocolate',
  '#000080': 'Navy Blue',
  '#000000': 'Black',

  '#FFD1DC': 'Baby Pink',
  '#B0E0E6': 'Powder Blue',
  '#FFD700': 'Gold',
  '#C0C0C0': 'Silver',
  '#FFA07A': 'Peach',
  '#20B2AA': 'Sea Blue',
  '#FF69B4': 'Candy',
  '#40E0D0': 'Aqua',
  '#F4A460': 'Sand',
  '#DAA520': 'Honey',
  '#4682B4': 'Steel',
  '#FFB6C1': 'Blush',
  '#9ACD32': 'Grass',
  '#FF7F50': 'Coral',
  '#6A5ACD': 'Indigo',
  '#FFE4B5': 'Beige',
  '#8FBC8F': 'Forest',
};

// Merged Brush Types from both components
export const getBrushTypes = (t: any) => [
  { id: 'pencil', label: t('paintBrush.tools.pencil'), icon: '✏️' },
  { id: 'glitter', label: t('paintBrush.effects.glitter'), icon: '✨' },
  { id: 'neon', label: t('paintBrush.effects.neon'), icon: '🔆' },
];

export const GAME_CONFIG = {
  DEFAULT_BRUSH_SIZE: 100,
  SPARKLE_COUNT: 36,
  SPARKLE_RANGE: 150,
  FULLY_COLORED_THRESHOLD: 99,
};

export const DARK_VISIBLE_COLORS = [
  '#c0392b',
  '#2980b9',
  '#8e44ad',
  '#2c3e50',
  '#d35400',
  '#16a085',
  '#27ae60',
  '#f39c12',
  '#5d2ea3',
  '#b33939',
];
