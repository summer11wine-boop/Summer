// Vercel Serverless Function
// 接收 ?url=商品頁網址，伺服器端抓取該頁面 HTML 並嘗試解析出
// 酒名、圖片、價格、評分、風味描述、酒莊介紹等欄位，回傳 JSON。
// 因為是伺服器端執行，不會受瀏覽器的跨網域（CORS）限制影響。
//
// 這是「盡力而為」的通用解析器：不同酒商網站的頁面結構不同，
// 抓取結果不一定 100% 準確，前端會把結果放進可編輯欄位，
// 使用者送出前務必檢查一次。

function stripTags(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function matchMeta(html, prop) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`,
    'i'
  );
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? stripTags(m[1]) : '';
}

function splitEnZh(title) {
  if (!title) return { en: '', zh: '' };
  const m = title.match(/^([A-Za-z0-9À-ÿ&.,'’\-()\s]+)/);
  if (m && m[1].trim().length > 1) {
    const en = m[1].trim();
    const zh = title.slice(m[1].length).trim();
    if (zh) return { en, zh };
  }
  return { en: '', zh: title.trim() };
}

function extractPrice(html) {
  // WooCommerce 常見的特價寫法：<del>...NT$X...</del> ... <ins>...NT$Y...</ins>
  let m = html.match(
    /<del>[\s\S]{0,300}?NT\$\s*([\d,]+)[\s\S]{0,300}?<\/del>[\s\S]{0,300}?<ins>[\s\S]{0,300}?NT\$\s*([\d,]+)[\s\S]{0,300}?<\/ins>/i
  );
  if (m) {
    return { sale: true, listPrice: m[1], salePrice: m[2] };
  }
  // 區間價格：NT$X – NT$Y（多年份/多容量商品常見）
  m = html.match(/NT\$\s*([\d,]+)\s*[–\-~]\s*NT\$\s*([\d,]+)/);
  if (m) {
    return { sale: false, priceLine: `NT$ ${m[1]} 起（依年份 / 容量報價）` };
  }
  // 單一價格
  m = html.match(/NT\$\s*([\d,]+)/);
  if (m) {
    return { sale: false, priceLine: `NT$ ${m[1]}` };
  }
  return { sale: false, priceLine: '' };
}

const SCORE_NAME_MAP = {
  wineadvocate: 'WA', robertparker: 'RP', jamessuckling: 'JS', winespectator: 'WS',
  decanter: 'DECANTER', vinous: 'VINOUS', janeanson: 'JANE ANSON',
  falstaff: 'FALSTAFF', jebdunnuck: 'JD', rp: 'RP', wa: 'WA', js: 'JS', ws: 'WS', jd: 'JD',
};

function extractScores(text) {
  const re = /\b(Wine\s?Advocate|Robert\s?Parker|James\s?Suckling|Wine\s?Spectator|Jane\s?Anson|Jeb\s?Dunnuck|Decanter|Vinous|Falstaff|RP|WA|JS|WS|JD)\b\s*[:：]?\s*(\d{2,3}(?:[-–+]\d{0,3})?)/gi;
  const found = new Set();
  let m;
  while ((m = re.exec(text)) !== null) {
    const key = m[1].toLowerCase().replace(/\s/g, '');
    const label = SCORE_NAME_MAP[key] || m[1].toUpperCase();
    found.add(`${label} ${m[2]}`);
    if (found.size >= 4) break;
  }
  return Array.from(found);
}

function extractFlavor(text) {
  const idx = text.indexOf('酒款表現');
  if (idx === -1) return '';
  let seg = text.slice(idx + 4, idx + 4 + 400).trim();
  // 部分商品頁（如多年份酒款）在「酒款表現」下方是逐年份條列，
  // 例如「【2019】JS 99、RP 97-99...」，這種格式不適合直接當成
  // 單一風味描述使用，偵測到就放棄，改用 og:description 當備援。
  if (seg.startsWith('【') || seg.slice(0, 12).includes('【')) return '';
  const stopIdx = seg.search(/餐酒搭配|相關商品|您可能也喜歡|【/);
  if (stopIdx !== -1) seg = seg.slice(0, stopIdx);
  return seg.trim().slice(0, 220);
}

function splitHeadline(desc) {
  if (!desc) return ['', ''];
  const cleaned = desc.trim();
  const m = cleaned.match(/^(.{4,36}?)[！!。，,](.*)$/);
  if (m) {
    return [m[1].trim(), m[2].trim().slice(0, 24)];
  }
  return [cleaned.slice(0, 24), ''];
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const targetUrl = req.query.url;
  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    res.status(400).json({ error: '請提供有效的商品網址（需以 http/https 開頭）' });
    return;
  }
  try {
    const resp = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeWineEDMBot/1.0)' },
    });
    if (!resp.ok) {
      res.status(502).json({ error: `目標網站回應錯誤（HTTP ${resp.status}）` });
      return;
    }
    const html = await resp.text();
    const text = stripTags(html);

    const ogTitle = matchMeta(html, 'og:title');
    const h1 = extractH1(html);
    const titleSource = h1 || ogTitle;
    const { en, zh } = splitEnZh(titleSource);

    const image = matchMeta(html, 'og:image');
    const description = matchMeta(html, 'og:description');
    const price = extractPrice(html);
    const scores = extractScores(text);
    const flavor = extractFlavor(text);
    const [headline1, headline2] = splitHeadline(description);

    res.status(200).json({
      sourceUrl: targetUrl,
      en_name: en,
      name: zh,
      vintage: '',
      image,
      headline1,
      headline2,
      winery: description,
      flavor: flavor || description,
      scores,
      ...price,
    });
  } catch (err) {
    res.status(500).json({ error: '抓取或解析失敗：' + (err && err.message ? err.message : String(err)) });
  }
};
