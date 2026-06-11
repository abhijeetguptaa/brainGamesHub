import { useState, useEffect, Suspense, lazy, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import './index.css'; // Tailwind first
import './App.scss';
import { useTranslation } from 'react-i18next';
import { App as CapacitorApp } from '@capacitor/app';
import { Toast } from '@capacitor/toast';
import WelcomeScreen from './components/WelcomeScreen';
import { STORAGE_KEYS } from './constants/appConstants';
import { getPlayStoreAgeSignal, isKnownMinor } from './services/ageVerification';
import useRetentionStore from './store/useRetentionStore';
import { getCategoryBGColor, getCategoryColor } from './constants/colors';
import { setScreen } from './utils/analytics';
import { trackEvent } from './utils/firebaseAnalytics';

const loadWordSearch = () => import('./components/WordSearch.jsx');
const WordSearch = lazy(loadWordSearch);
const loadWordSearchDifficultySelector = () =>
  import('./components/WordSearchDifficultySelector.jsx');
const WordSearchDifficultySelector = lazy(loadWordSearchDifficultySelector);
const loadSudoku = () => import('./components/Sudoku.jsx');
const Sudoku = lazy(loadSudoku);
const loadSudokuDifficultySelector = () => import('./components/SudokuDifficultySelector.jsx');
const SudokuDifficultySelector = lazy(loadSudokuDifficultySelector);
const loadTicTacToe = () => import('./components/TicTacToe.jsx');
const TicTacToe = lazy(loadTicTacToe);
const loadSettings = () => import('./components/Settings.jsx');
const Settings = lazy(loadSettings);
const loadMemoryMatch = () => import('./components/MemoryMatch.jsx');
const MemoryMatch = lazy(loadMemoryMatch);
const loadGridMatch = () => import('./components/GridMatch.jsx');
const GridMatch = lazy(loadGridMatch);
const loadSpinWheel = () => import('./components/SpinWheel.tsx');
const SpinWheel = lazy(loadSpinWheel);
const loadSmartMatch = () => import('./components/SmartMatch.tsx');
const SmartMatch = lazy(loadSmartMatch);
const loadMentalMath = () => import('./components/MentalMath.tsx');
const MentalMath = lazy(loadMentalMath);
const loadStickerBook = () => import('./components/StickerBook.tsx');
const StickerBook = lazy(loadStickerBook);
const loadTileConnect = () => import('./components/TileConnect.tsx');
const TileConnect = lazy(loadTileConnect);
const loadUnlockModal = () => import('./components/UnlockModal.tsx');
const UnlockModal = lazy(loadUnlockModal);
const DailyBonusModal = lazy(() => import('./components/DailyBonusModal'));
const Stars = lazy(() => import('./components/Stars'));

const USER_NAME_KEY = STORAGE_KEYS.USER_NAME;
const NOTIFICATION_PROMPT_KEY = 'notifications_prompted_v2';

let soundUtilsPromise;
let bgMusicManagerPromise;
let admobPromise;
let analyticsPromise;
let notificationsPromise;

const loadSoundUtils = () => (soundUtilsPromise ??= import('./utils/soundUtils'));
const loadBgMusicManager = () => (bgMusicManagerPromise ??= import('./utils/bgMusicManager'));
const loadAdMob = () => (admobPromise ??= import('@/utils/admob'));
const loadAnalytics = () => (analyticsPromise ??= import('./utils/analytics'));
const loadNotifications = () => (notificationsPromise ??= import('./utils/notifications'));

function scheduleAfterFirstPaint(task, delay = 0) {
  let timeoutId;
  let frameId;
  let idleId;

  const run = () => {
    timeoutId = window.setTimeout(task, delay);
  };

  frameId = window.requestAnimationFrame(() => {
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(run, { timeout: 2500 });
    } else {
      run();
    }
  });

  return () => {
    window.cancelAnimationFrame(frameId);
    if (typeof idleId === 'number' && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(idleId);
    }
    window.clearTimeout(timeoutId);
  };
}

function Home() {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('GamesCategory');
  }, []);

  const subjects = [
    {
      to: '/memory-match',
      label: t('memoryMatch.label'),
      src: '/memoryMatch.webp',
      title: t('memoryMatch.title'),
    },
    {
      to: '/sudoku',
      label: t('sudoku.label'),
      src: '/sudoku.webp',
      title: t('sudoku.title'),
    },
    {
      to: '/tictactoe',
      label: t('ticTacToe.label'),
      src: '/tic_tac_toe.webp',
      title: t('ticTacToe.title'),
    },
    {
      to: '/gridMatch',
      label: t('gridMatch.label'),
      src: '/gridMatch.webp',
      title: t('gridMatch.title'),
    },
    {
      to: '/tile-connect',
      label: t('tileConnect.label', 'Tile Connect'),
      src: '/tile-connect.webp',
      title: t('tileConnect.title', 'Tile Connect'),
    },

    {
      to: '/spin-wheel',
      label: t('spinWheel.label'),
      src: '/spinWheel.webp',
      title: t('spinWheel.title'),
    },
    {
      to: '/smart-match',
      label: t('smartMatch.label'),
      src: '/smartMatch.webp',
      title: t('smartMatch.title'),
    },
    {
      to: '/wordsearch',
      label: t('wordSearch.label'),
      src: '/match_the_word.webp',
      title: t('wordSearch.title'),
    },
    {
      to: '/mental-math',
      label: t('mentalMath.label'),
      src: '/mental-math.webp',
      title: t('mentalMath.title'),
    },
    {
      to: '/stickers',
      label: t('stickers.label'),
      src: '/stickers.webp',
      title: t('stickers.title'),
    },
  ];

  return (
    <main className="landing-page" role="main">
      <nav
        className="subject-selection games"
        role="navigation"
        aria-label={t('common.accessibility.subjectSelection')}
      >
        {subjects.map((subject, index) => (
          <Link
            to={subject.to}
            className="subject-icon-button"
            aria-label={subject.title}
            title={subject.title}
            key={subject.to}
            style={{
              '--card-color': getCategoryColor(index),
              '--bg-color': getCategoryBGColor(index),
              animationDelay: `${index * 0.05}s`,
            }}
          >
            <img className="subject-icon subject-icon--img" src={subject.src} alt={subject.label} />
            <div className="gameName">{subject.label}</div>
          </Link>
        ))}
      </nav>
    </main>
  );
}

export default function App() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [userName, setUserName] = useState(
    () => localStorage.getItem(USER_NAME_KEY) || t('common.defaultUserName'),
  );
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(() => {
    // Show once per session to keep branding visible but not annoying
    return sessionStorage.getItem(STORAGE_KEYS.WELCOME_SCREEN_SEEN) !== 'true';
  });
  const [isDeferredUiReady, setIsDeferredUiReady] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const lastBackPress = useRef(0);
  const isFirstRoute = useRef(true);
  const pathnameRef = useRef(location.pathname);
  const hasStartedExperience = useRef(false);
  const hasStartedDeferredServices = useRef(false);
  const hasScheduledNotificationPrompt = useRef(false);

  const { checkLogin } = useRetentionStore();

  pathnameRef.current = location.pathname;

  const maybePromptNotifications = useCallback(() => {
    if (
      hasScheduledNotificationPrompt.current ||
      localStorage.getItem(NOTIFICATION_PROMPT_KEY) === 'true'
    ) {
      return;
    }

    const { totalDaysPlayed } = useRetentionStore.getState();
    if (totalDaysPlayed < 3) {
      return;
    }

    hasScheduledNotificationPrompt.current = true;

    window.setTimeout(async () => {
      try {
        const { requestNotificationPermission, scheduleDailyReminder } = await loadNotifications();
        const granted = await requestNotificationPermission();
        localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');

        if (granted) {
          await scheduleDailyReminder(t);
        }
      } catch (err) {
        console.error('Notification error:', err);
      }
    }, 10000);
  }, [t]);

  const startDeferredServices = useCallback(() => {
    if (hasStartedDeferredServices.current) {
      return;
    }

    hasStartedDeferredServices.current = true;

    // Preload critical Home screen icons
    scheduleAfterFirstPaint(() => {
      const criticalIcons = [
        'memoryMatch',
        'sudoku',
        'tic_tac_toe',
        'gridMatch',
        'tile-connect',
        'spinWheel',
        'smartMatch',
        'match_the_word',
        'mental-math',
        'stickers',
      ];
      criticalIcons.forEach((icon) => {
        const img = new Image();
        img.src = `/${icon}.webp`;
      });
    }, 2500);

    scheduleAfterFirstPaint(() => {
      loadAnalytics()
        .then(({ initAnalytics }) => initAnalytics())
        .catch((err) => console.error('Analytics init failed:', err));
    }, 5000);

    scheduleAfterFirstPaint(() => {
      loadAdMob()
        .then(async ({ initAdMob }) => {
          await initAdMob();
        })
        .catch((err) => console.error('AdMob init failed:', err));
    }, 3000);
  }, []);

  const handlePlay = async () => {
    sessionStorage.setItem(STORAGE_KEYS.WELCOME_SCREEN_SEEN, 'true');
    setShowWelcomeScreen(false);
    hasStartedExperience.current = true;
    startDeferredServices();

    // Texas SB 2420 compliance: Fetch age signal
    if (Capacitor.getPlatform() === 'android') {
      getPlayStoreAgeSignal().then((result) => {
        if (result) {
          console.log('Age Signal Received:', result);
          if (isKnownMinor(result)) {
            console.log('User identified as minor for Texas compliance.');
            // Future: Implement specific restrictions or parental consent flows here
          }
        }
      });
    }

    const [{ unlockAudio, initTTS, speakText }, { playMusic }] = await Promise.all([
      loadSoundUtils(),
      loadBgMusicManager(),
    ]);
    await unlockAudio();
    await initTTS();
    speakText(t('welcomeScreen.message'));
    playMusic();
    maybePromptNotifications();
  };

  const handleBackClick = useCallback(() => {
    loadSoundUtils().then(({ stopAllTones, stopSpeech }) => {
      stopAllTones();
      stopSpeech();
    });

    const segments = location.pathname.split('/').filter(Boolean);

    if (segments.length <= 1) {
      navigate('/', { replace: true });
      return;
    }

    const parentRoute = `/${segments.slice(0, -1).join('/')}`;
    navigate(parentRoute, { replace: true });
  }, [navigate, location.pathname]);

  const handleNameSubmit = useCallback((name) => {
    localStorage.setItem(USER_NAME_KEY, name);
    setUserName(name);
  }, []);

  // INITIAL LOAD & GLOBAL EVENT LISTENERS
  useEffect(() => {
    trackEvent('app_open');

    // Start loading services as soon as app is visible (during Welcome screen)
    startDeferredServices();

    const cancelDeferredUi = scheduleAfterFirstPaint(() => {
      setIsDeferredUiReady(true);
    }, 800);

    const cancelRetentionCheck = scheduleAfterFirstPaint(() => {
      checkLogin();
    }, 300);

    const handleFirstClickUnlock = () => {
      startDeferredServices();
      loadSoundUtils().then(({ unlockAudio }) => unlockAudio());
    };
    document.addEventListener('click', handleFirstClickUnlock, { once: true });

    const handleVolumeChange = (e) => {
      loadBgMusicManager().then(({ setMusicVolume }) => {
        setMusicVolume(e.detail.volume);
      });
    };
    window.addEventListener('volumechange', handleVolumeChange);

    const handlePause = () => {
      if (!hasStartedExperience.current) return;
      Promise.all([loadSoundUtils(), loadBgMusicManager()]).then(
        ([{ stopSpeech, stopAllTones }, { pauseMusic }]) => {
          stopSpeech();
          stopAllTones();
          pauseMusic();
        },
      );
    };
    const handleVisibilityChange = () => {
      if (document.hidden) handlePause();
    };
    document.addEventListener('pause', handlePause, false);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelDeferredUi();
      cancelRetentionCheck();
      document.removeEventListener('click', handleFirstClickUnlock);
      window.removeEventListener('volumechange', handleVolumeChange);
      document.removeEventListener('pause', handlePause);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkLogin, startDeferredServices]);

  // CAPACITOR NATIVE LISTENERS (App State & Back Button)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const stateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        startDeferredServices();
      }

      if (!hasStartedExperience.current) return;

      Promise.all([loadSoundUtils(), loadBgMusicManager()]).then(
        ([{ stopAllTones, stopSpeech }, { playMusic, pauseMusic }]) => {
          if (isActive) {
            playMusic();
          } else {
            pauseMusic();
            stopAllTones();
            stopSpeech();
          }
        },
      );
    });

    const backListener = CapacitorApp.addListener('backButton', async () => {
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return;
      }

      const [{ stopSpeech, stopAllTones }, { pauseMusic }] = await Promise.all([
        loadSoundUtils(),
        loadBgMusicManager(),
      ]);
      stopSpeech();
      stopAllTones();
      pauseMusic();

      const segments = pathnameRef.current.split('/').filter(Boolean);

      if (segments.length <= 1) {
        if (pathnameRef.current !== '/') {
          navigate('/', { replace: true });
          return;
        }
      } else {
        const parentRoute = `/${segments.slice(0, -1).join('/')}`;
        navigate(parentRoute, { replace: true });
        return;
      }

      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        CapacitorApp.exitApp();
      } else {
        lastBackPress.current = now;
        Toast.show({
          text: t('app.pressBackToExit'),
          duration: 'short',
        });
      }
    });

    return () => {
      stateListener.then((l) => l.remove());
      backListener.then((l) => l.remove());
    };
  }, [navigate, t, isSettingsOpen, startDeferredServices]);

  // CLICK SOUND ON ROUTE CHANGE
  useEffect(() => {
    if (isFirstRoute.current) {
      isFirstRoute.current = false;
      return;
    }
    loadSoundUtils().then(({ playClickSound }) => playClickSound());
  }, [location.pathname]);

  return (
    <div className="app app-wrapper" role="application">
      <Suspense fallback={null}>{!showWelcomeScreen && <Stars />}</Suspense>
      <Suspense fallback={<div>{t('common.loading')}</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/wordsearch" element={<WordSearchDifficultySelector />} />
          <Route path="/wordsearch/:difficulty" element={<WordSearch />} />
          <Route path="/mental-math" element={<MentalMath />} />
          <Route path="/mental-math/:difficulty" element={<MentalMath />} />
          <Route path="/sudoku" element={<SudokuDifficultySelector />} />
          <Route path="/sudoku/:difficulty" element={<Sudoku />} />
          <Route path="/tictactoe" element={<TicTacToe userName={userName} />} />
          <Route path="/memory-match" element={<MemoryMatch />} />
          <Route path="/tile-connect" element={<TileConnect />} />
          <Route path="/gridMatch" element={<GridMatch />} />
          <Route path="/spin-wheel" element={<SpinWheel />} />
          <Route path="/smart-match" element={<SmartMatch />} />
          <Route path="/stickers" element={<StickerBook />} />
        </Routes>
      </Suspense>

      {location.pathname === '/' ? (
        <button className="nav-button nav-button--setting" onClick={() => setIsSettingsOpen(true)}>
          <img src="/setting.webp" alt={t('settings.title')} />
        </button>
      ) : (
        <button className="nav-button nav-button--home" onClick={handleBackClick}>
          <span className="homeButton">⇦</span>
        </button>
      )}

      <Suspense fallback={null}>
        {isDeferredUiReady && <UnlockModal />}
        {isDeferredUiReady && !showWelcomeScreen && <DailyBonusModal />}
        {isSettingsOpen && (
          <Settings
            userName={userName}
            onNameSubmit={handleNameSubmit}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </Suspense>

      {showWelcomeScreen && <WelcomeScreen onPlay={handlePlay} />}
    </div>
  );
}
