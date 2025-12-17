class NotificationService {
  constructor() {
    this.permission = null
    this.isSupported = 'Notification' in window
    this.init()
  }

  async init() {
    if (!this.isSupported) {
      console.warn('Bu tarayıcı bildirimleri desteklemiyor')
      return
    }

    this.permission = Notification.permission
    
    // iOS Safari için özel kontrol
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone)
    
    if (isIOS && !isInStandaloneMode) {
      console.warn('iOS Safari\'de PWA olarak açılmadığı için bildirimler çalışmayabilir')
    }
    
    // Bildirim izni varsa, service worker'ı kaydet
    if (this.permission === 'granted') {
      this.registerServiceWorker()
    }
    
    // Sayfa yüklendiğinde zamanlanmış bildirimleri kontrol et ve yeniden zamanla
    this.restoreScheduledNotifications()
  }

  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Bildirimler desteklenmiyor')
    }

    // iOS Safari için özel kontrol
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone)
    
    if (isIOS && !isInStandaloneMode) {
      throw new Error('iOS\'te bildirim izni almak için uygulamayı ana ekrandan açmanız gerekiyor')
    }

    if (this.permission === 'granted') {
      return true
    }

    if (this.permission === 'denied') {
      throw new Error('Bildirim izni reddedildi. Lütfen tarayıcı ayarlarından bildirim iznini etkinleştirin.')
    }

    try {
      this.permission = await Notification.requestPermission()
      if (this.permission === 'granted') {
        this.registerServiceWorker()
        return true
      }
      return false
    } catch (error) {
      console.error('Bildirim izni alınamadı:', error)
      throw error
    }
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js')
        console.log('Service Worker kaydedildi:', registration)
        return registration
      } catch (error) {
        console.error('Service Worker kaydedilemedi:', error)
      }
    }
  }

  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Bildirim gönderilemiyor - izin yok')
      return false
    }

    // iOS Safari için özel kontrol
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone)
    
    if (isIOS && !isInStandaloneMode) {
      console.warn('iOS Safari\'de PWA olarak açılmadığı için bildirimler çalışmayabilir')
      return false
    }

    try {
      // Eğer actions varsa Service Worker üzerinden gönder (actions sadece SW'de çalışır)
      if (options.actions && options.actions.length > 0) {
        return await this.showNotificationViaServiceWorker(title, options)
      }

      // Actions yoksa normal Notification API kullan
      const notification = new Notification(title, {
        icon: '/img/icons/icon-192x192.png',
        badge: '/img/icons/icon-96x96.png',
        requireInteraction: true,
        silent: false, // iOS için ses açık
        ...options
      })

      // Bildirime tıklandığında uygulamayı odakla
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // 5 saniye sonra otomatik kapat
      setTimeout(() => {
        notification.close()
      }, 5000)

      return true
    } catch (error) {
      console.error('Bildirim gönderilemedi:', error)
      return false
    }
  }

  // Service Worker üzerinden bildirim gönder (actions için gerekli)
  async showNotificationViaServiceWorker(title, options = {}) {
    try {
      const registration = await navigator.serviceWorker.ready
      
      await registration.showNotification(title, {
        icon: '/img/icons/icon-192x192.png',
        badge: '/img/icons/icon-96x96.png',
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200], // Bildirim titreşimi
        data: options.data || {},
        ...options
      })

      return true
    } catch (error) {
      console.error('Service Worker üzerinden bildirim gönderilemedi:', error)
      // Fallback: actions olmadan normal bildirim gönder
      try {
        // eslint-disable-next-line no-unused-vars
        const { actions, ...optionsWithoutActions } = options
        const notification = new Notification(title, {
          icon: '/img/icons/icon-192x192.png',
          badge: '/img/icons/icon-96x96.png',
          requireInteraction: true,
          silent: false,
          ...optionsWithoutActions
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        setTimeout(() => {
          notification.close()
        }, 5000)

        return true
      } catch (fallbackError) {
        console.error('Fallback bildirim de gönderilemedi:', fallbackError)
        return false
      }
    }
  }

  async showTaskNotification(task) {
    const title = 'Yeni Görev Hatırlatması'
    const body = `"${task.title}" görevi tamamlandı mı?`
    
    return this.showNotification(title, {
      body,
      tag: `task-${task.id}`,
      actions: [
        {
          action: 'complete',
          title: 'Tamamlandı',
          icon: '/img/icons/icon-96x96.png'
        },
        {
          action: 'later',
          title: 'Daha Sonra',
          icon: '/img/icons/icon-96x96.png'
        }
      ]
    })
  }

  async showNoteNotification(note) {
    const title = 'Not Hatırlatması'
    const body = `"${note.title}" notunu kontrol et`
    
    return this.showNotification(title, {
      body,
      tag: `note-${note.id}`,
      actions: [
        {
          action: 'view',
          title: 'Görüntüle',
          icon: '/img/icons/icon-96x96.png'
        }
      ]
    })
  }

  async showReminderNotification(message) {
    const title = 'Hatırlatma'
    const body = message
    
    return this.showNotification(title, {
      body,
      tag: 'reminder'
    })
  }

  // Zamanlanmış bildirimler için
  scheduleNotification(task, delay = 0) {
    if (delay > 0) {
      setTimeout(() => {
        this.showTaskNotification(task)
      }, delay)
    } else {
      this.showTaskNotification(task)
    }
  }

  // Belirli bir zamanda bildirim gönder
  scheduleNotificationAt(task, reminderTime) {
    const now = new Date()
    // Backend'den gelen reminderTime UTC formatında olabilir
    // new Date() otomatik olarak UTC'yi yerel saat dilimine çevirir
    const reminder = new Date(reminderTime)
    
    // Invalid date kontrolü
    if (isNaN(reminder.getTime())) {
      console.error('Geçersiz hatırlatma zamanı:', reminderTime)
      return null
    }
    
    const delay = reminder.getTime() - now.getTime()

    if (delay > 0) {
      const delayMinutes = Math.floor(delay / 60000)
      const delayHours = Math.floor(delayMinutes / 60)
      const delayDays = Math.floor(delayHours / 24)
      
      let delayText = ''
      if (delayDays > 0) {
        delayText = `${delayDays} gün, ${delayHours % 24} saat`
      } else if (delayHours > 0) {
        delayText = `${delayHours} saat, ${delayMinutes % 60} dakika`
      } else {
        delayText = `${delayMinutes} dakika`
      }
      
      console.log(`✅ Bildirim zamanlandı: "${task.title}" için ${delayText} sonra (${reminder.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })})`)
      
      const timeoutId = setTimeout(() => {
        console.log(`🔔 Hatırlatma bildirimi gönderiliyor: "${task.title}"`)
        this.showScheduledTaskNotification(task)
      }, delay)

      // Timeout ID'yi sakla (iptal etmek için)
      this.saveScheduledNotification(task.id, timeoutId, reminderTime)
      
      return timeoutId
    } else {
      const diffMinutes = Math.floor(Math.abs(delay) / 60000)
      console.warn(`⚠️ Hatırlatma zamanı geçmiş: "${task.title}" - ${diffMinutes} dakika önce (${reminder.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })})`)
      return null
    }
  }

  // Zamanlanmış görev bildirimi gönder
  async showScheduledTaskNotification(task) {
    const title = this.$t ? this.$t('notifications.scheduledReminder') : 'Zamanlanmış Hatırlatma'
    const body = this.$t ? 
      this.$t('notifications.taskReminderMessage').replace('{taskTitle}', task.title) :
      `Görev hatırlatması: ${task.title}`
    
    return this.showNotification(title, {
      body,
      tag: `scheduled-task-${task.id}`,
      data: {
        taskId: task.id,
        task: task
      },
      actions: [
        {
          action: 'complete',
          title: this.$t ? this.$t('common.complete') : 'Tamamla',
          icon: '/img/icons/icon-96x96.png'
        },
        {
          action: 'snooze',
          title: this.$t ? this.$t('common.snooze') : 'Ertele',
          icon: '/img/icons/icon-96x96.png'
        }
      ]
    })
  }

  // Zamanlanmış bildirimi kaydet
  saveScheduledNotification(taskId, timeoutId, reminderTime) {
    const scheduled = JSON.parse(localStorage.getItem('scheduledNotifications') || '{}')
    scheduled[taskId] = {
      timeoutId: null, // setTimeout ID'yi kaydetme (sayfa yenilendiğinde geçersiz olur, restoreScheduledNotifications ile yeniden zamanlanır)
      reminderTime,
      createdAt: new Date().toISOString()
    }
    localStorage.setItem('scheduledNotifications', JSON.stringify(scheduled))
  }

  // Zamanlanmış bildirimi iptal et
  cancelScheduledNotification(taskId) {
    const scheduled = JSON.parse(localStorage.getItem('scheduledNotifications') || '{}')
    if (scheduled[taskId]) {
      // Eğer aktif bir timeout varsa iptal et
      if (scheduled[taskId].timeoutId) {
        clearTimeout(scheduled[taskId].timeoutId)
      }
      delete scheduled[taskId]
      localStorage.setItem('scheduledNotifications', JSON.stringify(scheduled))
      return true
    }
    return false
  }

  // Tüm zamanlanmış bildirimleri temizle
  clearAllScheduledNotifications() {
    const scheduled = JSON.parse(localStorage.getItem('scheduledNotifications') || '{}')
    Object.values(scheduled).forEach(notification => {
      clearTimeout(notification.timeoutId)
    })
    localStorage.removeItem('scheduledNotifications')
  }

  // Zamanlanmış bildirimleri kontrol et
  getScheduledNotifications() {
    return JSON.parse(localStorage.getItem('scheduledNotifications') || '{}')
  }

  // Sayfa yüklendiğinde zamanlanmış bildirimleri geri yükle
  restoreScheduledNotifications() {
    const settings = this.getNotificationSettings()
    if (!settings.enabled || !settings.taskReminders) {
      return
    }

    const scheduled = this.getScheduledNotifications()
    const now = new Date()
    let restoredCount = 0
    let expiredCount = 0

    Object.keys(scheduled).forEach(taskId => {
      const notification = scheduled[taskId]
      const reminderTime = new Date(notification.reminderTime)
      
      // Geçersiz tarih kontrolü
      if (isNaN(reminderTime.getTime())) {
        console.warn(`Geçersiz hatırlatma zamanı task ${taskId} için`)
        delete scheduled[taskId]
        return
      }

      const delay = reminderTime.getTime() - now.getTime()

      if (delay > 0) {
        // Hala gelecekte, yeniden zamanla
        // Task bilgisini localStorage'dan veya store'dan al
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]')
        const tasksArray = Array.isArray(tasks.results) ? tasks.results : (Array.isArray(tasks) ? tasks : [])
        const task = tasksArray.find(t => t.id == taskId || t.id === parseInt(taskId))
        
        if (task && !task.completed) {
          const delayMinutes = Math.floor(delay / 60000)
          console.log(`🔄 Bildirim geri yüklendi: "${task.title}" için ${delayMinutes} dakika sonra`)
          
          const timeoutId = setTimeout(() => {
            console.log(`🔔 Hatırlatma bildirimi gönderiliyor: "${task.title}"`)
            this.showScheduledTaskNotification(task)
            // Bildirim gönderildikten sonra localStorage'dan sil
            this.cancelScheduledNotification(taskId)
          }, delay)

          // Timeout ID'yi güncelle
          scheduled[taskId].timeoutId = timeoutId
          restoredCount++
        } else {
          // Task bulunamadı veya tamamlanmış, bildirimi iptal et
          delete scheduled[taskId]
        }
      } else {
        // Zamanı geçmiş, bildirimi iptal et
        console.log(`⏰ Bildirim zamanı geçmiş, iptal ediliyor: task ${taskId}`)
        delete scheduled[taskId]
        expiredCount++
      }
    })

    // Güncellenmiş listeyi kaydet
    localStorage.setItem('scheduledNotifications', JSON.stringify(scheduled))

    if (restoredCount > 0) {
      console.log(`✅ ${restoredCount} bildirim geri yüklendi`)
    }
    if (expiredCount > 0) {
      console.log(`⏰ ${expiredCount} bildirim zamanı geçmiş, iptal edildi`)
    }
  }

  // Bildirim ayarlarını kontrol et
  getNotificationSettings() {
    const settings = localStorage.getItem('notificationSettings')
    return settings ? JSON.parse(settings) : {
      enabled: true,
      taskReminders: true,
      noteReminders: true,
      sound: true,
      vibration: true
    }
  }

  // Bildirim ayarlarını kaydet
  saveNotificationSettings(settings) {
    localStorage.setItem('notificationSettings', JSON.stringify(settings))
  }

  // Bildirim geçmişi
  getNotificationHistory() {
    const history = localStorage.getItem('notificationHistory')
    return history ? JSON.parse(history) : []
  }

  // Bildirim geçmişine ekle
  addToHistory(notification) {
    const history = this.getNotificationHistory()
    history.unshift({
      ...notification,
      timestamp: new Date().toISOString()
    })
    
    // Son 50 bildirimi sakla
    if (history.length > 50) {
      history.splice(50)
    }
    
    localStorage.setItem('notificationHistory', JSON.stringify(history))
  }

  // Tüm görevler için bildirimleri zamanla
  scheduleNotificationsForTasks(tasks) {
    if (!Array.isArray(tasks)) {
      console.warn('scheduleNotificationsForTasks: tasks bir array değil')
      return
    }

    const settings = this.getNotificationSettings()
    if (!settings.enabled || !settings.taskReminders) {
      console.log('Bildirimler devre dışı')
      return
    }

    // Önce mevcut zamanlanmış bildirimleri temizle
    this.clearAllScheduledNotifications()

    const now = new Date()
    let scheduledCount = 0

    tasks.forEach(task => {
      // Sadece tamamlanmamış ve reminder_time olan görevler için bildirim zamanla
      if (!task.completed && task.reminder_time) {
        // Backend'den gelen reminder_time UTC formatında olabilir
        const reminderTime = new Date(task.reminder_time)
        
        // Invalid date kontrolü
        if (isNaN(reminderTime.getTime())) {
          console.warn(`Geçersiz hatırlatma zamanı görev "${task.title}" için:`, task.reminder_time)
          return
        }
        
        const delay = reminderTime.getTime() - now.getTime()

        // Sadece gelecekteki hatırlatmalar için bildirim zamanla
        if (delay > 0) {
          const delayMinutes = Math.floor(delay / 60000)
          const delayHours = Math.floor(delayMinutes / 60)
          const delayDays = Math.floor(delayHours / 24)
          
          let delayText = ''
          if (delayDays > 0) {
            delayText = `${delayDays} gün, ${delayHours % 24} saat`
          } else if (delayHours > 0) {
            delayText = `${delayHours} saat, ${delayMinutes % 60} dakika`
          } else {
            delayText = `${delayMinutes} dakika`
          }
          
          console.log(`✅ Görev "${task.title}" için bildirim zamanlandı: ${delayText} sonra (${reminderTime.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })})`)
          
          const timeoutId = setTimeout(() => {
            console.log(`🔔 Hatırlatma bildirimi gönderiliyor: "${task.title}"`)
            this.showScheduledTaskNotification(task)
          }, delay)

          // Timeout ID'yi sakla
          this.saveScheduledNotification(task.id, timeoutId, task.reminder_time)
          scheduledCount++
        } else {
          const diffMinutes = Math.floor(Math.abs(delay) / 60000)
          console.log(`⚠️ Görev "${task.title}" için hatırlatma zamanı geçmiş: ${diffMinutes} dakika önce (${reminderTime.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })})`)
        }
      }
    })

    console.log(`${scheduledCount} bildirim zamanlandı`)
  }
}

export default new NotificationService()
