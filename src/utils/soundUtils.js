// ======================================================
// MODERN CAPACITOR TTS + AUDIO MANAGER (ANDROID SAFE)
// JS VERSION (for App.jsx compatibility)
// Uses: @capacitor-community/text-to-speech
// ======================================================

let clickSound = null;
let applauseSound = null;
const CLICK_SRC = '/sounds/heavy_khatak_wood_press.wav';
const APPLAUSE_SRC = '/applause.mp3';

export function playClick() {
  if (!clickSound) {
    clickSound = new Audio(CLICK_SRC);
    clickSound.loop = false;
  }
  clickSound.volume = getGameVolume() * 10;
  const playPromise = clickSound.play();
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      console.log('Audio play failed:', error);
    });
  }
}

export function playApplauseSound() {
  if (!applauseSound) {
    applauseSound = new Audio(APPLAUSE_SRC);
    applauseSound.loop = false;
  }
  applauseSound.volume = getGameVolume() * 2; // Was 0.5 * (0.3 + getGameVolume()) => 0.2 at max 0.1
  const playPromise = applauseSound.play();
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      console.log('Applause play failed:', error);
    });
  }
}

// Listen for volume changes to update active sound objects
if (typeof window !== 'undefined') {
  window.addEventListener('volumechange', (e) => {
    const newVol = e.detail.volume;
    if (clickSound) clickSound.volume = newVol * 10;
    if (applauseSound) applauseSound.volume = newVol * 2;
  });
}

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import i18n from '../i18n';

// ======================================================
// GLOBAL STATE
// ======================================================
let queuedSpeech = [];
let isSpeaking = false;
let audioContext = null;
let activeSources = [];

// ======================================================
// AUDIO CONTEXT
// ======================================================
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

const scheduleTone = async (type, freqStart, freqEnd, duration, gainValue, delayMs = 0) => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const startTime = ctx.currentTime + delayMs / 1000;
    const endTime = startTime + duration;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const source = { osc, gain };
    activeSources.push(source);

    osc.onended = () => {
      activeSources = activeSources.filter((s) => s !== source);
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        /* Ignore errors if already stopped */
      }
    };

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, startTime);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, endTime);
    }

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainValue * (getGameVolume() * 21), startTime + 0.01); // Was gainValue * (2 + getGameVolume()) => 2.1 at max 0.1
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(endTime);
  } catch {
    console.warn('Tone failed');
  }
};

export const unlockAudio = async () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
  } catch {
    console.warn('Audio unlock failed');
  }
};

// ======================================================
// LEGACY COMPATIBILITY EXPORTS (NO-OP IN CAPACITOR TTS)
// ======================================================
export const initTTS = async () => true;
export const preloadNativeSounds = async () => true;

// ======================================================
// SIMPLE UI TONES
// ======================================================
const playTone = (type, freqStart, freqEnd, duration, gainValue) =>
  scheduleTone(type, freqStart, freqEnd, duration, gainValue);

export const stopAllTones = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  activeSources.forEach((source) => {
    try {
      source.gain.gain.cancelScheduledValues(now);
      source.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      source.osc.stop(now + 0.05);
    } catch {
      /* Ignore errors if already stopped */
    }
  });
  activeSources = [];
};

export const playClickSound = () => playTone('sine', 600, 300, 0.2, 1);
export const playTapSound = () => playTone('sine', 600, null, 0.04, 0.8);
export const playCardFlipSound = () => playTone('sine', 400, 1400, 0.12, 0.8);
export const playSparklePop = () => {
  const tones = [1800, 2200, 2600, 3000];
  tones.forEach((freq, i) => {
    scheduleTone('sine', freq, freq + 200, 0.08, 0.25, i * 40);
  });
};

export const playCorrectSound = () => {
  const tones = [523.25, 659.25, 783.99]; // C5, E5, G5
  tones.forEach((freq, i) => {
    scheduleTone('sine', freq, freq + 100, 0.3, 0.6, i * 100);
  });
};

export const playIncorrectSound = () => {
  const tones = [392.0, 349.23, 329.63]; // G4, F4, E4
  tones.forEach((freq, i) => {
    scheduleTone('sine', freq, freq - 50, 0.4, 0.5, i * 200);
  });
};

export const playWheelSpinSound = () => {
  // A rapid succession of clicks or a descending slide
  for (let i = 0; i < 40; i++) {
    scheduleTone('triangle', 800 - i * 15, 100, 0.1, 0.15, i * 100);
  }
};

export const playWinFreeSpinSound = () => {
  const tones = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 (Major Arpeggio)
  tones.forEach((freq, i) => {
    scheduleTone('sine', freq, freq + 50, 0.25, 0.6, i * 120);
  });
};

export const playMultiplierRevealSound = () => {
  const tones = [880, 1108.73, 1318.51, 1760]; // A5, C#6, E6, A6
  tones.forEach((freq, i) => {
    scheduleTone('sine', freq, freq + 100, 0.1, 0.3, i * 80);
  });
};

export const playMultiplierWinSound = () => {
  const tones = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  tones.forEach((freq, i) => {
    scheduleTone('sine', freq, freq + 200, 0.4, 0.8, i * 150);
  });
};

export const playTileDropSound = () => playTone('sine', 400, 200, 0.05, 0.2); // Quieter
export const playMatchBurstSound = () => playTone('sine', 800, 1000, 0.12, 0.3); // Softer pop
export const playRowClearSound = () => {
  const tones = [440, 554, 659]; // Softer musical notes
  tones.forEach((freq, i) => {
    scheduleTone('sine', freq, freq + 50, 0.15, 0.2, i * 60);
  });
};
export const playBombSound = () => playTone('triangle', 100, 40, 0.4, 0.4); // Softer, deeper thump
export const playColorBlastSound = () => {
  for (let i = 0; i < 8; i++) {
    scheduleTone('sine', 800 + i * 150, 400, 0.1, 0.15, i * 40);
  }
};

// ======================================================
// CAPACITOR TTS
// ======================================================
const flushQueue = async () => {
  if (isSpeaking || queuedSpeech.length === 0) return;

  const item = queuedSpeech.shift();
  if (!item) return;

  if (typeof item === 'string') {
    await speakText(item);
  } else {
    await speakText(item.text, item.options);
  }
};

export const speakText = async (text, options = {}) => {
  if (!text || !text.trim()) return;
  if (isSpeaking) {
    queuedSpeech.push({ text, options });
    return;
  }

  try {
    isSpeaking = true;

    // Mature professional voice defaults: pitch 1.0, rate 0.9 (natural but clear)
    const finalOptions = {
      lang: i18n.language || 'en-US',
      rate: 0.9,
      pitch: 1.0,
      volume: getGameVolume() * 16,
      ...options,
    };

    // Safety timeout: Native TTS engines can sometimes hang
    const speakPromise = TextToSpeech.speak({
      text,
      ...finalOptions,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TTS_TIMEOUT')), 10000),
    );

    await Promise.race([speakPromise, timeoutPromise]);
  } catch (error) {
    if (
      error?.message?.includes('cancel') ||
      error?.message?.includes('interrupted') ||
      error?.message === 'TTS_TIMEOUT'
    ) {
      // Expected interruptions
    } else {
      console.warn('TTS speak failed:', error);
    }
  } finally {
    isSpeaking = false;
    queueMicrotask(() => flushQueue());
  }
};

export const stopSpeech = async () => {
  queuedSpeech = [];
  isSpeaking = false;

  try {
    await TextToSpeech.stop();
  } catch {
    // Already stopped
  }
};

export const speakNumber = (n) => speakText(String(n));

// ======================================================
// HELPERS
// ======================================================
export const isSpeechSupported = () => true;

export const getGameVolume = () => {
  const storedVolume = localStorage.getItem('gameVolume');
  return storedVolume ? parseFloat(storedVolume) : 0.1;
};
