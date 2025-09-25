<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <router-link to="/" class="nav-brand">
          {{ $t('nav.appName') }}
        </router-link>
        <div class="nav-menu">
          <router-link to="/" class="nav-link">{{ $t('nav.home') }}</router-link>
          <router-link to="/tasks" class="nav-link">{{ $t('nav.tasks') }}</router-link>
          <router-link to="/notes" class="nav-link">{{ $t('nav.notes') }}</router-link>
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view/>
    </main>
    
    <footer class="footer">
      <p>&copy; 2024 {{ $t('nav.appName') }}. {{ $t('footer.copyright') }}</p>
    </footer>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

export default {
  components: {
    LanguageSwitcher
  },
  name: 'App',
  async created() {
    // Önce localStorage'dan verileri yükle (hızlı görüntü için)
    this.loadFromLocalStorage()
    // Sonra backend'den güncel verileri yükle
    await this.loadInitialData()
  },
  methods: {
    ...mapActions(['fetchTasks', 'fetchNotes']),
    loadFromLocalStorage() {
      // localStorage'dan verileri yükle
      const savedTasks = localStorage.getItem('tasks')
      const savedNotes = localStorage.getItem('notes')
      
      if (savedTasks) {
        this.$store.commit('SET_TASKS', JSON.parse(savedTasks))
      }
      if (savedNotes) {
        this.$store.commit('SET_NOTES', JSON.parse(savedNotes))
      }
    },
    async loadInitialData() {
      try {
        await Promise.all([
          this.fetchTasks(),
          this.fetchNotes()
        ])
      } catch (error) {
        console.error('Veri yükleme hatası:', error)
      }
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
}

.nav-menu {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}

.footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-menu {
    gap: 1rem;
  }
  
  .main-content {
    padding: 1rem;
  }
}
</style>
