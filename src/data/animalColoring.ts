export interface AnimalColoringItem {
  name: string;
  src: string;
  ref?: string;
}

/**
 * Animal Studio Collection
 * Maps the standard sketch files and includes specific outliers.
 */

const SCRATCH_COLORING_NAMES = [
  'bee',
  'ladybug',
  'wasp',
  'parrot',
  'elephant',
  'giraffe',
  'lion1',
  'monkey',
  'zebra',
  'turkey',
  'butterfly1',
  'bear',
  'flamingo',
  'woodpecker',
  'scorpion',
  'mosquito',
  'spider',
  'centipede',
  'millipede',
  'caterpillar',
];

export const SCRATCH_COLORING = SCRATCH_COLORING_NAMES.map((name) => ({
  name,
  sketch: `/coloring/${name}.webp`,
  ref: `/coloring/${name}_ref.webp`,
}));

// export const ANIMAL_COLORING: AnimalColoringItem[] = [
//   ...ANIMAL.map((name) => ({
//     name: name,
//     src: `/coloring/${name}.webp`,
//   })),
// ];
