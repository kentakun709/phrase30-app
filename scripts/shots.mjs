// 画面写しを log/ に撮る（スマホ幅 zh・ko・th・en・PC 幅 ru・記号の読み方を開いた th・ko）。使い方: node scripts/shots.mjs "$PWD"（127.0.0.1:8791 で配信を立てる。8765 は別のサーバが使っていることがある）
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
const root = process.argv[2]
const srv = spawn('python3', ['-m', 'http.server', '8791', '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' })
await new Promise(r => setTimeout(r, 2500))
const b = await chromium.launch({ channel: 'chrome' })
const shots = [['en', 390, 844, 's3-phone-en.png'], ['zh', 390, 844, 's3-phone-zh.png'], ['ko', 390, 844, 's3-phone-ko.png'], ['th', 390, 844, 's3-phone-th.png'], ['ru', 1024, 900, 's3-pc-ru.png']]
for (const [lang, w, h, name] of shots) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: w < 600, hasTouch: w < 600 })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:8791/')
  await p.locator(`.tab[data-lang="${lang}"]`).click()
  await p.locator('.card[data-n="1"]').click()
  await p.waitForTimeout(400)
  await p.screenshot({ path: `${root}/log/${name}` })
  await ctx.close()
}
for (const lang of ['th', 'ko']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:8791/')
  await p.locator(`.tab[data-lang="${lang}"]`).click()
  await p.locator('#legendsum').click()
  await p.waitForTimeout(300)
  await p.screenshot({ path: `${root}/log/s3-legend-${lang}.png` })
  await ctx.close()
}
await b.close(); srv.kill()
console.log('ok')
