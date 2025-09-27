<template>
  <div v-if="!isOnline" class="offline-indicator">
    <div class="offline-content">
      <div class="offline-icon">📱</div>
      <div class="offline-text">
        <h4>Offline Mod</h4>
        <p v-if="pendingSyncCount > 0">
          {{ pendingSyncCount }} öğe senkronizasyon bekliyor
        </p>
        <p v-else>
          İnternet bağlantısı yok, ancak uygulama çalışmaya devam ediyor
        </p>
      </div>
      <button 
        v-if="pendingSyncCount > 0" 
        @click="forceSync" 
        class="sync-btn"
        :disabled="syncing"
      >
        {{ syncing ? 'Senkronize Ediliyor...' : 'Senkronize Et' }}
      </button>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import offlineService from '../services/offlineService'

export default {
  name: 'OfflineIndicator',
  data() {
    return {
      syncing: false
    }
  },
  computed: {
    ...mapState(['isOnline', 'pendingSyncCount'])
  },
  methods: {
    async forceSync() {
      this.syncing = true
      try {
        await offlineService.forceSync()
        this.$store.commit('SET_PENDING_SYNC_COUNT', offlineService.getPendingSyncCount())
      } catch (error) {
        console.error('Senkronizasyon hatası:', error)
      } finally {
        this.syncing = false
      }
    }
  },
  mounted() {
    // Bağlantı durumu dinleyicileri
    window.addEventListener('online', () => {
      this.$store.commit('SET_ONLINE_STATUS', true)
    })
    
    window.addEventListener('offline', () => {
      this.$store.commit('SET_ONLINE_STATUS', false)
    })
    
    // Pending sync count'u güncelle
    this.$store.commit('SET_PENDING_SYNC_COUNT', offlineService.getPendingSyncCount())
  }
}
</script>

<style scoped>
.offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
  z-index: 9999;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.offline-content {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  gap: 1rem;
}

.offline-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.offline-text {
  flex: 1;
}

.offline-text h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.offline-text p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.sync-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.sync-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.sync-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .offline-content {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
  }
  
  .offline-text {
    order: 2;
  }
  
  .sync-btn {
    order: 3;
    width: 100%;
  }
}
</style>
