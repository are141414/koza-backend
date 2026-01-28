# Koza 🌸 - Happy Mom Clone

Koza, hamilelik takibi, forum, ve çeşitli araçlar içeren kapsamlı bir web uygulamasıdır.

## 📦 Kurulum

Öncelikle gerekli Python kütüphanelerini yükleyin:

```bash
pip install -r requirements.txt
```

## 🚀 Başlatma (Terminal Komutları)

Uygulamayı yerel sunucuda başlatmak için proje ana dizininde şu kodu çalıştırın:

```bash
uvicorn api.main:app --reload
```
*Bu komut sunucuyu `http://127.0.0.1:8000` adresinde başlatır.*

### 🛠️ Debug (Hata Ayıklama) Modu
Hataları detaylı görmek (Error Logs) ve verbose çıktı almak için `--log-level debug` parametresini ekleyin:

```bash
uvicorn api.main:app --reload --log-level debug
```

## 🩺 Sağlık Kontrolü (Health Check)

Sunucunun ve modüllerin düzgün çalışıp çalışmadığını kontrol etmek için hazırladığımız script'i kullanabilirsiniz:

```bash
python preflight_checklist.py
```

Alternatif olarak, sadece sunucunun ayakta olup olmadığını basitçe test etmek için:
*(Windows Powershell)*
```powershell
curl -I http://127.0.0.1:8000/
```

## 📂 Proje Yapısı
- **api/** : Backend kodları (FastAPI)
- **models/** : Veritabanı modelleri (SQLAlchemy)
- **ui/** : Frontend arayüzü (HTML/JS/CSS)
- **build.config.json** : Mobil derleme ayarları
