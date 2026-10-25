import { test, expect } from '@playwright/test'

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
  await page.goto('/morse.html')
  await page.getByRole('tab', { name: '打つ', exact: true }).click()
  const key = page.getByRole('button', { name: '長さを変えて押す', exact: true })
  await key.tap()
  await expect(key).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('#key-code')).toHaveText('・')
  await expect(page.locator('#key-status')).toContainText(/正解|でした/)
  await expect(page.locator('#key-code')).toHaveText('—')
  await expect(page.locator('#fatal-error')).toBeHidden()
  expect(errors).toEqual([])
})
