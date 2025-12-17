<template>
  <div class="notification-settings">
    <button @click="toggleSettings" class="notification-icon-btn" :class="{ active: showSettings }">
      <span class="notification-icon">🔔</span>
    </button>

    <div v-if="showSettings" class="settings-content">
      <div class="settings-header">
        <h3>{{ $t('notifications.settings') }}</h3>
        <button @click="toggleSettings" class="close-btn">✕</button>
      </div>
      
      <div class="setting-item">
        <label class="setting-label">
          <input 
            type="checkbox" 
            v-model="settings.enabled"
            @change="updateSettings"
            class="setting-checkbox"
          >
          <span class="checkmark"></span>
          {{ $t('notifications.enableNotifications') }}
        </label>
      </div>

      <div v-if="settings.enabled" class="setting-item">
        <label class="setting-label">
          <input 
            type="checkbox" 
            v-model="settings.taskReminders"
            @change="updateSettings"
            class="setting-checkbox"
          >
          <span class="checkmark"></span>
          {{ $t('notifications.taskReminders') }}
        </label>
      </div>

      <div v-if="settings.enabled" class="setting-item">
        <label class="setting-label">
          <input 
            type="checkbox" 
            v-model="settings.sound"
            @change="updateSettings"
            class="setting-checkbox"
          >
          <span class="checkmark"></span>
          {{ $t('notifications.sound') }}
        </label>
      </div>

      <div v-if="settings.enabled" class="setting-item">
        <label class="setting-label">
          <input 
            type="checkbox" 
            v-model="settings.vibration"
            @change="updateSettings"
            class="setting-checkbox"
          >
          <span class="checkmark"></span>
          {{ $t('notifications.vibration') }}
        </label>
      </div>

      <div class="permission-status">
        <div v-if="permission === 'granted'" class="status granted">
          ✅ {{ $t('notifications.permissionGranted') }}
        </div>
        <div v-else-if="permission === 'denied'" class="status denied">
          ❌ {{ $t('notifications.permissionDenied') }}
          <div class="ios-instructions" v-if="isIOS && !isInStandaloneMode">
            <p><strong>iOS için:</strong></p>
            <ol>
              <li>Uygulamayı ana ekrana ekleyin</li>
              <li>Ana ekrandan uygulamayı açın</li>
              <li>Bildirim izni isteyin</li>
            </ol>
          </div>
        </div>
        <div v-else class="status pending">
          ⏳ {{ $t('notifications.permissionPending') }}
          <div class="ios-instructions" v-if="isIOS && !isInStandaloneMode">
            <p><strong>iOS için:</strong></p>
            <ol>
              <li>Uygulamayı ana ekrana ekleyin</li>
              <li>Ana ekrandan uygulamayı açın</li>
              <li>Bildirim izni isteyin</li>
            </ol>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button 
          v-if="permission !== 'granted'" 
          @click="requestPermission" 
          class="permission-btn"
          :disabled="requesting"
        >
          {{ requesting ? $t('notifications.requesting') : $t('notifications.requestPermission') }}
        </button>
        
        <button 
          @click="testNotification" 
          class="test-btn"
        >
        <!-- :disabled="!settings.enabled || permission !== 'granted'" -->
          {{ $t('notifications.testNotification') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import notificationService from '../services/notificationService'

export default {
  name: 'NotificationSettings',
  data() {
    return {
      showSettings: false,
      requesting: false,
      settings: notificationService.getNotificationSettings(),
      permission: notificationService.permission,
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isInStandaloneMode: ('standalone' in window.navigator) && (window.navigator.standalone)
    }
  },
  methods: {
    toggleSettings() {
      this.showSettings = !this.showSettings
    },
    
    updateSettings() {
      notificationService.saveNotificationSettings(this.settings)
      this.$emit('settings-updated', this.settings)
    },
    
    async requestPermission() {
      this.requesting = true
      try {
        const granted = await notificationService.requestPermission()
        this.permission = notificationService.permission
        
        if (granted) {
          this.$emit('permission-granted')
          // Başarı mesajı göster
          this.$emit('show-message', {
            type: 'success',
            text: this.$t('notifications.permissionGrantedSuccess')
          })
        }
      } catch (error) {
        console.error('Bildirim izni alınamadı:', error)
        this.$emit('show-message', {
          type: 'error',
          text: this.$t('notifications.permissionError')
        })
      } finally {
        this.requesting = false
      }
    },
    
    async testNotification() {
      try {
        await notificationService.showReminderNotification(
          this.$t('notifications.testMessage')
        )
      } catch (error) {
        console.error('Test bildirimi gönderilemedi:', error)
      }
    },
    
    handleClickOutside(event) {
      const el = this.$el
      if (el && !el.contains(event.target) && this.showSettings) {
        this.showSettings = false
      }
    }
  },
  
  mounted() {
    // Bildirim izni durumunu güncelle
    this.permission = notificationService.permission
    
    // Dışarı tıklandığında dropdown'ı kapat
    document.addEventListener('click', this.handleClickOutside)
  },
  
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  }
}
</script>

<style scoped>
.notification-settings {
  position: relative;
  z-index: 1001;
}

.notification-icon-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.notification-icon-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.notification-icon-btn.active {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.notification-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.settings-content {
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  z-index: 1002;
  max-height: 80vh;
  overflow-y: auto;
  margin-top: 0.5rem;
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 320px;
  min-width: 280px;
}

.settings-content > .setting-item:first-of-type {
  padding-top: 1.5rem;
}

.settings-content > .permission-status {
  padding: 0 1.5rem;
}

.settings-content > .action-buttons {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e1e5e9;
  position: sticky;
  top: 0;
  background: white;
  border-radius: 15px 15px 0 0;
  z-index: 1;
}

.settings-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.setting-item {
  margin-bottom: 1rem;
  padding: 0 1.5rem;
}

.setting-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  color: #333;
}

.setting-checkbox {
  margin-right: 0.75rem;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.permission-status {
  margin: 1.5rem 0;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
}

.status.granted {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status.denied {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status.pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.ios-instructions {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  font-size: 0.9rem;
}

.ios-instructions p {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.ios-instructions ol {
  margin: 0;
  padding-left: 1.5rem;
}

.ios-instructions li {
  margin-bottom: 0.25rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.permission-btn,
.test-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 120px;
}

.permission-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.permission-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.test-btn {
  background: #28a745;
  color: white;
}

.test-btn:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
}

.permission-btn:disabled,
.test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .settings-content {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 100vh;
    border-radius: 0;
    z-index: 9999;
    margin-top: 0;
    width: 100%;
    min-width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .permission-btn,
  .test-btn {
    flex: none;
    width: 100%;
  }
}
</style>
