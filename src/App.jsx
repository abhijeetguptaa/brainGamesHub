import { useState, useEffect, Suspense, lazy, useRef, useCallback, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import './index.css'; // Tailwind first
import './App.scss';
import { useTranslation } from 'react-i18next';
import { App as CapacitorApp } from '@capacitor/app';
import { Toast } from '@capacitor/toast';
import WelcomeScreen from './components/WelcomeScreen';
import { STORAGE_KEYS } from './constants/appConstants';
import { getPlayStoreAgeSignal, isKnownMinor } from './services/ageVerification';
import useRetentionStore from './store/useRetentionStore';
import { useLearningPathStore } from './store/useLearningPathStore';
import { getCategoryBGColor, getCategoryColor } from './constants/colors';
import { setScreen } from './utils/analytics';
import { trackEvent } from './utils/firebaseAnalytics';
import { exitLearningPathTask } from './utils/learningPathUtils';

const loadAlphabets = () => import('./components/Alphabets.tsx');
const Alphabets = lazy(loadAlphabets);
const loadTracingSelection = () => import('./components/TracingSelection.jsx');
const TracingSelection = lazy(loadTracingSelection);
const loadTracingGame = () => import('./components/TracingGame.tsx');
const TracingGame = lazy(loadTracingGame);
const loadWordSearch = () => import('./components/WordSearch.jsx');
const WordSearch = lazy(loadWordSearch);
const loadWordSearchDifficultySelector = () =>
  import('./components/WordSearchDifficultySelector.jsx');
const WordSearchDifficultySelector = lazy(loadWordSearchDifficultySelector);
const loadSentenceScramble = () => import('./components/SentenceScramble.tsx');
const SentenceScramble = lazy(loadSentenceScramble);
const loadSentenceScrambleDifficultySelector = () =>
  import('./components/SentenceScrambleDifficultySelector.jsx');
const SentenceScrambleDifficultySelector = lazy(loadSentenceScrambleDifficultySelector);
const loadSudoku = () => import('./components/Sudoku.jsx');
const Sudoku = lazy(loadSudoku);
const loadSudokuDifficultySelector = () => import('./components/SudokuDifficultySelector.jsx');
const SudokuDifficultySelector = lazy(loadSudokuDifficultySelector);
const loadTicTacToe = () => import('./components/TicTacToe.jsx');
const TicTacToe = lazy(loadTicTacToe);
const loadCountingExercise = () => import('./components/CountingExercise.tsx');
const CountingExercise = lazy(loadCountingExercise);
const loadEnglishWordsSpell = () => import('./components/EnglishWordsSpell.tsx');
const EnglishWordsSpell = lazy(loadEnglishWordsSpell);
const loadColorPad = () => import('./components/ColorPad.tsx');
const ColorPad = lazy(loadColorPad);
const loadCalculator = () => import('./components/Calculator.jsx');
const Calculator = lazy(loadCalculator);

const loadQuiz = () => import('./components/Quiz.tsx');
const Quiz = lazy(loadQuiz);
const loadQuizDifficultySelector = () => import('./components/QuizDifficultySelector.tsx');
const QuizDifficultySelector = lazy(loadQuizDifficultySelector);
const loadSettings = () => import('./components/Settings.jsx');
const Settings = lazy(loadSettings);
const loadMaths = () => import('./components/Maths.jsx');
const Maths = lazy(loadMaths);
const loadGames = () => import('./components/Games.jsx');
const Games = lazy(loadGames);
const loadPuzzle = () => import('./components/Puzzle.jsx');
const Puzzle = lazy(loadPuzzle);
const loadColoring = () => import('./components/Coloring.jsx');
const Coloring = lazy(loadColoring);
const loadColoringDifficultySelector = () => import('./components/ColoringDifficultySelector.jsx');
const ColoringDifficultySelector = lazy(loadColoringDifficultySelector);
const loadCreativity = () => import('./components/Creativity.jsx');
const Creativity = lazy(loadCreativity);
const loadJunior = () => import('./components/Junior.jsx');
const Junior = lazy(loadJunior);
const loadUtils = () => import('./components/Utils.jsx');
const Utils = lazy(loadUtils);
const loadWorksheets = () => import('./components/Worksheets.jsx');
const Worksheets = lazy(loadWorksheets);
const loadAddition = () => import('./components/Addition.jsx');
const Addition = lazy(loadAddition);
const loadEnglish = () => import('./components/English.jsx');
const English = lazy(loadEnglish);
const loadSubtraction = () => import('./components/Subtraction.jsx');
const Subtraction = lazy(loadSubtraction);
const loadMultiplication = () => import('./components/Multiplication.jsx');
const Multiplication = lazy(loadMultiplication);
const loadDivision = () => import('./components/Division.jsx');
const Division = lazy(loadDivision);
const loadComparison = () => import('./components/Comparison.jsx');
const Comparison = lazy(loadComparison);
const loadAscending = () => import('./components/Ascending.jsx');
const Ascending = lazy(loadAscending);
const loadDescending = () => import('./components/Descending.jsx');
const Descending = lazy(loadDescending);
const loadMemoryMatch = () => import('./components/MemoryMatch.jsx');
const MemoryMatch = lazy(loadMemoryMatch);
const loadGridMatch = () => import('./components/GridMatch.jsx');
const GridMatch = lazy(loadGridMatch);
const loadNotes = () => import('./components/Notes.jsx');
const Notes = lazy(loadNotes);
const loadPassageReading = () => import('./components/PassageReading.jsx');
const PassageReading = lazy(loadPassageReading);
const loadDifficultySelection = () => import('./components/DifficultySelection.jsx');
const DifficultySelection = lazy(loadDifficultySelection);
const loadPassageSelection = () => import('./components/PassageSelection.jsx');
const PassageSelection = lazy(loadPassageSelection);
const loadMathDifficultySelector = () => import('./components/MathDifficultySelector.jsx');
const MathDifficultySelector = lazy(loadMathDifficultySelector);
const loadSpinWheel = () => import('./components/SpinWheel.tsx');
const SpinWheel = lazy(loadSpinWheel);
const loadQuizGame = () => import('./components/QuizGame.tsx');
const QuizGame = lazy(loadQuizGame);
const loadSmartMatch = () => import('./components/SmartMatch.tsx');
const SmartMatch = lazy(loadSmartMatch);
const loadScratchGame = () => import('./components/ScratchGame.tsx');
const ScratchGame = lazy(loadScratchGame);
const loadMentalMath = () => import('./components/MentalMath.tsx');
const MentalMath = lazy(loadMentalMath);
const loadTapLearnRoute = () => import('./components/TapLearnRoute.tsx');
const TapLearnRoute = lazy(loadTapLearnRoute);
const loadVideoStories = () => import('./components/VideoStories.tsx');
const VideoStories = lazy(loadVideoStories);
const loadRhymes = () => import('./components/Rhymes.tsx');
const Rhymes = lazy(loadRhymes);
const loadCraft = () => import('./components/Craft.tsx');
const Craft = lazy(loadCraft);
const loadLearningPath = () => import('./components/LearningPath.tsx');
const LearningPath = lazy(loadLearningPath);
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

const NON_GAME_ROUTES = new Set([
  '/',
  '/tiny-steps',
  '/english',
  '/maths',
  '/games',
  '/creativity',
  '/junior',
  '/utils',
  '/videos',
  '/rhymes',
  '/english/wordsearch',
  '/games/sudoku',
  '/creativity/coloring',
  '/creativity/coloring-selection',
  '/english/passages',
  '/utils/math-worksheets',
]);

function isGameplayRoute(pathname) {
  if (NON_GAME_ROUTES.has(pathname)) return false;
  if (pathname.startsWith('/english/passages/')) return false;
  if (pathname.startsWith('/creativity/coloring/')) return true;
  return true;
}

function getOrientationLockType(type) {
  return type.startsWith('landscape') ? 'landscape-primary' : 'portrait-primary';
}

function Home() {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('GamesCategory');
  }, []);

  const subjects = [
    {
      to: '/games/memory-match',
      label: t('home.subjects.memoryMatch.label'),
      src: '/memoryMatch.webp',
      title: t('home.subjects.memoryMatch.title'),
    },
    {
      to: '/games/sudoku',
      label: t('home.subjects.sudoku.label'),
      src: '/sudoku.webp',
      title: t('home.subjects.sudoku.title'),
    },
    {
      to: '/games/tictactoe',
      label: t('home.subjects.ticTacToe.label'),
      src: '/tic_tac_toe.webp',
      title: t('home.subjects.ticTacToe.title'),
    },
    {
      to: '/games/gridMatch',
      label: t('home.subjects.gridMatch.label'),
      src: '/gridMatch.webp',
      title: t('home.subjects.gridMatch.title'),
    },
    {
      to: '/games/tile-connect',
      label: t('home.subjects.tileConnect.label', 'Tile Connect'),
      src: '/tile-connect.webp',
      title: t('home.subjects.tileConnect.title', 'Tile Connect'),
    },

    {
      to: '/games/spin-wheel',
      label: t('home.subjects.spinWheel.label'),
      src: '/spinWheel.webp',
      title: t('home.subjects.spinWheel.title'),
    },
    {
      to: '/games/smart-match',
      label: t('home.subjects.smartMatch.label'),
      src: '/smartMatch.webp',
      title: t('home.subjects.smartMatch.title'),
    },
    {
      to: '/english/wordsearch',
      label: t('home.subjects.wordSearch.label'),
      src: '/match_the_word.webp',
      title: t('home.subjects.wordSearch.title'),
    },
    {
      to: '/maths/mental-math',
      label: t('home.subjects.mentalMath.label'),
      src: '/mental-math.webp',
      title: t('home.subjects.mentalMath.title'),
    },
    {
      to: '/stickers',
      label: t('home.subjects.stickers.label'),
      src: '/stickers.webp',
      title: t('home.subjects.stickers.title'),
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
  const isAnimating = useLearningPathStore((state) => state.isAnimating);

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
  const hasShownOrientationLockError = useRef(false);
  const hasStartedExperience = useRef(false);
  const hasStartedDeferredServices = useRef(false);
  const hasScheduledNotificationPrompt = useRef(false);
  const lastOrientationLockRef = useRef('unlocked');

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
      const criticalIcons = ['tiny-steps', 'junior', 'stories', 'rhymes', 'craft'];
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

    const { isTaskReadyToComplete, currentActiveTask, setActiveTask } =
      useLearningPathStore.getState();

    if (currentActiveTask && isTaskReadyToComplete) {
      window.dispatchEvent(new CustomEvent('trigger-task-completion'));
      return;
    }

    if (
      exitLearningPathTask({
        currentActiveTask,
        pathname: location.pathname,
        setActiveTask,
        navigate,
        fallback: null,
      })
    ) {
      return;
    }

    const segments = location.pathname.split('/').filter(Boolean);

    if (segments.length <= 1) {
      navigate('/', { replace: true });
      return;
    }

    if (segments[0] === 'junior') {
      navigate('/junior', { replace: true });
      return;
    }

    if (segments[0] === 'english' && segments[1] === 'passage') {
      const difficulty = segments[2];
      navigate(`/english/passages/${difficulty}`, { replace: true });
      return;
    }

    if (segments[0] === 'creativity' && segments[1] === 'coloring') {
      navigate('/creativity/coloring-selection', { replace: true });
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
            const isVideoSection =
              pathnameRef.current === '/stories' ||
              pathnameRef.current === '/rhymes' ||
              pathnameRef.current === '/craft';
            if (!isVideoSection) playMusic();
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
      if (useLearningPathStore.getState().isAnimating && pathnameRef.current === '/tiny-steps')
        return;

      const [{ stopSpeech, stopAllTones }, { pauseMusic }] = await Promise.all([
        loadSoundUtils(),
        loadBgMusicManager(),
      ]);
      stopSpeech();
      stopAllTones();
      pauseMusic();

      const { currentActiveTask, isTaskReadyToComplete } = useLearningPathStore.getState();

      if (currentActiveTask && isTaskReadyToComplete) {
        window.dispatchEvent(new CustomEvent('trigger-task-completion'));
        return;
      }

      if (
        exitLearningPathTask({
          currentActiveTask,
          pathname: pathnameRef.current,
          setActiveTask: useLearningPathStore.getState().setActiveTask,
          navigate,
          fallback: null,
        })
      ) {
        return;
      }

      const segments = pathnameRef.current.split('/').filter(Boolean);

      if (segments.length <= 1) {
        if (pathnameRef.current !== '/') {
          navigate('/', { replace: true });
          return;
        }
      } else {
        if (segments[0] === 'english' && segments[1] === 'passage') {
          const difficulty = segments[2];
          navigate(`/english/passages/${difficulty}`, { replace: true });
          return;
        }

        if (segments[0] === 'creativity' && segments[1] === 'coloring') {
          navigate('/creativity/coloring-selection', { replace: true });
          return;
        }

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

  // ORIENTATION LOCK
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('ScreenOrientation')) return;

    const syncOrientationLock = async () => {
      try {
        if (!isGameplayRoute(location.pathname)) {
          if (lastOrientationLockRef.current !== 'unlocked') {
            await ScreenOrientation.unlock();
            lastOrientationLockRef.current = 'unlocked';
          }
          return;
        }

        const type = window.screen?.orientation?.type || 'portrait-primary';
        const nextLock = getOrientationLockType(type);
        if (lastOrientationLockRef.current === nextLock) return;

        await ScreenOrientation.lock({ orientation: nextLock });
        lastOrientationLockRef.current = nextLock;
      } catch (err) {
        if (!hasShownOrientationLockError.current) {
          console.error('Orientation lock failed:', err);
          hasShownOrientationLockError.current = true;
        }
      }
    };

    const cancelSync = scheduleAfterFirstPaint(syncOrientationLock, 1200);
    return () => cancelSync();
  }, [location.pathname]);

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
          <Route path="/tiny-steps" element={<LearningPath />} />
          {/* English */}
          <Route path="/english" element={<English />} />
          <Route path="/english/alphabets" element={<Alphabets />} />
          <Route path="/english/english-words" element={<EnglishWordsSpell />} />
          <Route
            path="/english/sentence-scramble"
            element={<SentenceScrambleDifficultySelector />}
          />
          <Route path="/english/sentence-scramble/:difficulty" element={<SentenceScramble />} />
          <Route path="/english/wordsearch" element={<WordSearchDifficultySelector />} />
          <Route path="/english/wordsearch/:difficulty" element={<WordSearch />} />
          <Route
            path="/english/passages"
            element={
              <DifficultySelection
                difficulties={[
                  { key: 'easy', label: t('common.levels.easy'), emoji: '🐣', color: '#60a5fa' },
                  {
                    key: 'medium',
                    label: t('common.levels.medium'),
                    emoji: '🐼',
                    color: '#f59e0b',
                  },
                  { key: 'hard', label: t('common.levels.hard'), emoji: '🐘', color: '#ef4444' },
                ]}
                baseRoute="/english/passages"
              />
            }
          />
          <Route path="/english/passages/:difficulty" element={<PassageSelection />} />
          <Route path="/english/passage/:difficulty/:id" element={<PassageReading />} />
          {/* Maths */}
          <Route path="/maths" element={<Maths />} />
          <Route path="/maths/counting" element={<CountingExercise />} />
          <Route path="/maths/addition" element={<MathDifficultySelector operator="Addition" />} />
          <Route path="/maths/addition/:difficulty" element={<Addition />} />
          <Route
            path="/maths/subtraction"
            element={<MathDifficultySelector operator="Subtraction" />}
          />
          <Route path="/maths/subtraction/:difficulty" element={<Subtraction />} />
          <Route
            path="/maths/multiplication"
            element={<MathDifficultySelector operator="Multiplication" />}
          />
          <Route path="/maths/multiplication/:difficulty" element={<Multiplication />} />
          <Route path="/maths/division" element={<MathDifficultySelector operator="Division" />} />
          <Route path="/maths/division/:difficulty" element={<Division />} />
          <Route
            path="/maths/comparison"
            element={<MathDifficultySelector operator="Comparison" />}
          />
          <Route path="/maths/comparison/:difficulty" element={<Comparison />} />
          <Route
            path="/maths/ascending"
            element={<MathDifficultySelector operator="Ascending" />}
          />
          <Route path="/maths/ascending/:difficulty" element={<Ascending />} />
          <Route
            path="/maths/descending"
            element={<MathDifficultySelector operator="Descending" />}
          />
          <Route path="/maths/descending/:difficulty" element={<Descending />} />
          <Route path="/maths/mental-math" element={<MentalMath />} />
          <Route path="/maths/mental-math/:difficulty" element={<MentalMath />} />
          {/* Games */}
          <Route path="/games" element={<Games />} />
          <Route path="/games/sudoku" element={<SudokuDifficultySelector />} />
          <Route path="/games/sudoku/:difficulty" element={<Sudoku />} />
          <Route path="/games/tictactoe" element={<TicTacToe userName={userName} />} />
          <Route path="/games/memory-match" element={<MemoryMatch />} />
          <Route path="/games/tile-connect" element={<TileConnect />} />
          <Route path="/games/gridMatch" element={<GridMatch />} />
          <Route path="/games/puzzle" element={<Puzzle />} />
          <Route path="/games/spin-wheel" element={<SpinWheel />} />
          <Route path="/games/smart-match" element={<SmartMatch />} />
          {/* Creativity */}
          <Route path="/creativity" element={<Creativity />} />
          <Route path="/creativity/coloring-selection" element={<ColoringDifficultySelector />} />
          <Route path="/creativity/coloring/:difficulty" element={<Coloring />} />
          <Route path="/creativity/colorPad" element={<ColorPad />} />
          <Route path="/creativity/tracing-selection" element={<TracingSelection />} />
          <Route
            path="/creativity/tracing-selection/alphabet-tracing"
            element={<TracingGame mode="alphabets" />}
          />
          <Route
            path="/creativity/tracing-selection/number-tracing"
            element={<TracingGame mode="numbers" />}
          />
          <Route path="/creativity/scratch-cards" element={<ScratchGame />} />
          {/* Junior */}
          <Route path="/junior" element={<Junior />} />
          <Route path="/junior/tap-learn" element={<TapLearnRoute gameType="letters" />} />
          <Route path="/junior/tap-learn-letters" element={<TapLearnRoute gameType="letters" />} />
          <Route path="/junior/tap-learn-numbers" element={<TapLearnRoute gameType="numbers" />} />
          <Route path="/junior/tap-learn-colors" element={<TapLearnRoute gameType="colors" />} />
          <Route
            path="/junior/tap-learn-vegetables"
            element={<TapLearnRoute gameType="vegetables" />}
          />
          <Route path="/junior/tap-learn-fruits" element={<TapLearnRoute gameType="fruits" />} />
          <Route path="/junior/tap-learn-shapes" element={<TapLearnRoute gameType="shapes" />} />
          <Route
            path="/junior/tap-learn-farm-animals"
            element={<TapLearnRoute gameType="farmAnimals" />}
          />
          <Route
            path="/junior/tap-learn-wild-animals"
            element={<TapLearnRoute gameType="wildAnimals" />}
          />
          <Route
            path="/junior/tap-learn-sea-animals"
            element={<TapLearnRoute gameType="seaAnimals" />}
          />
          <Route path="/junior/tap-learn-insects" element={<TapLearnRoute gameType="insects" />} />
          <Route
            path="/junior/tap-learn-vehicles"
            element={<TapLearnRoute gameType="vehicles" />}
          />
          <Route path="/junior/tap-learn-food" element={<TapLearnRoute gameType="food" />} />
          <Route
            path="/junior/tap-learn-instruments"
            element={<TapLearnRoute gameType="instruments" />}
          />
          {/* Utils */}
          <Route path="/utils" element={<Utils />} />
          <Route path="/utils/calculator" element={<Calculator />} />
          <Route path="/utils/notes" element={<Notes />} />
          <Route path="/utils/math-worksheets" element={<Worksheets />} />
          {/* Others */}
          <Route path="/quiz" element={<QuizDifficultySelector />} />
          <Route path="/quiz/:difficulty" element={<Quiz />} />
          <Route path="/stories" element={<VideoStories />} />{' '}
          <Route path="/rhymes" element={<Rhymes />} />
          <Route path="/craft" element={<Craft />} />
          <Route path="/stickers" element={<StickerBook />} />
        </Routes>
      </Suspense>

      {location.pathname === '/' ? (
        <button
          className="nav-button nav-button--setting"
          onClick={() => setIsSettingsOpen(true)}
          disabled={isAnimating && location.pathname === '/tiny-steps'}
        >
          <img src="/setting.webp" alt={t('settings.title')} />
        </button>
      ) : (
        <button
          className="nav-button nav-button--home"
          onClick={handleBackClick}
          disabled={isAnimating && location.pathname === '/tiny-steps'}
        >
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
