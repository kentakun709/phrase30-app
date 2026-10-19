// AC6: ログイン・APIキー・課金・外部サービスへの通信が無いことの機械の確認
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const here = dirname(fileURLToPath(import.meta.url))
const files = ['index.html', 'app.js', 'style.css'].map(f => [f, readFileSync(join(here, '..', f), 'utf8')])
const errs = []
for (const [f, s] of files) {
  for (const m of s.matchAll(/https?:\/\/[^\s"'<>)]+/g)) if (!/www\.w3\.org\/2000\/svg/.test(m[0])) errs.push(`${f}: 外部URL ${m[0]}`)
  for (const m of s.matchAll(/fetch\(\s*['"`]([^'"`]+)/g)) if (m[1] !== 'data/phrases.json') errs.push(`${f}: fetch 先 ${m[1]}`)
  if (/XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/.test(s)) errs.push(`${f}: 通信の仕組みがある`)
  if (/api[_-]?key|apikey|client_secret|authorization|bearer|stripe|paypal|login|signin|password/i.test(s)) errs.push(`${f}: 鍵・ログイン・課金の語がある`)
  if (f === 'index.html' && /<script[^>]+src=["']https?:/.test(s)) errs.push(`${f}: 外部スクリプトを読み込んでいる`)
}
// data の audio 欄（外部URLでないこと）は check-data.mjs が見る（audio/ 配下の相対パスだけ許す）
console.log(`点検したファイル ${files.length}/3`)
if (errs.length) { console.error('× ' + errs.length + ' 件'); errs.forEach(e => console.error('  - ' + e)); process.exit(1) }
console.log('○ check-no-external: 外部通信・鍵・ログイン・課金なし')
