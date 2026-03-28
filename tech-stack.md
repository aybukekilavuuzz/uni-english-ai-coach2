# Uni-English AI Coach - En Basit Tech Stack

Bu dokuman, baslangic seviyesinde bir ogrenci icin en kolay kurulum ve gelistirme akisini hedefler.  
Hedefimiz: "kisa surede calisan prototip (MVP)".

---

## 1) Onerilen En Basit Teknoloji Yigini

- Frontend: `HTML + CSS + Vanilla JavaScript`
- Backend: `Node.js + Express`
- AI: `Gemini API (Google AI Studio API key)`
- Ortam degiskeni: `.env` (`dotenv`)
- Gelistirme editoru: `Cursor` veya `VS Code`
- Yayinlama (opsiyonel): `Render` (backend) + `Netlify` (frontend)  
  > Ilk asamada deploy zorunlu degil, once lokal calistirmak daha iyi.

---

## 2) Neden Bu Teknolojileri Sectik?

### HTML + CSS + Vanilla JavaScript
- Baslangic icin en dusuk ogrenme egriisi.
- React gibi framework karmasasi yok; once temel mantigi ogrenirsin.
- Tek sayfa uygulama (input + sonuc) icin fazlasiyla yeterli.

### Node.js + Express
- JavaScript ile hem frontend hem backend yazarsin (tek dil avantajı).
- Express ile API yazmak cok hizli ve sade.
- Gemini cagrilarini backend uzerinden yapmak API key guvenligi icin dogru yaklasim.

### Gemini API
- Proje gereksinimine tam uygun (ozet, teknik kelime aciklama, quiz uretimi).
- Tek endpoint cagrisi ile anlamli metin ciktilari uretebilirsin.
- Google AI Studio API key ile hizli baslangic imkani var.

### dotenv (.env)
- API key'i kodun icine gommezsin.
- Guvenlik ve duzenli proje yapisi saglar.

---

## 3) Mimariyi Basit Tutma Karari

En basit guvenli akis:

1. Kullanici metni frontend'de girer.
2. Frontend, metni backend'deki `/analyze` endpoint'ine gonderir.
3. Backend Gemini API'ye istek atar.
4. Gemini cevabi backend'de sade JSON'a donusturulur.
5. Frontend bu JSON'u ekranda gosterir.

Neden dogrudan frontend'den Gemini cagirmiyoruz?
- API key aciga cikabilir.
- CORS ve guvenlik sorunlari yasayabilirsin.
- Prompt ve cevap formatini backend'de daha iyi kontrol edersin.

---

## 4) Kurulum Adimlari (Adim Adim)

## 4.1 Gereksinimler
- `Node.js LTS` kurulu olmali (18+ onerilir).
- Bir kod editoru (Cursor / VS Code).
- Google AI Studio API key hazir olmali.

Node surum kontrolu:
```bash
node -v
npm -v
```

---

## 4.2 Proje Klasoru ve Baslatma

```bash
mkdir uni-english-ai-coach
cd uni-english-ai-coach
npm init -y
```

---

## 4.3 Paketleri Kur

```bash
npm install express cors dotenv
```

Istersen gelistirme kolayligi icin:
```bash
npm install -D nodemon
```

---

## 4.4 Dosya Yapisi Olustur

```text
uni-english-ai-coach/
  .env
  .gitignore
  package.json
  server.js
  public/
    index.html
    styles.css
    app.js
```

---

## 4.5 .env ve .gitignore Ayarla

`.env`:
```env
GEMINI_API_KEY=buraya_kendi_api_keyini_yaz
PORT=3000
```

`.gitignore`:
```gitignore
node_modules
.env
```

---

## 4.6 package.json Scriptleri

`package.json` icinde scripts bolumune:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

---

## 4.7 Basit Sunucu Calistir

`server.js` tarafinda:
- Express sunucusu
- `express.json()` middleware
- `cors()` middleware
- `public` klasorunu static servis etme
- `POST /analyze` endpoint'i

Calistirma:
```bash
npm run dev
```

Tarayicida:
- `http://localhost:3000`

---

## 4.8 Gemini API Entegrasyon Mantigi

`POST /analyze` endpoint'i su adimlari izler:
- Frontend'den gelen `text` degerini alir.
- Prompt olusturur (ozet + teknik kelime + quiz).
- Gemini API'ye istek atar.
- Cevabi `summary`, `terms`, `quiz` formatina donusturur.
- Frontend'e JSON doner.

Bu yapi, PRD'deki cekirdek ozellige birebir uyar.

---

## 5) Baslangic Seviyesi Icin Yol Haritasi

1. Once sadece metni al ve ekrana geri yazdir (API'siz).
2. Sonra `/analyze` endpoint'ini mock veriyle calistir.
3. En son Gemini entegrasyonunu ac.
4. Hata durumlarini ekle (bos metin, API hata, timeout).

Bu sira ile gidersen karmasa yasamadan, her adimi gorerek ilerlersin.

---

## 6) Ozet Karar

Bu proje icin en sade ve dogru secim:
- `Vanilla JS + Express + Gemini API`

Cunku:
- Ogrenmesi kolay
- Hızlı MVP cikarma odakli
- Guvenlik olarak API key backend'de kalir
- Sonradan React/TypeScript'e gecis icin guclu temel olusturur
⚙️ Teknik Yapı (Tech Stack)

Başlangıç için önerilen:

- Frontend: HTML + CSS + JavaScript
- Backend: JavaScript (Node.js) veya basit API çağrısı
- AI: Gemini API (Google AI Studio)
- Deploy: Lovable / Netlify

