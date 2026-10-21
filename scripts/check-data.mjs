// data/phrases.json の点検（AC1・AC2・AC9・AC11 の機械の部分）。あるべき数: 言語6・フレーズ30・表現180
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const here = dirname(fileURLToPath(import.meta.url))
const d = JSON.parse(readFileSync(join(here, '..', 'data', 'phrases.json'), 'utf8'))
const EXPECT = { languages: 6, phrases: 30, codes: ['en', 'zh', 'ko', 'es', 'ru', 'th'] }
if (!Array.isArray(d.sections) || d.sections.length === 0) errs0('sections（小見出し）が無い')
function errs0 (m) { console.error('× ' + m); process.exit(1) }
const errs = []
const codes = d.languages.map(l => l.code)
if (codes.length !== EXPECT.languages) errs.push(`言語が ${codes.length} 件（あるべき ${EXPECT.languages}）`)
for (const c of EXPECT.codes) if (!codes.includes(c)) errs.push(`言語 ${c} が無い`)
for (const l of d.languages) if (!Array.isArray(l.bcp47) || !l.bcp47.length || !l.nameJa) errs.push(`言語 ${l.code} に bcp47/nameJa が無い`)
if (d.phrases.length !== EXPECT.phrases) errs.push(`フレーズが ${d.phrases.length} 件（あるべき ${EXPECT.phrases}）`)
// AC11 読み: 中国語はピンイン（声調記号つき・漢字なし）、ほかは / / で囲んだ発音記号（IPA に特有の文字を含む）
const TONE_RE = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/
const HANZI_RE = /[\u3400-\u9fff]/
// 約束で使わないと決めた記号（文末の ? ! .・読点・内破音 ̚・連結 ‿・つなぎ線 ͡・音節の区切り点）。IPA_RE の結合文字の範囲に ̚ と ͡ が入るので先に判定する
const FORBID_RE = /[.?!,、，。？！\u031a\u203f\u0361]/
const QUOTE_RE = /["“”'‘’「」«»]/   // 読みには引用符を付けない（約束）
const SCRIPT_RE = /[\u0400-\u04ff\uac00-\ud7af\u0e00-\u0e7f\u3400-\u9fff]/   // zh 以外の読みにキリル・ハングル・タイ文字・漢字が混じらない
const IPA_RE = /[əɪʊɛɔʃʒθðŋɾˈːɐɨʂʐɕʑʌɯʔɤɒæʝɲɡ\u02b0\u02b2\u0300-\u036f]/
const seen = new Set(); let count = 0; let altCount = 0; let readingCount = 0
d.phrases.forEach((p, i) => {
  if (p.n !== i + 1) errs.push(`${i + 1} 番目の n が ${p.n}`)
  if (seen.has(p.n)) errs.push(`n=${p.n} が重複`); seen.add(p.n)
  if (!p.ja) errs.push(`n=${p.n} の日本語（原文の型）が空`)
  for (const c of codes) {
    const x = p.langs && p.langs[c]
    if (!x) { errs.push(`n=${p.n} ${c} が無い`); continue }
    count++
    if (!x.example || !x.example.trim()) errs.push(`n=${p.n} ${c} の example が空`)
    if (!x.ja || !x.ja.trim()) errs.push(`n=${p.n} ${c} の ja が空`)
    if (!('template' in x) || !x.template) errs.push(`n=${p.n} ${c} の template が無い`)
    if (!('audio' in x)) errs.push(`n=${p.n} ${c} に audio 欄が無い`)
    if (!x.reading || !x.reading.trim()) errs.push(`n=${p.n} ${c} の reading（読み）が空`)
    else if (QUOTE_RE.test(x.reading)) errs.push(`n=${p.n} ${c}: 読みに引用符がある（${x.reading}）`)
    else if (FORBID_RE.test(c === 'zh' ? x.reading : x.reading.slice(1, -1))) errs.push(`n=${p.n} ${c}: 読みに使わない記号がある（${x.reading}）`)
    else if (c !== 'zh' && SCRIPT_RE.test(x.reading)) errs.push(`n=${p.n} ${c}: 発音記号にその言語の文字が混じっている（${x.reading}）`)
    else if (c === 'zh') {
      if (HANZI_RE.test(x.reading)) errs.push(`n=${p.n} zh: 読みに漢字が入っている（${x.reading}）`)
      else if (!TONE_RE.test(x.reading)) errs.push(`n=${p.n} zh: 読みに声調記号が無い（${x.reading}）`)
      else readingCount++
    } else if (!/^\/[^/]+\/$/.test(x.reading)) errs.push(`n=${p.n} ${c}: 発音記号が / / で囲まれていない（${x.reading}）`)
    else if (!IPA_RE.test(x.reading)) errs.push(`n=${p.n} ${c}: 発音記号に IPA の文字が無い（${x.reading}）`)
    else readingCount++
    if (c !== 'en' && x.note && /\bJapanese\b/.test(x.note)) errs.push(`n=${p.n} ${c}: 注に英単語 Japanese（その言語の語で書く）`)
    if (!p.ja.includes('〇〇') && x.template && x.example && x.template !== x.example) altCount++
    if (p.ja.includes('〇〇') && x.template && !x.template.includes('〇〇')) errs.push(`n=${p.n} ${c}: 原文は〇〇入りなのに template に〇〇が無い`)
    if (x.example && x.example.includes('〇〇')) errs.push(`n=${p.n} ${c}: example に〇〇が残っている（読み上げられない）`)
    if (x.ja && x.ja.includes('〇〇')) errs.push(`n=${p.n} ${c}: ja（例文の訳）に〇〇が残っている`)
    if (c === 'th' && x.example && !x.example.endsWith('ครับ')) errs.push(`n=${p.n} th: 例文の文末に丁寧形 ครับ が無い`)
    if (x.audio && !/^audio\/[^\s]+$/.test(x.audio)) errs.push(`n=${p.n} ${c}: audio は空か audio/ 配下の相対パスだけ（${x.audio}）`)
  }
})
// 記号の読み方（legend）の網羅: その言語の読みに出る記号（NFD で a-z・空白・/ 以外の1字ずつ）が全部、どれかの見出しに入っている。j は必ず・w は読みに出る言語だけ。zh は声調の印4つと q x zh ch sh z c r ü e
const ZH_KEYS = ['j', 'ian', '\u0304', '\u0301', '\u030c', '\u0300', 'q', 'x', 'zh', 'ch', 'sh', 'z', 'c', 'r', 'ü', 'e']
const legendLine = []
for (const l of d.languages) {
  const keys = (l.legend || []).map(e => e[0].normalize('NFD'))
  if (!keys.length) { errs.push(`言語 ${l.code} に legend（記号の読み方）が無い`); continue }
  const need = new Set()
  if (l.code === 'zh') ZH_KEYS.forEach(k => need.add(k))
  else {
    for (const p of d.phrases) for (const ch of (p.langs[l.code].reading || '').normalize('NFD')) if (!/[a-z \/]/.test(ch)) need.add(ch)
    need.add('j'); if (d.phrases.some(p => /w/.test(p.langs[l.code].reading || ''))) need.add('w')
  }
  let ok = 0
  for (const ch of need) { if (keys.some(k => l.code === 'zh' && ch.length > 1 ? k === ch : (l.code === 'zh' && /^[a-zü]$/.test(ch) ? k === ch.normalize('NFD') : k.includes(ch)))) ok++; else errs.push(`言語 ${l.code}: 記号の読み方に「${ch}」が無い`) }
  legendLine.push(`${l.code} ${ok}/${need.size}`)
}
console.log('凡例（記号の読み方の網羅）: ' + legendLine.join('・'))
console.log(`言語 ${codes.length}/${EXPECT.languages}・フレーズ ${d.phrases.length}/${EXPECT.phrases}・表現 ${count}/${EXPECT.languages * EXPECT.phrases}・読み ${readingCount}/${EXPECT.languages * EXPECT.phrases}・〇〇なしで「別の言い方」を持つ物 ${altCount}件`)
if (errs.length) { console.error('× ' + errs.length + ' 件'); for (const e of errs) console.error('  - ' + e); process.exit(1) }
if (count === 0) { console.error('対象0件'); process.exit(2) }
console.log('○ check-data: 異常なし')
