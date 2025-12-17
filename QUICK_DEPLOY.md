# ⚡ Hızlı Deployment Rehberi

Bu rehber, projeyi en hızlı şekilde deploy etmek için özet adımları içerir.

## 🎯 Hızlı Başlangıç

### 1. GitHub'a Push

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Backend (Render.com) - 5 Dakika

1. [render.com](https://render.com) → **New +** → **Blueprint**
2. GitHub repo'yu bağla
3. `render.yaml` otomatik algılanır
4. **Apply** → Deploy başlar
5. Backend URL'ini not et: `https://pwa-backend.onrender.com`

**Önemli**: İlk deploy 5-10 dakika sürebilir.

### 3. Frontend (Vercel) - 3 Dakika

1. [vercel.com](https://vercel.com) → **Add New Project**
2. GitHub repo'yu import et
3. Ayarlar:
   - **Root Directory**: `frontend`
   - **Framework**: Vue.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** ekle:
   ```
   VUE_APP_API_URL=https://pwa-backend.onrender.com/api/
   ```
5. **Deploy**

### 4. Test

- Backend: `https://pwa-backend.onrender.com/api/tasks/`
- Frontend: `https://your-app.vercel.app`
- Admin: `https://pwa-backend.onrender.com/admin/` (admin/admin123)

## ✅ Deployment Sonrası

1. **Admin şifresini değiştir**
2. **Backend URL'i doğru mu kontrol et** (Vercel env vars)
3. **CORS çalışıyor mu test et**

## 🐛 Sorun mu var?

Detaylı rehber için `DEPLOYMENT.md` dosyasına bakın.

## 📝 Notlar

- Render free tier: 15 dk kullanılmazsa uyku modu (ilk istek yavaş)
- Vercel: Otomatik SSL, CDN, hızlı
- İlk deploy'da sabırlı olun (5-10 dk)

---

**Başarılar! 🚀**

