import React, { useState, useEffect } from 'react';
import '../styles/Calculator.scss';
import { useTranslation } from 'react-i18next';
import { useLearningPathStore } from '../store/useLearningPathStore';
import { useNavigate } from 'react-router-dom';
import { setScreen } from '../utils/analytics';

const OPERATOR_SYMBOLS = {
  add: '+',
  subtract: '−',
  multiplication: '×',
  divide: '÷',
  percent: '%',
};

const Calculator = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    setScreen('CalculatorUtil');
  }, []);

  const { currentActiveTask, completeTask, setActiveTask } = useLearningPathStore();
  const [display, setDisplay] = useState('0');
  const [firstValue, setFirstValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForSecond, setWaitingForSecond] = useState(false);
  const [error, setError] = useState('');
  const currentOperatorSymbol = operator ? OPERATOR_SYMBOLS[operator] : '';

  const handleFinish = () => {
    if (currentActiveTask && currentActiveTask.path.includes('/calculator')) {
      completeTask(currentActiveTask.id);
      setActiveTask(null);
      navigate('/');
    }
  };

  const formatDisplayValue = (value) => {
    const parsedValue = Number(value);
    if (Number.isNaN(parsedValue)) return String(value);
    return parsedValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const operationPreview =
    operator && firstValue != null
      ? `${formatDisplayValue(firstValue)} ${currentOperatorSymbol}${waitingForSecond ? '' : ` ${formatDisplayValue(display)}`}`
      : '';

  const clearAll = () => {
    setDisplay('0');
    setFirstValue(null);
    setOperator(null);
    setWaitingForSecond(false);
    setError('');
  };

  const handleDigit = (digit) => {
    setError('');
    setDisplay((prev) => {
      // When waiting for the second number, start fresh
      if (waitingForSecond) {
        setWaitingForSecond(false);
        return digit;
      }
      if (prev === '0') return digit;
      return prev + digit;
    });
  };

  const handleDecimal = () => {
    setError('');
    setDisplay((prev) => {
      if (waitingForSecond) {
        setWaitingForSecond(false);
        return '0.';
      }
      if (prev.includes('.')) return prev;
      return `${prev}.`;
    });
  };

  const handleBackspace = () => {
    setError('');
    setDisplay((prev) => {
      if (waitingForSecond) return prev;
      if (prev.length <= 1) return '0';
      const next = prev.slice(0, -1);
      return next === '-' || next === '' ? '0' : next;
    });
  };

  const performCalculation = (currentOperator, a, b) => {
    switch (currentOperator) {
      case 'add':
        return a + b;
      case 'subtract':
        return a - b;
      case 'multiplication':
        return a * b;
      case 'divide':
        if (b === 0) {
          setError(t('calculator.cannotDivideByZero'));
          return null;
        }
        return a / b;
      case 'percent':
        // percentage of first value (a) by b -> a * b / 100
        return (a * b) / 100;
      default:
        return b;
    }
  };

  const handleOperator = (nextOperator) => {
    const inputValue = parseFloat(display);
    if (Number.isNaN(inputValue)) {
      setError(t('calculator.invalidNumber'));
      return;
    }

    if (firstValue == null) {
      setFirstValue(inputValue);
    } else if (operator && !waitingForSecond) {
      const result = performCalculation(operator, firstValue, inputValue);
      if (result == null) {
        setDisplay('0');
        setFirstValue(null);
        setOperator(null);
        setWaitingForSecond(false);
        return;
      }
      setFirstValue(result);
      setDisplay(String(result));
    }

    setOperator(nextOperator);
    setWaitingForSecond(true);
    setError('');
  };

  const handleEquals = () => {
    if (!operator || firstValue == null) return;
    const secondValue = parseFloat(display);
    if (Number.isNaN(secondValue)) {
      setError(t('calculator.invalidNumber'));
      return;
    }

    const result = performCalculation(operator, firstValue, secondValue);
    if (result == null) {
      setDisplay('0');
      setFirstValue(null);
      setOperator(null);
      setWaitingForSecond(false);
      return;
    }
    setDisplay(String(result));
    setFirstValue(null);
    setOperator(null);
    setWaitingForSecond(false);
    setError('');
  };

  const handleToggleSign = () => {
    setError('');
    setDisplay((prev) => {
      if (prev === '0') return prev;
      return prev.startsWith('-') ? prev.slice(1) : `-${prev}`;
    });
  };

  return (
    <div className="app-container">
      <section className="calculator-card" aria-label={t('calculator.title')}>
        <div className="calculator-left-panel">
          <div className="calculator__header">
            <h2 className="calculator__title">{t('calculator.title')}</h2>
            <span
              className={`calculator__active-operator${currentOperatorSymbol ? '' : ' is-empty'}`}
            >
              {currentOperatorSymbol || '+'}
            </span>
          </div>

          <div className="calculator__display" aria-live="polite" aria-atomic="true">
            {error ? (
              <span className="calculator__error">{error}</span>
            ) : (
              <>
                <span className="calculator__operation">{operationPreview}</span>
                <span className="calculator__value">{formatDisplayValue(display)}</span>
              </>
            )}
          </div>
        </div>

        <div
          className="calculator__keys"
          role="group"
          aria-label={t('common.accessibility.calculatorKeypad')}
        >
          <button
            type="button"
            className="calculator__key calculator__key--util"
            onClick={clearAll}
          >
            C
          </button>
          <button
            type="button"
            className="calculator__key calculator__key--util"
            onClick={handleBackspace}
          >
            ⌫
          </button>
          <button
            type="button"
            className="calculator__key calculator__key--util"
            onClick={handleToggleSign}
          >
            ±
          </button>
          <button
            type="button"
            className="calculator__key calculator__key--op"
            onClick={() => handleOperator('percent')}
          >
            %
          </button>

          <button type="button" className="calculator__key" onClick={() => handleDigit('7')}>
            7
          </button>
          <button type="button" className="calculator__key" onClick={() => handleDigit('8')}>
            8
          </button>
          <button type="button" className="calculator__key" onClick={() => handleDigit('9')}>
            9
          </button>
          <button
            type="button"
            className="calculator__key calculator__key--op"
            onClick={() => handleOperator('divide')}
          >
            ÷
          </button>

          <button type="button" className="calculator__key" onClick={() => handleDigit('4')}>
            4
          </button>
          <button type="button" className="calculator__key" onClick={() => handleDigit('5')}>
            5
          </button>
          <button type="button" className="calculator__key" onClick={() => handleDigit('6')}>
            6
          </button>
          <button
            type="button"
            className="calculator__key calculator__key--op"
            onClick={() => handleOperator('multiplication')}
          >
            ×
          </button>

          <button type="button" className="calculator__key" onClick={() => handleDigit('1')}>
            1
          </button>
          <button type="button" className="calculator__key" onClick={() => handleDigit('2')}>
            2
          </button>
          <button type="button" className="calculator__key" onClick={() => handleDigit('3')}>
            3
          </button>
          <button
            type="button"
            className="calculator__key calculator__key--op"
            onClick={() => handleOperator('subtract')}
          >
            −
          </button>

          <button type="button" className="calculator__key" onClick={() => handleDigit('0')}>
            0
          </button>
          <button type="button" className="calculator__key" onClick={handleDecimal}>
            .
          </button>
          <button
            type="button"
            className="calculator__key calculator__key--equals"
            onClick={handleEquals}
          >
            =
          </button>
          <button
            type="button"
            className="calculator__key calculator__key--op"
            onClick={() => handleOperator('add')}
          >
            +
          </button>
        </div>
      </section>
      {currentActiveTask && currentActiveTask.path.includes('/calculator') && (
        <button className="finish-task-btn" onClick={handleFinish}>
          {t('common.finish')}
        </button>
      )}
    </div>
  );
};

export default Calculator;
