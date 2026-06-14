const https = require('https');

const WORDS = [
  { word: '食べる', kana: 'たべる', romaji: 'taberu', meaning: '吃', example_ja: '毎朝パンを食べます。', example_zh: '每天早上吃面包。' },
  { word: '勉強', kana: 'べんきょう', romaji: 'benkyou', meaning: '学习', example_ja: '日本語を勉強しています。', example_zh: '正在学习日语。' },
  { word: '綺麗', kana: 'きれい', romaji: 'kirei', meaning: '漂亮、干净', example_ja: '今日は綺麗な空ですね。', example_zh: '今天的天空真漂亮呢。' },
  { word: '猫', kana: 'ねこ', romaji: 'neko', meaning: '猫', example_ja: '猫が好きです。', example_zh: '喜欢猫。' },
  { word: '犬', kana: 'いぬ', romaji: 'inu', meaning: '狗', example_ja: '犬を飼っています。', example_zh: '养了一只狗。' },
];

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiZGVtbyIsImlhdCI6MTc4MTQ0MTMxNSwiZXhwIjoxNzgxNDQyMjE1fQ.w8I_Nfwsb8UGXUBhclu9N6BuXr9Ka22ceIT96bHlKI8';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL('https://kiku-api.onrender.com' + path);
    const req = https.request(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}`, 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let out = '';
      res.on('data', c => out += c);
      res.on('end', () => resolve(JSON.parse(out)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    const r = await post('/api/words/import', { words: WORDS });
    console.log('Import:', r.message, '-', r.imported, 'words');
    
    // Verify
    const get = (path) => new Promise((resolve, reject) => {
      https.get('https://kiku-api.onrender.com' + path, { headers: { Authorization: `Bearer ${TOKEN}` } }, res => {
        let out = '';
        res.on('data', c => out += c);
        res.on('end', () => resolve(JSON.parse(out)));
      }).on('error', reject);
    });
    const review = await get('/api/review/today');
    console.log('Review today:', review.count, 'words');
  } catch(e) { console.error(e); }
})();
