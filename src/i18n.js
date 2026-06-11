import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const supportedLngs = [
  'en',
  'ar',
  'bn',
  'cs',
  'da',
  'de',
  'es',
  'es-ES',
  'es-419',
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

const localeLoaders = {
  ar: () => import('./locales/ar/ar.json'),
  bn: () => import('./locales/bn/bn.json'),
  cs: () => import('./locales/cs/cs.json'),
  da: () => import('./locales/da/da.json'),
  en: () => import('./locales/en/en.json'),
  de: () => import('./locales/de/de.json'),
  es: () => import('./locales/es/es.json'),
  'es-ES': () => import('./locales/es-ES/es-ES.json'),
  'es-419': () => import('./locales/es-419/es-419.json'),
  fi: () => import('./locales/fi/fi.json'),
  fr: () => import('./locales/fr/fr.json'),
  he: () => import('./locales/he/he.json'),
  hi: () => import('./locales/hi/hi.json'),
  hu: () => import('./locales/hu/hu.json'),
  id: () => import('./locales/id/id.json'),
  it: () => import('./locales/it/it.json'),
  nb: () => import('./locales/nb/nb.json'),
  nl: () => import('./locales/nl/nl.json'),
  pl: () => import('./locales/pl/pl.json'),
  pt: () => import('./locales/pt/pt.json'),
  'pt-BR': () => import('./locales/pt-BR/pt-BR.json'),
  ro: () => import('./locales/ro/ro.json'),
  ru: () => import('./locales/ru/ru.json'),
  sk: () => import('./locales/sk/sk.json'),
  sv: () => import('./locales/sv/sv.json'),
  th: () => import('./locales/th/th.json'),
  tr: () => import('./locales/tr/tr.json'),
  uk: () => import('./locales/uk/uk.json'),
  vi: () => import('./locales/vi/vi.json'),
  'zh-CN': () => import('./locales/zh-CN/zh-CN.json'),
  ja: () => import('./locales/ja/ja.json'),
  ko: () => import('./locales/ko/ko.json'),
};

const dynamicLocaleBackend = {
  type: 'backend',
  init: () => {},
  read: async (language, _namespace, callback) => {
    try {
      const requested = language || 'en';
      const normalized = requested.split('-')[0];
      const loader = localeLoaders[requested] || localeLoaders[normalized] || localeLoaders.en;
      const module = await loader();
      callback(null, module.default);
    } catch (error) {
      callback(error, false);
    }
  },
};

i18n
  .use(dynamicLocaleBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: import.meta.env.DEV,
    fallbackLng: 'en',
    supportedLngs,
    ns: ['translation'],
    defaultNS: 'translation',
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export default i18n;
