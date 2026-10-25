import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const data = JSON.parse(readFileSync(new URL('../data/phrases.json', import.meta.url), 'utf8'))

// app.spec.mjs と同じ差し替え方式。実機の声を鳴らさず呼び出しを記録する。
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
  { name: 'Karen', lang: 'en-AU' }, { name: 'Tingting', lang: 'zh-CN' },
  { name: 'Yuna', lang: 'ko-KR' }, { name: 'Mónica', lang: 'es-ES' },
  { name: 'Milena', lang: 'ru-RU' }, { name: 'Kanya', lang: 'th-TH' },
]

async function boot(page, url = '/#quiz') {
  await page.addInitScript(MOCK_SYNTH(VOICES_ALL))
  await page.goto(url)
  await expect(page.locator('.card')).toHaveCount(30)
}

async function currentQuestion(page) {
  const lang = await page.evaluate(() => window.phrase30.state.lang)
  const prompt = page.locator('.quiz-prompt')
  const meaning = await prompt.count() > 0
  const ja = meaning ? await prompt.textContent() : null
  const n = meaning
    ? data.phrases.find(p => p.langs[lang].ja === ja).n
    : await page.evaluate(() => window.phrase30.state.detailN)
  return { n, lang, meaning, item: data.phrases[n - 1].langs[lang] }
}

async function pick(page, right = true) {
  const q = await currentQuestion(page)
  const selector = right ? `.quiz-choice[data-n="${q.n}"]` : `.quiz-choice:not([data-n="${q.n}"])`
  await page.locator(selector).first().click()
  await expect(page.locator('#quiz-next')).toBeVisible()
  return q
}

async function finish(page, wrongAt = []) {
  const missed = []
  for (let i = 0; i < 10; i++) {
    await expect(page.locator('.quiz-progress')).toContainText(`${i + 1} / 10問`)
    const q = await pick(page, !wrongAt.includes(i))
    if (wrongAt.includes(i)) missed.push(q.n)
    await page.locator('#quiz-next').click()
  }
  return missed
}

test('画面タブ・直接ハッシュ・戻る／進む・一覧へ戻って再生', async ({ page }) => {
  await boot(page, '/')
  await expect(page.locator('.screens a')).toHaveCount(3)
  await expect(page.getByRole('link', { name: 'モールス', exact: true })).toHaveAttribute('href', 'morse.html')
  await page.locator('.card[data-n="8"]').click()
  await expect(page.locator('#detail .dtext')).toHaveText(data.phrases[7].langs.en.example)
  await page.locator('#quiz-tab').click()
  await expect(page).toHaveURL(/#quiz$/)
  for (const id of ['board', 'legend', 'detail', 'langnote']) await expect(page.locator(`#${id}`)).toBeHidden()
  await expect(page.locator('#quiz-start')).toBeVisible()
  await expect(page.locator('#tabs')).toBeVisible()
  await page.goBack()
  await expect(page.locator('#board')).toBeVisible()
  await expect(page.locator('#detail .dtext')).toHaveText(data.phrases[7].langs.en.example)
  await page.goForward()
  await expect(page.locator('#quiz-start')).toBeVisible()
  await page.reload()
  await expect(page.locator('#quiz-start')).toBeVisible()
  await page.locator('#phrases-tab').click()
  expect(new URL(page.url()).hash).toBe('')
  await page.evaluate(() => { window.__calls.length = 0 })
  await page.locator('.card[data-n="20"]').click()
  await expect.poll(() => page.evaluate(() => window.__calls.filter(c => c.type === 'speak').at(-1)?.text)).toBe(data.phrases[19].langs.en.example)
})

test('10問の点数・2種類各5問・4択重複なし・正解と不正解の色・正解の全情報と音', async ({ page }) => {
  await boot(page)
  expect(await page.evaluate(() => window.__calls.filter(c => c.type === 'speak').length)).toBe(0)
  await page.locator('#quiz-start').click()
  const kinds = [], ids = []
  for (let i = 0; i < 10; i++) {
    const q = await currentQuestion(page)
    kinds.push(q.meaning); ids.push(q.n)
    const choices = page.locator('.quiz-choice')
    await expect(choices).toHaveCount(4)
    const texts = await page.locator('.quiz-option-text').allTextContents()
    expect(new Set(texts).size).toBe(4)
    if (q.meaning) {
      await expect(page.locator('.quiz-choice .quiz-reading')).toHaveCount(4)
      expect(await page.evaluate(() => window.__calls.filter(c => c.type === 'speak').length)).toBe(0)
    }
    else {
      await expect.poll(() => page.evaluate(() => window.__calls.filter(c => c.type === 'speak').at(-1)?.text)).toBe(q.item.example)
      expect(await page.evaluate(() => window.__calls.filter(c => c.type === 'speak').length)).toBe(1)
      await page.evaluate(() => { window.__calls.length = 0 })
      await page.locator('#quiz-replay').click()
      await expect.poll(() => page.evaluate(() => window.__calls.filter(c => c.type === 'speak').length)).toBe(1)
    }
    const right = i % 3 !== 0
    await page.evaluate(() => { window.__calls.length = 0 })
    await pick(page, right)
    await expect(page.locator('.is-correct')).toHaveAttribute('data-n', String(q.n))
    await expect(page.locator('.is-wrong')).toHaveCount(right ? 0 : 1)
    const good = await page.locator('.is-correct').evaluate(e => getComputedStyle(e).backgroundColor)
    const green = good.match(/\d+/g).map(Number)
    expect(green[1]).toBeGreaterThan(green[0])
    if (!right) {
      const red = (await page.locator('.is-wrong').evaluate(e => getComputedStyle(e).backgroundColor)).match(/\d+/g).map(Number)
      expect(red[0]).toBeGreaterThan(red[1])
    }
    expect(await choices.evaluateAll(bs => bs.every(b => b.disabled))).toBe(true)
    await expect(page.locator('#quiz-answer-play .quiz-text')).toHaveText(q.item.example)
    await expect(page.locator('#quiz-answer-play .quiz-reading')).toHaveText(q.item.reading)
    await expect(page.locator('#quiz-answer-play .quiz-ja')).toHaveText(q.item.ja)
    if (q.item.note) await expect(page.locator('#quiz-answer-play .quiz-note')).toHaveText(q.item.note)
    await expect.poll(() => page.evaluate(() => window.__calls.filter(c => c.type === 'speak').at(-1)?.text)).toBe(q.item.example)
    expect(await page.evaluate(() => window.__calls.filter(c => c.type === 'speak').at(-1).lang)).toBe('en-AU')
    expect(await page.evaluate(() => window.__calls.filter(c => c.type === 'speak').at(-1).rate)).toBe(0.9)
    await page.evaluate(() => { window.__calls.length = 0 })
    await page.locator('#quiz-next').click()
  }
  expect(kinds.filter(Boolean)).toHaveLength(5)
  expect(new Set(ids).size).toBe(10)
  await expect(page.locator('#quiz h2')).toHaveText('10問中 6問正解')
  await expect(page.locator('.quiz-review-list li')).toHaveCount(4)
})

test('間違えた文の再生・間違えたのだけ10問・全問正解では復習ボタンなし・もう一回', async ({ page }) => {
  await boot(page)
  await page.locator('#quiz-start').click()
  const missed = await finish(page, [1, 4])
  await expect(page.locator('#quiz h2')).toHaveText('10問中 8問正解')
  await page.locator('.quiz-review-list button').first().click()
  await expect.poll(() => page.evaluate(() => window.__calls.filter(c => c.type === 'speak').at(-1)?.text)).toBe(data.phrases[missed[0] - 1].langs.en.example)
  await page.locator('#quiz-wrong-only').click()
  for (let i = 0; i < 10; i++) {
    const q = await currentQuestion(page)
    expect(missed).toContain(q.n)
    await pick(page)
    await page.locator('#quiz-next').click()
  }
  await expect(page.locator('#quiz h2')).toHaveText('10問中 10問正解')
  await expect(page.locator('#quiz-wrong-only')).toHaveCount(0)
  await page.locator('#quiz-again').click()
  await expect(page.locator('.quiz-progress')).toContainText('1 / 10問')
})

test('6言語で言語切り替えははじめるから・音は同じ言語のexample・ゆっくり', async ({ page }) => {
  await boot(page)
  await page.locator('#slow').click()
  for (const def of data.languages) {
    await page.locator(`.tab[data-lang="${def.code}"]`).click()
    await expect(page.locator('#quiz-start')).toBeVisible()
    await expect(page.locator('.quiz-choice')).toHaveCount(0)
    await page.locator('#quiz-start').click()
    await page.evaluate(() => { window.__calls.length = 0 })
    const q = await pick(page)
    await expect.poll(() => page.evaluate(() => window.__calls.filter(c => c.type === 'speak').at(-1)?.text)).toBe(q.item.example)
    const call = await page.evaluate(() => window.__calls.filter(c => c.type === 'speak').at(-1))
    expect(call.lang).toBe(VOICES_ALL.find(v => v.lang.startsWith(def.code)).lang)
    expect(call.rate).toBe(0.7)
  }
  await page.locator('#phrases-tab').click()
  await page.locator('.tab[data-lang="en"]').click()
  await page.locator('#quiz-tab').click()
  await expect(page.locator('#quiz-start')).toBeVisible()
})

test('言語別の間違い保存・再読込後に重みをつけて出題', async ({ page }) => {
  await boot(page)
  await page.locator('#quiz-start').click()
  const q = await pick(page, false)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('phrase30.quiz.mistakes.en')))).toEqual({ [q.n]: 1 })
  expect(await page.evaluate(() => localStorage.getItem('phrase30.quiz.mistakes.zh'))).toBeNull()
  // 再読込して固定の乱数で重みを確かめる。重みなしなら0.5で1番は選ばれない。
  await page.evaluate(() => localStorage.setItem('phrase30.quiz.mistakes.en', JSON.stringify({ 1: 1000 })))
  await page.reload()
  await expect(page.locator('#quiz-start')).toBeVisible()
  await page.evaluate(() => { Math.random = () => 0.5 })
  await page.locator('#quiz-start').click()
  expect((await currentQuestion(page)).n).toBe(1)
  await page.locator('.tab[data-lang="zh"]').click()
  await page.locator('#quiz-start').click()
  expect((await currentQuestion(page)).n).not.toBe(1)
})

for (const broken of ['blocked', 'invalid']) {
  test(`localStorageが${broken === 'blocked' ? '使えない' : '壊れた記録のある'}環境でも10問遊べる`, async ({ page }) => {
    if (broken === 'blocked') await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage blocked') } })
    })
    else await page.addInitScript(() => localStorage.setItem('phrase30.quiz.mistakes.en', '{broken'))
    await boot(page)
    await page.locator('#quiz-start').click()
    await finish(page, [0])
    await expect(page.locator('#quiz h2')).toHaveText('10問中 9問正解')
  })
}

test('音声の失敗案内が問題画面でも見える', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }))
  await page.goto('/#quiz')
  await expect(page.locator('#quiz-start')).toBeVisible()
  await expect(page.locator('#notice')).toBeVisible()
  await expect(page.locator('#notice')).toContainText('対応していません')
  await page.locator('#quiz-start').click()
  await pick(page)
  await expect(page.locator('#notice')).toBeVisible()
  await expect(page.locator('#detail')).toBeHidden()
})

for (const width of [320, 390, 1024]) {
  for (const colorScheme of ['light', 'dark']) {
    test(`${width}px・${colorScheme}：全言語の出題・答え・結果にはみ出しなし、タップ44px、帯が残る`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.emulateMedia({ colorScheme })
      await boot(page)
      const check = async () => {
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        const bad = await page.locator('#quiz button, .screen-tab, #slow, #tabs button').evaluateAll(els => els.filter(e => {
          const r = e.getBoundingClientRect()
          return r.height < 44 || r.left < 0 || r.right > innerWidth + 1 || e.scrollWidth > e.clientWidth + 1
        }).map(e => e.textContent))
        expect(bad).toEqual([])
      }
      for (const def of data.languages) {
        await page.locator(`.tab[data-lang="${def.code}"]`).click()
        await check()
        await page.locator('#quiz-start').click()
        await check()
        await pick(page, false)
        await check()
        await page.evaluate(() => window.scrollTo(0, 500))
        expect(await page.locator('.top').evaluate(e => Math.round(e.getBoundingClientRect().top))).toBe(0)
      }
      await page.locator('.tab[data-lang="en"]').click()
      await page.locator('#quiz-start').click()
      await finish(page, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      await check()
    })
  }
}
