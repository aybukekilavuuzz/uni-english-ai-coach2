# Uni-English AI Coach - Geliştirme Görev Listesi

Bu liste, `prd.md` dokümanına göre uygulamayı adım adım geliştirmek için hazırlanmıştır.

## 1) Proje Kurulumu
- [x] Proje klasor yapisini olustur (`index.html`, `styles.css`, `app.js`, `server.js`, `.env`, `README.md`).
- [ ] Node.js projesi baslat ve gerekli paketleri kur (`express`, `cors`, `dotenv`).
- [x] Basit bir `npm start` script'i tanimla.
- [x] `.gitignore` dosyasina `node_modules` ve `.env` ekle.

## 2) Input Ekrani (Ana Sayfa)
- [x] `index.html` icine buyuk bir metin kutusu (`textarea`) ekle.
- [x] "Analiz Et" butonunu ekle.
- [x] Sonuclari gostermek icin 3 bolumluk cikti alani hazirla (Ozet, Kelimeler, Quiz).
- [x] Sayfa yapisini sade ve okunabilir tutacak temel HTML iskeletini tamamla.

## 3) UI Stil ve Deneyim
- [x] `styles.css` ile sade bir arayuz tasarla (okunakli font, bosluklar, kart yapisi).
- [x] `loading` durumu icin bir metin veya spinner tasarla.
- [x] Butonun pasif/aktif durumlarini ayarla (metin yoksa pasif).
- [x] Mobil uyum icin temel responsive duzen ekle.

## 4) Frontend Davranisi
- [x] `app.js` icinde buton tiklamasini dinle.
- [x] Girilen metin bossa kullaniciya uyari goster.
- [x] Istek sirasinda loading gostergesini ac, istek bitince kapat.
- [x] Backend API'ye POST istegi at (`/analyze`).
- [x] Gelen sonucu ilgili alanlara yerlestir (ozet maddeleri, kelime listesi, quiz sorulari).
- [x] API hatalarinda anlasilir hata mesaji goster.

## 5) Backend API
- [x] `server.js` icinde Express sunucusu olustur.
- [x] JSON body parse ve CORS ayarlarini ekle.
- [x] `POST /analyze` endpoint'ini olustur.
- [x] Request body'sinde gelen `text` alanini dogrula (bos veya cok kisa metni reddet).
- [x] Gecici test icin mock response donen bir surum hazirla.

## 6) Gemini AI Entegrasyonu
- [x] Gemini API anahtarini `.env` uzerinden oku.
- [x] PRD'deki formata uygun prompt olustur:
  - [x] 5 maddelik ozet
  - [x] 5 teknik kelime aciklamasi
  - [x] 3 soruluk mini quiz
- [x] Gemini API'ye istek atip cevabi al.
- [x] AI cevabini standart bir JSON formata parse et:
  - [x] `summary: string[]`
  - [x] `terms: { term: string, meaning: string }[]`
  - [x] `quiz: { question: string, options?: string[], answer?: string }[]`
- [x] Beklenmeyen AI ciktilari icin fallback davranisi ekle.

## 7) Sonuc Ekrani Entegrasyonu
- [x] Ozeti madde madde goster.
- [x] Teknik kelimeleri ve aciklamalarini listele.
- [x] Quiz sorularini ekrana yazdir.
- [x] Cok uzun metinlerde kaydirma ve okunabilirlik kontrolleri yap.

## 8) Test ve Dogrulama
- [ ] Kisa, orta ve uzun akademik metinlerle manuel test yap.
- [ ] 30-60 saniye hedef suresini olc ve not al.
- [ ] Hata senaryolarini test et:
  - [ ] Bos metin
  - [ ] API key eksik
  - [ ] Gemini timeout / hata
- [ ] Cikti kalitesini kontrol et (anlamli ozet, ilgili kelime, tutarli quiz).

## 9) MVP Son Dokunuslar
- [ ] UI metinlerini duzgunlestir (Turkce/Ingilizce tutarlilik).
- [ ] README'ye kurulum ve calistirma adimlarini yaz.
- [ ] Ortam degiskenleri ve API key kullanimi icin kisa dokumantasyon ekle.
- [ ] Demo icin ornek akademik metin ekle.

## 10) Yayinlama (Deploy)
- [ ] Uygulamayi Netlify veya benzeri bir ortama deploy et.
- [ ] Canli linkte temel akisi test et.
- [ ] Deploy sonrasi olasi CORS ve environment ayarlarini dogrula.

## 11) Gelecek Asama (Opsiyonel)
- [ ] PDF yukleme destegi
- [ ] Sesli okuma ozelligi
- [ ] Kullanici ilerleme takibi
- [ ] Farkli quiz tipleri (coktan secmeli / acik uclu karmasi)
