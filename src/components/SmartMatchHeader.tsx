import { ITEMS, LevelConfig } from '../constants/smartMatchConstants';

interface SmartMatchHeaderProps {
  t: (key: string, options?: Record<string, unknown>) => string;
  currentLevel: LevelConfig;
  score: number;
  movesLeft: number;
  collectedItems: Record<string, number>;
  isProcessing: boolean;
  onSkipLevel: () => void;
  onReset: () => void;
}

export default function SmartMatchHeader({
  t,
  currentLevel,
  score,
  movesLeft,
  collectedItems,
  isProcessing,
  onSkipLevel,
  onReset,
}: SmartMatchHeaderProps) {
  return (
    <>
      <button
        className="skip-level-top-btn"
        onClick={onSkipLevel}
        disabled={isProcessing}
        title={t('home.subjects.smartMatch.skipLevel')}
      >
        ⏭️ {t('home.subjects.smartMatch.skipLevel')}
      </button>

      <div className="game-header">
        <div className="header-left">
          <div className="level-info">
            {t('home.subjects.smartMatch.level')} {currentLevel.id}
          </div>

          <div className="score-board">
            {t('home.subjects.smartMatch.score')}
            <span>
              {score} / {currentLevel.targetScore}
            </span>
          </div>

          <div className="moves-board">
            {t('home.subjects.smartMatch.moves')}: {movesLeft}
          </div>
        </div>

        <div className="header-right">
          {currentLevel.collectItems && (
            <div className="objectives-bar">
              {Object.entries(currentLevel.collectItems).map(([type, target]) => {
                const itemDef = ITEMS.find((item) => item.type === type);
                const current = collectedItems[type] || 0;

                return (
                  <div
                    key={type}
                    className={`objective-item ${current >= target ? 'completed' : ''}`}
                  >
                    <span className="obj-emoji">{itemDef?.emoji}</span>
                    <span className="obj-count">
                      {current} / {target}
                    </span>
                    {current >= target && <span className="obj-check">✅</span>}
                  </div>
                );
              })}
            </div>
          )}

          <button className="reset-btn" onClick={onReset} aria-label={t('common.actions.reset')}>
            ↻
          </button>
        </div>
      </div>
    </>
  );
}
