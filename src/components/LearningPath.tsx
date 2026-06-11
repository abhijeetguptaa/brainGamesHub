import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLearningPathStore } from '../store/useLearningPathStore';
import { LEARNING_PATH_LEVELS } from '../data/learningPath';
import { setScreen } from '../utils/analytics';
import '../styles/LearningPath.scss';
import { useSparkleBurst } from '../hooks/useSparkleBurst';
import useStarStore from '../store/useStarStore';
import { Toast } from '@capacitor/toast';

const LevelNode = memo(
  ({
    level,
    isUnlocked,
    isLevelComplete,
    isCurrent,
    phaseInfo,
    showPhaseTitle,
    alignment,
    nextAlignment,
    onLevelClick,
  }: {
    level: any;
    index: number;
    isUnlocked: boolean;
    isLevelComplete: boolean;
    isCurrent: boolean;
    phaseInfo: any;
    showPhaseTitle: boolean;
    alignment: string;
    nextAlignment: string | null;
    onLevelClick: (id: number, isUnlocked: boolean) => void;
  }) => {
    return (
      <>
        <div className={`node-row ${alignment}`}>
          <div className="node-wrapper">
            <div
              id={`level-${level.id}`}
              className={`level-node ${phaseInfo.class} ${isUnlocked ? 'unlocked' : 'locked'} ${isLevelComplete ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
              onClick={() => onLevelClick(level.id, isUnlocked)}
            >
              <div className="node-content">
                <span className="level-number">{level.id}</span>
                {isUnlocked ? (
                  <>
                    {isLevelComplete ? (
                      <span className="status-icon">🏆</span>
                    ) : isCurrent ? (
                      <span className="status-icon">🌟</span>
                    ) : null}
                  </>
                ) : (
                  <span className="status-icon">🔒</span>
                )}
              </div>
            </div>
          </div>

          {nextAlignment && <div className={`connector ${alignment}-to-${nextAlignment}`}></div>}
        </div>
        {showPhaseTitle && (
          <div className="phase-separator">
            <span className="phase-title-text">{phaseInfo.title}</span>
          </div>
        )}
      </>
    );
  },
);

export default function LearningPath() {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('LearningPath');
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const unlockedLevels = useLearningPathStore((state) => state.unlockedLevels);
  const completedTasks = useLearningPathStore((state) => state.completedTasks);
  const setActiveTask = useLearningPathStore((state) => state.setActiveTask);
  const skipLevel = useLearningPathStore((state) => state.skipLevel);
  const justCompletedLevel = useLearningPathStore((state) => state.justCompletedLevel);
  const setJustCompletedLevel = useLearningPathStore((state) => state.setJustCompletedLevel);
  const currentActiveTask = useLearningPathStore((state) => state.currentActiveTask);
  const { triggerSparkleBurst, SparkleRenderer } = useSparkleBurst();

  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const { stars, spendStars } = useStarStore();

  const handleClosePopup = () => {
    setSelectedLevelId(null);
    setActiveTask(null);
  };

  // Restore selectedLevelId if we are coming back from an active task
  useEffect(() => {
    if (location.pathname === '/tiny-steps' && currentActiveTask && !justCompletedLevel) {
      const levelMatch = currentActiveTask.id.match(/^l(\d+)_/);
      if (levelMatch) {
        setSelectedLevelId(parseInt(levelMatch[1]));
      }
    }
  }, [location.pathname, currentActiveTask, justCompletedLevel]);
  const [isReady, setIsReady] = useState(false);
  const [isSpendingStars, setIsSpendingStars] = useState(false);

  const getPhaseInfo = (id: number) => {
    if (id <= 10)
      return {
        class: 'phase-foundation',
        title: t('learningPath.phases.foundation', '🌈 Foundation Fields'),
        bg: 'bg-foundation',
      };
    if (id <= 20)
      return {
        class: 'phase-expanding',
        title: t('learningPath.phases.expanding', '🌲 Expanding Woods'),
        bg: 'bg-expanding',
      };
    if (id <= 30)
      return {
        class: 'phase-challenging',
        title: t('learningPath.phases.challenging', '🏔️ Challenge Peaks'),
        bg: 'bg-challenging',
      };
    if (id <= 40)
      return {
        class: 'phase-mastery',
        title: t('learningPath.phases.mastery', '🌊 Mastery Ocean'),
        bg: 'bg-mastery',
      };
    if (id <= 50)
      return {
        class: 'phase-grandmaster',
        title: t('learningPath.phases.grandmaster', '✨ Grand Master Galaxy'),
        bg: 'bg-grandmaster',
      };
    if (id <= 60)
      return {
        class: 'phase-cosmic',
        title: t('learningPath.phases.cosmic', '🚀 Cosmic Voyager'),
        bg: 'bg-cosmic',
      };
    if (id <= 70)
      return {
        class: 'phase-deepsea',
        title: t('learningPath.phases.deepsea', '🐙 Deep Sea Discovery'),
        bg: 'bg-deepsea',
      };
    if (id <= 80)
      return {
        class: 'phase-jungle',
        title: t('learningPath.phases.jungle', '🌿 Jungle Journey'),
        bg: 'bg-jungle',
      };
    if (id <= 90)
      return {
        class: 'phase-ancient',
        title: t('learningPath.phases.ancient', '🏺 Ancient Ruins'),
        bg: 'bg-ancient',
      };
    if (id <= 100)
      return {
        class: 'phase-legend',
        title: t('learningPath.phases.legend', '👑 Ultimate Legend'),
        bg: 'bg-legend',
      };
    if (id <= 110)
      return {
        class: 'phase-dragon',
        title: t('learningPath.phases.dragon', "🐲 Dragon's Lair"),
        bg: 'bg-dragon',
      };
    if (id <= 120)
      return {
        class: 'phase-crystal',
        title: t('learningPath.phases.crystal', '💎 Crystal Cave'),
        bg: 'bg-crystal',
      };
    if (id <= 130)
      return {
        class: 'phase-magic',
        title: t('learningPath.phases.magic', '🪄 Magic Kingdom'),
        bg: 'bg-magic',
      };
    if (id <= 140)
      return {
        class: 'phase-future',
        title: t('learningPath.phases.future', '🏙️ Future City'),
        bg: 'bg-future',
      };
    if (id <= 150)
      return {
        class: 'phase-robot',
        title: t('learningPath.phases.robot', '🤖 Robotic Revolution'),
        bg: 'bg-robot',
      };
    if (id <= 160)
      return {
        class: 'phase-cyber',
        title: t('learningPath.phases.cyber', '🌐 Cyber Space'),
        bg: 'bg-cyber',
      };
    if (id <= 170)
      return {
        class: 'phase-desert',
        title: t('learningPath.phases.desert', '🏜️ Desert Mirage'),
        bg: 'bg-desert',
      };
    if (id <= 180)
      return {
        class: 'phase-arctic',
        title: t('learningPath.phases.arctic', '❄️ Arctic Tundra'),
        bg: 'bg-arctic',
      };
    if (id <= 190)
      return {
        class: 'phase-volcano',
        title: t('learningPath.phases.volcano', '🌋 Volcano Valley'),
        bg: 'bg-volcano',
      };
    if (id <= 200)
      return {
        class: 'phase-skycastle',
        title: t('learningPath.phases.skycastle', '🏰 Sky Castle'),
        bg: 'bg-skycastle',
      };
    if (id <= 210)
      return {
        class: 'phase-diamond',
        title: t('learningPath.phases.diamond', '💎 Diamond Dunes'),
        bg: 'bg-diamond',
      };
    if (id <= 220)
      return {
        class: 'phase-emerald',
        title: t('learningPath.phases.emerald', '🍃 Emerald Enclave'),
        bg: 'bg-emerald',
      };
    if (id <= 230)
      return {
        class: 'phase-sapphire',
        title: t('learningPath.phases.sapphire', '💧 Sapphire Springs'),
        bg: 'bg-sapphire',
      };
    if (id <= 240)
      return {
        class: 'phase-ruby',
        title: t('learningPath.phases.ruby', '🔥 Ruby Ridge'),
        bg: 'bg-ruby',
      };
    if (id <= 250)
      return {
        class: 'phase-gold',
        title: t('learningPath.phases.gold', '💰 Golden Garden'),
        bg: 'bg-gold',
      };
    if (id <= 260)
      return {
        class: 'phase-silver',
        title: t('learningPath.phases.silver', '🥈 Silver Summit'),
        bg: 'bg-silver',
      };
    if (id <= 270)
      return {
        class: 'phase-platinum',
        title: t('learningPath.phases.platinum', '🛡️ Platinum Plateau'),
        bg: 'bg-platinum',
      };
    if (id <= 280)
      return {
        class: 'phase-titanium',
        title: t('learningPath.phases.titanium', '🏗️ Titanium Tower'),
        bg: 'bg-titanium',
      };
    if (id <= 290)
      return {
        class: 'phase-obsidian',
        title: t('learningPath.phases.obsidian', '🌑 Obsidian Oasis'),
        bg: 'bg-obsidian',
      };
    return {
      class: 'phase-zenith',
      title: t('learningPath.phases.zenith', '🌌 Zenith Universe'),
      bg: 'bg-zenith',
    };
  };

  const maxUnlocked = useMemo(() => Math.max(...unlockedLevels, 1), [unlockedLevels]);
  const reversedLevels = useMemo(() => [...LEARNING_PATH_LEVELS].reverse(), []);
  const [currentPhase, setCurrentPhase] = useState(() => getPhaseInfo(1));
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Directly show the current level on mount
  useLayoutEffect(() => {
    const activeLevelId = maxUnlocked;
    const element = document.getElementById(`level-${activeLevelId}`);

    if (element) {
      element.scrollIntoView({ behavior: 'auto', block: 'center' });
      // Update phase info immediately
      setCurrentPhase(getPhaseInfo(activeLevelId));
    } else {
      window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsReady(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [maxUnlocked]);

  // Handle background update on scroll using IntersectionObserver
  useEffect(() => {
    if (justCompletedLevel) {
      triggerSparkleBurst(window.innerWidth / 2, window.innerHeight / 2, {
        count: 50,
        range: 500,
      });
      setTimeout(() => {
        setJustCompletedLevel(null);
      }, 3000);
    }
  }, [justCompletedLevel, triggerSparkleBurst, setJustCompletedLevel]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px', // Trigger when element is in the middle of the screen
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idMatch = entry.target.id.match(/level-(\d+)/);
          if (idMatch) {
            const levelId = parseInt(idMatch[1]);
            const newPhase = getPhaseInfo(levelId);
            setCurrentPhase(newPhase);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const levelElements = document.querySelectorAll('.level-node');
    levelElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [unlockedLevels]);

  const handleLevelClick = async (levelId: number, isUnlocked: boolean) => {
    if (isUnlocked) {
      setSelectedLevelId(selectedLevelId === levelId ? null : levelId);
      return;
    }
  };

  const handleTaskClick = (task: any) => {
    setActiveTask(task);
    navigate(task.path);
  };

  const handleSkipLevel = async (levelId: number) => {
    if (isSpendingStars) return;
    if (stars < 100) {
      await Toast.show({
        text: t('unlockModal.notEnoughCoins'),
      });
      return;
    }

    setIsSpendingStars(true);
    try {
      const success = spendStars(100);
      if (success) {
        skipLevel(levelId);
        setSelectedLevelId(null);
        await Toast.show({
          text: t('unlockModal.featureUnlocked'),
        });
      }
    } catch (err) {
      console.error('Failed to skip level:', err);
    } finally {
      setIsSpendingStars(false);
    }
  };

  const getTaskLabel = (task: any, levelId: number) => {
    let label = task.label;
    if (task.path === '/alphabets') {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const end = Math.min(levelId * 6, 26);
      const startChar = 'A';
      const endChar = alphabet[end - 1];
      label = `${task.label} (${startChar}-${endChar})`;
    }
    return label;
  };

  const selectedLevel = LEARNING_PATH_LEVELS.find((l) => l.id === selectedLevelId);
  const isAllTasksCompleted = selectedLevel?.tasks.every((task) => completedTasks[task.id]);

  return (
    <div
      className={`tiny-steps-game-container ${currentPhase.bg} ${isReady ? 'is-ready' : 'is-initializing'}`}
      ref={containerRef}
    >
      <SparkleRenderer />
      <div className="game-sky">
        <div className="cloud c1">☁️</div>
        <div className="cloud c2">☁️</div>
        <div className="cloud c3">☁️</div>
        <div className="cloud c4">☁️</div>
        <div className="cloud c5">☁️</div>
      </div>
      {selectedLevel && (
        <>
          <div className="popup-overlay" onClick={handleClosePopup} />
          <div className="task-popup centered">
            <button className="close-popup" onClick={handleClosePopup}>
              ×
            </button>
            <h3 className="popup-title">{selectedLevel.title}</h3>
            <div className="popup-tasks">
              {selectedLevel.tasks.map((task) => (
                <button
                  key={task.id}
                  className={`popup-task-btn ${completedTasks[task.id] ? 'done' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskClick(task);
                  }}
                >
                  <span className="task-icon">
                    {task.type === 'math' ? '🧮' : task.type === 'english' ? '📚' : '🎮'}
                  </span>
                  <span className="task-text">{getTaskLabel(task, selectedLevel.id)}</span>
                  {completedTasks[task.id] && <span className="check">✅</span>}
                </button>
              ))}
            </div>

            {!isAllTasksCompleted && (
              <div className="popup-actions">
                <button
                  className="skip-level-btn"
                  onClick={() => handleSkipLevel(selectedLevel.id)}
                  disabled={isSpendingStars}
                >
                  {isSpendingStars ? (
                    t('common.loading', 'Loading...')
                  ) : (
                    <>
                      <span className="icon">🌟</span>
                      {t('learningPath.skipLevel', 'Skip Level')} (100 🌟)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <h1 className="game-title">{t('learningPath.title', 'Adventure Map')}</h1>

      <div className="path-scroll-area" ref={scrollRef}>
        <div className="path-nodes">
          {reversedLevels.map((level, reverseIndex) => {
            const index = LEARNING_PATH_LEVELS.length - 1 - reverseIndex;

            const isLevelComplete = level.tasks.every((task) => completedTasks[task.id]);

            const prevLevel = LEARNING_PATH_LEVELS.find((l) => l.id === level.id - 1);
            const isPrevComplete = prevLevel
              ? prevLevel.tasks.every((t) => completedTasks[t.id])
              : true;

            const isUnlocked =
              level.id === 1 || unlockedLevels.includes(level.id) || isPrevComplete;

            const isCurrent =
              isUnlocked &&
              !isLevelComplete &&
              (prevLevel ? prevLevel.tasks.every((t) => completedTasks[t.id]) : true);

            const phaseInfo = getPhaseInfo(level.id);
            const showPhaseTitle = (level.id - 1) % 10 === 0;

            const alignment =
              index % 4 === 0
                ? 'center'
                : index % 4 === 1
                  ? 'right'
                  : index % 4 === 2
                    ? 'center'
                    : 'left';

            // Next node's alignment for the connector
            const nextIndex = index + 1;
            const nextAlignment =
              nextIndex < LEARNING_PATH_LEVELS.length
                ? nextIndex % 4 === 0
                  ? 'center'
                  : nextIndex % 4 === 1
                    ? 'right'
                    : nextIndex % 4 === 2
                      ? 'center'
                      : 'left'
                : null;

            return (
              <LevelNode
                key={level.id}
                level={level}
                index={index}
                isUnlocked={isUnlocked}
                isLevelComplete={isLevelComplete}
                isCurrent={isCurrent}
                phaseInfo={phaseInfo}
                showPhaseTitle={showPhaseTitle}
                alignment={alignment}
                nextAlignment={nextAlignment}
                onLevelClick={handleLevelClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
