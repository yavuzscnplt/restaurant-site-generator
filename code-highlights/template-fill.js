/**
 * KOD ÖRNEĞİ — Placeholder tabanlı statik site derleme.
 *
 * Framework yok: her tema, {{PLACEHOLDER}} alanları olan tek bir index.html. Derleme
 * adımı üretilen içeriği (metin + görsel yolları) bu alanlara basar ve saf statik bir
 * site çıkarır → anında yüklenir, Vercel'de neredeyse bedava barınır.
 *
 * Gemini'nin döndürdüğü `theme` alanı hangi şablonun kullanılacağını belirler;
 * bilinmeyen tema güvenli şekilde finedining'e düşer.
 */

async function fillTemplate(content, restaurant) {
  // 1) Temaya göre şablon seç (eş anlamlıları eşle, yoksa fallback)
  let templateFolder = content.theme || 'fine_dining';
  if (templateFolder === 'steak') templateFolder = 'steakhouse';
  if (templateFolder === 'bar' || templateFolder === 'fine_dining') templateFolder = 'finedining';
  if (!fs.existsSync(path.join(TEMPLATES, templateFolder, 'index.html'))) {
    templateFolder = 'finedining'; // bilinmeyen tema → güvenli varsayılan
  }

  let html = fs.readFileSync(path.join(TEMPLATES, templateFolder, 'index.html'), 'utf8');

  // 2) Başlığı stilli parçala: ilk kelime kalın, gerisi italik/soluk
  const [firstWord, ...rest] = restaurant.name.split(' ');
  const styledName = rest.length
    ? `${firstWord}<br><span class="font-light italic text-white/70">${rest.join(' ')}</span>`
    : firstWord;

  // 3) Metin placeholder'ları
  html = html
    .replace(/{{RESTAURANT_NAME}}/g, restaurant.name)
    .replace(/{{RESTAURANT_NAME_HTML}}/g, styledName)
    .replace(/{{RESTAURANT_SHORT_NAME}}/g, restaurant.short_name)
    .replace(/{{LOCATION_SHORT}}/g, restaurant.location_short)
    .replace(/{{PHONE_DISPLAY}}/g, restaurant.phone_display)
    .replace(/{{HERO_SUBTITLE}}/g, content.hero_subtitle)
    .replace(/{{ABOUT_TEXT}}/g, content.about_text)
    .replace(/{{MENU_JSON_STRING}}/g, JSON.stringify(content.menu, null, 2));

  return html;
}
