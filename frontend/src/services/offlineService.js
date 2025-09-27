class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine
    this.syncQueue = []
    this.init()
  }

  init() {
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
  }

  // Offline veri ekleme
  addOfflineData(type, data, action = 'create') {
    const offlineItem = {
      id: Date.now() + Math.random(),
      type,
      data,
      action,
      timestamp: new Date().toISOString(),
      synced: false
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

  // Offline verileri yükle
  loadOfflineData() {
    const saved = localStorage.getItem('offlineSyncQueue')
    if (saved) {
      this.syncQueue = JSON.parse(saved)
      console.log('Offline veriler yüklendi:', this.syncQueue.length, 'öğe')
    }
  }

  // Bekleyen verileri senkronize et
  async syncPendingData() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return
    }

    console.log('Senkronizasyon başlatılıyor...', this.syncQueue.length, 'öğe')

    const unsyncedItems = this.syncQueue.filter(item => !item.synced)
    
    for (const item of unsyncedItems) {
      try {
        await this.syncItem(item)
        item.synced = true
        console.log('Öğe senkronize edildi:', item.id)
      } catch (error) {
        console.error('Senkronizasyon hatası:', error)
        // Hata durumunda öğeyi tekrar denemek için işaretle
        item.synced = false
      }
    }

    // Senkronize edilen öğeleri temizle
    this.syncQueue = this.syncQueue.filter(item => !item.synced)
    this.saveOfflineData()

    console.log('Senkronizasyon tamamlandı')
    this.hideOfflineIndicator()
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

  // Görev senkronizasyonu
  async syncTask(data, action) {
    const api = await import('./api.js')
    
    switch (action) {
      case 'create':
        return await api.default.createTask(data)
      case 'update':
        return await api.default.updateTask(data.id, data)
      case 'delete':
        return await api.default.deleteTask(data.id)
    }
  }

  // Not senkronizasyonu
  async syncNote(data, action) {
    const api = await import('./api.js')
    
    switch (action) {
      case 'create':
        return await api.default.createNote(data)
      case 'update':
        return await api.default.updateNote(data.id, data)
      case 'delete':
        return await api.default.deleteNote(data.id)
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

  // Offline durumu kontrol et
  isOffline() {
    return !this.isOnline
  }

  // Bekleyen senkronizasyon sayısı
  getPendingSyncCount() {
    return this.syncQueue.filter(item => !item.synced).length
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
