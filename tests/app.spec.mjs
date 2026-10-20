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

  test('AC2 どの言語でも30マスすべてに本文と日本語訳があり、押すと〇〇入りの型が枠の下の欄に見え、言語の説明が出る', async ({ page }) => {
    test.setTimeout(90000)
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('#detail')).toContainText('マスを押すと鳴ります')
    for (const code of CODES) {
      await page.locator(`.tab[data-lang="${code}"]`).click()
      const cards = page.locator('.card')
      await expect(cards).toHaveCount(30)
      const cells = await cards.evaluateAll(els => els.map(e => ({ num: e.querySelector('.num').textContent.trim(), text: e.querySelector('.text').textContent.trim(), ja: e.querySelector('.ja').textContent.trim() })))
      for (let i = 0; i < 30; i++) {
        expect(cells[i].num, `${code} ${i + 1} 番号`).toMatch(/^\d\d/)
        expect(cells[i].text.length, `${code} ${i + 1} 本文`).toBeGreaterThan(0)
        expect(cells[i].ja.length, `${code} ${i + 1} 訳`).toBeGreaterThan(0)
        const tpl = data.phrases[i].langs[code].template, ex = data.phrases[i].langs[code].example, note = data.phrases[i].langs[code].note
        if (tpl.includes('〇〇') || tpl !== ex || note) {
          const c = cards.nth(i)
          await c.dispatchEvent('click')
          await expect(page.locator('#detail .dtext'), `${code} ${i + 1} 欄の本文`).toHaveText(ex)
          await expect(page.locator('#detail .dja'), `${code} ${i + 1} 欄の訳`).toHaveText(data.phrases[i].langs[code].ja)
          if (tpl.includes('〇〇')) await expect(page.locator('#detail .tpl'), `${code} ${i + 1} 型`).toContainText('言い換えの型')
          else if (tpl !== ex) await expect(page.locator('#detail .tpl'), `${code} ${i + 1} 別の言い方`).toContainText('別の言い方（鳴るのは上の文）')
          if (note) await expect(page.locator('#detail .note'), `${code} ${i + 1} 注`).toHaveText(note)
        }
      }
      const def = data.languages.find(l => l.code === code)
      if (def.note) await expect(page.locator('#langnote')).toHaveText(def.note)
    }
    await expect(page.locator('.card .sec')).toHaveCount(data.sections.length)   // 区切りの名前は 1・13・20番のマスの番号の横
  })

  test('AC3 カードを押すと読み上げが呼ばれ、同じカードをもう一度押すとまた呼ばれる（英語は en-AU 等を選ぶ）', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    const card = page.locator('.card').first()
    await card.click()
    await expect(card).toHaveClass(/playing/)
    await expect(page.locator('#detail'), '押したマスが欄に隠れても分かるように、欄も光る').toHaveClass(/playing/)
    await expect(card).not.toHaveClass(/playing/, { timeout: 2000 })
    await expect(page.locator('#detail')).not.toHaveClass(/playing/)
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

  test('AC11 どの言語でも30マスすべてに読み（中国語はピンイン・ほかは発音記号）が常時見え、押した文の欄にも出る。幅390で横スクロールなし・マスは44px以上で枠の中', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    const board = await page.locator('#board').boundingBox()
    for (const code of CODES) {
      await page.locator(`.tab[data-lang="${code}"]`).click()
      await expect(page.locator('.card').first().locator('.text')).toHaveText(data.phrases[0].langs[code].example)
      const rs = await page.locator('.card').evaluateAll(es => es.map(e => {
        const r = e.querySelector('.reading'); const b = e.getBoundingClientRect(); const rb = r && r.getBoundingClientRect()
        return { text: r ? r.textContent : '', lang: r ? r.getAttribute('lang') : '', hidden: r ? r.getAttribute('aria-hidden') : '', h: rb ? rb.height : 0, cardH: b.height, x: b.x, right: b.right,
          order: r ? (e.querySelector('.text').getBoundingClientRect().bottom <= rb.top + 1 && rb.bottom <= e.querySelector('.ja').getBoundingClientRect().top + 1) : false }
      }))
      expect(rs.length).toBe(30)
      rs.forEach((r, i) => {
        expect(r.text, `${code} ${i + 1}番の読み`).toBe(data.phrases[i].langs[code].reading)
        expect(r.h, `${code} ${i + 1}番の読みが描かれている`).toBeGreaterThan(0)
        expect(r.order, `${code} ${i + 1}番: 文 → 読み → 訳 の順`).toBe(true)
        expect(r.cardH, `${code} ${i + 1}番のマスは44px以上`).toBeGreaterThanOrEqual(44)
        expect(r.x, `${code} ${i + 1}番は枠の中（左）`).toBeGreaterThanOrEqual(board.x - 1)
        expect(r.right, `${code} ${i + 1}番は枠の中（右）`).toBeLessThanOrEqual(board.x + board.width + 1)
        expect(r.lang, `${code} 読みの言語の印`).toBe(code === 'zh' ? 'zh-Latn-pinyin' : `${code}-fonipa`)
        expect(r.hidden, `${code} ${i + 1}番の読みは画面の読み上げ機能に読ませない`).toBe('true')
      })
      await expect(page.locator('#langnote'), `${code} 言語の説明に読みの記号の読み方`).toContainText(code === 'zh' ? 'ピンイン' : '発音記号')
      const sw = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(sw, `${code} の横幅`).toBeLessThanOrEqual(390)
    }
    // 押した文の欄にも同じ読み
    await page.locator('.tab[data-lang="zh"]').click()
    await page.locator('.card[data-n="1"]').click()
    await expect(page.locator('#detail .dreading')).toHaveText(data.phrases[0].langs.zh.reading)
  })

  test('AC5 幅390pxで横スクロールが出ず、カードとタブは44px以上、本文は広い列にある', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    for (const code of CODES) {
      await page.locator(`.tab[data-lang="${code}"]`).click()
      const sw = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(sw, `${code} の横幅`).toBeLessThanOrEqual(390)
      // マスの崩れを捕まえる（番号は上の行・アイコンは右上・本文はマスの幅いっぱい）
      const card0 = await page.locator('.card').first().boundingBox()
      const text = await page.locator('.card').first().locator('.text').boundingBox()
      const icon = await page.locator('.card').first().locator('.icon').boundingBox()
      const num = await page.locator('.card').first().locator('.num').boundingBox()
      expect(text.width, `${code} 本文の幅（2列のマス）`).toBeGreaterThan(140)
      expect(text.height, `${code} 本文が3行以内`).toBeLessThan(62)
      expect(num.y + num.height, '番号は本文の上').toBeLessThanOrEqual(text.y + 1)
      expect(icon.x, 'アイコンは番号の右').toBeGreaterThan(num.x + num.width)
      expect(icon.x + icon.width, 'アイコンはマスの中').toBeLessThanOrEqual(card0.x + card0.width + 1)
      const hs = await page.locator('.card').evaluateAll(es => es.map(e => ({ h: e.getBoundingClientRect().height, ja: e.querySelector('.ja').getBoundingClientRect().height })))
      expect(Math.min(...hs.map(x => x.h)), `${code} 30マスすべて 44px 以上`).toBeGreaterThanOrEqual(44)
      expect(Math.min(...hs.map(x => x.ja)), `${code} 訳が描かれている`).toBeGreaterThan(0)
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

  test('AC5c 一番長い状態（声の一覧が空・鳴らない＋声なし・8番の型と注）でも、欄は画面の4割以内で、帯は3割以内', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH([]))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    await page.locator('.tab[data-lang="th"]').click()
    await expect(page.locator('#notice')).toBeVisible()
    const dockOK = async (label) => {   // 欄は画面の4割以内で、中にスクロールが出ない（中身が隠れない）
      const m = await page.locator('#dock').evaluate(e => ({ h: e.getBoundingClientRect().height, sh: e.scrollHeight, ch: e.clientHeight }))
      console.log(`欄の高さ（${label}）:`, Math.round(m.h), 'px')
      expect(m.h, label).toBeLessThanOrEqual(844 * 0.4)
      expect(m.sh, `${label}: 欄の中にスクロールが出ない`).toBeLessThanOrEqual(m.ch + 1)
    }
    await dockOK('一覧が空・タイ語')
    await page.evaluate(() => { window.__silent = true })
    await page.locator('.card[data-n="8"]').dispatchEvent('click')
    await expect(page.locator('#notice')).toContainText('鳴りません', { timeout: 7000 })
    await expect(page.locator('#detail .tpl')).toContainText('言い換えの型')
    await dockOK('鳴らない＋声なし＋8番の型と注')
    await page.setViewportSize({ width: 390, height: 664 })   // iPhone Safari で実際に見える高さの目安（上下のバーを除く）。周回9 から合否にする（周回8 judge: 読みを足して 1px→20px に退行した）
    await page.waitForTimeout(200)
    const m664 = await page.locator('#dock').evaluate(e => ({ h: Math.round(e.getBoundingClientRect().height), sh: e.scrollHeight, ch: e.clientHeight }))
    console.log('欄（高さ664の画面・最長の状態）:', JSON.stringify(m664), '上限 40% =', Math.round(664 * 0.4), 'px')
    expect(m664.sh, '高さ664でも欄の中身が隠れない（欄の中にスクロールが出ない）').toBeLessThanOrEqual(m664.ch + 1)
    await page.setViewportSize({ width: 320, height: 664 })   // 一番狭いスマホ（周回8 東条: 320×664 で 302/265 だった）
    await page.waitForTimeout(200)
    const m320 = await page.locator('#dock').evaluate(e => ({ h: Math.round(e.getBoundingClientRect().height), sh: e.scrollHeight, ch: e.clientHeight }))
    console.log('欄（幅320・高さ664・最長の状態）:', JSON.stringify(m320))
    expect(m320.sh, '幅320・高さ664でも欄の中身が隠れない').toBeLessThanOrEqual(m320.ch + 1)
    await page.setViewportSize({ width: 390, height: 844 })
    expect((await page.locator('.top').boundingBox()).height, '固定の帯は画面の3割以内').toBeLessThan(844 * 0.3)
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
    // 声の無い言語が2つ続いても同じ（開いたまま次の言語へ移り、閉じてから押しても開き直さない）
    await page.locator('.tab[data-lang="ru"]').click()
    expect(await page.locator('#howto').evaluate(el => el.open), 'ロシア語で最初の1回は自動で開く').toBe(true)
    await page.locator('.tab[data-lang="ko"]').click()
    expect(await page.locator('#howto').evaluate(el => el.open), '開いたまま韓国語へ').toBe(true)
    await page.locator('#howtosum').click()
    await page.locator('.card').first().click()
    await page.waitForTimeout(200)
    expect(await page.locator('#howto').evaluate(el => el.open), '閉じた後に押しても開き直さない').toBe(false)
    // 見出しを手で押して開け直した物は、声が見つかっても畳まない
    await page.locator('#howtosum').click()
    await page.evaluate(() => window.__fireVoices([{ name: 'Samantha', lang: 'en-US' }, { name: 'Yuna', lang: 'ko-KR' }]))
    await expect(page.locator('#voiceinfo')).toContainText('Yuna')
    expect(await page.locator('#howto').evaluate(el => el.open), '手で開けた物は畳まない').toBe(true)
  })

  test('一番上にいる時に初めての言語を開くと、一番上のまま（言語の説明が隠れない）', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    await page.locator('.tab[data-lang="ko"]').dispatchEvent('click')
    await page.waitForTimeout(200)
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(5)
    const note = await page.locator('#langnote').boundingBox()
    const top = await page.locator('.top').boundingBox()
    expect(note.y - (top.y + top.height), '言語の説明は帯のすぐ下（0〜40px）').toBeGreaterThanOrEqual(-1)
    expect(note.y - (top.y + top.height)).toBeLessThan(40)
    expect(note.y + note.height, '言語の説明は枠より上').toBeLessThanOrEqual((await page.locator('#board').boundingBox()).y + 1)
  })

  test('AC5b 声が無い案内は欄の中にあり、帯は 130px 以内。案内のボタンは押せる高さで、下へ送っても画面の中', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH([{ name: 'Samantha', lang: 'en-US', default: true }]))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    await page.locator('.tab[data-lang="th"]').click()
    await expect(page.locator('#notice')).toBeVisible()
    const top = await page.locator('.top').boundingBox()
    console.log('固定の帯の高さ（案内はもう帯に無い）:', Math.round(top.height), 'px')
    expect(top.height).toBeLessThanOrEqual(130)
    expect((await page.locator('#noticehow').boundingBox()).height, '「声の足し方を見る」は押せる高さ').toBeGreaterThanOrEqual(44)
    // 下まで送っても、案内（欄の中）は画面の中にある
    await page.evaluate(() => window.scrollTo(0, 600))
    await page.waitForTimeout(200)
    const nb = await page.locator('#notice').boundingBox()
    expect(nb.y).toBeGreaterThanOrEqual(0); expect(nb.y + nb.height, '案内は画面の中').toBeLessThanOrEqual(844)
    await page.evaluate(() => window.scrollTo(0, 0))
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
    const dm = await page.locator('#dock').evaluate(e => ({ h: e.getBoundingClientRect().height, sh: e.scrollHeight, ch: e.clientHeight }))
    expect(dm.h, '案内ありの欄は画面の4割以内').toBeLessThanOrEqual(844 * 0.4); expect(dm.sh, '欄の中にスクロールが出ない').toBeLessThanOrEqual(dm.ch + 1)
    await page.locator('#noticehow').click()
    expect(await page.locator('#howto').evaluate(el => el.open)).toBe(true)
    await expect(page.locator('#howtosum')).toContainText('【タイ語】の声の足し方')
    await page.locator('.card').first().click()
    await page.waitForTimeout(200)
    expect(errors).toEqual([])
    // 鳴らなかった知らせが出ている最中に声が後から入った（voiceschanged）→ その知らせも案内も消え、声の名前が出る
    await page.evaluate(() => { window.__silent = true })
    await page.locator('.card').nth(1).click()
    await expect(page.locator('#notice')).toContainText('鳴りません', { timeout: 7000 })
    await page.evaluate(() => { window.__silent = false })
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
    await expect(page.locator('#voiceinfo')).toContainText('読み込み中')
    expect(await page.locator('#howto').evaluate(el => el.open), '一覧が空の間は手順を開かない（届いた時に画面が跳ばないように）').toBe(false)
    await page.evaluate(() => window.scrollTo(0, 600))
    await page.waitForTimeout(200)
    const nb0 = await page.locator('#notice').boundingBox()
    expect(nb0.y).toBeGreaterThanOrEqual(0); expect(nb0.y + nb0.height, '一覧が空のまま下へ送っても案内は画面の中').toBeLessThanOrEqual(844)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.evaluate(() => window.__fireVoices([{ name: 'Karen', lang: 'en-AU' }]))
    await expect(page.locator('#notice')).toBeHidden()
    expect(await page.locator('#howto').evaluate(el => el.open)).toBe(false)
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

  const rects = (pg) => pg.locator('.card').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return { n: Number(e.dataset.n), x: Math.round(r.x), y: Math.round(r.y), r: Math.round(r.right), b: Math.round(r.bottom), num: e.querySelector('.num').textContent.trim(), text: e.querySelector('.text').textContent.trim(), ja: e.querySelector('.ja').textContent.trim(), jaH: e.querySelector('.ja').getBoundingClientRect().height } }))
  const rect = (pg, sel) => pg.locator(sel).evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, r: r.right, b: r.bottom, h: r.height } })
  const inside = (cells, board) => { for (const c of cells) { expect(c.x, `${c.n} 枠の中（左）`).toBeGreaterThanOrEqual(board.x - 1); expect(c.r, `${c.n} 枠の中（右）`).toBeLessThanOrEqual(board.r + 1); expect(c.y, `${c.n} 枠の中（上）`).toBeGreaterThanOrEqual(board.y - 1); expect(c.b, `${c.n} 枠の中（下）`).toBeLessThanOrEqual(board.b + 1); expect(c.num, `${c.n} 番号`).toMatch(/^\d\d/); expect(c.text.length, `${c.n} 文`).toBeGreaterThan(0); expect(c.ja.length, `${c.n} 訳`).toBeGreaterThan(0); expect(c.jaH, `${c.n} 訳が描かれている`).toBeGreaterThan(0) } }

  test('AC10 言語の選択は一番上の帯にあり下へ送っても残る。30フレーズは1つの枠の中に表の形（幅599まで2列×15・600から3列×10）。押した文の欄と案内は押した瞬間に画面の中', async ({ page }) => {
    await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(30)
    const tabs = await rect(page, '#tabs'), board = await rect(page, '#board')
    expect(tabs.b, '言語タブは枠より上').toBeLessThanOrEqual(board.y + 1)
    expect(tabs.y, '言語タブは画面の一番上の帯').toBeLessThan(80)
    const cells = await rects(page)
    expect(new Set(cells.map(c => c.x)).size, '幅390は2列').toBe(2)
    expect(cells[0].y, '1番と16番が同じ段（上から下へ 1〜15・16〜30）').toBe(cells[15].y)
    expect(cells[0].x).toBeLessThan(cells[15].x)
    inside(cells, board)
    // 押した瞬間に、欄（文・訳・型）が画面の中に見える（画面を送っていない状態）
    await page.locator('.card[data-n="8"]').dispatchEvent('click')
    await expect(page.locator('#detail .tpl')).toContainText('言い換えの型')
    const tpl = await rect(page, '#detail .tpl'), dtext = await rect(page, '#detail .dtext')
    expect(dtext.y, '欄の文は画面の中').toBeGreaterThanOrEqual(0); expect(tpl.b, '欄の型は画面の中').toBeLessThanOrEqual(844)
    // 下へ送っても帯（タブ）は画面の一番上に残る（周回6で、body の overflow-x:hidden のせいで残っていなかった）
    await page.evaluate(() => window.scrollTo(0, 1200))
    await page.waitForTimeout(200)
    expect(await page.evaluate(() => window.scrollY), '送れている').toBeGreaterThan(600)
    const top2 = await rect(page, '.top'), tabs2 = await rect(page, '#tabs')
    expect(Math.round(top2.y), '帯の上端は 0').toBe(0)
    expect(tabs2.y).toBeGreaterThanOrEqual(0); expect(tabs2.b, 'タブは画面の上 130px 以内').toBeLessThan(130)
    expect(await page.evaluate(() => { const r = document.querySelector('.tab[data-lang="zh"]').getBoundingClientRect(); const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!(el && el.closest('.tab')) }), '帯の高さにあるのは言語タブ').toBe(true)
    const yBefore = await page.evaluate(() => window.scrollY)
    await page.locator('.tab[data-lang="ko"]').click()   // 固定が効いていれば、普通の click でも画面は飛ばない（同じ段を引き継ぐので ±1段まで）
    await expect(page.locator('.tab[data-lang="ko"]')).toHaveAttribute('aria-selected', 'true')
    await page.waitForTimeout(200)
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - yBefore), 'タブを押しても画面が飛ばない（同じ段を引き継ぐので1段ぶんまで）').toBeLessThan(260)
    expect(Math.round((await rect(page, '.top')).y), '押した後も帯は上端').toBe(0)
    await page.locator('.tab[data-lang="en"]').click()
    await page.waitForTimeout(200)
    // 20番の段を帯の直下に送り（欄は画面の下端に留まっている）、押して鳴らなくても、知らせと欄（下端）は画面の中
    await page.evaluate(() => { const el = document.querySelector('.card[data-n="20"]'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - document.querySelector('.top').getBoundingClientRect().height - 8) })
    await page.waitForTimeout(200)
    expect(Math.round((await rect(page, '#dock')).b), '欄は画面の下端に留まっている').toBe(844)
    await page.evaluate(() => { window.__silent = true })
    await page.locator('.card[data-n="20"]').click()
    await expect(page.locator('#notice')).toContainText('鳴りません', { timeout: 7000 })
    const notice = await rect(page, '#notice'), d2 = await rect(page, '#detail .dtext'), topNow = await rect(page, '.top')
    expect(notice.y, '知らせは帯の下').toBeGreaterThanOrEqual(topNow.b - 1); expect(notice.b, '知らせは画面の中').toBeLessThanOrEqual(844)
    expect(d2.y).toBeGreaterThanOrEqual(0); expect(d2.b, '欄は画面の中').toBeLessThanOrEqual(844)
    await expect(page.locator('#detail .dtext')).toHaveText(data.phrases[19].langs.en.example)
    // 列の境目: 599 までは2列、600 から3列
    await page.evaluate(() => { window.__silent = false })
    await page.setViewportSize({ width: 599, height: 844 })
    await page.waitForTimeout(100)
    const c599 = await rects(page)
    expect(new Set(c599.map(c => c.x)).size, '幅599は2列').toBe(2)
    expect(c599[0].y, '幅599でも1番と16番が同じ段').toBe(c599[15].y)
    inside(c599, await rect(page, '#board'))
    await page.setViewportSize({ width: 600, height: 844 })
    await page.waitForTimeout(100)
    const c600 = await rects(page)
    expect(new Set(c600.map(c => c.x)).size, '幅600は3列').toBe(3)
    expect(c600[0].y).toBe(c600[10].y); expect(c600[10].y).toBe(c600[20].y)
    inside(c600, await rect(page, '#board'))
    expect(await page.evaluate(() => document.documentElement.scrollWidth), '幅600で横スクロールなし').toBeLessThanOrEqual(600)
    // 一番下まで送ると欄は本来の位置＝枠のすぐ下
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(200)
    const bEnd = await rect(page, '#board'), dEnd = await rect(page, '#dock')
    expect(dEnd.y - bEnd.b, '欄は枠のすぐ下（本来の位置）').toBeGreaterThanOrEqual(-1)
    expect(dEnd.y - bEnd.b).toBeLessThan(40)
  })

  test.describe('幅1024（PC・タブレット横）', () => {
    test.use({ viewport: { width: 1024, height: 800 }, isMobile: false, hasTouch: false })
    test('AC10b 原本と同じ3列×10（1・11・21番が同じ段）で、30マスすべてが枠の中。帯は送っても残る', async ({ page }) => {
      await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
      await page.goto('/')
      await expect(page.locator('.card')).toHaveCount(30)
      const c2 = await rects(page), b2 = await rect(page, '#board')
      expect(new Set(c2.map(c => c.x)).size, '幅1024は3列').toBe(3)
      expect(c2[0].y).toBe(c2[10].y); expect(c2[10].y).toBe(c2[20].y)
      expect(c2[0].x).toBeLessThan(c2[10].x); expect(c2[10].x).toBeLessThan(c2[20].x)
      inside(c2, b2)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024)
      await page.locator('.card[data-n="17"]').dispatchEvent('click')
      await expect(page.locator('#detail .dtext')).toHaveText(data.phrases[16].langs.en.example)
      const d = await rect(page, '#detail .dtext'); expect(d.y).toBeGreaterThanOrEqual(0); expect(d.b, '欄は画面の中').toBeLessThanOrEqual(800)
      await page.evaluate(() => window.scrollTo(0, 400))
      await page.waitForTimeout(200)
      expect(await page.evaluate(() => window.scrollY), '送れている').toBeGreaterThan(100)
      expect(Math.round((await rect(page, '.top')).y), '帯の上端は 0').toBe(0)
      const t2 = await rect(page, '#tabs'); expect(t2.y).toBeGreaterThanOrEqual(0); expect(t2.b, 'タブは画面の上 130px 以内').toBeLessThan(130)
    })
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
    // 簡易版の声の時は、欄の「もっと自然な声に」から手順へ飛べる
    await page.evaluate(() => window.__fireVoices([{ name: 'Karen', lang: 'en-AU', voiceURI: 'com.apple.voice.compact.en-AU.Karen' }]))
    await page.locator('.tab[data-lang="en"]').click()
    await expect(page.locator('#voiceinfo')).toContainText('簡易版')
    await expect(page.locator('#voicehow')).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, 600))
    await page.waitForTimeout(200)
    const vb = await page.locator('#voicehow').boundingBox()
    expect(vb.height, '押せる高さ').toBeGreaterThanOrEqual(44)
    expect(vb.y).toBeGreaterThanOrEqual(0); expect(vb.y + vb.height, '下へ送っても「もっと自然な声に」は画面の中').toBeLessThanOrEqual(844)
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
    const firstVisible = () => page.evaluate(() => { const h = document.querySelector('.top').getBoundingClientRect().height; for (const c of document.querySelectorAll('.card')) { if (c.getBoundingClientRect().bottom > h + 10) return Number(c.dataset.n) } return 0 })
    await page.evaluate(() => { const el = document.querySelector('.card[data-n="7"]'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - document.querySelector('.top').getBoundingClientRect().height - 8) })
    await page.waitForTimeout(600)
    const n0 = await firstVisible(), y0 = await page.evaluate(() => window.scrollY)
    expect(n0, '一覧の中まで下りている').toBeGreaterThan(1)
    expect(y0).toBeGreaterThan(200)
    // 指で押すのと同じ素の click を送る（locator.click は押す前に要素を画面内へ送る動きをするため、位置の試験では使わない）
    await page.locator('.tab[data-lang="zh"]').dispatchEvent('click')
    await expect.poll(firstVisible).toBe(n0)   // 初めて開く中国語は、英語で見えていた番号を引き継ぐ
    const gap = await page.evaluate(n => document.querySelector(`.card[data-n="${n}"]`).getBoundingClientRect().top - document.querySelector('.top').getBoundingClientRect().height, n0)
    expect(gap, '引き継いだ番号のマスは帯のすぐ下（0〜20px）').toBeGreaterThanOrEqual(-1)
    expect(gap).toBeLessThan(20)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200)
    await page.evaluate(() => window.scrollTo(0, 120))
    await page.waitForTimeout(600)
    await page.locator('.tab[data-lang="en"]').dispatchEvent('click')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200)   // 英語は自分の位置
    await page.locator('.tab[data-lang="zh"]').dispatchEvent('click')
    await expect.poll(() => page.evaluate(() => Math.abs(window.scrollY - 120) < 40)).toBe(true)   // 中国語は自分の位置
    await page.waitForTimeout(600)
    await page.reload()
    await expect(page.locator('.card')).toHaveCount(30)
    await expect.poll(() => page.evaluate(() => Math.abs(window.scrollY - 120) < 40)).toBe(true)
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
