const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src/locales/en/en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function merge(source, target) {
  const result = { ...target };
  for (const key in source) {
    if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = merge(source[key], target[key] || {});
    } else if (target[key] === undefined) {
      result[key] = source[key];
      result.__isNew = true; // Mark as new for translation
    }
  }
  return result;
}

const locales = [
  'ar',
  'bn',
  'cs',
  'da',
  'de',
  'es',
  'es-419',
  'es-ES',
  'fi',
  'fr',
  'he',
  'hi',
  'hu',
  'id',
  'it',
  'ja',
  'ko',
  'nb',
  'nl',
  'pl',
  'pt',
  'pt-BR',
  'ro',
  'ru',
  'sk',
  'sv',
  'th',
  'tr',
  'uk',
  'vi',
  'zh-CN',
];

locales.forEach((lang) => {
  const langPath = path.join(__dirname, `src/locales/${lang}/${lang}.json`);
  if (!fs.existsSync(langPath)) return;
  const target = JSON.parse(fs.readFileSync(langPath, 'utf8'));
  merge(en, target);

  // Find all keys that need translation (marked with __isNew or still in English)
  // For simplicity, this script just identifies what's missing.
  // I will then provide the translations.
});
