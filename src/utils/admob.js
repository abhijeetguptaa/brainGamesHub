import {
  AdMob,
  InterstitialAdPluginEvents,
  MaxAdContentRating,
  RewardAdPluginEvents,
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const INTERSTITIAL_ID = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID;
const REWARDED_ID = import.meta.env.VITE_ADMOB_REWARDED_ID;
const TEST_MODE = import.meta.env.VITE_ADMOB_TEST_MODE === 'true';
const REQUEST_NON_PERSONALIZED_ADS = true;

let isInitialized = false;
let interstitialLoaded = false;
let rewardedLoaded = false;
let isPreloadingInterstitial = false;
let isPreloadingRewarded = false;
let isShowingInterstitial = false;
let isShowingRewarded = false;

let lastAdTime = 0;
let lastRewardedTime = 0;
let preloadRetryCount = {
  interstitial: 0,
  rewarded: 0,
};

/**
 * Families policy safe limits
 */
const MIN_TIME_BETWEEN_ADS = 150 * 1000; // 2.5 minutes
export const MIN_TIME_BETWEEN_REWARDED = 60 * 1000; // 60 seconds cooldown for rewarded to prevent spam
const INITIAL_AD_DELAY = 60 * 1000; // 1 minute delay

export const getRewardedCooldown = () => {
  const now = Date.now();
  const elapsed = now - lastRewardedTime;
  if (elapsed < MIN_TIME_BETWEEN_REWARDED) {
    return Math.ceil((MIN_TIME_BETWEEN_REWARDED - elapsed) / 1000);
  }
  return 0;
};

export const isRewardedLoaded = () => rewardedLoaded;

const MAX_PRELOAD_RETRIES = 5;
const INTERSTITIAL_PROBABILITY = 0.6; // 60% chance to show an interstitial when requested

const GAME_LOAD_TIME = Date.now();
const isNative = () => Capacitor.isNativePlatform();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getBackoffDelay = (retryCount) =>
  Math.min(Math.pow(2, retryCount) * 2000 + Math.random() * 1000, 60000);

const isValidAdUnitId = (id) => typeof id === 'string' && /^ca-app-pub-\d{16}\/\d{10}$/.test(id);

const createAdError = (message, code) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const trackAdImpressionAsync = (adType, adPlacement) => {
  import('./analytics')
    .then(({ trackAdImpression }) => trackAdImpression(adType, adPlacement))
    .catch((error) => {
      if (import.meta.env.DEV) {
        console.error('Ad impression tracking failed:', error);
      }
    });
};

/**
 * Initialize AdMob
 */
export const initAdMob = async () => {
  if (!isNative() || isInitialized) return;
  console.log('AdMob Config');
  console.log('INTERSTITIAL_ID=', INTERSTITIAL_ID);
  console.log('REWARDED_ID=', REWARDED_ID);
  console.log('TEST_MODE=', TEST_MODE);
  try {
    if (import.meta.env.DEV || TEST_MODE) {
      console.log('AdMob Initializing with:', {
        testMode: TEST_MODE,
        interstitialId: INTERSTITIAL_ID,
        rewardedId: REWARDED_ID,
        envMode: import.meta.env.MODE,
      });
    }

    await AdMob.initialize({
      tagForChildDirectedTreatment: true,
      tagForUnderAgeOfConsent: true,
      maxAdContentRating: MaxAdContentRating.General,
      initializeForTesting: TEST_MODE,
    });

    isInitialized = true;

    console.log('AdMob initialized');
    // Preload after init
    warmAdCaches();
  } catch (err) {
    console.error('AdMob init failed:', err);
  }
};

export const warmAdCaches = async () => {
  if (!isNative()) return;

  if (!isInitialized) {
    await initAdMob();
    return;
  }

  preloadInterstitial();
  await delay(2000);
  preloadRewardedAd();
};

/**
 * Preload Interstitial
 */
export const preloadInterstitial = async () => {
  if (!isNative() || isPreloadingInterstitial) return;

  if (!isValidAdUnitId(INTERSTITIAL_ID)) {
    console.warn('Invalid interstitial id');
    return;
  }

  isPreloadingInterstitial = true;

  try {
    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_ID,
      isTesting: TEST_MODE,
      npa: REQUEST_NON_PERSONALIZED_ADS,
    });

    interstitialLoaded = true;
    preloadRetryCount.interstitial = 0;

    if (import.meta.env.DEV) {
      console.log('Interstitial preloaded');
    }
  } catch (err) {
    interstitialLoaded = false;
    console.error('Interstitial preload failed:', err);

    // Exponential backoff retry
    if (preloadRetryCount.interstitial < MAX_PRELOAD_RETRIES) {
      const retryDelay = getBackoffDelay(preloadRetryCount.interstitial);
      preloadRetryCount.interstitial++;
      console.log(`Retrying interstitial preload in ${retryDelay}ms...`);
      window.setTimeout(preloadInterstitial, retryDelay);
    }
  } finally {
    isPreloadingInterstitial = false;
  }
};

/**
 * Preload Rewarded Ad
 */
export const preloadRewardedAd = async () => {
  if (!isNative() || isPreloadingRewarded) return;

  if (!isValidAdUnitId(REWARDED_ID)) {
    console.warn('Invalid rewarded id');
    return;
  }

  isPreloadingRewarded = true;
  console.log('====================');
  console.log('REWARDED AD DEBUG');
  console.log('Rewarded ID:', REWARDED_ID);
  console.log('Test Mode:', TEST_MODE);
  console.log('Is Initialized:', isInitialized);
  console.log('====================');
  try {
    // alert('Rewarded ID = ' + REWARDED_ID + '\nTest Mode = ' + TEST_MODE);
    await AdMob.prepareRewardVideoAd({
      adId: REWARDED_ID,
      isTesting: TEST_MODE,
      npa: REQUEST_NON_PERSONALIZED_ADS,
    });

    rewardedLoaded = true;
    preloadRetryCount.rewarded = 0;

    if (import.meta.env.DEV) {
      console.log('Rewarded ad preloaded');
    }
  } catch (err) {
    rewardedLoaded = false;
    // alert('PRELOAD FAILED\n\n' + JSON.stringify(err, null, 2));
    console.error('Reward preload failed:', err);

    // Exponential backoff retry
    if (preloadRetryCount.rewarded < MAX_PRELOAD_RETRIES) {
      const retryDelay = getBackoffDelay(preloadRetryCount.rewarded);
      preloadRetryCount.rewarded++;
      console.log(`Retrying rewarded preload in ${retryDelay}ms...`);
      window.setTimeout(preloadRewardedAd, retryDelay);
    }
  } finally {
    isPreloadingRewarded = false;
  }
};

/**
 * Show Rewarded Ad
 */
export const showSafeRewarded = () => {
  return new Promise((resolve, reject) => {
    (async () => {
      if (!isNative()) {
        reject(createAdError('Not native platform', 'NOT_NATIVE_PLATFORM'));
        return;
      }

      if (isShowingRewarded) {
        reject(createAdError('Ad is already displaying', 'REWARDED_ALREADY_SHOWING'));
        return;
      }

      const now = Date.now();
      if (now - lastRewardedTime < MIN_TIME_BETWEEN_REWARDED) {
        reject(
          createAdError('Please wait a moment before watching another ad', 'REWARDED_COOLDOWN'),
        );
        return;
      }

      let rewarded = false;
      let settled = false;
      let dismissedListener, rewardListener, failedToShowListener;

      const cleanup = async () => {
        isShowingRewarded = false;
        dismissedListener?.remove();
        rewardListener?.remove();
        failedToShowListener?.remove();
      };

      const warmRewardedCache = () => {
        window.setTimeout(() => {
          preloadRewardedAd().catch((err) => {
            console.error('Reward preload failed:', err);
          });
        }, 5000);
      };

      const settle = async (callback) => {
        if (settled) return;
        settled = true;
        await cleanup();
        callback();
      };

      try {
        if (!isInitialized) await initAdMob();

        if (!rewardedLoaded) {
          await preloadRewardedAd();
        }

        if (!rewardedLoaded) {
          reject(
            createAdError(
              'Ad is not ready. Please try again in a few seconds.',
              'REWARDED_NOT_READY',
            ),
          );
          return;
        }

        isShowingRewarded = true;

        rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
          rewarded = true;
        });

        failedToShowListener = await AdMob.addListener(
          RewardAdPluginEvents.FailedToShow,
          async () => {
            await settle(() => {
              rewardedLoaded = false;
              warmRewardedCache();
              reject(createAdError('Rewarded ad failed to show', 'REWARDED_FAILED_TO_SHOW'));
            });
          },
        );

        dismissedListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, async () => {
          await settle(() => {
            rewardedLoaded = false;
            lastRewardedTime = Date.now();
            warmRewardedCache();

            if (rewarded) {
              resolve();
            } else {
              reject(createAdError('User closed ad before earning reward', 'REWARDED_NOT_EARNED'));
            }
          });
        });
        console.log('Showing Rewarded Ad');
        console.log('Rewarded ID:', REWARDED_ID);
        console.log('Rewarded Loaded:', rewardedLoaded);
        await AdMob.showRewardVideoAd();
        rewardedLoaded = false;
        trackAdImpressionAsync('Rewarded', 'RewardScreen');
      } catch (err) {
        await cleanup();
        rewardedLoaded = false;
        warmRewardedCache();
        reject(err);
      }
    })();
  });
};

/**
 * Show Interstitial (Families policy safe)
 */
export const showSafeInterstitial = async () => {
  if (!isNative() || isShowingInterstitial) return;

  if (!isValidAdUnitId(INTERSTITIAL_ID)) {
    if (import.meta.env.DEV) {
      console.warn('Skipping interstitial: invalid interstitial id');
    }
    return;
  }

  const now = Date.now();

  // Initial delay: Don't show ads in the first minute of game load
  if (now - GAME_LOAD_TIME < INITIAL_AD_DELAY) {
    if (import.meta.env.DEV) {
      console.log('Skipping interstitial: first minute of game load');
    }
    return;
  }

  // Rate limiting: Only show one interstitial every 2.5 minutes
  if (now - lastAdTime < MIN_TIME_BETWEEN_ADS) {
    if (import.meta.env.DEV) {
      console.log('Skipping interstitial: too soon since last ad');
    }
    return;
  }

  // Probability check: Only show ad based on INTERSTITIAL_PROBABILITY
  if (Math.random() > INTERSTITIAL_PROBABILITY) {
    if (import.meta.env.DEV) {
      console.log('Skipping interstitial: probability check failed');
    }
    return;
  }

  let dismissedListener;
  let failedToShowListener;

  const cleanup = async () => {
    isShowingInterstitial = false;
    dismissedListener?.remove();
    failedToShowListener?.remove();
  };

  try {
    if (!isInitialized) await initAdMob();

    if (!interstitialLoaded) {
      await preloadInterstitial();
    }

    if (!interstitialLoaded) {
      return;
    }

    isShowingInterstitial = true;

    dismissedListener = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, async () => {
      interstitialLoaded = false;
      lastAdTime = Date.now();
      await cleanup();
      window.setTimeout(() => {
        preloadInterstitial().catch((err) => console.error('Interstitial preload failed:', err));
      }, 5000);
    });

    failedToShowListener = await AdMob.addListener(
      InterstitialAdPluginEvents.FailedToShow,
      async () => {
        interstitialLoaded = false;
        await cleanup();
        window.setTimeout(() => {
          preloadInterstitial().catch((err) => console.error('Interstitial preload failed:', err));
        }, 5000);
      },
    );

    await AdMob.showInterstitial();

    interstitialLoaded = false;
    trackAdImpressionAsync('Interstitial', 'Transition');
  } catch (err) {
    console.error('Interstitial show failed:', err);
    await cleanup();
    interstitialLoaded = false;
    window.setTimeout(() => {
      preloadInterstitial().catch((preloadErr) =>
        console.error('Interstitial preload failed:', preloadErr),
      );
    }, 5000);
  }
};

/**
 * Legacy support
 */
export const showInterstitialAd = async () => {
  await showSafeInterstitial();
};
