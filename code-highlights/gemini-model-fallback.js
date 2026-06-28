/**
 * KOD ÖRNEĞİ — API kota yönetimi: model rotasyonu + backoff.
 *
 * Problem: Ücretsiz Gemini modellerinin günlük kotası var. Toplu üretimde bir model
 * kotayı doldurunca (429 / RESOURCE_EXHAUSTED) tüm hat çökerdi.
 *
 * Çözüm:
 *  - Birden fazla model sırayla denenir; kota dolunca SIRADAKİ modele geçilir.
 *  - Model indeksi restoranlar arası KALICI — tükenen modele geri dönülmez (boşa çağrı yok).
 *  - Kota dışı geçici hatalar (503 vb.) için backoff'lu yeniden deneme.
 */

const GEMINI_MODELS = (process.env.GEMINI_MODEL || 'gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash')
  .split(',').map(s => s.trim()).filter(Boolean);
let _modelIdx = 0; // restoranlar arası kalıcı

async function generateContent(restaurantName, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const model = GEMINI_MODELS[_modelIdx];
    try {
      return await callGemini(restaurantName, model);
    } catch (err) {
      const msg = typeof err === 'string' ? err : (err.message || String(err));
      const isQuota = /RESOURCE_EXHAUSTED|"code":\s*429|exceeded your current quota/i.test(msg);

      // Kota dolduysa ve daha denenmemiş model varsa: modele geç, bu denemeyi tüketme.
      if (isQuota && _modelIdx < GEMINI_MODELS.length - 1) {
        _modelIdx++;
        console.log(`    ⚠️  ${model} kotası doldu → ${GEMINI_MODELS[_modelIdx]}`);
        attempt--;
        continue;
      }
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 10000)); // geçici hata → backoff
    }
  }
}
