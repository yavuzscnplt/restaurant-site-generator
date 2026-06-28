/**
 * KOD ÖRNEĞİ — Çok kaynaklı görsel indirme zinciri.
 *
 * Problem: Gözetimsiz toplu üretimde tek bir görsel kaynağı (rate limit, 503, timeout)
 * tüm hattı durdurabilir.
 *
 * Çözüm: Her görsel için sıralı fallback. Bir kaynak başarısız/yavaş olursa sıradakine
 * geçilir; hepsinde zaman aşımı var ki takılan bir kaynak build'i bekletmesin.
 * Sıra IMAGE_SOURCE'a göre değişir (varsayılan: internet öncelikli, AI son çare).
 */

async function fetchImg(aiPrompt, filename, stockQuery) {
  const dest = path.join(imgDir, filename);
  const q = stockQuery || `${t} restaurant food`;

  const tryPollinations = async () => {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=1200&height=800&nologo=true`;
    await downloadImage(url, dest, 30000);
  };
  const tryStock = async () => {
    const url = await stockPhotoUrl(q);          // Pexels → Unsplash
    if (!url) throw new Error('stok kaynak yok/boş');
    await downloadImage(url, dest);
  };
  const tryLorem = async () => {
    const tags = q.trim().split(/\s+/).slice(0, 4).join(','); // LoremFlickr etiket bekler
    await downloadImage(`https://loremflickr.com/1200/800/${tags}`, dest, 15000);
  };
  const tryPicsum = async () => {
    await downloadImage(`https://picsum.photos/1200/800`, dest, 15000); // keysiz son çare
  };

  const sources =
    IMAGE_SOURCE === 'pollinations' || IMAGE_SOURCE === 'auto'
      ? [['AI', tryPollinations], ['stok', tryStock], ['loremflickr', tryLorem], ['picsum', tryPicsum]]
      : [['stok', tryStock], ['loremflickr', tryLorem], ['picsum', tryPicsum], ['AI', tryPollinations]];

  for (const [label, fn] of sources) {
    try {
      await fn();
      return `./images/${filename}`;
    } catch (e) {
      console.log(`    ⚠️  ${label} başarısız (${e.message}). Sonraki kaynak...`);
    }
  }
  return `./images/${filename}`;
}

/**
 * downloadImage: yönlendirmeleri (301/302/307/308) izleyen ve zaman aşımı olan indirici.
 * Göreli Location başlıklarını mevcut URL'e göre çözer.
 */
function downloadImage(url, dest, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        res.resume();
        const next = new URL(res.headers.location, url).href; // göreli → mutlak
        return downloadImage(next, dest, timeoutMs).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('Status: ' + res.statusCode)); }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', (err) => fs.unlink(dest, () => reject(err)));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout ' + timeoutMs + 'ms')));
  });
}
