const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiZGVtbyIsImlhdCI6MTc4MTQ0MTMxNSwiZXhwIjoxNzgxNDQyMjE1fQ.w8I_Nfwsb8UGXUBhclu9N6BuXr9Ka22ceIT96bHlKI8';

const WORDS = [
  { word: '食べる', kana: 'たべる', romaji: 'taberu', meaning: '吃', example_ja: '毎朝パンを食べます。', example_zh: '每天早上吃面包。' },
  { word: '勉強', kana: 'べんきょう', romaji: 'benkyou', meaning: '学习', example_ja: '日本語を勉強しています。', example_zh: '正在学习日语。' },
  { word: '綺麗', kana: 'きれい', romaji: 'kirei', meaning: '漂亮、干净', example_ja: '今日は綺麗な空ですね。', example_zh: '今天的天空真漂亮呢。' },
  { word: '猫', kana: 'ねこ', romaji: 'neko', meaning: '猫', example_ja: '猫が好きです。', example_zh: '喜欢猫。' },
  { word: '犬', kana: 'いぬ', romaji: 'inu', meaning: '狗', example_ja: '犬を飼っています。', example_zh: '养了一只狗。' },
];

async function main() {
  // Step 1: Import words
  const resp = await fetch('https://kiku-api.onrender.com/api/words/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ words: WORDS }),
  });
  const data = await resp.json();
  console.log('Import status:', resp.status, data.message || data.error);

  // Step 2: Verify
  const rev = await fetch('https://kiku-api.onrender.com/api/review/today', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  });
  const revData = await rev.json();
  console.log('Review today:', revData.count, revData.error || '');
}

main().catch(console.error);
