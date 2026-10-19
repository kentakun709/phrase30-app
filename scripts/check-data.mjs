// data/phrases.json の点検（AC1・AC2・AC9 の機械の部分）。あるべき数: 言語6・フレーズ30・表現180
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
const seen = new Set(); let count = 0
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
    if (p.ja.includes('〇〇') && x.template && !x.template.includes('〇〇')) errs.push(`n=${p.n} ${c}: 原文は〇〇入りなのに template に〇〇が無い`)
    if (x.example && x.example.includes('〇〇')) errs.push(`n=${p.n} ${c}: example に〇〇が残っている（読み上げられない）`)
    if (x.ja && x.ja.includes('〇〇')) errs.push(`n=${p.n} ${c}: ja（例文の訳）に〇〇が残っている`)
    if (c === 'th' && x.example && !x.example.endsWith('ครับ')) errs.push(`n=${p.n} th: 例文の文末に丁寧形 ครับ が無い`)
    if (x.audio && !/^(?!\/\/)(?![a-z]+:)[^\s]+$/i.test(x.audio)) errs.push(`n=${p.n} ${c}: audio は空か同じサイト内の相対パスだけ（${x.audio}）`)
  }
})
console.log(`言語 ${codes.length}/${EXPECT.languages}・フレーズ ${d.phrases.length}/${EXPECT.phrases}・表現 ${count}/${EXPECT.languages * EXPECT.phrases}`)
if (errs.length) { console.error('× ' + errs.length + ' 件'); for (const e of errs) console.error('  - ' + e); process.exit(1) }
if (count === 0) { console.error('対象0件'); process.exit(2) }
console.log('○ check-data: 異常なし')
