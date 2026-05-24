import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import en from './en.json';
import am from './am.json';

const detectLanguage = async () => {
  try {
    const saved = await SecureStore.getItemAsync('language');
    return saved || 'en';
  } catch {
    return 'en';
  }
};

detectLanguage().then((lang) => {
  i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, am: { translation: am } },
    lng: lang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
});

export default i18n;
