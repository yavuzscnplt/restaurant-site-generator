# Mimari

## Pipeline

Sistem, bağımsız çalışabilen ama tek hatta zincirlenen modüllerden oluşur:

```
scraper.js     → Google Maps verisi (web sitesi olmayanları filtreler)
demo-factory.js → içerik (Gemini) + tema seçimi + görsel + statik derleme
deploy (*.js)   → Vercel API ile yayın, sabit {slug}.vercel.app alias
outreach.js     → WhatsApp/e-posta mesajı + QR
pipeline.js     → hepsini sırayla koşturan orkestratör
```

n8n bir workflow olarak bu adımları zamanlanmış/tetiklenmiş çalıştırır
(`n8n-workflow.json`).

## Tasarım ilkeleri

### 1. Hiçbir dış servis hattı durduramaz
Üretim hattının her dış bağımlılığı için **fallback** vardır:

- **İçerik:** Gemini → (kota dolarsa) sıradaki Gemini modeli → (hepsi başarısızsa) offline
  şablon içeriği. Hat asla "API yok" diye durmaz.
- **Görsel:** Pexels → Unsplash → LoremFlickr → Picsum → AI (Pollinations). Her birinin
  zaman aşımı var; biri takılırsa sıradakine geçilir.

Bu, "tek geliştirici, gece 03:00'te toplu üretim" senaryosunda hattın gözetimsiz
tamamlanmasını sağlar.

### 2. Şablon = saf HTML + placeholder
Her tema, `{{RESTAURANT_NAME}}`, `{{HERO_SUBTITLE}}`, `{{MENU_JSON_STRING}}` gibi
placeholder'lar içeren tek bir `index.html`'dir. Derleme adımı bunları üretilen içerikle
doldurur. Framework yok → çıktı saf statik, anında yüklenen, Vercel'de bedavaya yakın
barındırılan bir site.

### 3. İçerik güveni: gerçek menü override
AI içeriği "havalı ama uydurma" olabilir. `content-overrides/<slug>.json` varsa, menü ve
imza yemekleri **gerçek veriyle** değiştirilir; stok görseller korunur. Yani satışta
gösterilen menü gerçektir, sadece sunum otomatiktir.

### 4. Sabit, temiz deploy alias
Vercel her production deploy'una rastgele bir URL verir; sistem bunu her zaman
`{slug}.vercel.app` sabit alias'ına bağlar → işletmeye gönderilen link temiz ve kalıcı.

## Mutfak temaları

`templates/` altında 9 ayrı tema: `steakhouse`, `finedining`, `seafood`, `kebap`,
`italian`, `cafe`, `meyhane`, `asian`, `vegan`. Gemini'nin döndürdüğü `theme` alanı
hangi temanın kullanılacağını belirler; bilinmeyen tema `finedining`'e düşer.
