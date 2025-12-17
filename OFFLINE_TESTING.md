# Offline Test Rehberi

Bu dokümantasyon, PWA uygulamasının offline özelliklerini test etmek için detaylı bir rehber içerir.

## İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Chrome DevTools ile Test](#chrome-devtools-ile-test)
3. [Test Senaryoları](#test-senaryoları)
4. [Test Utility Script](#test-utility-script)
5. [Sorun Giderme](#sorun-giderme)

## Hızlı Başlangıç

### Gereksinimler

- Chrome veya Chromium tabanlı tarayıcı
- Backend sunucusu çalışıyor olmalı
- Frontend development server çalışıyor olmalı

### İlk Kurulum

1. **Backend'i başlatın:**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Frontend'i başlatın:**
   ```bash
   cd frontend
   npm run serve
   ```

3. **Tarayıcıda açın:**
   - http://localhost:3000

4. **Service Worker'ın kayıtlı olduğunu kontrol edin:**
   - Chrome DevTools → Application → Service Workers
   - "Service worker" kayıtlı olmalı

## Chrome DevTools ile Test

### 1. Service Worker Kontrolü

**Application Tab → Service Workers:**

- **Status:** Service worker durumunu gösterir
  - Activated: Aktif ve çalışıyor
  - Waiting: Yeni versiyon bekliyor
  - Installing: Yükleniyor

- **Update on reload:** Development için önerilir
  - Her sayfa yenilemede service worker güncellenir

- **Unregister:** Service worker'ı kaldırır
  - Test için cache'leri temizlemek istediğinizde kullanın

**Konsol Komutları:**

```javascript
// Service worker durumunu kontrol et
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Scope:', reg.scope)
  console.log('Active:', reg.active?.state)
  console.log('Waiting:', reg.waiting?.state)
})

// Service worker'ı güncelle
navigator.serviceWorker.getRegistration().then(reg => reg.update())

// Tüm service worker'ları listele
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Toplam:', regs.length)
  regs.forEach(reg => console.log(reg.scope))
})
```

### 2. Cache Storage

**Application Tab → Cache Storage:**

Cache'ler şunları içerir:

- **workbox-precache-v2-***: Precache edilmiş dosyalar (HTML, CSS, JS)
- **api-cache**: API yanıtları (24 saat TTL)
- **pages-cache**: Sayfa cache'leri (7 gün TTL)
- **images-cache**: Resimler (30 gün TTL)
- **fonts-cache**: Fontlar (1 yıl TTL)
- **static-resources**: CSS ve JS dosyaları (7 gün TTL)

**Konsol Komutları:**

```javascript
// Tüm cache'leri listele
caches.keys().then(keys => console.log(keys))

// Belirli bir cache'i aç ve içeriğini görüntüle
caches.open('api-cache').then(cache => {
  cache.keys().then(keys => {
    console.log('API Cache entries:', keys.length)
    keys.forEach(key => console.log(key.url))
  })
})

// Cache'i temizle
caches.delete('api-cache').then(() => {
  console.log('API cache temizlendi')
})

// Tüm cache'leri temizle
caches.keys().then(keys => {
  Promise.all(keys.map(key => caches.delete(key)))
    .then(() => console.log('Tüm cache\'ler temizlendi'))
})
```

### 3. Network Tab

**Network Tab Özellikleri:**

- **Offline checkbox:** Internet bağlantısını simüle eder
- **Throttling:** Yavaş bağlantı simülasyonu
  - Slow 3G: ~400 Kbps
  - Fast 3G: ~1.6 Mbps
  - Custom: Özel ayarlar

**Konsol Komutları:**

```javascript
// Network durumunu kontrol et
console.log('Online:', navigator.onLine)

// Connection API (destekleniyorsa)
if (navigator.connection) {
  console.log('Connection:', {
    effectiveType: navigator.connection.effectiveType,
    downlink: navigator.connection.downlink,
    rtt: navigator.connection.rtt
  })
}

// Online/offline event'lerini dinle
window.addEventListener('online', () => {
  console.log('✅ Online!')
})

window.addEventListener('offline', () => {
  console.log('❌ Offline!')
})
```

### 4. Console Tab

**Yararlı Komutlar:**

```javascript
// Service worker durumu
navigator.serviceWorker.getRegistration()

// Cache durumu
caches.keys()

// LocalStorage durumu
localStorage.getItem('offlineSyncQueue')
localStorage.getItem('tasks')

// Network durumu
navigator.onLine
```

## Test Senaryoları

### Senaryo 1: Temel Offline Mod

**Amaç:** Uygulamanın offline modda çalıştığını doğrulamak

**Adımlar:**

1. Uygulamayı açın ve birkaç görev ekleyin
2. Sayfayı yenileyin (cache'lerin dolması için)
3. Chrome DevTools → Network → Offline checkbox'ını işaretleyin
4. Sayfayı yenileyin
5. **Beklenen Sonuç:**
   - Offline indicator görünmeli
   - Önceden yüklenen görevler görünmeli
   - Yeni görev eklenebilmeli

**Doğrulama:**

```javascript
// Console'da
navigator.onLine // false olmalı
caches.keys() // Cache'ler dolu olmalı
```

### Senaryo 2: Cache Yönetimi

**Amaç:** Cache'lerin doğru çalıştığını doğrulamak

**Adımlar:**

1. Uygulamayı açın ve görevleri yükleyin
2. Chrome DevTools → Application → Cache Storage
3. `api-cache` içeriğini kontrol edin
4. Offline'a geçin
5. Sayfayı yenileyin
6. **Beklenen Sonuç:**
   - Görevler cache'den yüklenmeli
   - Network tab'da istekler kırmızı (failed) görünmeli

**Doğrulama:**

```javascript
// Cache içeriğini kontrol et
caches.open('api-cache').then(cache => {
  cache.match('/api/tasks/').then(response => {
    if (response) {
      response.json().then(data => console.log('Cached data:', data))
    }
  })
})
```

### Senaryo 3: Offline Queue ve Sync

**Amaç:** Offline queue ve sync mekanizmasını test etmek

**Adımlar:**

1. Offline'a geçin
2. Birkaç görev ekleyin/düzenleyin/silin
3. Console'da queue durumunu kontrol edin:
   ```javascript
   const offlineService = await import('./src/services/offlineService.js')
   offlineService.default.getSyncStatus()
   ```
4. Online'a geçin
5. **Beklenen Sonuç:**
   - Otomatik sync başlamalı
   - Console'da sync log'ları görünmeli
   - Backend'de değişiklikler görünmeli

**Doğrulama:**

```javascript
// Sync durumunu kontrol et
const offlineService = await import('./src/services/offlineService.js')
const status = offlineService.default.getSyncStatus()
console.log('Pending:', status.pendingCount)
console.log('Success:', status.successCount)
console.log('Failed:', status.failureCount)
```

### Senaryo 4: Retry Mekanizması

**Amaç:** Başarısız sync'lerin tekrar denendiğini doğrulamak

**Adımlar:**

1. Backend'i durdurun
2. Offline'a geçin ve görev ekleyin
3. Online'a geçin (backend hala kapalı)
4. Console'da retry log'larını izleyin
5. Backend'i tekrar başlatın
6. **Beklenen Sonuç:**
   - Retry mekanizması devreye girmeli
   - Backend açıldığında sync başarılı olmalı

**Doğrulama:**

```javascript
// Retry durumunu kontrol et
const offlineService = await import('./src/services/offlineService.js')
const status = offlineService.default.getSyncStatus()
status.items.forEach(item => {
  if (item.retryCount > 0) {
    console.log('Retry:', item.id, item.retryCount)
  }
})
```

### Senaryo 5: Conflict Resolution

**Amaç:** Veri çakışmalarının doğru yönetildiğini doğrulamak

**Adımlar:**

1. Bir görevi düzenleyin ve kaydedin
2. Offline'a geçin
3. Aynı görevi farklı şekilde düzenleyin
4. Online'a geçin
5. **Beklenen Sonuç:**
   - Conflict tespit edilmeli
   - Conflict çözüm seçenekleri sunulmalı

**Doğrulama:**

```javascript
// Conflict'leri kontrol et
const offlineService = await import('./src/services/offlineService.js')
const status = offlineService.default.getSyncStatus()
console.log('Conflicts:', status.conflicts)

// Conflict çöz
if (status.conflicts.length > 0) {
  const conflictId = status.conflicts[0].itemId
  await offlineService.default.resolveConflict(conflictId, true) // Server versiyonunu kullan
}
```

## Test Utility Script

Proje içinde `frontend/scripts/test-offline.js` dosyası test için yardımcı fonksiyonlar sağlar.

### Kullanım

**Browser Console'da:**

```javascript
// Script'i import et
const testUtils = await import('./scripts/test-offline.js')

// Tüm durumu kontrol et
await testUtils.checkAll()

// Service worker kontrolü
await testUtils.checkServiceWorker()

// Cache'leri listele
await testUtils.listCaches()

// Offline queue durumu
await testUtils.checkOfflineQueue()

// Network durumu
await testUtils.checkNetworkStatus()

// Manuel sync
await testUtils.triggerSync()

// Test senaryosu çalıştır
await testUtils.testOfflineScenario()
```

### Fonksiyonlar

- **checkServiceWorker()**: Service worker durumunu kontrol eder
- **listCaches()**: Tüm cache'leri listeler
- **clearCache(name)**: Belirli bir cache'i temizler
- **clearAllCaches()**: Tüm cache'leri temizler
- **checkOfflineQueue()**: Offline queue durumunu gösterir
- **checkNetworkStatus()**: Network durumunu kontrol eder
- **triggerSync()**: Manuel sync tetikler
- **reloadServiceWorker()**: Service worker'ı yeniden yükler
- **checkAll()**: Kapsamlı durum kontrolü
- **testOfflineScenario()**: Otomatik test senaryosu çalıştırır

## Sorun Giderme

### Service Worker Kayıtlı Değil

**Sorun:** Service worker kayıt olmuyor

**Çözüm:**

1. HTTPS veya localhost kullanıldığından emin olun
2. Browser cache'ini temizleyin
3. Service worker'ı manuel kaydedin:
   ```javascript
   navigator.serviceWorker.register('/service-worker.js')
   ```

### Cache'ler Dolmuyor

**Sorun:** Cache'ler boş görünüyor

**Çözüm:**

1. Sayfayı birkaç kez yenileyin
2. Farklı sayfalara gidin
3. API istekleri yapın
4. Cache'leri manuel kontrol edin:
   ```javascript
   caches.open('api-cache').then(cache => cache.keys())
   ```

### Sync Çalışmıyor

**Sorun:** Offline queue sync olmuyor

**Çözüm:**

1. Network durumunu kontrol edin:
   ```javascript
   navigator.onLine
   ```
2. Backend'in çalıştığından emin olun
3. Console'da hata mesajlarını kontrol edin
4. Manuel sync deneyin:
   ```javascript
   const offlineService = await import('./src/services/offlineService.js')
   await offlineService.default.forceSync()
   ```

### Offline Indicator Görünmüyor

**Sorun:** Offline modda indicator görünmüyor

**Çözüm:**

1. Vuex store'un çalıştığından emin olun
2. OfflineIndicator component'inin mount olduğunu kontrol edin
3. Console'da hata mesajlarını kontrol edin

### Conflict Çözülmüyor

**Sorun:** Conflict'ler çözülmüyor

**Çözüm:**

1. Conflict durumunu kontrol edin:
   ```javascript
   const offlineService = await import('./src/services/offlineService.js')
   const status = offlineService.default.getSyncStatus()
   console.log(status.conflicts)
   ```
2. Manuel conflict çöz:
   ```javascript
   await offlineService.default.resolveConflict(conflictId, true)
   ```

## İpuçları

1. **Development Modda:**
   - "Update on reload" seçeneğini aktif edin
   - Service worker değişikliklerini görmek için sayfayı yenileyin

2. **Cache Testi:**
   - Cache'leri temizleyerek "ilk açılış" senaryosunu test edin
   - Farklı cache stratejilerini test edin

3. **Network Testi:**
   - Throttling kullanarak yavaş bağlantıyı simüle edin
   - Offline/Online geçişlerini test edin

4. **Sync Testi:**
   - Backend'i durdurup başlatarak retry mekanizmasını test edin
   - Çoklu değişikliklerle queue'yu test edin

5. **Production Testi:**
   - Build edilmiş versiyonu test edin
   - Service worker'ın production modda çalıştığını doğrulayın

## Ek Kaynaklar

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [PWA Testing Guide](https://web.dev/pwa-checklist/)

