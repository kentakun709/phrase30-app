import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const data = JSON.parse(readFileSync(new URL('../data/phrases.json', import.meta.url), 'utf8'))
const CODES = data.languages.map(l => l.code)

// 端末の読み上げを差し替えて、呼び出しの順番と中身を記録する（実機の音は人が聞く）
const MOCK_SYNTH = (voices) => `
  (function(){
    var calls = []; window.__calls = calls;
    var voices = ${JSON.stringify(voices)}.map(function(v){ return { name: v.name, lang: v.lang, default: !!v.default, localService: true, voiceURI: v.name }; });
    var pending = false;
    var synth = {
      get pending(){ return pending; }, get speaking(){ return pending; }, paused: false,
      getVoices: function(){ calls.push({ type: 'getVoices' }); return voices; },
      cancel: function(){ calls.push({ type: 'cancel' }); pending = false; },
      resume: function(){ calls.push({ type: 'resume' }); },
      speak: function(u){ calls.push({ type: 'speak', text: u.text, lang: u.lang, voice: u.voice ? u.voice.name : null }); pending = true;
        var self = this; setTimeout(function(){ if (u.onstart) u.onstart({}); }, 0);
        setTimeout(function(){ if (pending) { pending = false; if (u.onend) u.onend({}); } }, 150); },
      addEventListener: function(){}
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    window.SpeechSynthesisUtterance = function(t){ this.text = t; this.lang = ''; this.voice = null; this.rate = 1; this.pitch = 1; this.volume = 1; };
  })();`

const VOICES_ALL = [
  { name: 'Karen', lang: 'en-AU' }, { name: 'Daniel', lang: 'en-GB' }, { name: 'Samantha', lang: 'en-US', default: true },
  { name: 'Tingting', lang: 'zh-CN' }, { name: 'Sinji', lang: 'zh-HK' }, { name: 'Yuna', lang: 'ko-KR' },
  { name: 'Mónica', lang: 'es-ES' }, { name: 'Milena', lang: 'ru-RU' }, { name: 'Kanya', lang: 'th-TH' }, { name: 'Kyoko', lang: 'ja-JP' },
]

test.describe('30フレーズ（スマホ幅・読み上げは差し替え）', () => {
  test('AC1 言語タブが6つあり、押すと30項目の表記が切り替わる', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.tab')).toHaveCount(6)
    await expect(page.locator('.card')).toHaveCount(30)
    const first = page.locator('.card').first().locator('.text')
    await expect(first).toHaveText(data.phrases[0].langs.en.example)
    for (const code of CODES) {
      await page.locator(`.tab[data-lang="${code}"]`).click()
      await expect(page.locator(`.tab[data-lang="${code}"]`)).toHaveAttribute('aria-selected', 'true')
      await expect(first).toHaveText(data.phrases[0].langs[code].example)
      await expect(page.locator('.card').nth(29).locator('.text')).toHaveText(data.phrases[29].langs[code].example)
    }
  })

  test('AC2 どの言語でも30枚すべてに本文と日本語訳があり、〇〇入りは型も見える', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    for (const code of CODES) {
      await page.locator(`.tab[data-lang="${code}"]`).click()
      const cards = page.locator('.card')
      await expect(cards).toHaveCount(30)
      for (let i = 0; i < 30; i++) {
        const c = cards.nth(i)
        expect((await c.locator('.text').innerText()).trim().length, `${code} ${i + 1} 本文`).toBeGreaterThan(0)
        expect((await c.locator('.ja').innerText()).trim().length, `${code} ${i + 1} 訳`).toBeGreaterThan(0)
        if (data.phrases[i].ja.includes('〇〇')) await expect(c.locator('.tpl'), `${code} ${i + 1} 型`).toBeVisible()
      }
    }
  })

  test('AC3 カードを押すと読み上げが呼ばれ、同じカードをもう一度押すとまた呼ばれる（英語は en-AU 等を選ぶ）', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    const card = page.locator('.card').first()
    await card.click()
    await card.click()
    const calls = await page.evaluate(() => window.__calls.filter(c => c.type === 'speak'))
    expect(calls).toHaveLength(2)
    expect(calls[0].text).toBe(data.phrases[0].langs.en.example)
    expect(calls[0].voice).toBe('Karen')   // en-NZ が無いので en-AU
    expect(calls[0].lang).toBe('en-AU')
    await expect(page.locator('#voiceinfo')).toContainText('Karen')
  })

  test('AC4 新しいタップのたびに cancel → speak の順で呼ばれ、読み上げの列が溜まらない', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    const cards = page.locator('.card')
    await cards.nth(0).click(); await cards.nth(1).click(); await cards.nth(1).click(); await cards.nth(2).click()
    const calls = await page.evaluate(() => window.__calls.filter(c => c.type === 'cancel' || c.type === 'speak').map(c => c.type))
    const speaks = calls.filter(c => c === 'speak')
    expect(speaks).toHaveLength(4)
    for (let i = 0; i < calls.length; i++) if (calls[i] === 'speak') expect(calls[i - 1], `speak #${i} の直前`).toBe('cancel')
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => window.speechSynthesis.pending)).toBe(false)
    // 再生中の見た目: 押した直後は光り、終わると消える
    await cards.nth(3).click()
    await expect(cards.nth(3)).toHaveClass(/playing/)
    await expect(cards.nth(3)).not.toHaveClass(/playing/, { timeout: 2000 })
  })

  test('AC5 幅390pxで横スクロールが出ず、カードとタブは44px以上', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    for (const code of CODES) {
      await page.locator(`.tab[data-lang="${code}"]`).click()
      const sw = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(sw, `${code} の横幅`).toBeLessThanOrEqual(390)
    }
    const box = await page.locator('.card').first().boundingBox()
    expect(box.height).toBeGreaterThanOrEqual(44)
    const tab = await page.locator('.tab').first().boundingBox()
    expect(tab.height).toBeGreaterThanOrEqual(44)
    expect(await page.locator('meta[name="viewport"]').count()).toBe(1)
  })

  test('AC7 その言語の声が無い端末では案内が出て、押してもエラーで止まらない', async ({ page }) => {
    const errors = []
    page.on('pageerror', e => errors.push(String(e)))
    await page.addInitScript(MOCK_SYNTH([{ name: 'Samantha', lang: 'en-US', default: true }, { name: 'Kyoko', lang: 'ja-JP' }]))
    await page.goto('/')
    await page.locator('.tab[data-lang="th"]').click()
    await expect(page.locator('#notice')).toBeVisible()
    await expect(page.locator('#notice')).toContainText('タイ語')
    await page.locator('.card').first().click()
    await page.waitForTimeout(200)
    expect(errors).toEqual([])
    // 英語に戻すと案内は消える（en-US がある）
    await page.locator('.tab[data-lang="en"]').click()
    await expect(page.locator('#notice')).toBeHidden()
  })

  test('AC7b 声の一覧が空（まだ読めていない）の時も案内が出る', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH([]))
    await page.goto('/')
    await expect(page.locator('#notice')).toBeVisible()
    await expect(page.locator('#notice')).toContainText('音声の一覧')
  })

  test('AC9 audio にファイルが入っている項目は、読み上げの代わりにその音声を鳴らす', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.addInitScript(() => {
      window.__played = []
      HTMLMediaElement.prototype.play = function () { window.__played.push(this.src); return Promise.resolve() }
      HTMLMediaElement.prototype.pause = function () {}
    })
    await page.route('**/data/phrases.json', async route => {
      const d = JSON.parse(JSON.stringify(data))
      d.phrases[0].langs.en.audio = 'audio/en/01.mp3'
      await route.fulfill({ json: d })
    })
    await page.goto('/')
    await page.locator('.card').first().click()
    const played = await page.evaluate(() => window.__played)
    expect(played).toHaveLength(1)
    expect(played[0]).toContain('audio/en/01.mp3')
    expect(await page.evaluate(() => window.__calls.filter(c => c.type === 'speak').length)).toBe(0)
    // audio の無い項目は読み上げ
    await page.locator('.card').nth(1).click()
    expect(await page.evaluate(() => window.__calls.filter(c => c.type === 'speak').length)).toBe(1)
  })

  test('言語の選択は次に開いた時も残る', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await page.locator('.tab[data-lang="ko"]').click()
    await page.reload()
    await expect(page.locator('.tab[data-lang="ko"]')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.card').first().locator('.text')).toHaveText(data.phrases[0].langs.ko.example)
  })
})
