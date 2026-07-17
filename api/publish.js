// Vercel Serverless Function
// 接收前端已經組好的 EDM HTML 全文，存到 Vercel Blob（物件儲存）
// 並回傳一個公開可分享的網址，讓使用者不用再手動上傳 GitHub。
//
// 使用前必須先在 Vercel 專案的 Storage 分頁建立一個 Blob store 並連接到
// 這個專案（一次性設定），詳見 README.md。

const { put } = require('@vercel/blob');

function slugify(text) {
  const base = (text || 'edm')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'edm';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    res.status(405).json({ error: '僅支援 POST 請求' });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const html = body.html;
    const title = body.title || 'edm';

    if (!html || typeof html !== 'string' || html.length < 50) {
      res.status(400).json({ error: '缺少要發布的 HTML 內容' });
      return;
    }
    if (html.length > 4 * 1024 * 1024) {
      res.status(400).json({ error: '內容過大（超過 4MB），請減少酒款數量或圖片' });
      return;
    }

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const pathname = `edm/${slugify(title)}-${id}.html`;

    const blob = await put(pathname, html, {
      access: 'public',
      contentType: 'text/html; charset=utf-8',
      addRandomSuffix: false,
    });

    res.status(200).json({ url: blob.url });
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (msg.includes('BLOB_READ_WRITE_TOKEN') || msg.includes('No token')) {
      res.status(500).json({
        error: '尚未設定 Blob 儲存空間。請到 Vercel 專案的 Storage 分頁建立一個 Blob store 並連接到這個專案（詳見 README），設定好之後重新部署一次即可。',
      });
      return;
    }
    res.status(500).json({ error: '發布失敗：' + msg });
  }
};
