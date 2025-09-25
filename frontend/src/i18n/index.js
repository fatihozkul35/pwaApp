import { createI18n } from 'vue-i18n'
import tr from './locales/tr.json'
import en from './locales/en.json'
import de from './locales/de.json'

const messages = {
  tr,
  en,
  de
}

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('language') || 'tr', // Default to Turkish
  fallbackLocale: 'en',
  messages
})

export default i18n
