<template>
  <div class="language-switcher">
    <select v-model="selectedLanguage" @change="changeLanguage" class="language-select">
      <option value="tr">🇹🇷 Türkçe</option>
      <option value="en">🇺🇸 English</option>
      <option value="de">🇩🇪 Deutsch</option>
    </select>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'LanguageSwitcher',
  setup() {
    const { locale } = useI18n()
    
    return {
      selectedLanguage: locale
    }
  },
  methods: {
    changeLanguage() {
      this.$i18n.locale = this.selectedLanguage
      localStorage.setItem('language', this.selectedLanguage)
    }
  }
}
</script>

<style scoped>
.language-switcher {
  display: flex;
  align-items: center;
}

.language-select {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.language-select:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.language-select:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.language-select option {
  background: #333;
  color: white;
}
</style>
