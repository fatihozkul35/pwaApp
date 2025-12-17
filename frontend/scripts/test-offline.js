/**
 * Offline Test Utility Script
 * 
 * Bu script offline mod testleri için yardımcı fonksiyonlar sağlar.
 * Browser console'da kullanılabilir.
 * 
 * Kullanım:
 *   const testUtils = await import('./scripts/test-offline.js')
 *   await testUtils.checkServiceWorker()
 */

// Service Worker durumunu kontrol et
export async function checkServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker desteklenmiyor!')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      console.log('✅ Service Worker kayıtlı:', {
        scope: registration.scope,
        active: registration.active?.state,
        waiting: registration.waiting?.state,
        installing: registration.installing?.state
      })
      return registration
    } else {
      console.warn('⚠️ Service Worker kayıtlı değil!')
      return null
    }
  } catch (error) {
    console.error('❌ Service Worker kontrolü hatası:', error)
    return null
  }
}

// Tüm cache'leri listele
export async function listCaches() {
  try {
    const cacheNames = await caches.keys()
    console.log('📦 Cache\'ler:', cacheNames)
    
    const cacheDetails = {}
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      cacheDetails[cacheName] = {
        count: keys.length,
        urls: keys.map(req => req.url).slice(0, 10) // İlk 10 URL
      }
    }
    
    console.table(cacheDetails)
    return cacheDetails
  } catch (error) {
    console.error('❌ Cache listeleme hatası:', error)
    return {}
  }
}

// Belirli bir cache'i temizle
export async function clearCache(cacheName) {
  try {
    const deleted = await caches.delete(cacheName)
    if (deleted) {
      console.log(`✅ Cache temizlendi: ${cacheName}`)
    } else {
      console.warn(`⚠️ Cache bulunamadı: ${cacheName}`)
    }
    return deleted
  } catch (error) {
    console.error(`❌ Cache temizleme hatası (${cacheName}):`, error)
    return false
  }
}

// Tüm cache'leri temizle
export async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys()
    const results = await Promise.all(
      cacheNames.map(name => caches.delete(name))
    )
    const cleared = results.filter(r => r).length
    console.log(`✅ ${cleared}/${cacheNames.length} cache temizlendi`)
    return cleared
  } catch (error) {
    console.error('❌ Tüm cache\'leri temizleme hatası:', error)
    return 0
  }
}

// Offline queue durumunu kontrol et
export async function checkOfflineQueue() {
  try {
    const offlineService = await import('../services/offlineService.js')
    const status = offlineService.default.getSyncStatus()
    
    console.log('📋 Offline Queue Durumu:', {
      pendingCount: status.pendingCount,
      queueLength: status.queueLength,
      inProgress: status.inProgress,
      lastSyncTime: status.lastSyncTime,
      successCount: status.successCount,
      failureCount: status.failureCount,
      conflicts: status.conflicts.length
    })
    
    if (status.items.length > 0) {
      console.table(status.items)
    }
    
    return status
  } catch (error) {
    console.error('❌ Offline queue kontrolü hatası:', error)
    return null
  }
}

// Network durumunu kontrol et
export async function checkNetworkStatus() {
  const isOnline = navigator.onLine
  console.log('🌐 Network Durumu:', {
    navigatorOnLine: isOnline,
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    } : 'Desteklenmiyor'
  })
  
  // Gerçek network testi
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    const response = await fetch(window.location.origin, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache'
    })
    
    clearTimeout(timeoutId)
    console.log('✅ Network bağlantısı aktif')
    return true
  } catch (error) {
    console.log('❌ Network bağlantısı yok veya yavaş')
    return false
  }
}

// Manuel sync tetikle
export async function triggerSync() {
  try {
    const offlineService = await import('../services/offlineService.js')
    console.log('🔄 Sync başlatılıyor...')
    await offlineService.default.forceSync()
    console.log('✅ Sync tamamlandı')
    
    // Durumu tekrar kontrol et
    await checkOfflineQueue()
  } catch (error) {
    console.error('❌ Sync hatası:', error)
  }
}

// Service Worker'ı yeniden yükle
export async function reloadServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.update()
      console.log('✅ Service Worker güncellendi')
      
      if (registration.waiting) {
        console.log('⚠️ Yeni Service Worker bekliyor. Aktif etmek için:')
        console.log('   registration.waiting.postMessage({ type: "SKIP_WAITING" })')
      }
    } else {
      console.warn('⚠️ Service Worker kayıtlı değil')
    }
  } catch (error) {
    console.error('❌ Service Worker yenileme hatası:', error)
  }
}

// Tüm durumu kontrol et (comprehensive check)
export async function checkAll() {
  console.log('🔍 Kapsamlı Offline Durum Kontrolü\n')
  console.log('='.repeat(50))
  
  console.log('\n1. Service Worker:')
  await checkServiceWorker()
  
  console.log('\n2. Cache\'ler:')
  await listCaches()
  
  console.log('\n3. Network:')
  await checkNetworkStatus()
  
  console.log('\n4. Offline Queue:')
  await checkOfflineQueue()
  
  console.log('\n' + '='.repeat(50))
  console.log('✅ Kontrol tamamlandı')
}

// Test senaryosu: Offline mod simülasyonu
export async function testOfflineScenario() {
  console.log('🧪 Offline Test Senaryosu Başlatılıyor...\n')
  
  // 1. Başlangıç durumu
  console.log('1️⃣ Başlangıç durumu kontrol ediliyor...')
  await checkAll()
  
  // 2. Service Worker kontrolü
  console.log('\n2️⃣ Service Worker kontrol ediliyor...')
  const sw = await checkServiceWorker()
  if (!sw) {
    console.error('❌ Service Worker yok! Test devam edemez.')
    return
  }
  
  // 3. Cache kontrolü
  console.log('\n3️⃣ Cache durumu kontrol ediliyor...')
  const caches = await listCaches()
  if (Object.keys(caches).length === 0) {
    console.warn('⚠️ Cache yok! Önce uygulamayı kullanarak cache\'leri doldurun.')
  }
  
  // 4. Network durumu
  console.log('\n4️⃣ Network durumu kontrol ediliyor...')
  const isOnline = await checkNetworkStatus()
  if (!isOnline) {
    console.log('ℹ️ Zaten offline moddasınız')
  } else {
    console.log('ℹ️ Online moddasınız. Offline test için:')
    console.log('   Chrome DevTools → Network → Offline checkbox\'ını işaretleyin')
  }
  
  // 5. Offline queue
  console.log('\n5️⃣ Offline queue kontrol ediliyor...')
  await checkOfflineQueue()
  
  console.log('\n✅ Test senaryosu tamamlandı!')
  console.log('\n📝 Sonraki adımlar:')
  console.log('   - Chrome DevTools → Network → Offline\'ı aktif edin')
  console.log('   - Bir görev ekleyin/düzenleyin')
  console.log('   - checkOfflineQueue() ile queue durumunu kontrol edin')
  console.log('   - Online\'a geçin ve triggerSync() ile sync yapın')
}

// Export tüm fonksiyonları
export default {
  checkServiceWorker,
  listCaches,
  clearCache,
  clearAllCaches,
  checkOfflineQueue,
  checkNetworkStatus,
  triggerSync,
  reloadServiceWorker,
  checkAll,
  testOfflineScenario
}

