import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * Library atoms call useTranslation(). Without an initialised instance every
 * mount logs a warning and `t` behaviour is version-dependent. A pass-through
 * instance renders each key exactly as written.
 */
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: {} } },
  parseMissingKeyHandler: (key: string) => key,
  interpolation: { escapeValue: false },
});

export default i18n;
