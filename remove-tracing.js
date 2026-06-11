const fs = require('fs');
const path = require('path');

const localesDir = 'D:\\Projects\\math-exercise-app\\src\\locales';

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let json;
  try {
    json = JSON.parse(content);
  } catch (e) {
    console.error(`Error parsing ${filePath}: ${e}`);
    return;
  }

  let changed = false;

  // Remove top-level tracing
  if (Object.prototype.hasOwnProperty.call(json, 'tracing')) {
    delete json.tracing;
    changed = true;
  }

  // Remove home.subjects.tracing
  if (json.home && json.home.subjects && Object.prototype.hasOwnProperty.call(json.home.subjects, 'tracing')) {
    delete json.home.subjects.tracing;
    changed = true;
  }

  if (changed) {
    // Preserve 2nd argument of JSON.stringify to match existing indentation if possible
    // en.json used 2 spaces.
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`Processed ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.json')) {
      processFile(fullPath);
    }
  }
}

walkDir(localesDir);
