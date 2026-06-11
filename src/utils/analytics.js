/**
 * Facebook Ads Event Tracking Utility
 * This utility handles both Meta Pixel (Web) and Native App Events.
 */

import { Capacitor } from '@capacitor/core';
import { FacebookLogin } from 'capacitor-facebook-login';
import { setScreen as setFirebaseScreen, trackEvent as logFirebaseEvent } from './firebaseAnalytics';

const FACEBOOK_APP_ID = '1925390955005187';
let isAnalyticsInitialized = false;

// Standard Facebook Event Names
export const FB_EVENTS = {
  VIEW_CONTENT: 'ViewContent',
  SEARCH: 'Search',
  START_TRIAL: 'StartTrial',
  SUBSCRIBE: 'Subscribe',
  COMPLETE_REGISTRATION: 'CompleteRegistration',
  LEVEL_ACHIEVED: 'fb_mobile_level_achieved',
  ACHIEVEMENT_UNLOCKED: 'fb_mobile_achievement_unlocked',
  SPENT_CREDITS: 'fb_mobile_spent_credits',
  AD_CLICK: 'AdClick',
  AD_IMPRESSION: 'AdImpression',
};

// Custom App Events
export const APP_EVENTS = {
  EXERCISE_START: 'ExerciseStart',
  EXERCISE_COMPLETE: 'ExerciseComplete',
  STAR_EARNED: 'StarEarned',
  FEATURE_UNLOCK_ATTEMPT: 'FeatureUnlockAttempt',
  FEATURE_UNLOCKED: 'FeatureUnlocked',
  AD_IMPRESSION: 'AdImpression',
  COLOR_CHANGE: 'ColorChange',
  BRUSH_CHANGE: 'BrushChange',
  BRUSH_SIZE_CHANGE: 'BrushSizeChange',
  ICON_SELECTION: 'IconSelection',
  UNDO_ACTION: 'UndoAction',
  CLEAR_CANVAS: 'ClearCanvas',
  DRAWING_START: 'DrawingStart',
  SUCCESS_MODAL_SHOW: 'SuccessModalShow',
};

/**
 * Initialize Analytics
 */
export const initAnalytics = () => {
  if (isAnalyticsInitialized) {
    return;
  }

  const platform = Capacitor.getPlatform();
  isAnalyticsInitialized = true;

  if (platform === 'web') {
    console.log('Analytics: Initializing Meta Pixel for Web');
    // Meta Pixel is usually initialized in index.html
  } else {
    console.log('Analytics: Initializing App Events for Native');

    FacebookLogin.initialize({ appId: FACEBOOK_APP_ID })
      .then(() => FacebookLogin.setAutoLogAppEventsEnabled({ enabled: true }))
      .then(() => {
        // This app is configured as a kids app, so keep advertiser ID collection disabled.
        return FacebookLogin.setAdvertiserIDCollectionEnabled({ enabled: false });
      })
      .catch((error) => {
        console.error('Facebook native analytics initialization failed:', error);
      });
  }
};

/**
 * Track Screen View
 * @param {string} screenName 
 */
export const setScreen = (screenName) => {
  // Track in Firebase
  setFirebaseScreen(screenName).catch((err) =>
    console.error('Firebase screen tracking failed:', err),
  );

  logEvent(APP_EVENTS.SCREEN_VIEW, {
    screen_name: screenName,
  });

  // Also log as standard ViewContent for Facebook
  logEvent(FB_EVENTS.VIEW_CONTENT, {
    content_name: screenName,
    content_category: 'Screen',
  });
};

/**
 * Log an Event to both Facebook and Firebase
 * @param {string} eventName - Standard or Custom event name
 * @param {object} params - Additional parameters for the event
 */
export const logEvent = (eventName, params = {}) => {
  try {
    const platform = Capacitor.getPlatform();

    // Log to Firebase
    logFirebaseEvent(eventName, params).catch((err) =>
      console.error(`Firebase event tracking failed for "${eventName}":`, err),
    );

    // Log to console for debugging
    if (import.meta.env.DEV || import.meta.env.VITE_ADMOB_TEST_MODE === 'true') {
      console.log(`[Analytics Event]: ${eventName}`, params);
    }

    if (platform === 'web') {
      if (window.fbq) {
        window.fbq('track', eventName, params);
      }
    } else {
      FacebookLogin.logEvent({ eventName }).catch((error) => {
        console.error(`Failed to log native Facebook event "${eventName}":`, error);
      });
    }
  } catch (error) {
    console.error('Failed to log analytics event:', error);
  }
};

/**
 * Helper: Track Exercise Start
 */
export const trackExerciseStart = (operator, difficulty) => {
  logEvent(APP_EVENTS.EXERCISE_START, {
    content_name: operator,
    content_category: 'Exercise',
    difficulty: difficulty,
  });
};

/**
 * Helper: Track Exercise Completion
 */
export const trackExerciseComplete = (operator, difficulty, score) => {
  logEvent(APP_EVENTS.EXERCISE_COMPLETE, {
    content_name: operator,
    difficulty: difficulty,
    value: score,
    currency: 'STAR',
  });

  // Also log standard level achieved for Facebook
  logEvent(FB_EVENTS.LEVEL_ACHIEVED, {
    fb_level: `${operator}_${difficulty}`,
    score: score,
  });
};

/**
 * Helper: Track Star Earned
 */
export const trackStarsEarned = (amount, source) => {
  logEvent(APP_EVENTS.STAR_EARNED, {
    value: amount,
    content_id: source,
  });
};

/**
 * Helper: Track Feature Unlock
 */
export const trackFeatureUnlocked = (featureName, cost) => {
  logEvent(APP_EVENTS.FEATURE_UNLOCKED, {
    content_name: featureName,
    value: cost,
    currency: 'STAR',
  });

  logEvent(FB_EVENTS.SPENT_CREDITS, {
    fb_content_id: featureName,
    fb_value_to_sum: cost,
  });
};

/**
 * Helper: Track Ad Impression
 */
export const trackAdImpression = (adType, adPlacement) => {
  logEvent(FB_EVENTS.AD_IMPRESSION, {
    ad_type: adType,
    placement: adPlacement,
  });
};

/**
 * Helper: Track Color Change
 */
export const trackColorChange = (color, category) => {
  logEvent(APP_EVENTS.COLOR_CHANGE, {
    color,
    category,
  });
};

/**
 * Helper: Track Brush Change
 */
export const trackBrushChange = (brushType, category) => {
  logEvent(APP_EVENTS.BRUSH_CHANGE, {
    brush_type: brushType,
    category,
  });
};

/**
 * Helper: Track Brush Size Change
 */
export const trackBrushSizeChange = (size, category) => {
  logEvent(APP_EVENTS.BRUSH_SIZE_CHANGE, {
    size,
    category,
  });
};

/**
 * Helper: Track Icon Selection
 */
export const trackIconSelection = (iconName, category) => {
  logEvent(APP_EVENTS.ICON_SELECTION, {
    icon_name: iconName,
    category,
  });
};

/**
 * Helper: Track Undo Action
 */
export const trackUndoAction = (category) => {
  logEvent(APP_EVENTS.UNDO_ACTION, {
    category,
  });
};

/**
 * Helper: Track Clear Canvas
 */
export const trackClearCanvas = (category) => {
  logEvent(APP_EVENTS.CLEAR_CANVAS, {
    category,
  });
};

/**
 * Helper: Track Drawing Start
 */
export const trackDrawingStart = (category) => {
  logEvent(APP_EVENTS.DRAWING_START, {
    category,
  });
};

/**
 * Helper: Track Success Modal Show
 */
export const trackSuccessModalShow = (category, starsWon = 1) => {
  logEvent(APP_EVENTS.SUCCESS_MODAL_SHOW, {
    category,
    stars_won: starsWon,
  });
};
