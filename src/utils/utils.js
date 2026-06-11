import { MATH_OPERATORS, DIFFICULTY_LEVELS } from '../constants/appConstants';

// Math operation constants
export const OPERATORS = MATH_OPERATORS;

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 */
export const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Returns a random item from an array, or null for invalid/empty inputs.
 */
export const getRandomItem = (items) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
};

// Helper to shuffle array (Fisher-Yates)
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const generateQuestion = (operator, complexity) => {
  // For Add, Minus, Times, Division
  let num1 = Math.floor(Math.random() * complexity) + 1;
  let num2 = Math.floor(Math.random() * complexity) + 1;

  if (operator === MATH_OPERATORS.Subtraction) {
    if (num2 > num1) {
      [num1, num2] = [num2, num1];
    }
  }

  if (operator === MATH_OPERATORS.Multiplication) {
    let minNum2 = 2;
    let maxNum2 = 5;
    if (complexity <= 10) {
      minNum2 = 2;
      maxNum2 = 5;
    } else if (complexity <= 20) {
      minNum2 = 6;
      maxNum2 = 8;
    } else if (complexity <= 50) {
      minNum2 = 9;
      maxNum2 = 15;
    } else {
      minNum2 = 16;
      maxNum2 = 20;
    }

    num2 = Math.floor(Math.random() * (maxNum2 - minNum2 + 1)) + minNum2;
  }

  if (operator === MATH_OPERATORS.Division) {
    let minDivisor = 2;
    let maxDivisor = 5;
    let minQuotient = 1;
    let maxQuotient = 10;

    if (complexity <= 10) {
      minDivisor = 2;
      maxDivisor = 5;
      minQuotient = 1;
      maxQuotient = 10;
    } else if (complexity <= 20) {
      minDivisor = 6;
      maxDivisor = 8;
      minQuotient = 11;
      maxQuotient = 20;
    } else if (complexity <= 50) {
      minDivisor = 9;
      maxDivisor = 15;
      minQuotient = 21;
      maxQuotient = 50;
    } else {
      minDivisor = 16;
      maxDivisor = 20;
      minQuotient = 51;
      maxQuotient = 100;
    }

    num2 = Math.floor(Math.random() * (maxDivisor - minDivisor + 1)) + minDivisor;
    const result = Math.floor(Math.random() * (maxQuotient - minQuotient + 1)) + minQuotient;
    num1 = num2 * result;
  }
  let correctAnswer;
  switch (operator) {
    case MATH_OPERATORS.Addition:
      correctAnswer = num1 + num2;
      break;
    case MATH_OPERATORS.Subtraction:
      correctAnswer = num1 - num2;
      break;
    case MATH_OPERATORS.Multiplication:
      correctAnswer = num1 * num2;
      break;
    case MATH_OPERATORS.Division:
      correctAnswer = num1 / num2;
      break;
    default:
      correctAnswer = num1 + num2;
  }

  const generateOpts = (ans) => {
    let options = [ans];
    let fallback = 1;
    const correctLastDigit = Math.abs(ans) % 10;
    while (options.length < 4 && fallback < 100) {
      let offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
      let candidate = ans + offset;
      if (candidate > 0 && !options.includes(candidate)) {
        options.push(candidate);
      }
      fallback++;
    }
    while (options.length < 4) {
      let candidate = options.length * 10 + correctLastDigit;
      if (!options.includes(candidate)) options.push(candidate);
    }
    return shuffleArray(options);
  };

  return {
    num1,
    num2,
    correctAnswer,
    options: generateOpts(correctAnswer),
  };
};

export const generateMentalMathQuestion = (complexity, previousAnswer = null) => {
  let operator;
  let maxNum;
  let maxMulti;

  switch (complexity.toLowerCase()) {
    case DIFFICULTY_LEVELS.EASY:
      operator = Math.random() < 0.5 ? MATH_OPERATORS.Addition : MATH_OPERATORS.Subtraction;
      maxNum = 10;
      break;
    case DIFFICULTY_LEVELS.MEDIUM: {
      const randMed = Math.random();
      if (randMed < 0.4) operator = MATH_OPERATORS.Addition;
      else if (randMed < 0.8) operator = MATH_OPERATORS.Subtraction;
      else operator = MATH_OPERATORS.Multiplication;
      maxNum = 20;
      maxMulti = 10;
      break;
    }
    case DIFFICULTY_LEVELS.HARD: {
      const randHard = Math.random();
      if (randHard < 0.3) operator = MATH_OPERATORS.Addition;
      else if (randHard < 0.6) operator = MATH_OPERATORS.Subtraction;
      else if (randHard < 0.85) operator = MATH_OPERATORS.Multiplication;
      else operator = MATH_OPERATORS.Division;
      maxNum = 50;
      maxMulti = 15;
      break;
    }
    case DIFFICULTY_LEVELS.COMPLEX: {
      const randComp = Math.random();
      if (randComp < 0.25) operator = MATH_OPERATORS.Addition;
      else if (randComp < 0.5) operator = MATH_OPERATORS.Subtraction;
      else if (randComp < 0.75) operator = MATH_OPERATORS.Multiplication;
      else operator = MATH_OPERATORS.Division;
      maxNum = 100;
      maxMulti = 20;
      break;
    }
    default:
      operator = MATH_OPERATORS.Addition;
      maxNum = 10;
  }

  const effectiveComplexity =
    operator === MATH_OPERATORS.Multiplication || operator === MATH_OPERATORS.Division
      ? maxMulti || maxNum
      : maxNum;

  if (previousAnswer !== null && previousAnswer !== undefined) {
    let num1 = previousAnswer;
    if (num1 <= 0) num1 = Math.floor(Math.random() * 5) + 1;

    let question;
    if (operator === MATH_OPERATORS.Subtraction) {
      let num2 = Math.floor(Math.random() * num1) + 1;
      let correctAnswer = num1 - num2;
      question = { num1, num2, correctAnswer };
    } else if (operator === MATH_OPERATORS.Division) {
      let divisors = [];
      for (let i = 2; i <= num1; i++) {
        if (num1 % i === 0) divisors.push(i);
      }
      if (divisors.length > 0) {
        let num2 = divisors[Math.floor(Math.random() * divisors.length)];
        let correctAnswer = num1 / num2;
        question = { num1, num2, correctAnswer };
      } else {
        operator = MATH_OPERATORS.Addition;
        let num2 = Math.floor(Math.random() * effectiveComplexity) + 1;
        let correctAnswer = num1 + num2;
        question = { num1, num2, correctAnswer };
      }
    } else if (operator === MATH_OPERATORS.Multiplication) {
      let limit = num1 > 10 ? 5 : 10;
      let num2 = Math.floor(Math.random() * limit) + 1;
      let correctAnswer = num1 * num2;
      question = { num1, num2, correctAnswer };
    } else {
      let num2 = Math.floor(Math.random() * effectiveComplexity) + 1;
      let correctAnswer = num1 + num2;
      question = { num1, num2, correctAnswer };
    }

    const generateOpts = (ans) => {
      let options = [ans];
      let fallback = 1;
      while (options.length < 4 && fallback < 100) {
        let offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
        let candidate = ans + offset;
        if (candidate > 0 && !options.includes(candidate)) options.push(candidate);
        fallback++;
      }
      while (options.length < 4) {
        let candidate = options.length * 7 + Math.floor(Math.random() * 10);
        if (!options.includes(candidate)) options.push(candidate);
      }
      return shuffleArray(options);
    };

    return { ...question, options: generateOpts(question.correctAnswer), operator };
  } else {
    return { ...generateQuestion(operator, effectiveComplexity), operator };
  }
};

// Animation constants
export const EMOJI_ANIMATION_DURATION = 1500; // ms

// Quiz constants
export const QUIZ_ROUNDS = 10;

export const getOperator = (operator) => {
  switch (operator) {
    case MATH_OPERATORS.Addition:
      return '+';
    case MATH_OPERATORS.Subtraction:
      return '-';
    case MATH_OPERATORS.Multiplication:
      return '*';
    case MATH_OPERATORS.Division:
      return '/';
    case MATH_OPERATORS.MentalMath:
      return '±';
    default:
      return '+';
  }
};

export function getRandomVisibleColor() {
  let hue;
  do {
    hue = Math.floor(Math.random() * 360);
  } while (hue >= 180 && hue <= 300);
  return `hsl(${hue}, 70%, 50%)`;
}

export function getRandomDarkColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 60%, 25%)`;
}

export function generateDistinctColors(count) {
  const colors = [];
  const hueStep = 360 / count;
  for (let i = 0; i < count; i++) {
    const hue = (hueStep * i + Math.random() * (hueStep * 0.5)) % 360;
    colors.push(`hsla(${hue}, 80%, 60%, 0.3)`);
  }
  return colors;
}

export const getPointerCoordinates = (e, element) => {
  if (!element) return { x: 0, y: 0 };
  const rect = element.getBoundingClientRect();
  let clientX, clientY;
  if ('touches' in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if ('changedTouches' in e && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else if ('clientX' in e) {
    clientX = e?.clientX;
    clientY = e?.clientY;
  } else {
    clientX = 0;
    clientY = 0;
  }
  const scaleX = element.width ? element.width / rect.width : 1;
  const scaleY = element.height ? element.height / rect.height : 1;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
};

export const debounce = (fn, ms) => {
  let timeoutId;
  return function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, ms);
  };
};
