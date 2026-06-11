import { useState, useEffect } from 'react';
import '../styles/PassageReading.scss';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import SuccessModal from './SuccessModal';
import LooseModal from './LooseModal';
import { speakText, stopSpeech } from '../utils/soundUtils'; // Import speakText and stopSpeech
import ShareButton from './ShareButton';
import { useLearningPathStore } from '../store/useLearningPathStore';
import useStarStore from '../store/useStarStore';
import { exitLearningPathTask } from '../utils/learningPathUtils';

import { useTranslation } from 'react-i18next';
import { setScreen, trackExerciseComplete } from '../utils/analytics';

const PassageReading = () => {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('PassageReading');
  }, []);

  const { difficulty, id } = useParams(); // ⭐ read difficulty and id from URL
  const navigate = useNavigate();
  const location = useLocation();
  const { currentActiveTask, completeTask, setActiveTask } = useLearningPathStore();
  const { completePassage } = useStarStore();
  const [passage, setPassage] = useState(null);
  const [isPassageLoading, setIsPassageLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLooseModal, setShowLooseModal] = useState(false);
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);

  useEffect(() => {
    let isMounted = true;

    setPassage(null);
    setIsPassageLoading(true);
    setSelectedAnswers({});
    setShowFeedback({});
    setShowSuccessModal(false);
    setShowLooseModal(false);
    setIncorrectQuestions([]);

    import('../data/passage').then(({ passageData }) => {
      if (isMounted) {
        setPassage(passageData[difficulty]?.[id] ?? null);
        setIsPassageLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [difficulty, id]);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [id, difficulty]);

  useEffect(() => {
    if (!passage) return;

    const allQuestionsAnswered = Object.keys(selectedAnswers).length === passage.questions.length;

    if (allQuestionsAnswered) {
      const incorrects = passage.questions
        .map((q, idx) => ({
          question: q.question,
          userAnswer: selectedAnswers[idx],
          correctAnswer: q.answer,
          isCorrect: showFeedback[idx],
        }))
        .filter((q) => !q.isCorrect);

      if (incorrects.length === 0) {
        if (currentActiveTask && currentActiveTask.path.includes('/passages')) {
          completeTask(currentActiveTask.id);
        }
        setShowSuccessModal(true);
        completePassage(Number(id), difficulty);
        trackExerciseComplete('Passage', difficulty, 1);
      } else {
        setIncorrectQuestions(incorrects);
        setShowLooseModal(true);
      }
    }
  }, [
    selectedAnswers,
    showFeedback,
    passage,
    difficulty,
    id,
    currentActiveTask,
    completeTask,
    completePassage,
  ]);

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    exitLearningPathTask({
      currentActiveTask,
      pathname: location.pathname,
      search: location.search,
      setActiveTask,
      navigate,
    });
  };
  const handleCloseLooseModal = () => {
    setShowLooseModal(false);
  };

  const handleOptionChange = (qIndex, selectedOption, correctAnswer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIndex]: selectedOption,
    }));
    setShowFeedback((prev) => ({
      ...prev,
      [qIndex]: selectedOption === correctAnswer,
    }));
  };

  const handleRewardSuccess = () => {
    setSelectedAnswers({});
    setShowFeedback({});
    setIncorrectQuestions([]);
    setShowLooseModal(false);
  };

  if (isPassageLoading || !passage) {
    return <div>{t('passageReading.loading')}</div>;
  }

  const handlePdfDownloadClick = async () => {
    const { downloadPassagePdf } = await import('../utils/pdfUtils');
    downloadPassagePdf(passage, t);
  };

  return (
    <div className="passage-container">
      <ShareButton onDownloadClick={handlePdfDownloadClick} />

      <div className="passage-title text-on-blue-BG">{passage.title}</div>
      <div className="passage-content">
        {passage.passage}
        <span className="speaker-icon" onClick={() => speakText(passage.passage)}>
          🔊
        </span>
      </div>

      <div className="questions-section">
        {passage.questions.map((q, qIndex) => (
          <div key={qIndex} className="question-item">
            <p className="question-text">
              {qIndex + 1}. {q.question}
              <span className="speaker-icon" onClick={() => speakText(q.question)}>
                🔊
              </span>
            </p>
            <div className="options-list">
              {q.options.map((option, oIndex) => {
                const isCorrect =
                  showFeedback[qIndex] === true && selectedAnswers[qIndex] === option;
                const isIncorrect =
                  showFeedback[qIndex] === false && selectedAnswers[qIndex] === option;
                const isAnswered = selectedAnswers[qIndex] !== undefined;

                return (
                  <label
                    key={oIndex}
                    className={`option-label ${isAnswered ? (isCorrect ? 'correct' : isIncorrect ? 'incorrect' : '') : ''} ${isAnswered ? 'disabled' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      value={option}
                      checked={selectedAnswers[qIndex] === option}
                      onChange={() => handleOptionChange(qIndex, option, q.answer)}
                      disabled={selectedAnswers[qIndex] !== undefined}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {showSuccessModal && (
        <SuccessModal handleClose={handleCloseSuccessModal} message={''} starsWon={1} />
      )}
      {showLooseModal && (
        <LooseModal
          handleClose={handleCloseLooseModal}
          message=""
          starsWon={0}
          onWatchAdReward={handleRewardSuccess}
          incorrectQuestions={incorrectQuestions}
        />
      )}
    </div>
  );
};

export default PassageReading;
