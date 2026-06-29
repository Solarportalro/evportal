import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hy from "./locales/hy.json";
import ru from "./locales/ru.json";

export const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  resources: {
    hy: { translation: hy },
    ru: { translation: ru },
    en: { translation: en }
  },
  lng: "hy",
  fallbackLng: "hy",
  interpolation: {
    escapeValue: false
  }
});
