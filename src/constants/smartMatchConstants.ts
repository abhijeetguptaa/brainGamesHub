export const GRID_COLS = 6;
export const GRID_ROWS = 9;
export const MATCH_THRESHOLD = 3;

export type SpecialType = 'row' | 'column' | 'bomb' | 'colorBlast' | 'boardClear';

export interface SmartMatchItem {
  id: string;
  type: string;
  emoji: string;
  color: string;
  special?: SpecialType;
}

export const ITEMS = [
  { type: 'apple', emoji: '🍏' },
  { type: 'donut', emoji: '🍩' },
  { type: 'star', emoji: '⭐' },
  { type: 'cherry', emoji: '🍒' },
  { type: 'leaf', emoji: '🍁' },
  { type: 'lollipop', emoji: '🍭' },
  { type: 'flower', emoji: '🌼' },
  { type: 'cookie', emoji: '🍪' },
  { type: 'lantern', emoji: '🎃' },
  { type: 'berry', emoji: '🫐' },
];

export interface LevelConfig {
  id: number;
  targetScore: number;
  moves: number;
  collectItems?: { [key: string]: number };
}

const COLLECT_ITEMS_SCALE_AFTER_LEVEL_5 = 1.7;

const scaleCollectItems = (collectItems?: { [key: string]: number }) => {
  if (!collectItems) return collectItems;

  return Object.fromEntries(
    Object.entries(collectItems).map(([itemType, count]) => [
      itemType,
      Math.round(count * COLLECT_ITEMS_SCALE_AFTER_LEVEL_5),
    ]),
  );
};

const BASE_LEVELS: LevelConfig[] = [
  { id: 1, targetScore: 30, moves: 20 },
  { id: 2, targetScore: 50, moves: 25, collectItems: { apple: 10 } },
  { id: 3, targetScore: 75, moves: 25, collectItems: { star: 15 } },
  { id: 4, targetScore: 90, moves: 30, collectItems: { donut: 12, cherry: 10 } },
  { id: 5, targetScore: 100, moves: 35, collectItems: { lollipop: 20, donut: 20 } },
  { id: 6, targetScore: 110, moves: 32, collectItems: { flower: 13, donut: 18 } },
  { id: 7, targetScore: 115, moves: 32, collectItems: { cookie: 9, apple: 13 } },
  { id: 8, targetScore: 119, moves: 32, collectItems: { lantern: 10, donut: 13 } },
  { id: 9, targetScore: 122, moves: 32, collectItems: { lantern: 10, star: 13 } },
  { id: 10, targetScore: 126, moves: 34, collectItems: { apple: 11, cherry: 14 } },
  { id: 11, targetScore: 130, moves: 34, collectItems: { donut: 11, leaf: 14 } },
  { id: 12, targetScore: 133, moves: 34, collectItems: { star: 11, lollipop: 15 } },
  { id: 13, targetScore: 137, moves: 34, collectItems: { cherry: 11, flower: 15 } },
  { id: 14, targetScore: 140, moves: 34, collectItems: { leaf: 12, cookie: 15 } },
  { id: 15, targetScore: 144, moves: 36, collectItems: { lollipop: 12, lantern: 15 } },
  { id: 16, targetScore: 147, moves: 36, collectItems: { flower: 13, berry: 16 } },
  { id: 17, targetScore: 151, moves: 36, collectItems: { cookie: 13, apple: 16 } },
  { id: 18, targetScore: 154, moves: 36, collectItems: { lantern: 13, donut: 17 } },
  { id: 19, targetScore: 158, moves: 36, collectItems: { berry: 13, star: 17 } },

  {
    id: 20,
    targetScore: 161,
    moves: 38,
    collectItems: { apple: 14, cherry: 18, flower: 21 },
  },

  {
    id: 21,
    targetScore: 165,
    moves: 38,
    collectItems: { donut: 14, leaf: 18, cookie: 21 },
  },

  {
    id: 22,
    targetScore: 168,
    moves: 38,
    collectItems: { star: 15, lollipop: 18, lantern: 22 },
  },

  {
    id: 23,
    targetScore: 172,
    moves: 38,
    collectItems: { cherry: 15, flower: 18, berry: 22 },
  },

  {
    id: 24,
    targetScore: 175,
    moves: 38,
    collectItems: { leaf: 15, cookie: 19, apple: 22 },
  },

  {
    id: 25,
    targetScore: 179,
    moves: 40,
    collectItems: { lollipop: 15, lantern: 19, donut: 22 },
  },

  {
    id: 26,
    targetScore: 182,
    moves: 40,
    collectItems: { flower: 16, berry: 20, star: 23 },
  },

  {
    id: 27,
    targetScore: 186,
    moves: 40,
    collectItems: { cookie: 16, apple: 20, cherry: 23 },
  },

  {
    id: 28,
    targetScore: 189,
    moves: 40,
    collectItems: { lantern: 17, donut: 20, leaf: 24 },
  },

  {
    id: 29,
    targetScore: 193,
    moves: 40,
    collectItems: { berry: 17, star: 20, lollipop: 24 },
  },

  {
    id: 30,
    targetScore: 196,
    moves: 42,
    collectItems: { apple: 18, cherry: 21, flower: 25 },
  },

  {
    id: 31,
    targetScore: 200,
    moves: 42,
    collectItems: { donut: 18, leaf: 21, cookie: 25 },
  },

  {
    id: 32,
    targetScore: 203,
    moves: 42,
    collectItems: { star: 18, lollipop: 22, lantern: 25 },
  },

  {
    id: 33,
    targetScore: 207,
    moves: 42,
    collectItems: { cherry: 18, flower: 22, berry: 25 },
  },

  {
    id: 34,
    targetScore: 210,
    moves: 42,
    collectItems: { leaf: 19, cookie: 22, apple: 26 },
  },

  {
    id: 35,
    targetScore: 214,
    moves: 44,
    collectItems: { lollipop: 19, lantern: 22, donut: 26 },
  },

  {
    id: 36,
    targetScore: 217,
    moves: 44,
    collectItems: { flower: 20, berry: 23, star: 27 },
  },

  {
    id: 37,
    targetScore: 221,
    moves: 44,
    collectItems: { cookie: 20, apple: 23, cherry: 27 },
  },

  {
    id: 38,
    targetScore: 224,
    moves: 44,
    collectItems: { lantern: 20, donut: 24, leaf: 27 },
  },

  {
    id: 39,
    targetScore: 227,
    moves: 44,
    collectItems: { berry: 20, star: 24, lollipop: 27 },
  },

  {
    id: 40,
    targetScore: 231,
    moves: 46,
    collectItems: { apple: 21, cherry: 25, flower: 28, berry: 31 },
  },

  {
    id: 41,
    targetScore: 234,
    moves: 46,
    collectItems: { donut: 21, leaf: 25, cookie: 28, apple: 31 },
  },

  {
    id: 42,
    targetScore: 238,
    moves: 46,
    collectItems: { star: 22, lollipop: 25, lantern: 29, donut: 32 },
  },

  {
    id: 43,
    targetScore: 241,
    moves: 46,
    collectItems: { cherry: 22, flower: 25, berry: 29, star: 32 },
  },

  {
    id: 44,
    targetScore: 245,
    moves: 46,
    collectItems: { leaf: 22, cookie: 26, apple: 29, cherry: 33 },
  },

  {
    id: 45,
    targetScore: 248,
    moves: 48,
    collectItems: { lollipop: 22, lantern: 26, donut: 29, leaf: 33 },
  },

  {
    id: 46,
    targetScore: 252,
    moves: 48,
    collectItems: { flower: 23, berry: 27, star: 30, lollipop: 34 },
  },

  {
    id: 47,
    targetScore: 255,
    moves: 48,
    collectItems: { cookie: 23, apple: 27, cherry: 30, flower: 34 },
  },

  {
    id: 48,
    targetScore: 259,
    moves: 48,
    collectItems: { lantern: 24, donut: 27, leaf: 31, cookie: 34 },
  },

  {
    id: 49,
    targetScore: 263,
    moves: 48,
    collectItems: { berry: 24, star: 27, lollipop: 31, lantern: 34 },
  },

  {
    id: 50,
    targetScore: 266,
    moves: 50,
    collectItems: { apple: 25, cherry: 28, flower: 31, berry: 35 },
  },

  {
    id: 51,
    targetScore: 270,
    moves: 50,
    collectItems: { donut: 25, leaf: 28, cookie: 31, apple: 35 },
  },

  {
    id: 52,
    targetScore: 273,
    moves: 50,
    collectItems: { star: 25, lollipop: 29, lantern: 32, donut: 36 },
  },

  {
    id: 53,
    targetScore: 277,
    moves: 50,
    collectItems: { cherry: 25, flower: 29, berry: 32, star: 36 },
  },

  {
    id: 54,
    targetScore: 280,
    moves: 50,
    collectItems: { leaf: 26, cookie: 29, apple: 33, cherry: 36 },
  },

  {
    id: 55,
    targetScore: 284,
    moves: 52,
    collectItems: { lollipop: 26, lantern: 29, donut: 33, leaf: 36 },
  },

  {
    id: 56,
    targetScore: 287,
    moves: 52,
    collectItems: { flower: 27, berry: 30, star: 34, lollipop: 37 },
  },

  {
    id: 57,
    targetScore: 291,
    moves: 52,
    collectItems: { cookie: 27, apple: 30, cherry: 34, flower: 37 },
  },

  {
    id: 58,
    targetScore: 294,
    moves: 52,
    collectItems: { lantern: 27, donut: 31, leaf: 34, cookie: 38 },
  },

  {
    id: 59,
    targetScore: 298,
    moves: 52,
    collectItems: { berry: 27, star: 31, lollipop: 34, lantern: 38 },
  },

  {
    id: 60,
    targetScore: 301,
    moves: 54,
    collectItems: { apple: 28, cherry: 31, flower: 35, berry: 39 },
  },

  {
    id: 61,
    targetScore: 305,
    moves: 54,
    collectItems: { donut: 28, leaf: 31, cookie: 35, apple: 39 },
  },

  {
    id: 62,
    targetScore: 308,
    moves: 54,
    collectItems: { star: 29, lollipop: 32, lantern: 36, donut: 39 },
  },

  {
    id: 63,
    targetScore: 312,
    moves: 54,
    collectItems: { cherry: 29, flower: 32, berry: 36, star: 39 },
  },

  {
    id: 64,
    targetScore: 315,
    moves: 54,
    collectItems: { leaf: 29, cookie: 33, apple: 36, cherry: 40 },
  },

  {
    id: 65,
    targetScore: 319,
    moves: 56,
    collectItems: { lollipop: 29, lantern: 33, donut: 36, leaf: 40 },
  },

  {
    id: 66,
    targetScore: 322,
    moves: 56,
    collectItems: { flower: 30, berry: 34, star: 37, lollipop: 41 },
  },

  {
    id: 67,
    targetScore: 326,
    moves: 56,
    collectItems: { cookie: 30, apple: 34, cherry: 37, flower: 41 },
  },

  {
    id: 68,
    targetScore: 329,
    moves: 56,
    collectItems: { lantern: 31, donut: 34, leaf: 38, cookie: 41 },
  },

  {
    id: 69,
    targetScore: 333,
    moves: 56,
    collectItems: { berry: 31, star: 34, lollipop: 38, lantern: 41 },
  },

  {
    id: 70,
    targetScore: 336,
    moves: 58,
    collectItems: { apple: 31, cherry: 35, flower: 39, berry: 42 },
  },

  {
    id: 71,
    targetScore: 340,
    moves: 58,
    collectItems: { donut: 31, leaf: 35, cookie: 39, apple: 42 },
  },

  {
    id: 72,
    targetScore: 343,
    moves: 58,
    collectItems: { star: 32, lollipop: 36, lantern: 39, donut: 43 },
  },

  {
    id: 73,
    targetScore: 347,
    moves: 58,
    collectItems: { cherry: 32, flower: 36, berry: 39, star: 43 },
  },

  {
    id: 74,
    targetScore: 350,
    moves: 58,
    collectItems: { leaf: 33, cookie: 36, apple: 40, cherry: 43 },
  },

  {
    id: 75,
    targetScore: 354,
    moves: 60,
    collectItems: { lollipop: 33, lantern: 36, donut: 40, leaf: 43 },
  },

  {
    id: 76,
    targetScore: 357,
    moves: 60,
    collectItems: { flower: 34, berry: 37, star: 41, lollipop: 44 },
  },

  {
    id: 77,
    targetScore: 361,
    moves: 60,
    collectItems: { cookie: 34, apple: 37, cherry: 41, flower: 44 },
  },

  {
    id: 78,
    targetScore: 364,
    moves: 60,
    collectItems: { lantern: 34, donut: 38, leaf: 41, cookie: 45 },
  },

  {
    id: 79,
    targetScore: 368,
    moves: 60,
    collectItems: { berry: 34, star: 38, lollipop: 41, lantern: 45 },
  },

  {
    id: 80,
    targetScore: 371,
    moves: 62,
    collectItems: { apple: 35, cherry: 39, flower: 42, berry: 46 },
  },

  {
    id: 81,
    targetScore: 375,
    moves: 62,
    collectItems: { donut: 35, leaf: 39, cookie: 42, apple: 46 },
  },

  {
    id: 82,
    targetScore: 378,
    moves: 62,
    collectItems: { star: 36, lollipop: 39, lantern: 43, donut: 46 },
  },

  {
    id: 83,
    targetScore: 382,
    moves: 62,
    collectItems: { cherry: 36, flower: 39, berry: 43, star: 46 },
  },

  {
    id: 84,
    targetScore: 385,
    moves: 62,
    collectItems: { leaf: 36, cookie: 40, apple: 43, cherry: 47 },
  },

  {
    id: 85,
    targetScore: 389,
    moves: 64,
    collectItems: { lollipop: 36, lantern: 40, donut: 43, leaf: 47 },
  },

  {
    id: 86,
    targetScore: 392,
    moves: 64,
    collectItems: { flower: 37, berry: 41, star: 44, lollipop: 48 },
  },

  {
    id: 87,
    targetScore: 396,
    moves: 64,
    collectItems: { cookie: 37, apple: 41, cherry: 44, flower: 48 },
  },

  {
    id: 88,
    targetScore: 399,
    moves: 64,
    collectItems: { lantern: 38, donut: 41, leaf: 45, cookie: 48 },
  },

  {
    id: 89,
    targetScore: 403,
    moves: 64,
    collectItems: { berry: 38, star: 41, lollipop: 45, lantern: 48 },
  },

  {
    id: 90,
    targetScore: 406,
    moves: 66,
    collectItems: { apple: 39, cherry: 42, flower: 46, berry: 49 },
  },

  {
    id: 91,
    targetScore: 410,
    moves: 66,
    collectItems: { donut: 39, leaf: 42, cookie: 46, apple: 49 },
  },

  {
    id: 92,
    targetScore: 413,
    moves: 66,
    collectItems: { star: 39, lollipop: 43, lantern: 46, donut: 50 },
  },

  {
    id: 93,
    targetScore: 417,
    moves: 66,
    collectItems: { cherry: 39, flower: 43, berry: 46, star: 50 },
  },

  {
    id: 94,
    targetScore: 420,
    moves: 66,
    collectItems: { leaf: 40, cookie: 43, apple: 47, cherry: 50 },
  },

  {
    id: 95,
    targetScore: 424,
    moves: 68,
    collectItems: { lollipop: 40, lantern: 43, donut: 47, leaf: 50 },
  },

  {
    id: 96,
    targetScore: 427,
    moves: 68,
    collectItems: { flower: 41, berry: 44, star: 48, lollipop: 51 },
  },

  {
    id: 97,
    targetScore: 431,
    moves: 68,
    collectItems: { cookie: 41, apple: 44, cherry: 48, flower: 51 },
  },

  {
    id: 98,
    targetScore: 434,
    moves: 68,
    collectItems: { lantern: 41, donut: 45, leaf: 48, cookie: 52 },
  },

  {
    id: 99,
    targetScore: 438,
    moves: 68,
    collectItems: { berry: 41, star: 45, lollipop: 48, lantern: 52 },
  },

  {
    id: 100,
    targetScore: 441,
    moves: 70,
    collectItems: { apple: 42, cherry: 46, flower: 49, berry: 53 },
  },
  {
    id: 101,
    targetScore: 445,
    moves: 70,
    collectItems: { donut: 42, leaf: 46, cookie: 49, apple: 53 },
  },
  {
    id: 102,
    targetScore: 448,
    moves: 70,
    collectItems: { star: 43, lollipop: 46, lantern: 50, donut: 53 },
  },
  {
    id: 103,
    targetScore: 451,
    moves: 70,
    collectItems: { cherry: 43, flower: 47, berry: 50, star: 54 },
  },
  {
    id: 104,
    targetScore: 455,
    moves: 70,
    collectItems: { leaf: 43, cookie: 47, apple: 50, cherry: 54 },
  },
  {
    id: 105,
    targetScore: 458,
    moves: 72,
    collectItems: { lollipop: 44, lantern: 47, donut: 51, leaf: 54 },
  },
  {
    id: 106,
    targetScore: 462,
    moves: 72,
    collectItems: { flower: 44, berry: 48, star: 51, lollipop: 55 },
  },
  {
    id: 107,
    targetScore: 465,
    moves: 72,
    collectItems: { cookie: 44, apple: 48, cherry: 51, flower: 55 },
  },
  {
    id: 108,
    targetScore: 469,
    moves: 72,
    collectItems: { lantern: 45, donut: 48, leaf: 52, cookie: 55 },
  },
  {
    id: 109,
    targetScore: 472,
    moves: 72,
    collectItems: { berry: 45, star: 49, lollipop: 52, lantern: 56 },
  },
  {
    id: 110,
    targetScore: 476,
    moves: 74,
    collectItems: { apple: 46, cherry: 49, flower: 53, berry: 56 },
  },
  {
    id: 111,
    targetScore: 479,
    moves: 74,
    collectItems: { donut: 46, leaf: 49, cookie: 53, apple: 56 },
  },
  {
    id: 112,
    targetScore: 483,
    moves: 74,
    collectItems: { star: 46, lollipop: 50, lantern: 53, donut: 57 },
  },
  {
    id: 113,
    targetScore: 486,
    moves: 74,
    collectItems: { cherry: 47, flower: 50, berry: 54, star: 57 },
  },
  {
    id: 114,
    targetScore: 490,
    moves: 74,
    collectItems: { leaf: 47, cookie: 50, apple: 54, cherry: 57 },
  },
  {
    id: 115,
    targetScore: 493,
    moves: 76,
    collectItems: { lollipop: 47, lantern: 51, donut: 54, leaf: 58 },
  },
  {
    id: 116,
    targetScore: 497,
    moves: 76,
    collectItems: { flower: 48, berry: 51, star: 55, lollipop: 58 },
  },
  {
    id: 117,
    targetScore: 500,
    moves: 76,
    collectItems: { cookie: 48, apple: 51, cherry: 55, flower: 58 },
  },
  {
    id: 118,
    targetScore: 504,
    moves: 76,
    collectItems: { lantern: 48, donut: 52, leaf: 55, cookie: 59 },
  },
  {
    id: 119,
    targetScore: 507,
    moves: 76,
    collectItems: { berry: 49, star: 52, lollipop: 56, lantern: 59 },
  },
  {
    id: 120,
    targetScore: 511,
    moves: 78,
    collectItems: { apple: 49, cherry: 53, flower: 56, berry: 59 },
  },
  {
    id: 121,
    targetScore: 515,
    moves: 78,
    collectItems: { donut: 49, leaf: 53, cookie: 56, apple: 60 },
  },
  {
    id: 122,
    targetScore: 518,
    moves: 78,
    collectItems: { star: 50, lollipop: 53, lantern: 57, donut: 60 },
  },
  {
    id: 123,
    targetScore: 522,
    moves: 78,
    collectItems: { cherry: 50, flower: 54, berry: 57, star: 61 },
  },
  {
    id: 124,
    targetScore: 525,
    moves: 78,
    collectItems: { leaf: 50, cookie: 54, apple: 57, cherry: 61 },
  },
  {
    id: 125,
    targetScore: 529,
    moves: 80,
    collectItems: { lollipop: 51, lantern: 54, donut: 58, leaf: 61 },
  },
  {
    id: 126,
    targetScore: 532,
    moves: 80,
    collectItems: { flower: 51, berry: 55, star: 58, lollipop: 62 },
  },
  {
    id: 127,
    targetScore: 536,
    moves: 80,
    collectItems: { cookie: 51, apple: 55, cherry: 58, flower: 62 },
  },
  {
    id: 128,
    targetScore: 539,
    moves: 80,
    collectItems: { lantern: 52, donut: 55, leaf: 59, cookie: 62 },
  },
  {
    id: 129,
    targetScore: 543,
    moves: 80,
    collectItems: { berry: 52, star: 56, lollipop: 59, lantern: 63 },
  },
  {
    id: 130,
    targetScore: 546,
    moves: 82,
    collectItems: { apple: 53, cherry: 56, flower: 59, berry: 63 },
  },
  {
    id: 131,
    targetScore: 550,
    moves: 82,
    collectItems: { donut: 53, leaf: 56, cookie: 60, apple: 63 },
  },
  {
    id: 132,
    targetScore: 553,
    moves: 82,
    collectItems: { star: 53, lollipop: 57, lantern: 60, donut: 64 },
  },
  {
    id: 133,
    targetScore: 557,
    moves: 82,
    collectItems: { cherry: 54, flower: 57, berry: 61, star: 64 },
  },
  {
    id: 134,
    targetScore: 560,
    moves: 82,
    collectItems: { leaf: 54, cookie: 57, apple: 61, cherry: 64 },
  },
  {
    id: 135,
    targetScore: 564,
    moves: 84,
    collectItems: { lollipop: 54, lantern: 58, donut: 61, leaf: 65 },
  },
  {
    id: 136,
    targetScore: 567,
    moves: 84,
    collectItems: { flower: 55, berry: 58, star: 62, lollipop: 65 },
  },
  {
    id: 137,
    targetScore: 571,
    moves: 84,
    collectItems: { cookie: 55, apple: 58, cherry: 62, flower: 65 },
  },
  {
    id: 138,
    targetScore: 574,
    moves: 84,
    collectItems: { lantern: 55, donut: 59, leaf: 62, cookie: 66 },
  },
  {
    id: 139,
    targetScore: 578,
    moves: 84,
    collectItems: { berry: 56, star: 59, lollipop: 63, lantern: 66 },
  },
  {
    id: 140,
    targetScore: 581,
    moves: 86,
    collectItems: { apple: 56, cherry: 59, flower: 63, berry: 67 },
  },
  {
    id: 141,
    targetScore: 585,
    moves: 86,
    collectItems: { donut: 56, leaf: 60, cookie: 63, apple: 67 },
  },
  {
    id: 142,
    targetScore: 588,
    moves: 86,
    collectItems: { star: 57, lollipop: 60, lantern: 64, donut: 67 },
  },
  {
    id: 143,
    targetScore: 592,
    moves: 86,
    collectItems: { cherry: 57, flower: 61, berry: 64, star: 68 },
  },
  {
    id: 144,
    targetScore: 595,
    moves: 86,
    collectItems: { leaf: 57, cookie: 61, apple: 64, cherry: 68 },
  },
  {
    id: 145,
    targetScore: 599,
    moves: 88,
    collectItems: { lollipop: 58, lantern: 61, donut: 65, leaf: 68 },
  },
  {
    id: 146,
    targetScore: 602,
    moves: 88,
    collectItems: { flower: 58, berry: 62, star: 65, lollipop: 69 },
  },
  {
    id: 147,
    targetScore: 606,
    moves: 88,
    collectItems: { cookie: 58, apple: 62, cherry: 65, flower: 69 },
  },
  {
    id: 148,
    targetScore: 609,
    moves: 88,
    collectItems: { lantern: 59, donut: 62, leaf: 66, cookie: 69 },
  },
  {
    id: 149,
    targetScore: 613,
    moves: 88,
    collectItems: { berry: 59, star: 63, lollipop: 66, lantern: 70 },
  },
  {
    id: 150,
    targetScore: 616,
    moves: 90,
    collectItems: { apple: 59, cherry: 63, flower: 67, berry: 70 },
  },
  {
    id: 151,
    targetScore: 620,
    moves: 90,
    collectItems: { donut: 60, leaf: 63, cookie: 67, apple: 70 },
  },
  {
    id: 152,
    targetScore: 623,
    moves: 90,
    collectItems: { star: 60, lollipop: 64, lantern: 67, donut: 71 },
  },
  {
    id: 153,
    targetScore: 627,
    moves: 90,
    collectItems: { cherry: 61, flower: 64, berry: 68, star: 71 },
  },
  {
    id: 154,
    targetScore: 630,
    moves: 90,
    collectItems: { leaf: 61, cookie: 64, apple: 68, cherry: 71 },
  },
  {
    id: 155,
    targetScore: 634,
    moves: 92,
    collectItems: { lollipop: 61, lantern: 65, donut: 68, leaf: 72 },
  },
  {
    id: 156,
    targetScore: 637,
    moves: 92,
    collectItems: { flower: 62, berry: 65, star: 69, lollipop: 72 },
  },
  {
    id: 157,
    targetScore: 641,
    moves: 92,
    collectItems: { cookie: 62, apple: 65, cherry: 69, flower: 72 },
  },
  {
    id: 158,
    targetScore: 644,
    moves: 92,
    collectItems: { lantern: 62, donut: 66, leaf: 69, cookie: 73 },
  },
  {
    id: 159,
    targetScore: 648,
    moves: 92,
    collectItems: { berry: 63, star: 66, lollipop: 70, lantern: 73 },
  },
  {
    id: 160,
    targetScore: 651,
    moves: 94,
    collectItems: { apple: 63, cherry: 67, flower: 70, berry: 74 },
  },
  {
    id: 161,
    targetScore: 655,
    moves: 94,
    collectItems: { donut: 63, leaf: 67, cookie: 70, apple: 74 },
  },
  {
    id: 162,
    targetScore: 658,
    moves: 94,
    collectItems: { star: 64, lollipop: 67, lantern: 71, donut: 74 },
  },
  {
    id: 163,
    targetScore: 662,
    moves: 94,
    collectItems: { cherry: 64, flower: 68, berry: 71, star: 75 },
  },
  {
    id: 164,
    targetScore: 665,
    moves: 94,
    collectItems: { leaf: 64, cookie: 68, apple: 71, cherry: 75 },
  },
  {
    id: 165,
    targetScore: 669,
    moves: 96,
    collectItems: { lollipop: 65, lantern: 68, donut: 72, leaf: 75 },
  },
  {
    id: 166,
    targetScore: 672,
    moves: 96,
    collectItems: { flower: 65, berry: 69, star: 72, lollipop: 76 },
  },
  {
    id: 167,
    targetScore: 676,
    moves: 96,
    collectItems: { cookie: 65, apple: 69, cherry: 72, flower: 76 },
  },
  {
    id: 168,
    targetScore: 679,
    moves: 96,
    collectItems: { lantern: 66, donut: 69, leaf: 73, cookie: 76 },
  },
  {
    id: 169,
    targetScore: 683,
    moves: 96,
    collectItems: { berry: 66, star: 70, lollipop: 73, lantern: 77 },
  },
  {
    id: 170,
    targetScore: 686,
    moves: 98,
    collectItems: { apple: 67, cherry: 70, flower: 74, berry: 77 },
  },
  {
    id: 171,
    targetScore: 690,
    moves: 98,
    collectItems: { donut: 67, leaf: 70, cookie: 74, apple: 77 },
  },
  {
    id: 172,
    targetScore: 693,
    moves: 98,
    collectItems: { star: 67, lollipop: 71, lantern: 74, donut: 78 },
  },
  {
    id: 173,
    targetScore: 697,
    moves: 98,
    collectItems: { cherry: 68, flower: 71, berry: 75, star: 78 },
  },
  {
    id: 174,
    targetScore: 700,
    moves: 98,
    collectItems: { leaf: 68, cookie: 71, apple: 75, cherry: 78 },
  },
  {
    id: 175,
    targetScore: 704,
    moves: 100,
    collectItems: { lollipop: 68, lantern: 72, donut: 75, leaf: 79 },
  },
  {
    id: 176,
    targetScore: 707,
    moves: 100,
    collectItems: { flower: 69, berry: 72, star: 76, lollipop: 79 },
  },
  {
    id: 177,
    targetScore: 711,
    moves: 100,
    collectItems: { cookie: 69, apple: 72, cherry: 76, flower: 79 },
  },
  {
    id: 178,
    targetScore: 714,
    moves: 100,
    collectItems: { lantern: 69, donut: 73, leaf: 76, cookie: 80 },
  },
  {
    id: 179,
    targetScore: 718,
    moves: 100,
    collectItems: { berry: 70, star: 73, lollipop: 77, lantern: 80 },
  },
  {
    id: 180,
    targetScore: 721,
    moves: 102,
    collectItems: { apple: 70, cherry: 74, flower: 77, berry: 81 },
  },
  {
    id: 181,
    targetScore: 725,
    moves: 102,
    collectItems: { donut: 70, leaf: 74, cookie: 77, apple: 81 },
  },
  {
    id: 182,
    targetScore: 728,
    moves: 102,
    collectItems: { star: 71, lollipop: 74, lantern: 78, donut: 81 },
  },
  {
    id: 183,
    targetScore: 732,
    moves: 102,
    collectItems: { cherry: 71, flower: 75, berry: 78, star: 82 },
  },
  {
    id: 184,
    targetScore: 735,
    moves: 102,
    collectItems: { leaf: 71, cookie: 75, apple: 78, cherry: 82 },
  },
  {
    id: 185,
    targetScore: 739,
    moves: 104,
    collectItems: { lollipop: 72, lantern: 75, donut: 79, leaf: 82 },
  },
  {
    id: 186,
    targetScore: 742,
    moves: 104,
    collectItems: { flower: 72, berry: 76, star: 79, lollipop: 83 },
  },
  {
    id: 187,
    targetScore: 746,
    moves: 104,
    collectItems: { cookie: 72, apple: 76, cherry: 79, flower: 83 },
  },
  {
    id: 188,
    targetScore: 749,
    moves: 104,
    collectItems: { lantern: 73, donut: 76, leaf: 80, cookie: 83 },
  },
  {
    id: 189,
    targetScore: 753,
    moves: 104,
    collectItems: { berry: 73, star: 77, lollipop: 80, lantern: 84 },
  },
  {
    id: 190,
    targetScore: 756,
    moves: 106,
    collectItems: { apple: 74, cherry: 77, flower: 81, berry: 84 },
  },
  {
    id: 191,
    targetScore: 760,
    moves: 106,
    collectItems: { donut: 74, leaf: 77, cookie: 81, apple: 84 },
  },
  {
    id: 192,
    targetScore: 763,
    moves: 106,
    collectItems: { star: 74, lollipop: 78, lantern: 81, donut: 85 },
  },
  {
    id: 193,
    targetScore: 767,
    moves: 106,
    collectItems: { cherry: 75, flower: 78, berry: 82, star: 85 },
  },
  {
    id: 194,
    targetScore: 770,
    moves: 106,
    collectItems: { leaf: 75, cookie: 78, apple: 82, cherry: 85 },
  },
  {
    id: 195,
    targetScore: 774,
    moves: 108,
    collectItems: { lollipop: 75, lantern: 79, donut: 82, leaf: 86 },
  },
  {
    id: 196,
    targetScore: 777,
    moves: 108,
    collectItems: { flower: 76, berry: 79, star: 83, lollipop: 86 },
  },
  {
    id: 197,
    targetScore: 781,
    moves: 108,
    collectItems: { cookie: 76, apple: 79, cherry: 83, flower: 86 },
  },
  {
    id: 198,
    targetScore: 784,
    moves: 108,
    collectItems: { lantern: 76, donut: 80, leaf: 83, cookie: 87 },
  },
  {
    id: 199,
    targetScore: 788,
    moves: 108,
    collectItems: { berry: 77, star: 80, lollipop: 84, lantern: 87 },
  },
  {
    id: 200,
    targetScore: 791,
    moves: 110,
    collectItems: { apple: 77, cherry: 81, flower: 84, berry: 88 },
  },
  {
    id: 201,
    targetScore: 795,
    moves: 110,
    collectItems: { donut: 77, leaf: 81, cookie: 84, apple: 88 },
  },
  {
    id: 202,
    targetScore: 798,
    moves: 110,
    collectItems: { star: 78, lollipop: 81, lantern: 85, donut: 88 },
  },
  {
    id: 203,
    targetScore: 802,
    moves: 110,
    collectItems: { cherry: 78, flower: 82, berry: 85, star: 89 },
  },
  {
    id: 204,
    targetScore: 805,
    moves: 110,
    collectItems: { leaf: 78, cookie: 82, apple: 85, cherry: 89 },
  },
  {
    id: 205,
    targetScore: 809,
    moves: 112,
    collectItems: { lollipop: 79, lantern: 82, donut: 86, leaf: 89 },
  },
  {
    id: 206,
    targetScore: 813,
    moves: 112,
    collectItems: { flower: 79, berry: 83, star: 86, lollipop: 90 },
  },
  {
    id: 207,
    targetScore: 816,
    moves: 112,
    collectItems: { cookie: 79, apple: 83, cherry: 86, flower: 90 },
  },
  {
    id: 208,
    targetScore: 820,
    moves: 112,
    collectItems: { lantern: 80, donut: 83, leaf: 87, cookie: 90 },
  },
  {
    id: 209,
    targetScore: 823,
    moves: 112,
    collectItems: { berry: 80, star: 84, lollipop: 87, lantern: 91 },
  },
  {
    id: 210,
    targetScore: 827,
    moves: 114,
    collectItems: { apple: 81, cherry: 84, flower: 88, berry: 91 },
  },
  {
    id: 211,
    targetScore: 830,
    moves: 114,
    collectItems: { donut: 81, leaf: 84, cookie: 88, apple: 91 },
  },
  {
    id: 212,
    targetScore: 834,
    moves: 114,
    collectItems: { star: 81, lollipop: 85, lantern: 88, donut: 92 },
  },
  {
    id: 213,
    targetScore: 837,
    moves: 114,
    collectItems: { cherry: 82, flower: 85, berry: 89, star: 92 },
  },
  {
    id: 214,
    targetScore: 841,
    moves: 114,
    collectItems: { leaf: 82, cookie: 85, apple: 89, cherry: 92 },
  },
  {
    id: 215,
    targetScore: 844,
    moves: 116,
    collectItems: { lollipop: 82, lantern: 86, donut: 89, leaf: 93 },
  },
];

export const LEVELS: LevelConfig[] = BASE_LEVELS.map((level) =>
  level.id > 5
    ? {
        ...level,
        collectItems: scaleCollectItems(level.collectItems),
      }
    : level,
);
