# PWA App - Vue.js ve Django

Bu proje Vue.js 3 ve Django REST Framework kullanılarak geliştirilmiş bir Progressive Web Application (PWA)'dır. Görev yönetimi ve not tutma özelliklerine sahiptir.

## 🚀 Özellikler

### Frontend (Vue.js)
- Vue.js 3 Composition API
- Vue Router ile sayfa yönlendirme
- Vuex ile state management
- PWA özellikleri (offline çalışma, mobil yüklenebilir)
- Responsive tasarım
- Modern ve kullanıcı dostu arayüz

### Backend (Django)
- Django REST Framework
- SQLite veritabanı
- CORS desteği
- Admin paneli
- RESTful API endpoints

### PWA Özellikleri
- Service Worker ile offline çalışma
- Web App Manifest ile mobil yüklenebilir
- Push notification desteği
- Cache stratejileri

## 📁 Proje Yapısı

```
pwaApp/
├── backend/                 # Django backend
│   ├── api/                # API uygulaması
│   │   ├── models.py       # Veritabanı modelleri
│   │   ├── views.py        # API view'ları
│   │   ├── serializers.py  # API serializers
│   │   └── urls.py         # API URL'leri
│   ├── pwa_backend/        # Ana Django projesi
│   │   ├── settings.py     # Django ayarları
│   │   └── urls.py         # Ana URL yapılandırması
│   ├── manage.py           # Django yönetim scripti
│   └── requirements.txt    # Python bağımlılıkları
├── frontend/               # Vue.js frontend
│   ├── public/             # Statik dosyalar
│   │   ├── manifest.json   # PWA manifest
│   │   └── index.html      # Ana HTML dosyası
│   ├── src/                # Kaynak kodlar
│   │   ├── components/     # Vue bileşenleri
│   │   ├── views/          # Sayfa bileşenleri
│   │   ├── router/         # Vue Router yapılandırması
│   │   ├── store/          # Vuex store
│   │   ├── services/       # API servisleri
│   │   └── service-worker.js # PWA service worker
│   ├── package.json        # Node.js bağımlılıkları
│   └── vue.config.js       # Vue CLI yapılandırması
└── README.md               # Bu dosya
```

## 🛠️ Kurulum

### Gereksinimler
- Python 3.8+
- Node.js 14+
- npm veya yarn

### Backend Kurulumu

1. **Python sanal ortamı oluşturun:**
```bash
cd backend
python -m venv venv
```

2. **Sanal ortamı aktifleştirin:**
```bash
# Windows
venv\\Scripts\\activate

# macOS/Linux
source venv/bin/activate
```

3. **Bağımlılıkları yükleyin:**
```bash
pip install -r requirements.txt
```

4. **Çevre değişkenlerini ayarlayın:**
```bash
# env.example dosyasını .env olarak kopyalayın
cp env.example .env
# .env dosyasını düzenleyin
```

5. **Veritabanı migrasyonlarını çalıştırın:**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Admin kullanıcısı oluşturun:**
```bash
python manage.py createsuperuser
```

7. **Sunucuyu başlatın:**
```bash
python manage.py runserver
```

Backend http://localhost:8000 adresinde çalışacaktır.

### Frontend Kurulumu

1. **Bağımlılıkları yükleyin:**
```bash
cd frontend
npm install
```

2. **Geliştirme sunucusunu başlatın:**
```bash
npm run serve
```

Frontend http://localhost:3000 adresinde çalışacaktır.

## 🚀 Üretim Dağıtımı

### Frontend Build
```bash
cd frontend
npm run build
```

Build edilmiş dosyalar `frontend/dist` klasöründe oluşturulacaktır.

### Backend Dağıtımı
```bash
cd backend
pip install gunicorn
gunicorn pwa_backend.wsgi:application --bind 0.0.0.0:8000
```

## 📱 PWA Özellikleri

### Mobil Cihaza Yükleme
1. Tarayıcıda uygulamayı açın
2. Adres çubuğundaki "Yükle" butonuna tıklayın
3. Uygulama ana ekranınıza eklenecektir

### Offline Çalışma
- Service Worker sayesinde uygulama offline çalışabilir
- Önceden ziyaret edilen sayfalar cache'den yüklenir
- API istekleri offline durumunda cache'den servis edilir
- Offline queue ile değişiklikler internet geldiğinde otomatik senkronize edilir
- Retry mekanizması ile başarısız sync'ler tekrar denenir
- Conflict resolution ile veri çakışmaları yönetilir

## 🔧 API Endpoints

### Görevler (Tasks)
- `GET /api/tasks/` - Tüm görevleri listele
- `POST /api/tasks/` - Yeni görev oluştur
- `GET /api/tasks/{id}/` - Belirli görevi getir
- `PUT /api/tasks/{id}/` - Görevi güncelle
- `DELETE /api/tasks/{id}/` - Görevi sil
- `GET /api/tasks/completed/` - Tamamlanan görevler
- `GET /api/tasks/pending/` - Bekleyen görevler

### Notlar (Notes)
- `GET /api/notes/` - Tüm notları listele
- `POST /api/notes/` - Yeni not oluştur
- `GET /api/notes/{id}/` - Belirli notu getir
- `PUT /api/notes/{id}/` - Notu güncelle
- `DELETE /api/notes/{id}/` - Notu sil

## 🎨 Özelleştirme

### Tema Renkleri
`frontend/public/manifest.json` dosyasında tema renklerini değiştirebilirsiniz:

```json
{
  "theme_color": "#4DBA87",
  "background_color": "#ffffff"
}
```

### API Base URL
`frontend/src/services/api.js` dosyasında API base URL'ini değiştirebilirsiniz:

```javascript
const api = axios.create({
  baseURL: 'https://your-domain.com/api/',
  // ...
})
```

## 🧪 Offline Test Rehberi

### Chrome DevTools ile Offline Test

#### 1. Service Worker Kontrolü

**Application Tab → Service Workers:**
- Service worker durumunu kontrol edin
- "Update on reload" seçeneğini aktif edin (development için)
- "Unregister" ile service worker'ı temizleyebilirsiniz
- "Skip waiting" ile yeni service worker'ı hemen aktif edebilirsiniz

**Konsol Komutları:**
```javascript
// Service worker durumunu kontrol et
navigator.serviceWorker.getRegistration().then(reg => console.log(reg))

// Service worker'ı yeniden yükle
navigator.serviceWorker.getRegistration().then(reg => reg.update())

// Tüm service worker'ları listele
navigator.serviceWorker.getRegistrations().then(regs => console.log(regs))
```

#### 2. Cache Storage Kontrolü

**Application Tab → Cache Storage:**
- Cache'lenmiş dosyaları görüntüleyin
- Her cache'i ayrı ayrı inceleyebilirsiniz:
  - `workbox-precache-v2-*` - Precache edilmiş dosyalar
  - `api-cache` - API yanıtları
  - `pages-cache` - Sayfa cache'leri
  - `images-cache` - Resimler
  - `fonts-cache` - Fontlar
  - `static-resources` - CSS ve JS dosyaları

**Konsol Komutları:**
```javascript
// Tüm cache'leri listele
caches.keys().then(keys => console.log(keys))

// Belirli bir cache'i aç
caches.open('api-cache').then(cache => {
  cache.keys().then(keys => console.log('API Cache:', keys))
})

// Cache'i temizle (test için)
caches.delete('api-cache').then(() => console.log('Cache temizlendi'))
```

#### 3. Network Tab ile Offline Simülasyonu

**Network Tab:**
- "Offline" checkbox'ını işaretleyerek internet bağlantısını kesin
- "Throttling" dropdown'ından yavaş bağlantı simüle edin:
  - Slow 3G
  - Fast 3G
  - Custom (özel ayarlar)

**Konsol Komutları:**
```javascript
// Network durumunu kontrol et
console.log('Online:', navigator.onLine)

// Online/offline event'lerini dinle
window.addEventListener('online', () => console.log('Online!'))
window.addEventListener('offline', () => console.log('Offline!'))
```

#### 4. Offline Queue Kontrolü

**Konsol Komutları:**
```javascript
// Offline queue durumunu kontrol et
const offlineService = await import('./src/services/offlineService.js')
console.log('Sync Status:', offlineService.default.getSyncStatus())

// Bekleyen sync sayısı
console.log('Pending:', offlineService.default.getPendingSyncCount())

// Offline queue'yu temizle
offlineService.default.clearOfflineData()
```

### Local Test Senaryoları

#### Senaryo 1: Temel Offline Mod Testi

1. **Uygulamayı açın:**
   ```bash
   cd frontend
   npm run serve
   ```

2. **Backend'i başlatın:**
   ```bash
   cd backend
   python manage.py runserver
   ```

3. **Uygulamayı tarayıcıda açın** (http://localhost:3000)

4. **Birkaç görev ekleyin** ve sayfayı yenileyin

5. **Chrome DevTools → Network → Offline** checkbox'ını işaretleyin

6. **Sayfayı yenileyin:**
   - Offline indicator görünmeli
   - Önceden yüklenen görevler görünmeli
   - Offline.html sayfası görünmemeli (cache çalışıyorsa)

7. **Yeni bir görev ekleyin:**
   - Görev eklenmeli (offline queue'ya)
   - Offline indicator'da bekleyen sync sayısı artmalı

8. **Online'a geçin** (Offline checkbox'ını kaldırın):
   - Otomatik sync başlamalı
   - Console'da sync log'ları görünmeli
   - Backend'de görev oluşmalı

#### Senaryo 2: Cache Testi

1. **Uygulamayı açın ve görevleri yükleyin**

2. **Chrome DevTools → Application → Cache Storage** ile cache'leri kontrol edin

3. **Offline'a geçin**

4. **Sayfayı yenileyin:**
   - Tüm görevler görünmeli (cache'den)
   - Yeni görev ekleyebilmelisiniz

5. **Cache'i temizleyin:**
   ```javascript
   caches.keys().then(keys => 
     Promise.all(keys.map(key => caches.delete(key)))
   )
   ```

6. **Sayfayı yenileyin:**
   - Offline.html görünmeli (cache yoksa)

#### Senaryo 3: Sync Queue Testi

1. **Offline'a geçin**

2. **Birkaç görev ekleyin/düzenleyin/silin:**
   - Her işlem offline queue'ya eklenmeli
   - Offline indicator'da sayı artmalı

3. **Console'da queue durumunu kontrol edin:**
   ```javascript
   const offlineService = await import('./src/services/offlineService.js')
   console.log(offlineService.default.getSyncStatus())
   ```

4. **Online'a geçin:**
   - Otomatik sync başlamalı
   - Console'da her sync işlemi log'lanmalı
   - Backend'de tüm değişiklikler görünmeli

5. **Backend'i kontrol edin:**
   - Admin panelinde veya API'den görevlerin eklendiğini/güncellendiğini doğrulayın

#### Senaryo 4: Retry ve Conflict Testi

1. **Backend'i durdurun:**
   ```bash
   # Backend process'ini durdurun (Ctrl+C)
   ```

2. **Offline'a geçin ve görev ekleyin**

3. **Online'a geçin** (backend hala kapalı):
   - Sync başarısız olmalı
   - Retry mekanizması devreye girmeli
   - Console'da retry log'ları görünmeli

4. **Backend'i tekrar başlatın:**
   ```bash
   python manage.py runserver
   ```

5. **Manuel sync tetikleyin:**
   - Offline indicator'daki "Senkronize Et" butonuna tıklayın
   - Veya console'dan:
   ```javascript
   const offlineService = await import('./src/services/offlineService.js')
   await offlineService.default.forceSync()
   ```

### Test Utility Script

Proje kök dizininde `test-offline.html` dosyası oluşturarak offline test için yardımcı bir sayfa kullanabilirsiniz. Bu sayfa:
- Service worker durumunu gösterir
- Cache durumunu listeler
- Offline queue durumunu gösterir
- Manuel sync tetikleme butonu içerir

Detaylı test rehberi için `OFFLINE_TESTING.md` dosyasına bakın.

## 🐛 Sorun Giderme

### CORS Hatası
Backend'de `settings.py` dosyasında `CORS_ALLOWED_ORIGINS` listesine frontend URL'inizi ekleyin.

### Build Hatası
Node.js ve npm versiyonlarınızı kontrol edin:
```bash
node --version
npm --version
```

### Veritabanı Hatası
Migrasyon dosyalarını temizleyip yeniden oluşturun:
```bash
python manage.py makemigrations --empty api
python manage.py migrate
```

### Service Worker Sorunları

**Service Worker güncellenmiyor:**
1. Chrome DevTools → Application → Service Workers
2. "Update on reload" seçeneğini aktif edin
3. "Unregister" ile mevcut service worker'ı kaldırın
4. Sayfayı yenileyin

**Cache temizleme:**
```javascript
// Tüm cache'leri temizle
caches.keys().then(keys => 
  Promise.all(keys.map(key => caches.delete(key)))
).then(() => console.log('Tüm cache\'ler temizlendi'))
```

**Offline queue temizleme:**
```javascript
// Browser console'da
localStorage.removeItem('offlineSyncQueue')
location.reload()
```

### Offline Mod Çalışmıyor

1. **Service Worker kayıtlı mı kontrol edin:**
   ```javascript
   navigator.serviceWorker.getRegistration().then(reg => {
     if (reg) console.log('Service Worker kayıtlı:', reg)
     else console.log('Service Worker kayıtlı değil!')
   })
   ```

2. **HTTPS veya localhost kullanıldığından emin olun:**
   - Service Worker sadece HTTPS veya localhost'ta çalışır

3. **Cache'lerin dolu olduğundan emin olun:**
   - İlk açılışta cache'lerin dolması için sayfayı birkaç kez ziyaret edin

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 İletişim

Herhangi bir sorunuz varsa lütfen issue açın.
