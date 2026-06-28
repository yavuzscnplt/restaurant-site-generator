/**
 * KOD ÖRNEĞİ — Türkçe karakter-duyarlı slug üretimi.
 *
 * "Çağrı Kebap & Izgara" gibi Türkçe + özel karakterli adları URL-güvenli, okunur
 * slug'a çevirir: "cagri-ve-kebap-izgara". Standart slugify Türkçe ı/İ/ş/ğ vb. karakterleri
 * ya düşürür ya bozar; bu yüzden önce manuel eşleme yapılır.
 */

function slugify(str) {
  const map = {
    'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','İ':'i',
    'ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u',
  };
  return String(str)
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, c => map[c] || c) // Türkçe → ASCII
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // kalan aksanları temizle
    .replace(/&/g, ' ve ')                            // & → "ve"
    .replace(/[^a-z0-9]+/g, '-')                       // alfanümerik dışı → tire
    .replace(/^-+|-+$/g, '');                          // baştaki/sondaki tireyi at
}
