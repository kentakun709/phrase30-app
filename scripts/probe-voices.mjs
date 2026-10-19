// この Mac の Chrome（本物の読み上げ）で、言語ごとに選ばれる声と、実際に鳴り始めて鳴り終わるかを記録する。
// 使い方: python3 -m http.server 8787 を起動してから  node scripts/probe-voices.mjs  （音は出るので、呼ぶ側でミュートする）
import { chromium } from '@playwright/test'
const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
page.on('pageerror', e => console.log('pageerror:', String(e)))
await page.goto('http://127.0.0.1:' + (process.env.PORT || '8787') + '/')
await page.waitForSelector('.card')
const info = await page.evaluate(async () => {
  const s = window.speechSynthesis; let voices = s.getVoices()
  if (!voices.length) await new Promise(r => { s.onvoiceschanged = () => r(); setTimeout(r, 2500) })
  voices = s.getVoices()
  const out = { ua: navigator.userAgent, total: voices.length, langs: {} }
  for (const l of window.phrase30.state.data.languages) {
    const v = window.phrase30.pickVoice(l, voices)
    out.langs[l.code] = v ? { name: v.name, lang: v.lang } : null
  }
  return out
})
console.log(JSON.stringify(info, null, 1))
const results = {}
for (const l of Object.keys(info.langs)) {
  await page.evaluate(code => window.phrase30.setLang(code), l)
  await page.locator('.card').first().click()
  const r = await page.evaluate(() => new Promise(res => {
    const s = window.speechSynthesis; const t0 = Date.now(); let started = false
    const iv = setInterval(() => {
      if (s.speaking) started = true
      if (started && !s.speaking) { clearInterval(iv); res({ ok: true, ms: Date.now() - t0 }) }
      if (Date.now() - t0 > 8000) { clearInterval(iv); res({ ok: false, started, ms: Date.now() - t0 }) }
    }, 50)
  }))
  const notice = await page.locator('#notice').evaluate(el => el.hidden ? '' : el.textContent)
  results[l] = { ...r, voice: info.langs[l], notice: notice.slice(0, 60) }
  console.log(l, JSON.stringify(results[l]))
}
await page.evaluate(code => window.phrase30.setLang(code), 'en')
await page.screenshot({ path: 'log/phrase30-en-390.png', fullPage: false })
await page.evaluate(code => window.phrase30.setLang(code), 'th')
await page.screenshot({ path: 'log/phrase30-th-390.png', fullPage: false })
await browser.close()
