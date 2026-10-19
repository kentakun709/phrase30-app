import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const data = JSON.parse(readFileSync(new URL('../data/phrases.json', import.meta.url), 'utf8'))
const CODES = data.languages.map(l => l.code)

// 端末の読み上げを差し替えて、呼び出しの順番と中身を記録する（実機の音は人が聞く）
//   window.__throw=true … speak() が同期例外 ／ window.__silent=true … onstart/onend を一切出さない ／ window.__fireVoices(list) … 声の一覧が後から変わった
const MOCK_SYNTH = (voices) => `
  (function(){
    var calls = []; window.__calls = calls; var listeners = [];
    function mk(list){ return list.map(function(v){ return { name: v.name, lang: v.lang, default: !!v.default, localService: v.localService !== false, voiceURI: v.voiceURI || v.name }; }); }
    var voices = mk(${JSON.stringify(voices)});
    var current = null;
    var synth = {
      get pending(){ return !!current && !current.started; }, get speaking(){ return !!current && current.started; }, paused: false,
      getVoices: function(){ calls.push({ type: 'getVoices' }); return voices; },
      cancel: function(){ calls.push({ type: 'cancel', busy: !!current, t: performance.now() }); if (current) { var c = current; current = null; setTimeout(function(){ if (c.u.onerror) c.u.onerror({ error: 'canceled' }); }, 10); } },
      resume: function(){ calls.push({ type: 'resume' }); },
      speak: function(u){
        if (window.__throw) throw new Error('mock speak failure');
        calls.push({ type: 'speak', text: u.text, lang: u.lang, voice: u.voice ? u.voice.name : null, rate: u.rate, t: performance.now() });
        var c = { u: u, started: false }; current = c;
        if (window.__silent) return;
        setTimeout(function(){ if (current !== c) return; c.started = true; if (u.onstart) u.onstart({}); }, 0);
        setTimeout(function(){ if (current !== c) return; current = null; if (u.onend) u.onend({}); }, 150); },
      addEventListener: function(name, fn){ if (name === 'voiceschanged') listeners.push(fn); }
    };
    window.__fireVoices = function(list){ voices = mk(list); listeners.forEach(function(fn){ fn(); }); };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    window.SpeechSynthesisUtterance = function(t){ this.text = t; this.lang = ''; this.voice = null; this.rate = 1; this.pitch = 1; this.volume = 1; };
  })();`

const VOICES_ALL = [
  { name: 'Karen', lang: 'en-AU' }, { name: 'Daniel', lang: 'en-GB' }, { name: 'Samantha', lang: 'en-US', default: true },
  { name: 'Tingting', lang: 'zh-CN' }, { name: 'Sinji', lang: 'zh-HK' }, { name: 'Yuna', lang: 'ko-KR' },
  { name: 'Mónica', lang: 'es-ES' }, { name: 'Milena', lang: 'ru-RU' }, { name: 'Kanya', lang: 'th-TH' }, { name: 'Kyoko', lang: 'ja-JP' },
]

// 1秒の無音 WAV（AC9 の「本当に鳴る」確認用）
function silentWav (seconds = 0.3, rate = 8000) {
  const n = Math.floor(seconds * rate), buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(rate, 24)
  buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40)
  return buf
}

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

  test('AC2 どの言語でも30枚すべてに本文と日本語訳があり、〇〇入りは型も見え、言語の説明が出る', async ({ page }) => {
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
        const tpl = data.phrases[i].langs[code].template, ex = data.phrases[i].langs[code].example
        if (tpl.includes('〇〇')) await expect(c.locator('.tpl'), `${code} ${i + 1} 型`).toContainText('言い換えの型')
        else if (tpl !== ex) await expect(c.locator('.tpl'), `${code} ${i + 1} 別の言い方`).toContainText('別の言い方（鳴るのは上の文）')
      }
      const def = data.languages.find(l => l.code === code)
      if (def.note) await expect(page.locator('#langnote')).toHaveText(def.note)
    }
    await expect(page.locator('.section')).toHaveCount(data.sections.length)
  })

  test('AC3 カードを押すと読み上げが呼ばれ、同じカードをもう一度押すとまた呼ばれる（英語は en-AU 等を選ぶ）', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    const card = page.locator('.card').first()
    await card.click()
    await expect(card).toHaveClass(/playing/)
    await expect(card).not.toHaveClass(/playing/, { timeout: 2000 })
    await card.click()
    await expect.poll(() => page.evaluate(() => window.__calls.filter(c => c.type === 'speak').length)).toBe(2)
    const calls = await page.evaluate(() => window.__calls.filter(c => c.type === 'speak'))
    expect(calls[0].text).toBe(data.phrases[0].langs.en.example)
    expect(calls[0].voice).toBe('Karen')   // en-NZ が無いので en-AU
    expect(calls[0].lang).toBe('en-AU')
    expect(calls[0].rate).toBeCloseTo(0.9)
    await expect(page.locator('#voiceinfo')).toContainText('Karen')
    await expect(page.locator('#voiceinfo')).toContainText('オーストラリア英語')
    await expect(page.locator('#voiceinfo')).toHaveText(/の声が無いので代用$/)
    // ゆっくり
    await page.locator('#slow').click()
    await card.click()
    await expect.poll(() => page.evaluate(() => window.__calls.filter(c => c.type === 'speak').length)).toBe(3)
    expect((await page.evaluate(() => window.__calls.filter(c => c.type === 'speak')))[2].rate).toBeCloseTo(0.7)
  })

  test('AC4 新しいタップのたびに cancel → speak の順で呼ばれ、読み上げの列が溜まらない（連打・鳴っている最中も）', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    const cards = page.locator('.card')
    await cards.nth(0).click(); await cards.nth(1).click(); await cards.nth(1).click(); await cards.nth(2).click()
    await page.waitForTimeout(300)
    // 連打の最中に追い越された押下は鳴らさなくてよい（最後に押した物だけが鳴る）。鳴る時は必ず直前に cancel
    const speaks = await page.evaluate(() => window.__calls.filter(c => c.type === 'speak'))
    expect(speaks.length).toBeGreaterThanOrEqual(1)
    expect(speaks.length).toBeLessThanOrEqual(4)
    expect(speaks[speaks.length - 1].text).toBe(data.phrases[2].langs.en.example)
    const calls = await page.evaluate(() => window.__calls.filter(c => c.type === 'cancel' || c.type === 'speak').map(c => c.type))
    for (let i = 0; i < calls.length; i++) if (calls[i] === 'speak') expect(calls[i - 1], `speak #${i} の直前`).toBe('cancel')
    // 鳴っていた物を止めた cancel から、次に鳴らすまで 80ms 以上空く（連打でも）
    const gaps = await page.evaluate(() => { const c = window.__calls; const out = []; let lastBusyCancel = null
      for (const x of c) { if (x.type === 'cancel' && x.busy) lastBusyCancel = x.t; if (x.type === 'speak' && lastBusyCancel != null) { out.push(x.t - lastBusyCancel); lastBusyCancel = null } }
      return out })
    for (const g of gaps) expect(g, '止めてから鳴らすまでの間').toBeGreaterThanOrEqual(75)
    // 鳴り終わってから押せば、押した回数だけ鳴る
    for (let k = 0; k < 3; k++) { await cards.nth(5).click(); await expect(cards.nth(5)).not.toHaveClass(/playing/, { timeout: 2000 }) }
    expect(await page.evaluate(() => window.__calls.filter(c => c.type === 'speak' && c.text === window.phrase30.state.data.phrases[5].langs.en.example).length)).toBe(3)
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => window.speechSynthesis.pending)).toBe(false)
    expect(await page.evaluate(() => window.speechSynthesis.speaking)).toBe(false)
    // 再生中の見た目: 押した直後は光り、終わると消える。止めた読み上げの遅いイベントで、新しい方の光が消えない
    await cards.nth(3).click()
    await expect(cards.nth(3)).toHaveClass(/playing/)
    await cards.nth(4).click()
    await page.waitForTimeout(60)   // 旧 utterance の canceled が届く頃
    await expect(cards.nth(4)).toHaveClass(/playing/)
    await expect(cards.nth(3)).not.toHaveClass(/playing/)
    await expect(cards.nth(4)).not.toHaveClass(/playing/, { timeout: 2000 })
  })

  test('AC5 幅390pxで横スクロールが出ず、カードとタブは44px以上、本文は広い列にある', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    for (const code of CODES) {
      await page.locator(`.tab[data-lang="${code}"]`).click()
      const sw = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(sw, `${code} の横幅`).toBeLessThanOrEqual(390)
      // 列の崩れを捕まえる（周回1の画面で、本文がアイコンの右の細い列に落ちていた）
      const text = await page.locator('.card').first().locator('.text').boundingBox()
      const icon = await page.locator('.card').first().locator('.icon').boundingBox()
      const num = await page.locator('.card').first().locator('.num').boundingBox()
      expect(text.width, `${code} 本文の列の幅`).toBeGreaterThan(200)
      expect(text.height, `${code} 本文が1〜2行に収まる`).toBeLessThan(60)
      expect(num.x, '番号は左').toBeLessThan(text.x)
      expect(icon.x, 'アイコンは本文の右').toBeGreaterThan(text.x + text.width - 1)
    }
    const box = await page.locator('.card').first().boundingBox()
    expect(box.height).toBeGreaterThanOrEqual(44)
    const tab = await page.locator('.tab').first().boundingBox()
    expect(tab.height).toBeGreaterThanOrEqual(44)
    const slow = await page.locator('#slow').boundingBox()
    expect(slow.height).toBeGreaterThanOrEqual(44)
    const top = await page.locator('.top').boundingBox()
    expect(top.height, '固定の帯は画面の3割以内').toBeLessThan(844 * 0.3)
  })

  test('AC5c 一番長い案内（声の一覧が空・鳴らない＋声なし）でも、固定の帯は画面の3割以内', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH([]))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    await page.locator('.tab[data-lang="th"]').click()
    await expect(page.locator('#notice')).toBeVisible()
    const h1 = (await page.locator('.top').boundingBox()).height
    console.log('固定の帯の高さ（一覧が空・タイ語）:', Math.round(h1), 'px')
    expect(h1).toBeLessThan(844 * 0.3)
    await page.evaluate(() => { window.__silent = true })
    await page.locator('.card').first().click()
    await expect(page.locator('#notice')).toContainText('鳴りません', { timeout: 7000 })
    const h2 = (await page.locator('.top').boundingBox()).height
    console.log('固定の帯の高さ（鳴らない＋声なし）:', Math.round(h2), 'px')
    expect(h2).toBeLessThan(844 * 0.3)
  })

  test('声が無い言語の「声の足し方」は言語ごとに1回だけ自動で開き、閉じたら押しても開き直さない', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH([{ name: 'Samantha', lang: 'en-US', default: true }]))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    await page.locator('.tab[data-lang="th"]').click()
    expect(await page.locator('#howto').evaluate(el => el.open)).toBe(true)
    await page.locator('#howtosum').click()
    expect(await page.locator('#howto').evaluate(el => el.open)).toBe(false)
    await page.locator('.card').first().click()
    await page.waitForTimeout(200)
    expect(await page.locator('#howto').evaluate(el => el.open), '押しても開き直さない').toBe(false)
  })

  test('AC5b 声が無い案内が出ている時も、固定の帯は 250px 以内', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH([{ name: 'Samantha', lang: 'en-US', default: true }]))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    await page.locator('.tab[data-lang="th"]').click()
    await expect(page.locator('#notice')).toBeVisible()
    const top = await page.locator('.top').boundingBox()
    console.log('固定の帯の高さ（案内あり・タイ語）:', Math.round(top.height), 'px')
    expect(top.height).toBeLessThanOrEqual(250)
    await expect(page.locator('#howto')).toBeVisible()
    await expect(page.locator('#howtosum')).toContainText('【タイ語】の声の足し方')
    expect(await page.locator('meta[name="viewport"]').count()).toBe(1)
    expect(await page.locator('#tabs').getAttribute('role')).toBe('tablist')
  })

  test('AC7 その言語の声が無い端末では言語名と設定の手順つきの案内が出て、押してもエラーで止まらない。声が後から増えたら消える', async ({ page }) => {
    const errors = []
    page.on('pageerror', e => errors.push(String(e)))
    await page.addInitScript(MOCK_SYNTH([{ name: 'Samantha', lang: 'en-US', default: true }, { name: 'Kyoko', lang: 'ja-JP' }]))
    await page.goto('/')
    await page.locator('.tab[data-lang="th"]').click()
    await expect(page.locator('#notice')).toBeVisible()
    await expect(page.locator('#notice')).toContainText('タイ語')
    await expect(page.locator('#notice')).toContainText('設定')
    expect((await page.locator('.top').boundingBox()).height, '案内ありの帯は画面の3割以内').toBeLessThan(844 * 0.3)
    await page.locator('#noticehow').click()
    expect(await page.locator('#howto').evaluate(el => el.open)).toBe(true)
    await expect(page.locator('#howtosum')).toContainText('【タイ語】の声の足し方')
    await page.locator('.card').first().click()
    await page.waitForTimeout(200)
    expect(errors).toEqual([])
    // 声が後から入った（voiceschanged）→ 案内が消え、声の名前が出る
    expect(await page.locator('#howto').evaluate(el => el.open), '声が無い間は手順が開いている').toBe(true)
    await page.evaluate(() => window.__fireVoices([{ name: 'Samantha', lang: 'en-US' }, { name: 'Kanya', lang: 'th-TH' }]))
    await expect(page.locator('#notice')).toBeHidden()
    await expect(page.locator('#voiceinfo')).toContainText('Kanya')
    expect(await page.locator('#howto').evaluate(el => el.open), '自分で「声の足し方を見る」を押して開けた物は、声が見つかっても畳まない').toBe(true)
    // 英語に戻すと案内は出ない（en-US がある）
    await page.locator('.tab[data-lang="en"]').click()
    await expect(page.locator('#notice')).toBeHidden()
  })

  test('AC7b 声の一覧が空（まだ読めていない）の時も、言語名と設定の手順つきの案内が出る。閉じると消える', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH([]))
    await page.goto('/')
    await expect(page.locator('#notice')).toBeVisible()
    await expect(page.locator('#notice')).toContainText('英語')
    await expect(page.locator('#notice')).toContainText('設定')
    expect(await page.locator('#howto').evaluate(el => el.open)).toBe(true)
    await page.evaluate(() => window.__fireVoices([{ name: 'Karen', lang: 'en-AU' }]))
    await expect(page.locator('#notice')).toBeHidden()
    expect(await page.locator('#howto').evaluate(el => el.open), '一覧が入ったら手順は畳まれる').toBe(false)
  })

  test('AC7c 読み上げが始まらない・例外になる時は、光ったままにせず案内を出す', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    const card = page.locator('.card').first()
    await page.evaluate(() => { window.__silent = true })
    await card.click()
    await expect(card).toHaveClass(/playing/)
    await expect(card).not.toHaveClass(/playing/, { timeout: 7000 })   // 読み込み待ち（pending）なら1回だけ待ち直すので最長5秒
    await expect(page.locator('#notice')).toContainText('鳴りませんでした')
    await page.evaluate(() => { window.__silent = false; window.__throw = true })
    await card.click()
    await expect(card).not.toHaveClass(/playing/)
    await expect(page.locator('#notice')).toContainText('始められませんでした')
    // 直した後にちゃんと鳴れば、失敗の案内は自動で消える
    await page.evaluate(() => { window.__throw = false })
    await card.click()
    await expect(card).toHaveClass(/playing/)
    await expect(page.locator('#notice')).toBeHidden()
  })

  test('AC7d 閉じた「声が無い」の案内は言語ごとに覚えて出し直さない。失敗の知らせは閉じても次に失敗すればまた出る。声が無い間は「声: なし」が残る', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH([{ name: 'Samantha', lang: 'en-US', default: true }]))
    await page.goto('/')
    await page.locator('.tab[data-lang="th"]').click()
    await expect(page.locator('#notice')).toContainText('タイ語')
    await page.locator('#noticeclose').click()
    await expect(page.locator('#notice')).toBeHidden()
    await expect(page.locator('#voiceinfo')).toContainText('声: なし')
    await page.evaluate(() => { window.__silent = true })
    await page.locator('.card').first().click()
    await expect(page.locator('#notice')).toContainText('鳴りませんでした', { timeout: 7000 })
    await expect(page.locator('#notice')).toContainText('声が無いためです')
    await page.locator('#noticeclose').click()
    await page.evaluate(() => { window.__silent = false })
    await page.locator('.card').nth(1).click()
    await page.waitForTimeout(300)
    await expect(page.locator('#notice')).toBeHidden()   // 閉じたタイ語の案内は出し直さない
    await page.evaluate(() => { window.__silent = true })
    await page.locator('.card').nth(2).click()
    await expect(page.locator('#notice')).toContainText('鳴りません', { timeout: 7000 })   // 失敗の知らせは、また失敗すればまた出る
    await page.evaluate(() => { window.__silent = false })
    await page.locator('.tab[data-lang="ru"]').click()
    await expect(page.locator('#notice')).toContainText('ロシア語')   // 別の言語の案内は出る
  })

  test('AC9 audio にファイルが入っている項目は、読み上げの代わりにその音声を本当に鳴らす（鳴り終わりまで）', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.route('**/data/phrases.json', async route => {
      const d = JSON.parse(JSON.stringify(data))
      d.phrases[0].langs.en.audio = 'audio/en/01.wav'
      await route.fulfill({ json: d })
    })
    await page.route('**/audio/en/01.wav', route => route.fulfill({ status: 200, contentType: 'audio/wav', body: silentWav(0.3) }))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    const card = page.locator('.card').first()
    await card.click()
    await expect(card).toHaveClass(/playing/)
    await expect(card).not.toHaveClass(/playing/, { timeout: 5000 })   // onended まで来た
    expect(await page.evaluate(() => window.__calls.filter(c => c.type === 'speak').length)).toBe(0)
    expect(await page.evaluate(() => window.phrase30.state.audioEl && window.phrase30.state.audioEl.ended)).toBe(true)
    // audio の無い項目は読み上げ
    await page.locator('.card').nth(1).click()
    await expect.poll(() => page.evaluate(() => window.__calls.filter(c => c.type === 'speak').length)).toBe(1)
  })

  test('AC9b 音声ファイルが読めない（404）時は、案内を出して端末の読み上げで鳴らす', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.route('**/data/phrases.json', async route => {
      const d = JSON.parse(JSON.stringify(data))
      d.phrases[0].langs.en.audio = 'audio/en/missing.mp3'
      await route.fulfill({ json: d })
    })
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    await page.locator('.card').first().click()
    await expect.poll(() => page.evaluate(() => window.__calls.filter(c => c.type === 'speak').length), { timeout: 5000 }).toBe(1)
    await expect(page.locator('#notice')).toContainText('端末の読み上げで鳴らしました')
  })

  test('AC9c 音声ファイルが鳴り終わった後に error が来ても、読み上げには戻らない', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.route('**/data/phrases.json', async route => {
      const d = JSON.parse(JSON.stringify(data)); d.phrases[0].langs.en.audio = 'audio/en/01.wav'; await route.fulfill({ json: d })
    })
    await page.route('**/audio/en/01.wav', route => route.fulfill({ status: 200, contentType: 'audio/wav', body: silentWav(0.3) }))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    const card = page.locator('.card').first()
    await card.click()
    await expect(card).not.toHaveClass(/playing/, { timeout: 5000 })
    await page.evaluate(() => { const a = window.phrase30.state.audioEl; if (a.onerror) a.onerror(new Event('error')) })
    await page.waitForTimeout(200)
    expect(await page.evaluate(() => window.__calls.filter(c => c.type === 'speak').length)).toBe(0)
    await expect(page.locator('#notice')).toBeHidden()
  })

  test('声の選び方: 端末内の声を優先し、機械っぽい名前は避け、中国語は香港の声を使わず台湾の声は最後の手段', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    const pick = (defCode, voices) => page.evaluate(([c, vs]) => {
      const def = window.phrase30.state.data.languages.find(l => l.code === c)
      const v = window.phrase30.pickVoice(def, vs.map(x => ({ name: x.name, lang: x.lang, localService: x.localService !== false, voiceURI: x.voiceURI || x.name, default: !!x.default })))
      return v ? v.name : null
    }, [defCode, voices])
    expect(await pick('en', [{ name: 'Google UK English Female', lang: 'en-GB', localService: false }, { name: 'Daniel', lang: 'en-GB' }])).toBe('Daniel')
    expect(await pick('en', [{ name: 'Molly Online', lang: 'en-NZ', localService: false }, { name: 'Karen', lang: 'en-AU' }])).toBe('Karen')   // 端末内の声が地域をまたいでも先
    expect(await pick('th', [{ name: 'Google Thai', lang: 'th-TH', localService: false }])).toBe('Google Thai')   // 端末内に無ければ通信する声
    expect(await pick('en', [{ name: 'Karen', lang: 'en-AU' }, { name: 'Hayley', lang: 'en_NZ' }])).toBe('Hayley')
    expect(await pick('es', [{ name: 'Eddy (Spanish (Spain))', lang: 'es-ES', voiceURI: 'com.apple.eloquence.es-ES.Eddy' }, { name: 'Mónica', lang: 'es-ES', voiceURI: 'com.apple.voice.compact.es-ES.Monica' }])).toBe('Mónica')
    expect(await pick('en', [{ name: 'Karen', lang: 'en-AU', voiceURI: 'com.apple.voice.compact.en-AU.Karen' }, { name: 'Samantha', lang: 'en-US', voiceURI: 'com.apple.voice.premium.en-US.Samantha' }])).toBe('Samantha')   // 入れたプレミアムの声は簡易版の豪に勝つ
    expect(await pick('en', [{ name: 'Karen', lang: 'en-AU' }, { name: 'Samantha', lang: 'en-US' }])).toBe('Karen')   // 同じ質なら NZ に近い豪
    expect(await pick('en', [{ name: 'Karen', lang: 'en-AU' }, { name: 'Samantha', lang: 'en-US', voiceURI: 'com.apple.voice.enhanced.en-US.Samantha' }])).toBe('Samantha')   // 自然さが地域より先（普通の豪より拡張の米）
    expect(await pick('es', [{ name: 'Mónica', lang: 'es-ES' }, { name: 'Diego', lang: 'es-AR', voiceURI: 'com.apple.voice.premium.es-AR.Diego' }])).toBe('Diego')   // 普通の西よりプレミアムの亜
    expect(await pick('en', [{ name: 'Karen', lang: 'en-AU' }, { name: 'Samantha', lang: 'en-US', default: true }])).toBe('Karen')   // 既定の声は最後の決め手
    expect(await pick('en', [{ name: 'Zulu', lang: 'en-AU' }, { name: 'Alpha', lang: 'en-AU' }])).toBe('Alpha')   // 完全に同点なら名前の順（列挙順に左右されない）
    // 簡易版の声の時は、帯の「もっと自然な声に」から手順へ飛べる
    await page.evaluate(() => window.__fireVoices([{ name: 'Karen', lang: 'en-AU', voiceURI: 'com.apple.voice.compact.en-AU.Karen' }]))
    await page.locator('.tab[data-lang="en"]').click()
    await expect(page.locator('#voiceinfo')).toContainText('簡易版')
    await expect(page.locator('#voicehow')).toBeVisible()
    await page.locator('#voicehow').click()
    expect(await page.locator('#howto').evaluate(el => el.open)).toBe(true)
    expect(await pick('en', [{ name: 'Alpha', lang: 'en-AU' }, { name: 'Zulu', lang: 'en-AU' }])).toBe('Alpha')
    expect(await pick('en', [{ name: 'Karen', lang: 'en-AU', voiceURI: 'com.apple.voice.compact.en-AU.Karen' }, { name: 'Samantha', lang: 'en-US', voiceURI: 'com.apple.voice.compact.en-US.Samantha' }])).toBe('Karen')   // どちらも簡易版なら豪
    expect(await pick('es', [{ name: 'Mónica', lang: 'es-ES', voiceURI: 'com.apple.voice.compact.es-ES.Monica' }, { name: 'Paulina', lang: 'es-MX', voiceURI: 'com.apple.voice.enhanced.es-MX.Paulina' }])).toBe('Paulina')   // 拡張の声は地域より先
    // 第1候補の地域の声があるのに、より自然な声を選んだ時は「代用」と言わない
    await page.evaluate(() => window.__fireVoices([{ name: 'Mónica', lang: 'es-ES', voiceURI: 'com.apple.voice.compact.es-ES.Monica' }, { name: 'Paulina', lang: 'es-MX', voiceURI: 'com.apple.voice.enhanced.es-MX.Paulina' }]))
    await page.locator('.tab[data-lang="es"]').click()
    await expect(page.locator('#voiceinfo')).toContainText('Paulina')
    await expect(page.locator('#voiceinfo')).toContainText('より自然な声を選びました')
    expect(await pick('en', [{ name: 'Hayley', lang: 'en-NZ', voiceURI: 'com.apple.voice.compact.en-NZ.Hayley' }, { name: 'Karen', lang: 'en-AU', voiceURI: 'com.apple.voice.enhanced.en-AU.Karen' }])).toBe('Hayley')   // NZ があれば必ず NZ
    expect(await pick('zh', [{ name: 'Sinji', lang: 'zh-HK' }, { name: 'Meijia', lang: 'zh-TW' }])).toBe('Meijia')
    expect(await pick('zh', [{ name: 'Sinji', lang: 'zh-HK' }, { name: 'Meijia', lang: 'zh-TW' }, { name: 'Tingting', lang: 'zh-CN' }])).toBe('Tingting')
    expect(await pick('zh', [{ name: 'Sinji', lang: 'zh-HK' }])).toBe(null)
  })

  test('スクロール位置は言語ごとに覚え、初めて開く言語は今の位置を引き継ぎ、次に開いた時も戻る', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    const firstVisible = () => page.evaluate(() => { const h = document.querySelector('.top').getBoundingClientRect().height; for (const c of document.querySelectorAll('.card')) { if (c.getBoundingClientRect().bottom > h + 1) return Number(c.dataset.n) } return 0 })
    await page.evaluate(() => { const el = document.querySelector('.card[data-n="20"]'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - document.querySelector('.top').getBoundingClientRect().height - 8) })
    await page.waitForTimeout(600)
    expect(await firstVisible()).toBe(20)
    // locator.click() は固定表示のタブを「本来の位置」へスクロールしてから押す（試験の都合）ので、指で押すのと同じ素の click を送る
    await page.locator('.tab[data-lang="zh"]').dispatchEvent('click')
    await expect.poll(firstVisible).toBe(20)   // 初めて開く中国語は、英語で見えていた番号（20）を引き継ぐ
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)
    await page.evaluate(() => window.scrollTo(0, 300))
    await page.waitForTimeout(600)
    await page.locator('.tab[data-lang="en"]').dispatchEvent('click')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)   // 英語は自分の位置
    await page.locator('.tab[data-lang="zh"]').dispatchEvent('click')
    await expect.poll(() => page.evaluate(() => Math.abs(window.scrollY - 300) < 40)).toBe(true)   // 中国語は自分の位置
    await page.waitForTimeout(600)
    await page.reload()
    await expect(page.locator('.card')).toHaveCount(30)
    await expect.poll(() => page.evaluate(() => Math.abs(window.scrollY - 300) < 40)).toBe(true)
  })

  test('読み上げの機能そのものが無いブラウザでは、開いた時から案内が出て、言語を切り替えても残る', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }) })
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    await expect(page.locator('#notice')).toContainText('対応していません')
    await page.locator('.tab[data-lang="ko"]').click()
    await expect(page.locator('#notice')).toContainText('対応していません')
    await page.locator('.card').first().click()
    await expect(page.locator('.card').first()).not.toHaveClass(/playing/)
  })

  test('言語とゆっくりの選択は次に開いた時も残る', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    await page.locator('.tab[data-lang="ko"]').click()
    await page.locator('#slow').click()
    await page.reload()
    await expect(page.locator('.tab[data-lang="ko"]')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#slow')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.card').first().locator('.text')).toHaveText(data.phrases[0].langs.ko.example)
  })
})
