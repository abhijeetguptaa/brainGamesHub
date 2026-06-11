import React from 'react';
import { MATH_OPERATORS, DIFFICULTY_LEVELS } from '../constants/appConstants';

// Math operation constants
export const OPERATORS = MATH_OPERATORS;

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
    operator === MATH_OPERATORS.Multiplication || operator === MATH_OPERATORS.Division ? maxMulti || maxNum : maxNum;

  // If we have a previous answer, we use it as num1.
  // We need to ensure the question remains valid and within complexity limits.
  let question;
  if (previousAnswer !== null && previousAnswer !== undefined) {
    // If the previous answer is too large or 0, we might need to reset or cap it for some operators
    let num1 = previousAnswer;

    // Safety: if num1 is 0, we can't do division or multiplication well in this context
    if (num1 <= 0) num1 = Math.floor(Math.random() * 5) + 1;

    // For Subtraction, ensure num2 is smaller than num1
    if (operator === MATH_OPERATORS.Subtraction) {
      let num2 = Math.floor(Math.random() * num1) + 1;
      let correctAnswer = num1 - num2;
      question = {
        num1,
        num2,
        correctAnswer,
        options: generateOptions(correctAnswer),
      };
    } else if (operator === MATH_OPERATORS.Division) {
      // Find a divisor of num1
      let divisors = [];
      for (let i = 2; i <= num1; i++) {
        if (num1 % i === 0) divisors.push(i);
      }
      if (divisors.length > 0) {
        let num2 = divisors[Math.floor(Math.random() * divisors.length)];
        let correctAnswer = num1 / num2;
        question = {
          num1,
          num2,
          correctAnswer,
          options: generateOptions(correctAnswer),
        };
      } else {
        // Fallback: if no divisors (prime or 1), just do addition
        operator = MATH_OPERATORS.Addition;
        let num2 = Math.floor(Math.random() * effectiveComplexity) + 1;
        let correctAnswer = num1 + num2;
        question = {
          num1,
          num2,
          correctAnswer,
          options: generateOptions(correctAnswer),
        };
      }
    } else if (operator === MATH_OPERATORS.Multiplication) {
      // Keep multiplication simple if num1 is already large
      let limit = num1 > 10 ? 5 : 10;
      let num2 = Math.floor(Math.random() * limit) + 1;
      let correctAnswer = num1 * num2;
      question = {
        num1,
        num2,
        correctAnswer,
        options: generateOptions(correctAnswer),
      };
    } else {
      // Addition
      let num2 = Math.floor(Math.random() * effectiveComplexity) + 1;
      let correctAnswer = num1 + num2;
      question = {
        num1,
        num2,
        correctAnswer,
        options: generateOptions(correctAnswer),
      };
    }
  } else {
    question = generateQuestion(operator, effectiveComplexity);
  }

  return { ...question, operator };
};

// Helper for generateMentalMathQuestion
function generateOptions(correctAnswer) {
  let options = [correctAnswer];
  // Generate wrong options
  let fallback = 1;
  while (options.length < 4 && fallback < 100) {
    let offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
    let candidate = correctAnswer + offset;
    if (candidate > 0 && !options.includes(candidate)) {
      options.push(candidate);
    }
    fallback++;
  }
  // Ensure variety if random fails
  while (options.length < 4) {
    let candidate = options.length * 7 + Math.floor(Math.random() * 10);
    if (!options.includes(candidate)) options.push(candidate);
  }

  return shuffleArray(options);
}

// Range sets
export const RANGE_SET1 = [10, 25, 50, 99];
export const RANGE_SET2 = [5, 10, 20, 30];
export const RANGE_SET_MULTI = [10, 20, 50, 100];

// For dropdowns, use string values for compatibility
export const COMPLEXITY_RANGE_SET1 = RANGE_SET1.map((n) => `<${n}`);
export const COMPLEXITY_RANGE_SET2 = RANGE_SET2.map((n) => `<${n}`);
export const COMPLEXITY_RANGE_SET_MULTI = RANGE_SET_MULTI.map((n) => `<${n}`);

// Helper to get correct range set for an operator
export function getRangeSetForOperator(operator) {
  if (operator === MATH_OPERATORS.Multiplication || operator === MATH_OPERATORS.Division) {
    return COMPLEXITY_RANGE_SET_MULTI;
  }
  return COMPLEXITY_RANGE_SET1;
}

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
    case MATH_OPERATORS.Comparison:
      return '_';
    case MATH_OPERATORS.Ascending:
      return '↑';
    case MATH_OPERATORS.Descending:
      return '↓';
    default:
      return '+';
  }
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

// Helper to robustly detect Cordova/Capacitor
export function isCordovaOrCapacitor() {
  return (
    typeof window !== 'undefined' &&
    window.cordova &&
    (window.Capacitor || window.cordova.platformId)
  );
}

// Helper to check if Cordova File and SocialSharing plugins are available
export function hasCordovaFileAndSharing() {
  return (
    typeof window !== 'undefined' &&
    window.resolveLocalFileSystemURL &&
    window.cordova &&
    window.cordova.file &&
    window.plugins &&
    window.plugins.socialsharing
  );
}

// Helper to convert base64 to Blob
export function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

export const generateQuestion = (operator, complexity) => {
  const rangeSet =
    operator === MATH_OPERATORS.Multiplication || operator === MATH_OPERATORS.Division
      ? RANGE_SET_MULTI
      : RANGE_SET1;
  const index = rangeSet.indexOf(complexity);
  const minVal = index > 0 ? rangeSet[index - 1] + 1 : 1;

  if (operator === MATH_OPERATORS.Ascending || operator === MATH_OPERATORS.Descending) {
    // Generate 4 random numbers
    const numbers = [];
    while (numbers.length < 3) {
      const num = Math.floor(Math.random() * (complexity - minVal + 1)) + minVal;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }

    // Create correct answer (ascending or descending)
    const correctOrder =
      operator === MATH_OPERATORS.Ascending
        ? [...numbers].sort((a, b) => a - b)
        : [...numbers].sort((a, b) => b - a);

    // Determine separator based on operator
    const separator = operator === MATH_OPERATORS.Ascending ? ' < ' : ' > ';

    // Generate 3 wrong arrangements
    const correctAnswer = correctOrder.join(separator);
    const options = [correctAnswer];
    while (options.length < 4) {
      const wrongArrangement = shuffleArray(numbers);
      const wrongOption = wrongArrangement.join(separator);
      if (!options.includes(wrongOption)) {
        options.push(wrongOption);
      }
    }
    return {
      numbers,
      correctAnswer: correctAnswer,
      options: shuffleArray(options),
    };
  }

  if (operator === MATH_OPERATORS.Comparison) {
    let num1 = Math.floor(Math.random() * (complexity - minVal + 1)) + minVal;
    let num2 = Math.floor(Math.random() * (complexity - minVal + 1)) + minVal;
    // Optionally, avoid num1 === num2 too often for more variety
    return { num1, num2 };
  }
  // For Add, Minus, Times, Division
  let num1 = Math.floor(Math.random() * (complexity - minVal + 1)) + minVal;
  let num2 = Math.floor(Math.random() * (complexity - minVal + 1)) + minVal;

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
  let options = [correctAnswer];
  // Generate wrong options: plausible, same last digit, within ±10%
  const plausibleSet = new Set([correctAnswer]);
  const plausibleOptions = [];
  const correctLastDigit = Math.abs(correctAnswer) % 10;
  const minPlausibleVal = Math.max(1, Math.floor(correctAnswer * 0.9));
  const maxPlausibleVal = Math.ceil(correctAnswer * 1.1);
  for (
    let candidate = minPlausibleVal;
    candidate <= maxPlausibleVal && plausibleOptions.length < 10;
    candidate++
  ) {
    if (
      candidate !== correctAnswer &&
      Math.abs(candidate) % 10 === correctLastDigit &&
      candidate > 0
    ) {
      plausibleOptions.push(candidate);
      plausibleSet.add(candidate);
    }
  }
  // Shuffle plausibleOptions
  const shuffledPlausible = shuffleArray(plausibleOptions);
  for (let i = 0; options.length < 4 && i < shuffledPlausible.length; i++) {
    if (!options.includes(shuffledPlausible[i])) {
      options.push(shuffledPlausible[i]);
    }
  }
  // If not enough, fill with other positive numbers with same last digit
  let fallback = 1;
  while (options.length < 4 && fallback < 1000) {
    let candidate = fallback * 10 + correctLastDigit;
    if (!options.includes(candidate) && candidate > 0) {
      options.push(candidate);
    }
    fallback++;
  }
  // Final shuffle
  return {
    num1,
    num2,
    correctAnswer,
    options: shuffleArray(options),
  };
};

export const generateCustomQuestion = (operator, range1, range2) => {
  let num1 = Math.floor(Math.random() * range1) + 1;
  let num2 = Math.floor(Math.random() * range2) + 1;

  if (operator === MATH_OPERATORS.Subtraction) {
    if (num2 > num1) {
      [num1, num2] = [num2, num1];
    }
  }

  if (operator === MATH_OPERATORS.Division) {
    // Ensure num2 is not 0 (already handled by +1)
    // Make it divisible
    const result = Math.floor(Math.random() * range1) + 1;
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

  return { num1, num2, correctAnswer };
};

export async function loadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function getRandomVisibleColor() {
  let hue;
  do {
    hue = Math.floor(Math.random() * 360);
  } while (hue >= 180 && hue <= 300); // Avoid blue/cyan tones

  const saturation = 60 + Math.random() * 20; // 60-80% for vibrancy
  const lightness = 40 + Math.random() * 20; // 40-60% for good visibility
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function getRandomDarkColor() {
  const hue = Math.floor(Math.random() * 360); // 0–360
  const saturation = 50 + Math.random() * 30; // 50–80%
  const lightness = 15 + Math.random() * 20; // 15–35%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function generateDistinctColors(count) {
  const colors = [];
  const hueStep = 360 / count;
  for (let i = 0; i < count; i++) {
    const hue = (hueStep * i + Math.random() * (hueStep * 0.5)) % 360; // Spread hues and add a small random offset
    const saturation = 70 + Math.random() * 20; // 70-90% for vibrancy
    const lightness = 50 + Math.random() * 20; // 50-70% for good visibility
    colors.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`);
  }
  return colors;
}

export function createIcon(Icon, size) {
  return React.createElement(Icon, {
    size,
    color: getRandomVisibleColor(),
  });
}

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

/**
 * Calculates the coordinates of a pointer event relative to an element.
 * Handles both mouse and touch events.
 */
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
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    clientX = 0;
    clientY = 0;
  }

  // Calculate scale if canvas internal dimensions differ from CSS dimensions
  const scaleX = element.width ? element.width / rect.width : 1;
  const scaleY = element.height ? element.height / rect.height : 1;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
};

/**
 * Debounce utility
 */
export const debounce = (fn, ms) => {
  let timeoutId;
  return function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, ms);
  };
};
