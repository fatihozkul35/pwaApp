class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine
    this.syncQueue = []
    this.maxRetries = 3
    this.retryDelay = 1000 // 1 second
    this.syncStatus = {
      inProgress: false,
      lastSyncTime: null,
      successCount: 0,
      failureCount: 0,
      conflicts: []
    }
    this.init()
  }

  init() {
    // İlk durumu kontrol et
    this.isOnline = navigator.onLine
    
    // Bağlantı durumu dinleyicileri
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('İnternet bağlantısı kuruldu, senkronizasyon başlatılıyor...')
      this.syncPendingData()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('İnternet bağlantısı kesildi, offline moda geçiliyor...')
      this.showOfflineIndicator()
    })

    // Sayfa yüklendiğinde offline verileri kontrol et
    this.loadOfflineData()
    
    // Eğer online ise ve sync edilmemiş öğeler varsa otomatik sync başlat
    if (this.isOnline && this.syncQueue.length > 0) {
      // Kısa bir gecikme ile sync başlat (sayfa yüklenmesi tamamlansın)
      setTimeout(() => {
        this.syncPendingData()
      }, 1000)
    }
  }

  // Offline veri ekleme
  addOfflineData(type, data, action = 'create') {
    const offlineItem = {
      id: Date.now() + Math.random(),
      type,
      data,
      action,
      timestamp: new Date().toISOString(),
      synced: false,
      retryCount: 0,
      lastError: null,
      syncStatus: 'pending' // pending, syncing, success, failed, conflict
    }

    this.syncQueue.push(offlineItem)
    this.saveOfflineData()
    
    console.log('Offline veri eklendi:', offlineItem)
    return offlineItem.id
  }

  // Offline veri güncelleme
  updateOfflineData(id, newData) {
    const item = this.syncQueue.find(item => item.id === id)
    if (item) {
      item.data = { ...item.data, ...newData }
      item.synced = false
      this.saveOfflineData()
    }
  }

  // Offline veri silme
  deleteOfflineData(id) {
    const item = this.syncQueue.find(item => item.id === id)
    if (item) {
      item.action = 'delete'
      item.synced = false
      this.saveOfflineData()
    }
  }

  // Offline verileri kaydet
  saveOfflineData() {
    localStorage.setItem('offlineSyncQueue', JSON.stringify(this.syncQueue))
  }

  // Offline verileri yükle (sadece sync edilmemiş olanları)
  loadOfflineData() {
    const saved = localStorage.getItem('offlineSyncQueue')
    if (saved) {
      const allItems = JSON.parse(saved)
      
      // Sadece sync edilmemiş öğeleri yükle (synced: false veya syncStatus: 'pending', 'failed', 'conflict')
      this.syncQueue = allItems.filter(item => 
        !item.synced || 
        item.syncStatus === 'pending' || 
        item.syncStatus === 'failed' || 
        item.syncStatus === 'conflict' ||
        item.syncStatus === 'syncing' // Syncing olanlar da beklemeli
      )
      
      // Eğer sync edilmiş öğeler varsa localStorage'dan temizle
      const syncedItems = allItems.filter(item => 
        item.synced && item.syncStatus === 'success'
      )
      
      if (syncedItems.length > 0) {
        console.log(`${syncedItems.length} sync edilmiş öğe localStorage'dan temizlendi`)
        // Güncellenmiş queue'yu kaydet (sync edilmiş öğeler olmadan)
        this.saveOfflineData()
      }
      
      if (this.syncQueue.length > 0) {
        console.log('Offline veriler yüklendi:', this.syncQueue.length, 'öğe (sync edilmemiş)')
      } else {
        // Eğer hiç sync edilmemiş öğe yoksa localStorage'ı tamamen temizle
        localStorage.removeItem('offlineSyncQueue')
        console.log('Tüm öğeler sync edilmiş, localStorage temizlendi')
      }
    }
  }

  // Bekleyen verileri senkronize et
  async syncPendingData() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return
    }

    if (this.syncStatus.inProgress) {
      console.log('Senkronizasyon zaten devam ediyor...')
      return
    }

    this.syncStatus.inProgress = true
    this.syncStatus.lastSyncTime = new Date().toISOString()
    
    console.log('Senkronizasyon başlatılıyor...', this.syncQueue.length, 'öğe')

    const unsyncedItems = this.syncQueue.filter(item => 
      !item.synced && item.syncStatus !== 'syncing'
    )
    
    for (const item of unsyncedItems) {
      item.syncStatus = 'syncing'
      this.saveOfflineData()
      
      try {
        const result = await this.syncItemWithRetry(item)
        
        // Conflict kontrolü
        if (result && result.conflict) {
          item.syncStatus = 'conflict'
          item.lastError = result.error
          this.syncStatus.conflicts.push({
            itemId: item.id,
            type: item.type,
            action: item.action,
            timestamp: new Date().toISOString(),
            conflict: result.conflict
          })
          console.warn('Çakışma tespit edildi:', item.id, result.conflict)
        } else {
          item.synced = true
          item.syncStatus = 'success'
          item.lastError = null
          this.syncStatus.successCount++
          console.log('Öğe senkronize edildi:', item.id)
        }
      } catch (error) {
        console.error('Senkronizasyon hatası:', error)
        item.syncStatus = 'failed'
        item.lastError = error.message || error.toString()
        this.syncStatus.failureCount++
        
        // Retry limit aşılmadıysa tekrar dene
        if (item.retryCount < this.maxRetries) {
          item.synced = false
          item.syncStatus = 'pending'
        }
      }
      
      this.saveOfflineData()
    }

    // Senkronize edilen öğeleri temizle (sadece başarılı olanlar)
    const syncedItems = this.syncQueue.filter(item => item.synced && item.syncStatus === 'success')
    this.syncQueue = this.syncQueue.filter(item => 
      !item.synced || item.syncStatus === 'conflict' || item.syncStatus === 'failed'
    )
    
    // Sync edilen öğeleri localStorage'dan temizle
    if (syncedItems.length > 0) {
      console.log(`${syncedItems.length} öğe başarıyla sync edildi ve localStorage'dan temizlendi`)
      this.saveOfflineData()
    }

    this.syncStatus.inProgress = false
    console.log('Senkronizasyon tamamlandı', {
      success: this.syncStatus.successCount,
      failed: this.syncStatus.failureCount,
      conflicts: this.syncStatus.conflicts.length
    })
    
    // Eğer tüm öğeler sync edildiyse (conflict ve failed yoksa) localStorage'ı tamamen temizle
    if (this.getPendingSyncCount() === 0 && this.syncQueue.length === 0) {
      localStorage.removeItem('offlineSyncQueue')
      console.log('Tüm offline veriler sync edildi, localStorage temizlendi')
      this.hideOfflineIndicator()
    } else if (this.getPendingSyncCount() === 0) {
      this.hideOfflineIndicator()
    }
  }

  // Retry mekanizması ile öğe senkronizasyonu
  async syncItemWithRetry(item, retryCount = 0) {
    try {
      const result = await this.syncItem(item)
      item.retryCount = 0
      return result
    } catch (error) {
      item.retryCount = retryCount + 1
      
      if (item.retryCount < this.maxRetries) {
        console.log(`Senkronizasyon hatası, ${this.retryDelay * (item.retryCount)}ms sonra tekrar denenecek:`, error)
        
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, item.retryCount)
        await this.sleep(delay)
        
        return await this.syncItemWithRetry(item, item.retryCount)
      } else {
        throw error
      }
    }
  }

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Tek öğe senkronizasyonu
  async syncItem(item) {
    const { type, data, action } = item

    switch (type) {
      case 'task':
        return await this.syncTask(data, action)
      case 'note':
        return await this.syncNote(data, action)
      default:
        console.warn('Bilinmeyen veri tipi:', type)
    }
  }

  // Görev senkronizasyonu (conflict resolution ile)
  async syncTask(data, action) {
    // Dynamic import kullanarak circular dependency'yi önle
    // Named import kullan - createTask, updateTask, deleteTask, getTask named export
    let createTask, updateTask, deleteTask, getTask
    
    try {
      const apiModule = await import('./api.js')
      createTask = apiModule.createTask
      updateTask = apiModule.updateTask
      deleteTask = apiModule.deleteTask
      getTask = apiModule.getTask
    } catch (importError) {
      console.error('API modülü import hatası:', importError)
      throw new Error('Failed to import API module')
    }
    
    try {
      switch (action) {
        case 'create':
          // Create için conflict kontrolü gerekmez
          return await createTask(data)
        case 'update':
          // Conflict kontrolü: önce mevcut veriyi kontrol et
          try {
            const existingTask = await getTask(data.id)
            // Eğer veri değişmişse conflict var
            if (existingTask.data && existingTask.data.updated_at && data.updated_at && 
                new Date(existingTask.data.updated_at) > new Date(data.updated_at)) {
              return {
                conflict: true,
                error: 'Task was modified on server',
                serverData: existingTask.data,
                localData: data
              }
            }
          } catch (error) {
            // Task bulunamadı (404) veya başka bir hata
            // 404 ise normal update yap, diğer hatalar için fırlat
            if (error.response?.status === 404 || error.message?.includes('not found')) {
              // Task yok, normal update yap
            } else {
              // Başka bir hata, fırlat
              throw error
            }
          }
          return await updateTask(data.id, data)
        case 'delete':
          return await deleteTask(data.id)
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    } catch (error) {
      // 409 Conflict hatası
      if (error.response?.status === 409) {
        return {
          conflict: true,
          error: error.response.data?.message || 'Conflict detected',
          serverData: error.response.data
        }
      }
      throw error
    }
  }

  // Not senkronizasyonu
  async syncNote(data, action) {
    // Not fonksiyonları henüz implement edilmemiş olabilir
    // Gelecekte eklenecek
    const apiModule = await import('./api.js')
    
    // Eğer note fonksiyonları varsa kullan
    if (apiModule.createNote && apiModule.updateNote && apiModule.deleteNote) {
      const { createNote, updateNote, deleteNote } = apiModule
      
      switch (action) {
        case 'create':
          return await createNote(data)
        case 'update':
          return await updateNote(data.id, data)
        case 'delete':
          return await deleteNote(data.id)
      }
    } else {
      console.warn('Note API fonksiyonları henüz implement edilmemiş')
      throw new Error('Note API functions not implemented')
    }
  }

  // Offline gösterge
  showOfflineIndicator() {
    if (document.getElementById('offline-indicator')) return

    const indicator = document.createElement('div')
    indicator.id = 'offline-indicator'
    indicator.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; background: #ff6b6b; color: white; padding: 10px; text-align: center; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <p style="margin: 0; font-size: 14px;">
          📱 Offline Mod - ${this.syncQueue.length} öğe senkronizasyon bekliyor
        </p>
      </div>
    `
    document.body.appendChild(indicator)
  }

  // Offline göstergeyi gizle
  hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator')
    if (indicator) {
      indicator.remove()
    }
  }

  // Offline durumu kontrol et (hem kendi durumumuzu hem navigator'ı kontrol et)
  isOffline() {
    // Hem kendi durumumuzu hem de navigator.onLine'ı kontrol et
    // Chrome DevTools offline modunda navigator.onLine false olur
    return !this.isOnline || !navigator.onLine
  }

  // Bekleyen senkronizasyon sayısı
  getPendingSyncCount() {
    return this.syncQueue.filter(item => 
      !item.synced && item.syncStatus !== 'success'
    ).length
  }

  // Sync status bilgisi
  getSyncStatus() {
    return {
      ...this.syncStatus,
      pendingCount: this.getPendingSyncCount(),
      queueLength: this.syncQueue.length,
      items: this.syncQueue.map(item => ({
        id: item.id,
        type: item.type,
        action: item.action,
        syncStatus: item.syncStatus,
        retryCount: item.retryCount,
        lastError: item.lastError,
        timestamp: item.timestamp
      }))
    }
  }

  // Conflict çözümü - server versiyonunu kullan
  async resolveConflict(itemId, useServerVersion = true) {
    const item = this.syncQueue.find(i => i.id === itemId)
    if (!item || item.syncStatus !== 'conflict') {
      return false
    }

    if (useServerVersion) {
      // Server versiyonunu kullan, local değişiklikleri at
      item.synced = true
      item.syncStatus = 'success'
      item.lastError = null
      
      // Conflict'i listeden çıkar
      this.syncStatus.conflicts = this.syncStatus.conflicts.filter(
        c => c.itemId !== itemId
      )
      
      this.saveOfflineData()
      return true
    } else {
      // Local versiyonu kullan, tekrar sync dene
      item.syncStatus = 'pending'
      item.retryCount = 0
      item.lastError = null
      this.saveOfflineData()
      
      // Tekrar sync dene
      if (this.isOnline) {
        await this.syncPendingData()
      }
      return true
    }
  }

  // Başarısız sync'leri tekrar dene
  async retryFailedSyncs() {
    const failedItems = this.syncQueue.filter(
      item => item.syncStatus === 'failed' && item.retryCount < this.maxRetries
    )
    
    for (const item of failedItems) {
      item.syncStatus = 'pending'
      item.retryCount = 0
      item.lastError = null
    }
    
    this.saveOfflineData()
    
    if (failedItems.length > 0 && this.isOnline) {
      await this.syncPendingData()
    }
  }

  // Offline verileri temizle
  clearOfflineData() {
    this.syncQueue = []
    localStorage.removeItem('offlineSyncQueue')
    console.log('Offline veriler temizlendi')
  }

  // Manuel senkronizasyon
  async forceSync() {
    if (this.isOnline) {
      await this.syncPendingData()
    } else {
      console.log('İnternet bağlantısı yok, senkronizasyon yapılamıyor')
    }
  }
}

export default new OfflineService
