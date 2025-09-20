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
