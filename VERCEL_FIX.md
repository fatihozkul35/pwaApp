# 🔧 Vercel Frontend Build Hatası Düzeltmesi

## Sorun

```
sh: line 1: vue-cli-service: command not found
Error: Command "npm run build" exited with 127
```

## Neden

Vercel build komutu `frontend` klasöründe çalışmıyor. `node_modules` ve `vue-cli-service` bulunamıyor.

## Çözüm

### Yöntem 1: Vercel Dashboard'da Ayarlama (ÖNERİLEN) ⭐

1. **Vercel Dashboard** → Projenize gidin
2. **Settings** → **General** sekmesi
3. **Root Directory** ayarını bulun
4. **Edit** → `frontend` yazın → **Save**
5. **Build & Development Settings** bölümünde:
   - **Framework Preset**: `Vue.js` (otomatik algılanır)
   - **Build Command**: `npm run build` (otomatik)
   - **Output Directory**: `dist` (otomatik)
   - **Install Command**: `npm install` (otomatik)
6. **Redeploy** yapın

### Yöntem 2: Root vercel.json Kullanma

Eğer root'taki `vercel.json` kullanmak istiyorsanız:

1. Vercel Dashboard'da **Settings** → **General**
2. **Root Directory** boş bırakın (root)
3. **Build Command** manuel ayarlayın:
   ```
   cd frontend && npm install && npm run build
   ```
4. **Output Directory**: `frontend/dist`
5. **Redeploy**

### Yöntem 3: frontend/vercel.json Kullanma

1. Root'taki `vercel.json` dosyasını silin veya yeniden adlandırın
2. Vercel Dashboard'da:
   - **Root Directory**: `frontend`
   - Diğer ayarlar otomatik algılanır
3. **Redeploy**

## Hızlı Çözüm (En Kolay)

### Adım 1: Vercel Dashboard

1. Projenize gidin → **Settings**
2. **Root Directory**: `frontend` olarak ayarlayın
3. **Save**

### Adım 2: Environment Variables

**Settings** → **Environment Variables**:

```
VUE_APP_API_URL=https://pwa-backend.onrender.com/api/
NODE_ENV=production
```

### Adım 3: Redeploy

1. **Deployments** sekmesine gidin
2. En son deployment'ın yanındaki **⋯** menüsüne tıklayın
3. **Redeploy** seçin

## Kontrol Listesi

Deploy öncesi kontrol edin:

- [ ] Root Directory: `frontend` olarak ayarlı
- [ ] Build Command: `npm run build` (veya boş, otomatik)
- [ ] Output Directory: `dist` (veya boş, otomatik)
- [ ] Install Command: `npm install` (veya boş, otomatik)
- [ ] Environment Variable: `VUE_APP_API_URL` ayarlı
- [ ] `frontend/package.json` içinde `vercel-build` script'i var

## Test

Deploy tamamlandıktan sonra:

1. Frontend URL'ini açın
2. Browser console'u kontrol edin (hata var mı?)
3. Network tab'ında API isteklerini kontrol edin
4. PWA özelliklerini test edin (offline mode, install)

## Hala Çalışmıyorsa

### Build Loglarını Kontrol Edin

1. **Deployments** → En son deployment
2. **Build Logs** sekmesine tıklayın
3. Hata mesajlarını kontrol edin

### Yaygın Hatalar

#### 1. "Cannot find module"
**Çözüm**: `npm install` çalıştığından emin olun

#### 2. "Command not found"
**Çözüm**: Root Directory `frontend` olmalı

#### 3. "Build failed"
**Çözüm**: 
- Node.js versiyonunu kontrol edin (Vercel otomatik algılar)
- `package.json`'daki script'leri kontrol edin

### Manuel Build Test

Local'de test edin:

```bash
cd frontend
npm install
npm run build
```

Eğer local'de çalışıyorsa, Vercel ayarlarını kontrol edin.

## Özet

✅ **En Kolay Çözüm**: Vercel Dashboard'da **Root Directory** = `frontend`
✅ Environment Variable: `VUE_APP_API_URL` ekleyin
✅ Redeploy yapın

**Sorun devam ederse**: Build loglarını paylaşın!

