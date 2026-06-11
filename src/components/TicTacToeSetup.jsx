const TicTacToeSetup = ({
  t,
  mode,
  setMode,
  playerX,
  setPlayerX,
  playerO,
  setPlayerO,
  difficulty,
  setDifficulty,
  onStart,
}) => {
  const difficultyOptions = [
    { value: 'easy', label: t('common.levels.easy') },
    { value: 'medium', label: t('common.levels.medium') },
    { value: 'hard', label: t('common.levels.hard') },
  ];
  const selectedDifficulty = difficultyOptions.find((option) => option.value === difficulty);

  return (
    <div className="white-bg-card mx-auto shadow ttt-setup-card">
      <div className="card-body">
        <div className="mb-3 player-selection">
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="mode"
              id="pvai"
              value="pvai"
              checked={mode === 'pvai'}
              onChange={() => setMode('pvai')}
            />
            <label className="form-check-label" htmlFor="pvai">
              {t('ticTacToe.humanVsAi')}
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="mode"
              id="pvp"
              value="pvp"
              checked={mode === 'pvp'}
              onChange={() => setMode('pvp')}
            />
            <label className="form-check-label" htmlFor="pvp">
              {t('ticTacToe.humanVsHuman')}
            </label>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="playerXInput">
            {t('ticTacToe.playerXName')}
          </label>
          <input
            id="playerXInput"
            className="form-control"
            value={playerX}
            onChange={(e) => setPlayerX(e.target.value)}
            maxLength={16}
          />
        </div>

        {mode === 'pvp' && (
          <div className="mb-3">
            <label className="form-label" htmlFor="playerOInput">
              {t('ticTacToe.playerOName')}
            </label>
            <input
              id="playerOInput"
              className="form-control"
              value={playerO}
              onChange={(e) => setPlayerO(e.target.value)}
              maxLength={16}
            />
          </div>
        )}

        {mode === 'pvai' && (
          <div className="mb-3">
            <span className="form-label" id="difficultySelectLabel">
              {t('ticTacToe.difficulty')}
            </span>
            <details className="ttt-difficulty-dropdown">
              <summary aria-labelledby="difficultySelectLabel">
                {selectedDifficulty?.label || difficulty}
              </summary>
              <div className="ttt-difficulty-menu" role="listbox">
                {difficultyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={option.value === difficulty ? 'active' : ''}
                    role="option"
                    aria-selected={option.value === difficulty}
                    onClick={(event) => {
                      setDifficulty(option.value);
                      event.currentTarget.closest('details')?.removeAttribute('open');
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </details>
          </div>
        )}

        <button className="btn btn-primary mt-2" onClick={onStart}>
          {t('ticTacToe.startGame')}
        </button>
      </div>
    </div>
  );
};

export default TicTacToeSetup;
