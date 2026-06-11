import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

export const trackEvent = async (eventName, params = {}) => {
  try {
    await FirebaseAnalytics.logEvent({
      name: eventName,
      params,
    });
  } catch (e) {
    console.log('Analytics Error:', e);
  }
};

export const setScreen = async (screenName) => {
  try {
    await FirebaseAnalytics.setCurrentScreen({
      screenName,
    });
  } catch (e) {
    console.log('Screen Tracking Error:', e);
  }
};
