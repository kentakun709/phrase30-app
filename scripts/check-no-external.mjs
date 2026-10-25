// AC6: ログイン・APIキー・課金・外部サービスへの通信が無いことの機械の確認
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const here = dirname(fileURLToPath(import.meta.url))
const files = ['index.html', 'app.js', 'style.css', 'morse.html'].map(f => [f, readFileSync(join(here, '..', f), 'utf8')])
const errs = []
for (const [f, s] of files) {
  if (f === 'morse.html') {
    // 辞書URLは2つの定数の宣言位置だけ許可する。同じURLの直書き読み込みは許可しない。
    const dictionaryUrls = new Set()
    for (const m of s.matchAll(/^\s*const KUROMOJI_(?:SCRIPT|DIC) = (['"])(https:\/\/cdn\.jsdelivr\.net\/npm\/kuromoji@0\.1\.2\/[^'"\s]*)\1;\s*$/gm)) {
      dictionaryUrls.add(m.index + m[0].indexOf(m[2]))
    }
    for (const m of s.matchAll(/(?:[a-z][a-z\d+.-]*:)?\/\/[^\s"'`<>)]+/gi)) {
      if (m[0] !== 'http://www.w3.org/2000/svg' && !dictionaryUrls.has(m.index)) errs.push(`${f}: 外部URL ${m[0]}`)
    }
    for (const m of s.matchAll(/<(script|link)\b[^>]*?\b(src|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi)) {
      const url = m[3] ?? m[4] ?? m[5]
      if (/^(?:https?:)?\/\//i.test(url)) errs.push(`${f}: 外部${m[1].toLowerCase() === 'script' ? 'スクリプト' : 'リンク'}を読み込んでいる`)
    }
  } else {
    for (const m of s.matchAll(/https?:\/\/[^\s"'<>)]+/g)) if (!/www\.w3\.org\/2000\/svg/.test(m[0])) errs.push(`${f}: 外部URL ${m[0]}`)
  }
  for (const m of s.matchAll(/fetch\(\s*['"`]([^'"`]+)/g)) if (m[1] !== 'data/phrases.json') errs.push(`${f}: fetch 先 ${m[1]}`)
  // Kuromoji 辞書URLの限定補正に使う参照1か所だけ除外する。他ファイル・他の通信は従来どおり点検する。
  const communicationSource = f === 'morse.html'
    ? s.replace(/^    const xhrPrototype = window\.XMLHttpRequest\.prototype;\r?$/m, '')
    : s
  if (/XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/.test(communicationSource)) errs.push(`${f}: 通信の仕組みがある`)
  if (/api[_-]?key|apikey|client_secret|authorization|bearer|stripe|paypal|login|signin|password/i.test(s)) errs.push(`${f}: 鍵・ログイン・課金の語がある`)
  if (f === 'index.html' && /<script[^>]+src=["']https?:/.test(s)) errs.push(`${f}: 外部スクリプトを読み込んでいる`)
}
// data の audio 欄（外部URLでないこと）は check-data.mjs が見る（audio/ 配下の相対パスだけ許す）
console.log(`点検したファイル ${files.length}/4`)
if (errs.length) { console.error('× ' + errs.length + ' 件'); errs.forEach(e => console.error('  - ' + e)); process.exit(1) }
console.log('○ check-no-external: 外部通信・鍵・ログイン・課金なし（モールスの手動読込辞書のみ例外）')
