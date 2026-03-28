# 📘 Product Requirements Document (PRD)
## Proje Adı: Uni-English AI Coach

---

## 1. 🧩 Ürün Özeti (Overview)

Uni-English AI Coach, üniversite öğrencilerinin akademik İngilizce metinleri daha iyi anlamasını sağlayan AI destekli bir web uygulamasıdır.

Kullanıcı bir akademik metni uygulamaya yapıştırır. Yapay zeka bu metni analiz ederek:
- Kısa bir özet çıkarır
- Teknik kelimeleri açıklar
- Metne özel mini quiz oluşturur

Amaç: Öğrencinin tek bir metinden hızlıca öğrenmesini sağlamak.

---

## 2. 🎯 Hedef

- Akademik metinleri daha anlaşılır hale getirmek
- Öğrenme süresini kısaltmak
- Öğrencinin aktif öğrenmesini sağlamak (quiz ile)

---

## 3. 👤 Hedef Kullanıcı

- Üniversite öğrencileri
- İngilizce hazırlık öğrencileri
- Teknik bölümlerde okuyan (özellikle mühendislik) öğrenciler
- B1–C1 seviyesinde İngilizceye sahip kullanıcılar

---

## 4. 🚀 Temel Özellik (Core Feature)

Kullanıcı metin girer → AI analiz eder → sonuçları gösterir

AI çıktıları:
1. 3-5 maddelik özet
2. Teknik kelime açıklamaları
3. 3 soruluk mini quiz

---

## 5. 🖥️ Ekranlar (UI / Screens)

### 1. Ana Sayfa (Input Screen)
- Büyük bir metin kutusu (textarea)
- “Analiz Et” butonu

---

### 2. Sonuç Sayfası (Output Screen)

3 ayrı bölüm olacak:

#### 📌 Özet Bölümü
- Madde madde özet

#### 📚 Kelime Bölümü
- Teknik kelimeler + açıklamaları

#### ❓ Quiz Bölümü
- 3 soru (çoktan seçmeli veya açık uçlu)

---

## 6. 🔄 Kullanıcı Akışı (User Flow)

1. Kullanıcı siteyi açar  
2. Metin kutusuna akademik metni yapıştırır  
3. “Analiz Et” butonuna basar  
4. Sistem AI’a istek gönderir  
5. Kullanıcı loading (yükleniyor) görür  
6. Sonuçlar ekranda gösterilir  

---

## 7. 🤖 AI Entegrasyonu

- Gemini API kullanılacak
- AI’dan şu formatta çıktı istenecek:
  - Özet
  - Kelimeler
  - Quiz

### Örnek Prompt:
“Bu akademik metni analiz et:
1. 5 maddelik özet çıkar
2. 5 teknik kelimeyi açıkla
3. 3 soruluk mini quiz oluştur”

---

## 8. ⚙️ Teknik Yapı (Tech Stack)

Başlangıç için önerilen:

- Frontend: HTML + CSS + JavaScript
- Backend: JavaScript (Node.js) veya basit API çağrısı
- AI: Gemini API (Google AI Studio)
- Deploy: Lovable / Netlify

---

## 9. 📏 Başarı Kriterleri

- Kullanıcı metin girip sonuç alabiliyor mu?
- AI çıktısı anlamlı mı?
- 30–60 saniye içinde sonuç geliyor mu?

---

## 10. ⚠️ Kısıtlar (Constraints)

- Proje basit tutulmalı (tek feature)
- UI sade olmalı
- Hızlı çalışan prototip öncelik

---

## 11. 🔮 Gelecek Özellikler (Future Scope)

- Sesli okuma
- PDF yükleme
- Kişisel ilerleme takibi
- Farklı quiz türleri

---