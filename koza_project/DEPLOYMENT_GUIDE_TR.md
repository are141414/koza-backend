# 🚀 Koza Projesi - Mobil Dağıtım & İmzalam Klavuzu

Bu döküman, **Koza (Happy Mom Clone)** projenizi Android (Play Store) ve iOS (App Store) mağazalarına yüklemeye hazır hale getirmek için gereken **imzalama (signing)** ve **paketleme** adımlarını içerir.

Projemiz web tabanlı (HTML/JS/Python) olduğu için, mobil uygulama çıktısı almak adına modern bir **Wrapper (Sarmalayıcı)** teknolojisi olan **Capacitor** veya **Cordova** kullandığımız varsayılmıştır.

## 📂 1. Hazırlık: Build Config

Proje ana dizininde oluşturulan `build.config.json` dosyası temel ayarlarınızı içerir:
- **Versiyon:** 1.0.0
- **Paket ID:** `com.koza.happymom.clone`
- **İzinler:** Kamera, Galeri, İnternet

---

## 🤖 2. Android İçin (APK / AAB)

Google Play Store artık `.apk` yerine `.aab` (Android App Bundle) formatını zorunlu kılmaktadır.

### Adım 2.1: Keystore (Anahtar Deposu) Oluşturma
Uygulamanızı imzalamak için benzersiz bir dijital imza dosyanız olmalıdır. Bu dosyayı asla kaybetmeyin!

**Terminalden şu komutu çalıştırın:**
```bash
keytool -genkey -v -keystore koza-release.keystore -alias koza_key -keyalg RSA -keysize 2048 -validity 10000
```
*Sizden şifre ve kişisel bilgiler isteyecektir. Şifreyi güvenli bir yere not edin.*

### Adım 2.2: Build Alma (AAB)
Android Studio veya komut satırı kullanarak Release modunda build alın:

```bash
# Eğer Capacitor kullanıyorsanız:
npx cap open android
# Android Studio açılacaktır.
# Build > Generate Signed Bundle / APK > Android App Bundle seçin.
```

### Adım 2.3: İmzalama (Signing)
Oluşturduğunuz `koza-release.keystore` dosyasını seçin ve şifrenizi girin.
Çıktı olarak `app-release.aab` dosyasını alacaksınız. Bu dosya Play Store'a yüklenmeye hazırdır.

---

## 🍎 3. iOS İçin (IPA)

iOS dağıtımı için **MacOS** işletim sistemi ve **Xcode** gereklidir. Ayrıca Apple Developer Program üyeliği ($99/yıl) zorunludur.

### Adım 3.1: Sertifika ve Profil
1. **Apple Developer Account**'a giriş yapın.
2. `Certificates, Identifiers & Profiles` bölümüne gidin.
3. **Identifier** oluşturun: `com.koza.happymom.clone`.
4. **Distribution Certificate** (Dağıtım Sertifikası) oluşturup Mac'inize indirin ve kurun.
5. **Provisioning Profile** (App Store tipi) oluşturun.

### Adım 3.2: Xcode ile Arşivleme
```bash
# Projeyi Xcode'da açın
npx cap open ios
```
1. Xcode'da projenin "Signing & Capabilities" sekmesine gelin.
2. Oluşturduğunuz Team ve Profil'i seçin.
3. Versiyonun `1.0.0` olduğundan emin olun.
4. Menüden **Product > Archive** seçeneğine tıklayın.

### Adım 3.3: App Store Connect Yükleme
Arşivleme bittiğinde "Organizer" penceresi açılır.
- **Distribute App** butonuna tıklayın.
- **App Store Connect** seçeneğini işaretleyin.
- İşlem tamamlandığında uygulamanız TestFlight'a düşecektir.

---

## ✅ 4. Son Kontroller (Pre-Flight)

Markete göndermeden önce `python preflight_checklist.py` komutunu çalıştırarak:
1. API bağlantılarının çalıştığını,
2. Offline (Çevrimdışı) modun aktif olduğunu,
3. Logolarda kırıklık olmadığını doğrulayın.

Başarılar! 🌸
