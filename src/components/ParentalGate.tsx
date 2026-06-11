import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/ParentalGate.scss';
import { logEvent } from '../utils/analytics';

interface ParentalGateProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ParentalGate: React.FC<ParentalGateProps> = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNum1(Math.floor(Math.random() * 10) + 5);
      setNum2(Math.floor(Math.random() * 10) + 5);
      setAnswer('');
      setError(false);
      logEvent('ParentalGateShow');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(answer) === num1 + num2) {
      logEvent('ParentalGateSuccess');
      onConfirm();
      onClose();
    } else {
      logEvent('ParentalGateFailure');
      setError(true);
      setAnswer('');
    }
  };

  return (
    <div className="parental-gate-overlay">
      <div className="parental-gate-modal">
        <h3>{t('parentalGate.title')}</h3>
        <p>{t('parentalGate.question', { num1, num2 })}</p>

        <form onSubmit={handleSubmit}>
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t('common.questionMark')}
            autoFocus
            className={error ? 'error' : ''}
          />
          <div className="parental-gate-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              {t('common.cancel')}
            </button>
            <button type="submit" className="confirm-btn">
              {t('common.done')}
            </button>
          </div>
        </form>
        {error && <p className="error-text">{t('parentalGate.wrongAnswer')}</p>}
      </div>
    </div>
  );
};

export default ParentalGate;
