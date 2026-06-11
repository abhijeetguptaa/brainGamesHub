const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const enPath = path.join(localesDir, 'en', 'en.json');
const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Common translations of "Kids" to remove from branding
const kidsWords = [
    'Kids', 'किड्स', 'niños', 'børn', 'kinder', 'novedades', 'niño', 'garçons', 'enfants', 'ragazzi', 'bambini', 'děti',
    'lapset', 'ילדים', 'gyerekek', 'anak-anak', '子供', '아이들', 'barn', 'kinderen', 'dzieci', 'crianças', 'copii', 'дети',
    'deti', 'เด็ก', 'çocuklar', 'діти', 'trẻ em', '儿童'
];

function deepSync(target, source) {
    for (let key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepSync(target[key], source[key]);
        } else {
            // Only update if target is missing or if it's a new key we want to force-sync (like mathWorksheets)
            // But here the user said "sync all other locales", so we should ensure structure is same.
            if (target[key] === undefined) {
                target[key] = source[key];
            }
        }
    }
    for (let key in target) {
        if (source[key] === undefined) delete target[key];
    }
}

function cleanString(str) {
    let newStr = str;
    // Revert "Smart Learning" to "Smart Kids Learning"
    newStr = newStr.replace(/Smart\s+Learning/gi, 'Smart Kids Learning');
    // Hindi
    newStr = newStr.replace(/स्मार्ट\s+लर्निंग/gi, 'स्मार्ट किड्स लर्निंग');
    return newStr.trim();
}

function deepClean(obj) {
    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = cleanString(obj[key]);
            
            // Rename category label
            if (key === 'junior' && (obj[key].toLowerCase() === 'kids' || kidsWords.some(w => obj[key].includes(w)))) {
                obj[key] = 'Junior';
            }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            deepClean(obj[key]);
        }
    }
}

function processLocale(locale) {
    if (locale === 'en') return;
    const filePath = path.join(localesDir, locale, `${locale}.json`);
    if (!fs.existsSync(filePath)) return;

    let json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // 1. Sync structure from English
    deepSync(json, enJson);
    
    // 2. Clean up branding
    deepClean(json);
    
    // 3. Ensure junior key is used
    if (json.home && json.home.categories) {
        if (json.home.categories.kids) {
            json.home.categories.junior = json.home.categories.kids;
            delete json.home.categories.kids;
        }
        if (json.home.categories.junior && (json.home.categories.junior.toLowerCase().includes('kids') || kidsWords.some(w => json.home.categories.junior.includes(w)))) {
            json.home.categories.junior = 'Junior';
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
}

const locales = fs.readdirSync(localesDir);
locales.forEach(processLocale);
console.log('Final sync and cleanup completed.');
