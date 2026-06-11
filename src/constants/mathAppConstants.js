import { FILE_SETTINGS, UI_MODES, APP_TEXT } from './appConstants';

// Math Application Constants
// All static values and configuration for math exercises and PDF generation

// PDF Configuration
export const PDF_CONFIG = {
  // Page dimensions (A4 in mm)
  PAGE_WIDTH: 210,
  PAGE_HEIGHT: 297,

  // Margins and spacing
  MARGIN: 15,
  BOTTOM_MARGIN: 20,

  // Font sizes
  TITLE_FONT_SIZE: 16,
  SUBTITLE_FONT_SIZE: 14,
  CONTENT_FONT_SIZE: 13,
  OPERATOR_FONT_SIZE: 15,
  STUDENT_INFO_FONT_SIZE: 10,

  // Student info line configuration
  STUDENT_INFO: {
    LINE_LENGTH: 40,
    FIELD_SPACING: 60,
    NAME_OFFSET: 15,
    DATE_OFFSET: 12,
    CLASS_OFFSET: 13,
  },

  // Watermark configuration
  WATERMARK: {
    OPACITY: 0.15,
    MARGIN_PERCENT: 0.1,
    DPI_CONVERSION: 2.83, // Convert mm to pixels at 72 DPI
    BACKGROUND_OPACITY: 0.1,
  },
};

// Grid layouts for different exercise types
export const GRID_LAYOUTS = {
  SET1_OPS: {
    COLS: 4,
    ROWS: 6,
    BOX_WIDTH: 45,
    BOX_HEIGHT: 40,
    PROBLEMS_COUNT: 24,
  },
  SET2_OPS: {
    COLS: 2,
    ROWS: 24,
    BOX_WIDTH: 85,
    BOX_HEIGHT: 10,
    PROBLEMS_COUNT: 48,
  },
};

// Exercise positioning
export const EXERCISE_POSITIONING = {
  TITLE_Y: 15,
  CONTENT_START_Y: 25,
  NUMBER_Y_OFFSET: 14,
  OPERATOR_Y_OFFSET: 20,
  LINE_Y_OFFSET: 24,
  LINE_MARGIN: 6,
  TEXT_MARGIN: 3,
  OPERATOR_MARGIN: 1.4,
};

// File and sharing configuration
export const FILE_CONFIG = {
  DEFAULT_FILENAME: FILE_SETTINGS.DEFAULT_PDF_NAME,
  FILE_TYPE: FILE_SETTINGS.PDF_TYPE,
  SHARE_TITLE: FILE_SETTINGS.SHARE_TITLE,
  SHARE_TEXT: FILE_SETTINGS.SHARE_TEXT,
};

// UI Text and Labels
export const UI_TEXT = {
  STUDENT_LABELS: {
    NAME: APP_TEXT.LABELS.NAME,
    DATE: APP_TEXT.LABELS.DATE,
    CLASS: APP_TEXT.LABELS.CLASS,
  },
  BUTTON_LABELS: {
    SHARE_PDF: APP_TEXT.BUTTONS.SHARE_PDF,
    DOWNLOAD: 'Download', // mathApp uses "Download", appConstants uses "Download as File"
    HOME: APP_TEXT.BUTTONS.GO_HOME,
  },
  OPTION_LABELS: {
    OPERATION: APP_TEXT.LABELS.OPERATION,
    RANGE: APP_TEXT.LABELS.RANGE,
  },
  MODAL_MODES: UI_MODES,
  EMOJIS: APP_TEXT.EMOJIS,
};

// Error and warning messages
export const MESSAGES = {
  WATERMARK_FAILED: 'Failed to add watermark:',
  SHARING_NOT_SUPPORTED:
    'Sharing PDF is not supported on this device/browser. Please download and share manually.',
  CONTINUE_WITHOUT_WATERMARK: 'Continue without watermark',
};

// Drawing configuration
export const DRAWING_CONFIG = {
  LINE_WIDTH: 0.5,
  DRAW_COLOR: [0, 0, 0], // RGB for black
  FONT_WEIGHT: {
    NORMAL: 'normal',
    BOLD: 'bold',
  },
  TEXT_ALIGN: {
    LEFT: 'left',
    RIGHT: 'right',
    CENTER: 'center',
  },
  TEXT_BASELINE: {
    MIDDLE: 'middle',
  },
};

// Canvas and image processing
export const CANVAS_CONFIG = {
  CONTEXT_TYPE: '2d',
  IMAGE_FORMAT: 'image/png',
  CROSS_ORIGIN: 'anonymous',
};
