import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const modes = [
  ['さわる', 'explore'],
  ['打つ', 'key'],
  ['聞く', 'quiz'],
  ['変換', 'convert'],
]

test('起動と4つの練習切り替えで画面エラー・外部通信がない', async ({ page }) => {
  const errors = []
  const externalRequests = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => {
    if (new URL(request.url()).hostname !== '127.0.0.1') externalRequests.push(request.url())
  })
  await page.goto('/morse.html')
  await expect(page).toHaveTitle('モールス｜30フレーズ')
  await expect(page.locator('#nodes .morse-node')).toHaveCount(26)
  await expect(page.locator('#panel-explore')).toBeVisible()
  for (const [name, mode] of modes) {
    const tab = page.getByRole('tab', { name, exact: true })
    await tab.click()
    await expect(tab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel')).toHaveCount(1)
    await expect(page.locator(`#panel-${mode}`)).toBeVisible()
    for (const [, other] of modes) {
      if (other !== mode) await expect(page.locator(`#panel-${other}`)).toBeHidden()
    }
  }
  await expect(page.locator('#convert-roman')).toHaveText('konnichiha')
  // 漢字を入力しても、辞書ボタンを押すまでは読み込まない。
  await page.locator('#convert-input').fill('東京')
  await expect(page.locator('#read-kanji')).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#fatal-error')).toBeHidden()
  expect(errors).toEqual([])
  expect(externalRequests).toEqual([])
})

test('HTTPS公開先でも手動読込の辞書12ファイルをCDNに要求する', async ({ page }) => {
  const publishedUrl = 'https://kentakun709.github.io/phrase30-app/morse.html'
  const cdn = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/'
  const files = ['base', 'check', 'cc', 'tid', 'tid_pos', 'tid_map', 'unk', 'unk_pos', 'unk_map', 'unk_char', 'unk_compat', 'unk_invoke']
    .map(name => `${name}.dat.gz`)
  const dictionaryRequests = []
  const cdnRequests = []
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => {
    const url = request.url()
    if (url.endsWith('.dat.gz')) dictionaryRequests.push(url)
    if (url.startsWith(cdn)) cdnRequests.push(url)
  })
  await page.addInitScript(() => { window.originalXhrOpen = XMLHttpRequest.prototype.open })
  // 未知の要求も遮断し、本物のCDNには接続しない。
  await page.route('**/*', route => route.abort())
  await page.route('https://kentakun709.github.io/phrase30-app/**', route => {
    if (route.request().url() === publishedUrl) {
      return route.fulfill({ path: fileURLToPath(new URL('../morse.html', import.meta.url)), contentType: 'text/html; charset=utf-8' })
    }
    return route.fulfill({ status: 404, body: '' })
  })
  await page.route(`${cdn}**`, route => {
    if (route.request().url() !== `${cdn}build/kuromoji.js`) {
      return route.fulfill({ body: 'dictionary fixture', headers: { 'access-control-allow-origin': '*' } })
    }
    return route.fulfill({ contentType: 'application/javascript', body: `
      window.kuromoji = {
        builder({ dicPath }) {
          return { build(done) {
            const files = ${JSON.stringify(files)};
            Promise.all(files.map(file => new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              // 本物の path.join と同様に scheme の二重スラッシュを潰す。
              xhr.open('GET', (dicPath + file).replace('://', ':/'), true);
              xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error('dictionary status ' + xhr.status));
              xhr.onerror = () => reject(new Error('dictionary request failed'));
              xhr.send();
            }))).then(() => done(null, {
              tokenize(text) {
                if (text === '東京') return [{ surface_form: '東京', reading: 'トウキョウ', word_position: 1 }];
                return [
                  { surface_form: '今日', reading: 'キョウ', word_position: 1 },
                  { surface_form: 'は', reading: 'ハ', pos: '助詞', word_position: 3 },
                  { surface_form: '良い', reading: 'ヨイ', word_position: 4 },
                  { surface_form: '天気', reading: 'テンキ', word_position: 6 }
                ];
              }
            }), error => done(error));
          } };
        }
      };
    ` })
  })
  await page.goto(publishedUrl)
  await page.getByRole('tab', { name: '変換', exact: true }).click()
  await page.locator('#convert-input').fill('東京')
  await expect(page.locator('#read-kanji')).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect(cdnRequests).toEqual([])
  expect(dictionaryRequests).toEqual([])
  await page.locator('#read-kanji').click()
  await expect(page.locator('#convert-roman')).toHaveText('toukyou')
  expect(dictionaryRequests.sort()).toEqual(files.map(file => `${cdn}dict/${file}`).sort())
  await expect(page.locator('#read-kanji')).toBeHidden()
  expect(await page.evaluate(() => XMLHttpRequest.prototype.open === window.originalXhrOpen)).toBe(true)
  expect(errors).toEqual([])
})

test('アプリ切り替えの3リンクと現在地が正しい', async ({ page }) => {
  await page.goto('/morse.html')
  const navigation = page.getByRole('navigation', { name: 'アプリ切り替え' })
  await expect(navigation).toBeVisible()
  await expect(navigation.getByRole('link')).toHaveCount(3)
  for (const [name, href] of [['フレーズ', 'index.html'], ['問題', 'index.html#quiz'], ['モールス', 'morse.html']]) {
    await expect(navigation.getByRole('link', { name, exact: true })).toHaveAttribute('href', href)
  }
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1)
  await expect(navigation.getByRole('link', { name: 'モールス', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('tablist', { name: '練習モード' })).toBeVisible()
})

for (const width of [320, 390]) {
  test(`幅${width}pxで帯と4つの練習内容が横にはみ出さない`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/morse.html')
    for (const [name] of modes) {
      await page.getByRole('tab', { name, exact: true }).click()
      // body の overflow-x:hidden による、はみ出しの隠蔽も検出する。
      const overflow = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth
        return [...document.querySelectorAll('body, body *')].filter(element => {
          if (!element.getClientRects().length) return false
          const rect = element.getBoundingClientRect()
          return rect.left < -1 || rect.right > viewport + 1 || element.scrollWidth > element.clientWidth + 1
        }).map(element => element.id || element.tagName)
      })
      expect(overflow, `${name}の横はみ出し`).toEqual([])
    }
  })
}

test('電鍵ボタンを押して入力を確定しても例外がない', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
  await page.goto('/morse.html')
  await page.getByRole('tab', { name: '打つ', exact: true }).click()
  const key = page.getByRole('button', { name: '長さを変えて押す', exact: true })
  const prompt = await page.locator('#key-prompt').textContent()
  // 読み込み後に時計を止め、実時間の負荷によらず tap を短点として処理する。
  await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z'))
  await key.tap()
  await expect(key).toHaveAttribute('aria-pressed', 'false')
  // 短点の確定待ち（既定700ms）と次のお題へのリセット（900ms）を進める。
  await page.clock.runFor(2000)
  await expect(page.locator('#key-status')).toHaveText(
    prompt === 'E' ? '正解。E です。' : `E でした。お題は ${prompt} です。`
  )
  await expect(page.locator('#key-code')).toHaveText('—')
  const processed = await page.evaluate(() => {
    const progress = JSON.parse(localStorage.getItem('morse-tag-progress'))
    return Object.values(progress).reduce((total, score) => total + score.correct + score.wrong, 0)
  })
  expect(processed).toBe(1)
  await expect(page.locator('#fatal-error')).toBeHidden()
  expect(errors).toEqual([])
})
