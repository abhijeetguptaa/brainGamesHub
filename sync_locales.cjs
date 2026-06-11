const fs = require('fs');
const path = require('path');

const localesDir = path.join('src', 'locales');
const enPath = path.join(localesDir, 'en', 'en.json');

if (!fs.existsSync(enPath)) {
  console.error('Source file en.json not found!');
  process.exit(1);
}

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

/**
 * Recursively syncs target object with source object.
 * Adds missing keys, removes extra keys, and keeps existing translations.
 */
function syncObjects(source, target) {
  const result = {};

  // 1. Add/Update keys from source
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        // If it's an object, recurse
        result[key] = syncObjects(source[key], target[key] || {});
      } else {
        // If it's a primitive or array, use target value if exists, else source value
        result[key] = Object.prototype.hasOwnProperty.call(target, key) ? target[key] : source[key];
      }
    }
  }

  return result;
}

const locales = fs.readdirSync(localesDir).filter(f => {
  const fullPath = path.join(localesDir, f);
  return fs.statSync(fullPath).isDirectory() && f !== 'en';
});

locales.forEach(locale => {
  const filePath = path.join(localesDir, locale, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    // Optional: Create it if it doesn't exist
    // fs.writeFileSync(filePath, JSON.stringify(enData, null, 2) + '\n', 'utf8');
    return;
  }

  try {
    const targetData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const syncedData = syncObjects(enData, targetData);

    fs.writeFileSync(filePath, JSON.stringify(syncedData, null, 2) + '\n', 'utf8');
    console.log(`Synced: ${locale}`);
  } catch (err) {
    console.error(`Error processing ${locale}:`, err);
  }
});
