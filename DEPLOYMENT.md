# 🚀 Deployment Rehberi

Bu rehber, PWA uygulamanızı Render.com (Backend) ve Vercel (Frontend) üzerinde deploy etmek için adım adım talimatlar içerir.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Backend Deployment (Render.com)](#backend-deployment-rendercom)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Post-Deployment Ayarları](#post-deployment-ayarları)
5. [Sorun Giderme](#sorun-giderme)

---

## Genel Bakış

Bu proje iki ayrı servis olarak deploy edilir:
- **Backend**: Django REST API (Render.com)
- **Frontend**: Vue.js PWA (Vercel)

### Gereksinimler

- GitHub hesabı
- Render.com hesabı (ücretsiz)
- Vercel hesabı (ücretsiz)
- Git kurulu

---

## Backend Deployment (Render.com)

### 1. GitHub Repository Hazırlığı

Projenizi GitHub'a push edin:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Render.com'da Yeni Web Service Oluşturma

1. [Render.com](https://render.com) hesabınıza giriş yapın
2. Dashboard'da **"New +"** butonuna tıklayın
3. **"Blueprint"** seçeneğini seçin
4. GitHub repository'nizi bağlayın
5. `render.yaml` dosyası otomatik olarak algılanacak

**VEYA** Manuel olarak:

1. **"New +"** → **"Web Service"** seçin
2. GitHub repository'nizi bağlayın
3. Aşağıdaki ayarları yapın:

#### Web Service Ayarları

- **Name**: `pwa-backend`
- **Environment**: `Python 3`
- **Build Command**: 
  ```bash
  cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput
  ```
- **Start Command**: 
  ```bash
  cd backend && python manage.py migrate && gunicorn pwa_backend.wsgi:application --bind 0.0.0.0:$PORT
  ```

### 3. PostgreSQL Database Oluşturma

1. Render Dashboard'da **"New +"** → **"PostgreSQL"** seçin
2. Ayarlar:
   - **Name**: `pwa-postgres-db`
   - **Plan**: Free (veya istediğiniz plan)
   - **Region**: Oregon (veya size yakın)

3. Database oluşturulduktan sonra **"Connection Info"** bölümünden connection string'i kopyalayın

### 4. Environment Variables Ayarlama

Backend Web Service'inizde **"Environment"** sekmesine gidin ve şu değişkenleri ekleyin:

```
DEBUG=False
SECRET_KEY=<Render otomatik oluşturur veya kendiniz oluşturun>
DATABASE_URL=<PostgreSQL connection string (Render otomatik bağlar)>
ALLOWED_HOSTS=pwa-backend.onrender.com
PYTHON_VERSION=3.11.8
```

**SECRET_KEY oluşturma:**
```python
# Python'da çalıştırın:
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

### 5. Deploy

1. **"Manual Deploy"** → **"Deploy latest commit"** seçin
2. Deploy işlemi tamamlanana kadar bekleyin (5-10 dakika)
3. Backend URL'inizi not edin: `https://pwa-backend.onrender.com`

### 6. İlk Kurulum

Deploy tamamlandıktan sonra:

1. **Logs** sekmesinden deploy loglarını kontrol edin
2. Admin kullanıcısı otomatik oluşturulur:
   - Username: `admin`
   - Password: `admin123`
   - **ÖNEMLİ**: İlk girişten sonra şifreyi değiştirin!

3. Admin paneline erişim:
   ```
   https://pwa-backend.onrender.com/admin/
   ```

---

## Frontend Deployment (Vercel)

### 1. Vercel Hesabı ve Repository Bağlama

1. [Vercel.com](https://vercel.com) hesabınıza giriş yapın
2. **"Add New..."** → **"Project"** seçin
3. GitHub repository'nizi import edin

### 2. Project Ayarları

#### Build Settings

- **Framework Preset**: Vue.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Environment Variables

**"Environment Variables"** sekmesine gidin ve ekleyin:

```
VUE_APP_API_URL=https://pwa-backend.onrender.com/api/
NODE_ENV=production
```

**ÖNEMLİ**: Backend URL'inizi buraya yazın!

### 3. Deploy

1. **"Deploy"** butonuna tıklayın
2. Deploy işlemi tamamlanana kadar bekleyin (2-5 dakika)
3. Frontend URL'inizi not edin: `https://your-app.vercel.app`

### 4. Custom Domain (Opsiyonel)

1. Vercel Dashboard → **"Settings"** → **"Domains"**
2. Kendi domain'inizi ekleyin
3. DNS ayarlarını yapın

---

## Post-Deployment Ayarları

### 1. Backend CORS Ayarları

Backend'inizde frontend URL'ini CORS'a ekleyin:

**Render.com Environment Variables:**
```
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

Veya `settings.py`'de zaten `CORS_ALLOW_ALL_ORIGINS = True` var, bu yeterli.

### 2. Frontend API URL Güncelleme

Eğer backend URL'i değiştiyse, Vercel'de environment variable'ı güncelleyin:

```
VUE_APP_API_URL=https://yeni-backend-url.onrender.com/api/
```

Sonra yeniden deploy edin.

### 3. Admin Şifresi Değiştirme

1. Backend admin paneline giriş yapın
2. **"Users"** → Admin kullanıcısını seçin
3. Şifreyi değiştirin

### 4. SSL Sertifikası

Render ve Vercel otomatik olarak SSL sertifikası sağlar. HTTPS zorunludur (PWA için).

---

## Sorun Giderme

### Backend Sorunları

#### 1. Database Connection Hatası

**Hata**: `django.db.utils.OperationalError`

**Çözüm**:
- Render'da PostgreSQL database'in bağlı olduğundan emin olun
- `DATABASE_URL` environment variable'ının doğru olduğunu kontrol edin
- Database'in aktif olduğundan emin olun (free tier'da 90 gün kullanılmazsa silinir)

#### 2. Static Files Hatası

**Hata**: CSS/JS dosyaları yüklenmiyor

**Çözüm**:
- Build command'da `collectstatic` çalıştığından emin olun
- WhiteNoise middleware'in aktif olduğunu kontrol edin
- `STATIC_ROOT` ayarını kontrol edin

#### 3. Timeout Hatası

**Hata**: Request timeout

**Çözüm**:
- Render free tier'da 15 dakika kullanılmazsa uyku moduna geçer
- İlk istekte "wake-up" süresi 30-60 saniye olabilir
- Frontend'de `wakeUpBackend()` fonksiyonu kullanılabilir

#### 4. CORS Hatası

**Hata**: `Access-Control-Allow-Origin`

**Çözüm**:
- Backend'de `CORS_ALLOW_ALL_ORIGINS = True` olduğundan emin olun
- Frontend URL'ini `CORS_ALLOWED_ORIGINS` listesine ekleyin

### Frontend Sorunları

#### 1. API Bağlantı Hatası

**Hata**: Network error veya 404

**Çözüm**:
- Vercel environment variable'da `VUE_APP_API_URL` doğru mu kontrol edin
- Backend'in çalıştığından emin olun
- Browser console'da network tab'ı kontrol edin

#### 2. Build Hatası

**Hata**: Build failed

**Çözüm**:
- `package.json`'daki script'leri kontrol edin
- Node.js versiyonunu kontrol edin (Vercel otomatik algılar)
- Local'de `npm run build` çalıştırarak test edin

#### 3. Service Worker Hatası

**Hata**: Service worker kayıt edilemiyor

**Çözüm**:
- HTTPS kullanıldığından emin olun (Vercel otomatik sağlar)
- `service-worker.js` dosyasının build output'ta olduğunu kontrol edin
- Browser console'da service worker loglarını kontrol edin

### Genel Sorunlar

#### 1. Render Free Tier Uyku Modu

Render free tier'da 15 dakika kullanılmazsa uygulama uyku moduna geçer.

**Çözüm**:
- İlk istekte 30-60 saniye bekleme süresi olabilir
- Cron job ile düzenli ping gönderebilirsiniz
- Paid plan'a geçebilirsiniz

#### 2. Environment Variables Güncellenmiyor

**Çözüm**:
- Environment variable değiştikten sonra **mutlaka yeniden deploy** edin
- Vercel'de "Redeploy" yapın
- Render'da "Manual Deploy" yapın

#### 3. Cache Sorunları

**Çözüm**:
- Browser cache'ini temizleyin
- Hard refresh yapın (Ctrl+Shift+R veya Cmd+Shift+R)
- Service worker'ı unregister edin (DevTools → Application → Service Workers)

---

## Deployment Checklist

### Backend (Render.com)

- [ ] GitHub repository push edildi
- [ ] Render.com'da Web Service oluşturuldu
- [ ] PostgreSQL database oluşturuldu
- [ ] Environment variables ayarlandı (DEBUG, SECRET_KEY, DATABASE_URL, ALLOWED_HOSTS)
- [ ] Deploy tamamlandı
- [ ] Backend URL çalışıyor (`https://pwa-backend.onrender.com/api/`)
- [ ] Admin paneli erişilebilir
- [ ] API endpoints test edildi

### Frontend (Vercel)

- [ ] Vercel'de project oluşturuldu
- [ ] Root directory `frontend` olarak ayarlandı
- [ ] Build settings doğru yapılandırıldı
- [ ] Environment variable `VUE_APP_API_URL` ayarlandı
- [ ] Deploy tamamlandı
- [ ] Frontend URL çalışıyor
- [ ] API bağlantısı test edildi
- [ ] PWA özellikleri test edildi (offline mode, install)

### Post-Deployment

- [ ] Admin şifresi değiştirildi
- [ ] CORS ayarları kontrol edildi
- [ ] SSL sertifikaları aktif
- [ ] Custom domain ayarlandı (opsiyonel)
- [ ] Monitoring/logging ayarlandı (opsiyonel)

---

## Hızlı Deploy Komutları

### Local Test

```bash
# Backend
cd backend
python manage.py runserver

# Frontend
cd frontend
npm run serve
```

### Production Build Test

```bash
# Frontend build test
cd frontend
npm run build
npm install -g serve
serve -s dist
```

---

## Destek ve Kaynaklar

- [Render.com Dokümantasyonu](https://render.com/docs)
- [Vercel Dokümantasyonu](https://vercel.com/docs)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Vue.js Deployment Guide](https://vuejs.org/guide/scaling-up/deployment.html)

---

## Notlar

1. **Free Tier Limitleri**:
   - Render: 15 dakika kullanılmazsa uyku modu
   - Vercel: 100GB bandwidth/month
   - PostgreSQL: 90 gün kullanılmazsa silinir

2. **Güvenlik**:
   - Production'da `DEBUG=False` olmalı
   - `SECRET_KEY` güvenli tutulmalı
   - Admin şifresi mutlaka değiştirilmeli

3. **Performans**:
   - Render free tier'da ilk istek yavaş olabilir
   - Vercel CDN kullanır, hızlıdır
   - Database connection pooling kullanılabilir

---

**Başarılar! 🎉**

