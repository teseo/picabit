import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

void i18n.use(initReactI18next).init({
  lng: Localization.getLocales()[0].languageTag,
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        share: 'Share',
        save: 'Save',
      },
    },
    es: {
      translation: {
        share: 'Compartir',
        save: 'Guardar',
      },
    },
    af: {
      translation: {
        share: 'Deel',
        save: 'Stoor',
      },
    },
  },
});

export default i18n;
