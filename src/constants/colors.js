export const CATEGORY_COLORS = [
  '#FF3B3B', // Sharp Red
  '#C94FD6', // Sharp Magenta
  '#1DA1C1', // Sharp Blue
  '#F4C542', // Sharp Yellow
  '#7D3CB5', // Sharp Purple
  '#FF7A00', // Sharp Orange
  '#FF66D9', // Sharp Light Pink
  '#2E86FF', // Sharp Azure
  '#4B00C9', // Sharp Indigo
  '#C97C7C', // Sharp Pink
  '#5DD39E', // Sharp Green
];

export const CATEGORY_BG_COLORS = [
  'rgba(255, 220, 220, 1)', // Ultra Light Red
  'rgba(248, 235, 249, 1)', // Ultra Light Magenta
  'rgba(220, 240, 248, 1)', // Ultra Light Blue
  'rgba(255, 248, 230, 1)', // Ultra Light Yellow
  'rgba(235, 225, 245, 1)', // Ultra Light Purple
  'rgba(255, 235, 215, 1)', // Ultra Light Orange
  'rgba(255, 235, 250, 1)', // Ultra Light Pink
  'rgba(225, 240, 255, 1)', // Ultra Light Azure
  'rgba(225, 220, 248, 1)', // Ultra Light Indigo
  'rgba(248, 235, 235, 1)', // Ultra Light Pink
  'rgba(235, 250, 245, 1)', // Ultra Light Green
];

/**
 * Returns a color from the CATEGORY_COLORS array based on the index.
 * @param {number} index
 * @returns {string}
 */
export const getCategoryColor = (index) => {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
};

export const getCategoryBGColor = (index) => {
  return CATEGORY_BG_COLORS[index % CATEGORY_COLORS.length];
};
