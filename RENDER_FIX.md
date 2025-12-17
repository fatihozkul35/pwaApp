# 🔧 Render Deployment Hata Düzeltmesi

## Sorun

Render'da deploy sonrası şu hata alınıyor:
```
django.db.utils.OperationalError: could not translate host name "dpg-d37k7oer433s73er4qg0-a" to address
```

## Neden

1. **Database Connection String**: External connection string kullanılıyor, internal olmalı
2. **Python Versiyonu**: Render Python 3.13 kullanıyor, 3.11.8 olmalı
3. **Database Hazır Değil**: Web servisi database'den önce başlıyor olabilir

## Çözüm

### 1. render.yaml Güncellemesi ✅

`render.yaml` dosyasında şu değişiklik yapıldı:

```yaml
# ÖNCE (YANLIŞ)
property: connectionString

# SONRA (DOĞRU)
property: internalConnectionString
```

### 2. Render Dashboard'da Manuel Düzeltme

Eğer Blueprint kullanmıyorsanız, Render Dashboard'da:

1. **pwa-backend** servisine gidin
2. **Environment** sekmesine tıklayın
3. `DATABASE_URL` environment variable'ını bulun
4. **Edit** butonuna tıklayın
5. **Database** dropdown'ından `pwa-postgres-db` seçin
6. **Property** olarak **"Internal Connection String"** seçin
7. **Save Changes** → **Manual Deploy**

### 3. Python Versiyonu

Render'da Python versiyonu için:

1. **pwa-backend** servisine gidin
2. **Settings** sekmesine tıklayın
3. **Python Version** bölümünde `3.11.8` seçin (veya `runtime.txt` dosyası otomatik algılanır)

### 4. Database Servisinin Önce Deploy Edilmesi

1. Render Dashboard'da **pwa-postgres-db** servisine gidin
2. **Manual Deploy** yapın ve tamamlanmasını bekleyin
3. Sonra **pwa-backend** servisini deploy edin

## Adım Adım Düzeltme

### Yöntem 1: Blueprint ile (Önerilen)

1. GitHub'a güncellenmiş `render.yaml` dosyasını push edin:
   ```bash
   git add render.yaml
   git commit -m "Fix database connection string"
   git push origin main
   ```

2. Render Dashboard'da:
   - Mevcut servisleri silin (veya yeni bir blueprint oluşturun)
   - **New +** → **Blueprint**
   - Repository'yi seçin
   - **Apply** → Deploy başlar

### Yöntem 2: Manuel Düzeltme

1. **Database Servisi**:
   - `pwa-postgres-db` servisinin çalıştığından emin olun
   - **Status** yeşil olmalı

2. **Backend Servisi**:
   - **Environment** → `DATABASE_URL` düzenle
   - **Internal Connection String** seç
   - **Save** → **Manual Deploy**

3. **Python Versiyonu**:
   - **Settings** → **Python Version**: `3.11.8`
   - Veya `runtime.txt` dosyasının `backend/` klasöründe olduğundan emin olun

## Test

Deploy tamamlandıktan sonra:

1. **Logs** sekmesinden hataları kontrol edin
2. Backend URL'ini test edin:
   ```
   https://pwa-backend.onrender.com/api/tasks/
   ```
3. Admin paneline giriş yapın:
   ```
   https://pwa-backend.onrender.com/admin/
   Username: admin
   Password: admin123
   ```

## Hala Çalışmıyorsa

### Database Connection String Kontrolü

Render Dashboard'da:
1. **pwa-postgres-db** → **Info** sekmesi
2. **Internal Connection String**'i kopyalayın
3. **pwa-backend** → **Environment** → `DATABASE_URL`
4. Manuel olarak yapıştırın (geçici çözüm)

### Python Versiyonu Kontrolü

Build loglarında Python versiyonunu kontrol edin:
```
Python 3.11.8
```

Eğer 3.13 görüyorsanız:
1. `backend/runtime.txt` dosyasının içeriği: `python-3.11.8`
2. Render'da **Settings** → **Python Version** manuel seçin

### Database Hazır Değil

Eğer database henüz hazır değilse:
1. Database servisinin deploy olmasını bekleyin
2. **Status** yeşil olana kadar bekleyin
3. Sonra backend'i deploy edin

## Özet

✅ `render.yaml` güncellendi: `internalConnectionString` kullanılıyor
✅ `runtime.txt` mevcut: Python 3.11.8
✅ Database servisi önce deploy edilmeli

**Sonraki Adım**: GitHub'a push edin ve Render'da yeniden deploy edin!

