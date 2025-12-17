<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <router-link to="/" class="nav-brand">
          {{ $t('nav.appName') }}
        </router-link>
        
        <div class="nav-menu">
          <div class="nav-links">
            <router-link to="/tasks" class="nav-link">{{ $t('nav.tasks') }}</router-link>
          </div>
          
          <div class="nav-controls">
            <NotificationSettings @permission-granted="onPermissionGranted" @show-message="showMessage" />
          </div>
        </div>
      </div>
    </nav>
    
    <OfflineIndicator />
    
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
import NotificationSettings from './components/NotificationSettings.vue'
import OfflineIndicator from './components/OfflineIndicator.vue'
import notificationService from './services/notificationService'

export default {
  components: {
    NotificationSettings,
    OfflineIndicator
  },
  name: 'App',
  async created() {
    // Önce localStorage'dan verileri yükle (hızlı görüntü için)
    this.loadFromLocalStorage()
    // Sonra backend'den güncel verileri yükle
    await this.loadInitialData()
  },
  methods: {
    ...mapActions(['fetchTasks']),
    loadFromLocalStorage() {
      // localStorage'dan verileri yükle
      const savedTasks = localStorage.getItem('tasks')
      
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks)
        this.$store.commit('SET_TASKS', parsedTasks)
        // localStorage'dan yüklenen görevler için bildirimleri zamanla
        const tasks = Array.isArray(parsedTasks.results) ? parsedTasks.results : (Array.isArray(parsedTasks) ? parsedTasks : [])
        if (tasks.length > 0) {
          notificationService.scheduleNotificationsForTasks(tasks)
        }
      }
    },
    async loadInitialData() {
      try {
        await this.fetchTasks()
      } catch (error) {
        console.error('Veri yükleme hatası:', error)
      }
    },
    
    onPermissionGranted() {
      console.log('Bildirim izni alındı')
      // İsteğe bağlı: Hoş geldin bildirimi gönder
      notificationService.showReminderNotification('Bildirimler başarıyla etkinleştirildi!')
    },
    
    showMessage(message) {
      // Basit mesaj gösterimi (toast notification)
      console.log('Message:', message)
      // Burada toast notification bileşeni kullanılabilir
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
  position: relative;
  z-index: 1000;
  overflow: visible;
  flex-shrink: 0;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  flex-shrink: 0;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  transition: background-color 0.3s;
  white-space: nowrap;
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
    padding: 0 1rem;
  }
  
  .nav-menu {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }
  
  .nav-links {
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .nav-controls {
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .nav-link {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
  
  .main-content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 0.5rem;
  }
  
  .nav-links {
    flex-direction: column;
    width: 100%;
  }
  
  .nav-controls {
    flex-direction: column;
    width: 100%;
  }
  
  .nav-link {
    text-align: center;
    width: 100%;
  }
}
</style>
