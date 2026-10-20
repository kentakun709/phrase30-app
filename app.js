/* 30フレーズ音声アプリ（ベータ）。登録・課金・外部APIなし。音声は端末の Web Speech API。
   data/phrases.json の各項目に audio（このサイト内 audio/ の音声ファイルのパス）が入っていれば、読み上げの代わりにそれを鳴らす（将来の差し替え口）。 */
(function () {
  'use strict';
  var synth = window.speechSynthesis || null;
  var state = { data: null, lang: 'en', voices: [], voice: null, playing: null, utter: null, audioEl: null,
    noVoice: false, slow: false, gen: 0, watchdog: null, dismissed: {}, noticeKey: '', busyCancelAt: 0, scroll: {}, howtoAuto: false, howtoOpened: {} };
  var $ = function (id) { return document.getElementById(id); };
  var $tabs = $('tabs'), $list = $('list'), $notice = $('notice'), $noticetext = $('noticebody'), $noticeclose = $('noticeclose'), $noticehow = $('noticehow');
  var $voiceinfo = $('voiceinfo'), $loading = $('loading'), $langnote = $('langnote'), $slow = $('slow'), $howto = $('howto'), $howtobody = $('howtobody'), $howtosum = $('howtosum'), $voicehow = $('voicehow');

  var SPEAKER_SVG = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';
  var LANG_JA = { 'en-nz': 'ニュージーランド英語', 'en-au': 'オーストラリア英語', 'en-gb': 'イギリス英語', 'en-ie': 'アイルランド英語', 'en-us': 'アメリカ英語',
    'en-in': 'インド英語', 'en-za': '南アフリカ英語', 'en-ca': 'カナダ英語',
    'zh-cn': '中国語（普通話）', 'zh-hans': '中国語（普通話）', 'zh-hans-cn': '中国語（普通話）', 'cmn-cn': '中国語（普通話）', 'cmn-hans-cn': '中国語（普通話）',
    'zh-tw': '台湾の中国語', 'zh-hant-tw': '台湾の中国語', 'zh-hk': '香港の中国語',
    'ko-kr': '韓国語', 'es-es': 'スペイン語（スペイン）', 'es-mx': 'スペイン語（メキシコ）', 'es-us': 'スペイン語（米国）', 'es-ar': 'スペイン語（アルゼンチン）',
    'ru-ru': 'ロシア語', 'th-th': 'タイ語' };
  var IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var IS_ANDROID = /Android/.test(navigator.userAgent);

  function normLang(l) { return String(l || '').replace(/_/g, '-').toLowerCase(); }
  function langDef(code) { code = code || state.lang; for (var i = 0; i < state.data.languages.length; i++) if (state.data.languages[i].code === code) return state.data.languages[i]; return state.data.languages[0]; }
  function langJa(l) {
    l = normLang(l); if (LANG_JA[l]) return LANG_JA[l];
    var base = l.split('-')[0];
    for (var i = 0; i < state.data.languages.length; i++) { var d = state.data.languages[i]; for (var j = 0; j < d.bcp47.length; j++) if (normLang(d.bcp47[j]).split('-')[0] === base) return d.nameJa; }
    return l;
  }

  // 自然な声を優先する点数（名前と識別名 voiceURI の手がかり）
  function voiceScore(v) {
    var name = String(v.name || '').toLowerCase(), n = name + ' ' + String(v.voiceURI || '').toLowerCase(), s = 0;
    if (/eloquence|espeak|novelty|whisper|bells|bubbles|organ|cellos|zarvox|trinoids|boing|bad news|good news|jester|wobble|albert|fred|junior|ralph|kathy/.test(n)) s -= 10;
    if (/^(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/.test(name)) s -= 10;
    if (/compact/.test(n)) s -= 3;
    if (/premium|enhanced|neural|natural|wavenet|journey|studio|siri|拡張|プレミアム/.test(n)) s += 5;
    return s;
  }
  function isCompact(v) { return /compact/.test((String(v.name || '') + ' ' + String(v.voiceURI || '')).toLowerCase()); }
  // 声の選び方: 端末内の声（localService）から、下の順で比べて1つ選ぶ。無ければ通信する声も含めて同じ基準
  //   上から順に比べる（足し算ではない）: NZ があれば必ず → 自然さ（premium/enhanced +5・compact -3・機械声 -10）→ 地域の近さ（豪→英→愛→米）→ 端末の既定の声 → 名前
  //   → 普通の豪の声は普通の米の声に勝ち、拡張の米の声は普通や簡易版の豪の声に勝つ（要件「端末内の音声から自然な声を優先」「可能なら NZ」。周回3 judge・周回4 東条）
  function regionScore(def, l) {
    var prefs = def.bcp47.map(normLang), i;
    for (i = 0; i < prefs.length; i++) if (l === prefs[i] || l.indexOf(prefs[i] + '-') === 0) return prefs.length - i;   // 近い地域ほど大きい
    return 0;
  }
  // 比べる順: ①英語なら NZ の声 ②自然さ（voiceScore） ③地域の近さ ④端末の既定の声 ⑤名前・識別名（同点でも列挙順に左右されない）
  function compareVoices(def, a, b) {
    var la = normLang(a.lang), lb = normLang(b.lang);
    var nzA = def.code === 'en' && regionScore(def, la) === def.bcp47.length ? 1 : 0, nzB = def.code === 'en' && regionScore(def, lb) === def.bcp47.length ? 1 : 0;
    if (nzA !== nzB) return nzB - nzA;
    var qa = voiceScore(a), qb = voiceScore(b); if (qa !== qb) return qb - qa;
    var ra = regionScore(def, la), rb = regionScore(def, lb); if (ra !== rb) return rb - ra;
    var da = a.default ? 1 : 0, db = b.default ? 1 : 0; if (da !== db) return db - da;
    return String((a.name || '') + '|' + (a.voiceURI || '') + '|' + (a.lang || '')).localeCompare(String((b.name || '') + '|' + (b.voiceURI || '') + '|' + (b.lang || '')));   // 同点は名前→識別名→lang で固定（列挙順に左右されない）
  }
  function pickVoice(def, voices) {
    var hard = def.code === 'zh' ? /(^|-)hk($|-)|^yue|hant-hk/ : null;      // 香港の広東語は使わない
    var soft = def.code === 'zh' ? /(^|-)tw($|-)|hant/ : null;              // 台湾の声は、普通話の声が無い時だけ
    var bases = {}; def.bcp47.forEach(function (p) { bases[normLang(p).split('-')[0]] = 1; });
    var sameLang = function (v) { var l = normLang(v.lang); return bases[l.split('-')[0]] && !(hard && hard.test(l)); };
    var find = function (pool) {
      var cands = pool.filter(sameLang);
      var main = cands.filter(function (v) { return !(soft && soft.test(normLang(v.lang))); });
      if (!main.length) main = cands;
      if (!main.length) return null;
      main.sort(function (a, b) { return compareVoices(def, a, b); });
      return main[0];
    };
    return find(voices.filter(function (v) { return v.localService !== false; })) || find(voices) || null;
  }

  function refreshVoices() {
    if (!synth) { renderVoiceState(); return; }
    try { state.voices = synth.getVoices() || []; } catch (e) { state.voices = []; }
    state.voice = pickVoice(langDef(), state.voices);
    state.noVoice = !state.voice;
    renderVoiceState();
  }

  function howToAdd(def) {
    var region = def.code === 'en' ? ' → オーストラリア（NZ に一番近い。他の地域でも可）' : def.code === 'es' ? '（スペインか中南米のどれでも可）' : '';
    var ios = 'iPhone: 設定 → アクセシビリティ → 読み上げコンテンツ → 声 → ' + def.nameJa + region + ' を選び、名前に「拡張」か「プレミアム」と付いた声をダウンロード。';
    var android = 'Android: 設定 → ユーザー補助（機種により システム → 言語と入力）→ テキスト読み上げ → Google の音声 → 音声データをインストール → ' + def.nameJa + '。';
    if (IS_IOS) return ios; if (IS_ANDROID) return android; return ios + ' ' + android;
  }
  function renderVoiceState() {
    var def = langDef();
    $howtobody.textContent = howToAdd(def) + ' Wi-Fi で、言語ごとに1回。数十〜数百MB。入れたら、この画面で言語タブを押し直すと新しい声になります。';
    $howtosum.textContent = state.noVoice ? '【' + def.nameJa + '】の声の足し方' : '声が機械っぽい時は → もっと自然な声にする（言語ごとに1回）';
    if (!synth) { showNotice('nosynth', 'このブラウザは読み上げに対応していません。iPhone の Safari か Android の Chrome で開いてください。'); $voiceinfo.textContent = ''; return; }
    if (state.noVoice) {
      $howto.hidden = false;
      if (state.voices.length === 0) {
        showNotice('novoice-empty:' + def.code, '声の一覧をまだ読めていません。カードを1回押してください。【' + def.nameJa + '】の声は設定で足せます。');
        $voiceinfo.textContent = '声: 読み込み中';
      } else {
        showNotice('novoice:' + def.code, 'この端末には【' + def.nameJa + '】の音声が入っていません。端末の設定で足せます。');
        $voiceinfo.textContent = '声: なし';
        if (!state.howtoOpened[def.code]) {   // 一覧はあるのにその言語の声が無い時だけ、言語ごとに最初の1回だけ自動で開く（閉じたら押しても開き直さない）
          state.howtoOpened[def.code] = true;
          if (!$howto.open) { $howto.open = true; state.howtoAuto = true; }
        }
      }
      $voicehow.hidden = true;
    } else {
      hideNotice('novoice');
      var vl = normLang(state.voice.lang), first = normLang(def.bcp47[0]);
      var txt = '声: ' + state.voice.name + '・' + langJa(vl) + (isCompact(state.voice) ? '・簡易版' : '');
      $voicehow.hidden = !isCompact(state.voice);   // 簡易版の時は、帯から手順へ飛べる
      if (LANG_JA[vl] && LANG_JA[first] && LANG_JA[vl] !== LANG_JA[first]) {
        var hasFirst = state.voices.some(function (v) { var l = normLang(v.lang); return (l === first || l.indexOf(first + '-') === 0) && v.localService !== false; });
        txt += hasFirst ? '。より自然な声を選びました' : '。' + LANG_JA[first] + 'の声が無いので代用';
      }
      $voiceinfo.textContent = txt;
      $howto.hidden = false;
      if (state.howtoAuto) { $howto.open = false; state.howtoAuto = false; }   // 声が見つかったら、自動で開いた手順は畳む
    }
  }
  function showNotice(key, text) {
    if (state.dismissed[key]) return;              // 閉じた案内は、同じ件では出し直さない
    state.noticeKey = key; $noticetext.textContent = text; $notice.hidden = false;
    $noticehow.hidden = !/^(novoice|err|silent)/.test(key);   // 声の足し方へ飛ぶボタン（声の問題の時だけ）
  }
  function hideNotice(prefix) { if (!prefix || state.noticeKey.indexOf(prefix) === 0) { $notice.hidden = true; $noticetext.textContent = ''; state.noticeKey = ''; } }
  function hideFailNotices(keys) { keys.forEach(function (k) { if (state.noticeKey === k) hideNotice(k); }); }

  function setPlaying(n) {
    state.playing = n;
    var cards = $list.querySelectorAll('.card');
    for (var i = 0; i < cards.length; i++) {
      var on = Number(cards[i].getAttribute('data-n')) === n;
      cards[i].classList.toggle('playing', on);
      cards[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }
  function clearWatchdog() { if (state.watchdog) { clearTimeout(state.watchdog); state.watchdog = null; } }

  function nowMs() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function stopAll() {
    var wasBusy = false; try { wasBusy = !!(synth && (synth.speaking || synth.pending)); } catch (e) { /* */ }
    if (wasBusy) state.busyCancelAt = nowMs();     // 鳴っていた物を止めた時刻（この後 80ms は鳴らさない）
    state.gen++;                                   // これより前の読み上げ・遅延の予約を全部無効にする
    state.utter = null;                            // 止めた読み上げの遅いイベント（onend/onerror）が後から効かないように
    clearWatchdog();
    if (synth) { try { synth.cancel(); } catch (e) { /* 端末差で例外になることがある */ } }
    if (state.audioEl) { try { state.audioEl.onplay = state.audioEl.onended = state.audioEl.onerror = state.audioEl.onpause = null; state.audioEl.pause(); state.audioEl.currentTime = 0; } catch (e) { /* */ } }
    setPlaying(null);
  }

  function speakItem(item, n, def) {
    if (!synth) { renderVoiceState(); return; }
    var delay = state.busyCancelAt ? Math.min(80, Math.max(0, 80 - (nowMs() - state.busyCancelAt))) : 0;
    if (state.voices.length === 0 || state.noVoice) refreshVoices();   // iOS は最初の操作の後に一覧が入る・声を追加した直後にも効く
    var gen = state.gen;
    var u = new SpeechSynthesisUtterance(item.example);
    u.lang = state.voice ? state.voice.lang : def.bcp47[0];
    if (state.voice) u.voice = state.voice;
    u.rate = state.slow ? 0.7 : 0.9; u.pitch = 1; u.volume = 1;
    var started = false;
    u.onstart = function () { if (state.utter !== u) return; started = true; clearWatchdog(); hideFailNotices(['silent', 'err']); setPlaying(n); };   // 「読み上げで鳴らしました」の案内は残す
    u.onend = function () { if (state.utter !== u) return; clearWatchdog(); setPlaying(null); };
    u.onerror = function (ev) {
      if (state.utter !== u) return;
      clearWatchdog(); setPlaying(null);
      var code = ev && ev.error;
      if (code && code !== 'interrupted' && code !== 'canceled') showNotice('err', '読み上げに失敗しました。端末に【' + def.nameJa + '】の音声があるか確かめてください。');
    };
    state.utter = u;                               // 参照を持つ（持たないと途中で止まるブラウザがある）
    setPlaying(n);                                 // 押した瞬間に光らせる（onstart が遅い端末がある）
    var armWatchdog = function (second) {
      state.watchdog = setTimeout(function () {
        if (state.utter !== u || started) return;
        var sp = false, pe = false; try { sp = !!synth.speaking; pe = !!synth.pending; } catch (e) { /* */ }
        if (sp) {                                             // onstart が来ない端末でも、鳴っているなら黙って見守り、止まったら光を消す（上限30秒）
          (function poll(k) { state.watchdog = setTimeout(function () { if (state.utter !== u) return; var s2 = false; try { s2 = !!synth.speaking; } catch (e) { /* */ } if (s2 && k < 30) poll(k + 1); else setPlaying(null); }, 1000); })(0);
          return;
        }
        if (pe && !second) { armWatchdog(true); return; }     // 声の読み込み待ちだけ、もう1回待つ
        setPlaying(null);
        showNotice('silent', state.noVoice
          ? '鳴りませんでした。この端末に【' + def.nameJa + '】の声が無いためです。端末の設定で足せます。'
          : '鳴りませんでした。もう一度押してください。音量と消音（マナーモード）も確かめてください。');
      }, 2500);
    };
    var go = function () {
      if (state.gen !== gen || state.utter !== u) return;
      try { if (synth.paused) synth.resume(); synth.speak(u); }
      catch (e) { setPlaying(null); showNotice('err', '読み上げを始められませんでした。もう一度押してください。' + (state.noVoice ? '【' + def.nameJa + '】の声は端末の設定で足せます。' : '')); return; }
      armWatchdog(false);
    };
    if (delay > 0) setTimeout(go, delay); else go();   // 止めた直後の speak が落ちる端末があるので、鳴っていた時は 80ms 空ける
  }

  function playFile(src, item, n, def) {
    if (!state.audioEl) state.audioEl = new Audio();
    var a = state.audioEl, gen = state.gen, fell = false, settled = false;
    var fallback = function () {
      if (fell || settled || state.gen !== gen) return; fell = true;   // 鳴り終わった後の error では戻らない
      showNotice('audiofail', '音声ファイルが読めないので、端末の読み上げで鳴らしました（' + src + '）。');
      speakItem(item, n, def);
    };
    a.onplay = function () { if (state.gen === gen) { hideFailNotices(['silent', 'err', 'audiofail']); setPlaying(n); } };
    a.onended = function () { settled = true; if (state.gen === gen) setPlaying(null); };
    a.onerror = function () { if (state.gen === gen) { setPlaying(null); fallback(); } };
    a.onpause = function () { if (state.gen === gen && a.ended) setPlaying(null); };
    a.src = src;
    setPlaying(n);
    var p;
    try { p = a.play(); } catch (e) { setPlaying(null); fallback(); return; }
    if (p && typeof p.catch === 'function') p.catch(function () { if (state.gen === gen) { setPlaying(null); fallback(); } });
  }

  function play(n) {
    var item = state.data.phrases[n - 1].langs[state.lang], def = langDef();
    stopAll();                                     // 前の音声を止め、読み上げの列を空にしてから鳴らす（溜めない・止めた直後 80ms は空ける）
    hideFailNotices(['audiofail']);                // 前のファイルの知らせは、次を押したら消す（また失敗すればまた出る）
    if (item.audio) { playFile(item.audio, item, n, def); return; }
    speakItem(item, n, def);
  }

  function renderTabs() {
    $tabs.innerHTML = '';
    state.data.languages.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tab'; b.setAttribute('role', 'tab');
      b.setAttribute('data-lang', l.code);
      b.setAttribute('aria-selected', l.code === state.lang ? 'true' : 'false');
      b.innerHTML = '<span>' + esc(l.name) + '</span><small>' + esc(l.nameJa) + '</small>';
      b.addEventListener('click', function () { setLang(l.code); });
      $tabs.appendChild(b);
    });
  }

  function renderList() {
    $list.innerHTML = '';
    var def = langDef(), sections = state.data.sections || [];
    state.data.phrases.forEach(function (p) {
      var sec = sections.filter(function (s) { return s.from === p.n; })[0];
      if (sec) { var h = document.createElement('li'); h.className = 'section'; h.textContent = sec.title + '（' + sec.from + '〜' + sec.to + '）'; $list.appendChild(h); }
      var it = p.langs[state.lang];
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'card'; b.setAttribute('data-n', String(p.n)); b.setAttribute('aria-pressed', 'false');
      var html = '<span class="num">' + (p.n < 10 ? '0' + p.n : p.n) + '</span>' +
        '<span class="text" lang="' + esc(def.bcp47[0]) + '">' + esc(it.example) + '</span>' +
        '<span class="ja">' + esc(it.ja) + '</span>';
      if (it.note) html += '<span class="note">' + esc(it.note) + '</span>';
      if (it.template && it.template !== it.example) {
        html += it.template.indexOf('〇〇') >= 0
          ? '<span class="tpl">言い換えの型: ' + esc(it.template) + '（' + esc(p.ja) + '）</span>'
          : '<span class="tpl">別の言い方（鳴るのは上の文）: ' + esc(it.template) + '</span>';
      }
      html += SPEAKER_SVG;
      b.innerHTML = html;
      b.addEventListener('click', function () { play(p.n); });
      li.appendChild(b);
      $list.appendChild(li);
    });
    $langnote.textContent = def.note || '';
  }

  function topOffset() { var top = document.querySelector('.top'); return top ? top.getBoundingClientRect().height : 0; }
  function visibleFirstCard() {   // 帯のすぐ下に見えている最初のカードの番号
    var cards = $list.querySelectorAll('.card'), h = topOffset(), i;
    for (i = 0; i < cards.length; i++) { if (cards[i].getBoundingClientRect().bottom > h + 1) return Number(cards[i].getAttribute('data-n')); }
    return 0;
  }
  function scrollToCard(n) {
    var el = n ? $list.querySelector('.card[data-n="' + n + '"]') : null; if (!el) return;
    try { window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + (window.scrollY || 0) - topOffset() - 8)); } catch (e) { /* */ }
  }
  function setLang(code) {
    var inList = !!state.data && $list.getBoundingClientRect().top < topOffset();   // 一覧の中まで下りている時だけ番号で引き継ぐ（一番上なら一番上のまま）
    var curY = window.scrollY || 0, curCard = inList ? visibleFirstCard() : 0;
    if (state.data) state.scroll[state.lang] = curY;
    state.lang = code;
    try { localStorage.setItem('phrase30.lang', code); } catch (e) { /* プライベートモード等 */ }
    stopAll();
    hideNotice('');
    var tabs = $tabs.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].setAttribute('aria-selected', tabs[i].getAttribute('data-lang') === code ? 'true' : 'false');
    renderList();
    refreshVoices();
    var known = (code in state.scroll), y = known ? state.scroll[code] : curY;
    var restore = function () { if (known || !curCard) { try { window.scrollTo(0, y); } catch (e) { /* */ } } else scrollToCard(curCard); };   // 初めて開く言語は、見えていたカードの番号で引き継ぐ
    restore();
    if (window.requestAnimationFrame) window.requestAnimationFrame(restore);   // 描画の直後にもう一度（一覧の高さが決まる前だと届かない端末がある）
  }
  function setSlow(on) {
    state.slow = !!on; $slow.setAttribute('aria-pressed', state.slow ? 'true' : 'false');
    try { localStorage.setItem('phrase30.slow', state.slow ? '1' : '0'); } catch (e) { /* */ }
  }
  function saveScroll() {
    state.scroll[state.lang] = window.scrollY || 0;
    try { localStorage.setItem('phrase30.scroll', JSON.stringify(state.scroll)); } catch (e) { /* */ }
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function init(data) {
    state.data = data;
    var saved = null, slow = null, scroll = null;
    try { saved = localStorage.getItem('phrase30.lang'); slow = localStorage.getItem('phrase30.slow'); scroll = JSON.parse(localStorage.getItem('phrase30.scroll') || '{}'); } catch (e) { /* */ }
    if (saved && data.languages.some(function (l) { return l.code === saved; })) state.lang = saved;
    if (scroll && typeof scroll === 'object') state.scroll = scroll;
    setSlow(slow === '1');
    $loading.hidden = true;
    renderTabs();
    renderList();
    refreshVoices();
    if (synth && typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', refreshVoices);
    else if (synth) synth.onvoiceschanged = refreshVoices;
    $slow.addEventListener('click', function () { setSlow(!state.slow); });
    $howtosum.addEventListener('click', function () { state.howtoAuto = false; });   // 手で開け閉めした物は、自動では畳まない
    var goHowto = function () {
      $howto.hidden = false; $howto.open = true; state.howtoAuto = false;   // 自分で開けた物は、声が見つかっても畳まない
      try { window.scrollTo(0, Math.max(0, $howto.getBoundingClientRect().top + (window.scrollY || 0) - topOffset() - 8)); } catch (e) { /* */ }
    };
    $noticehow.addEventListener('click', goHowto);
    $voicehow.addEventListener('click', goHowto);
    $noticeclose.addEventListener('click', function () { if (/^(nosynth|novoice)/.test(state.noticeKey)) state.dismissed[state.noticeKey] = true; hideNotice(''); });   // 失敗の知らせは次に失敗すればまた出す
    document.addEventListener('visibilitychange', function () { if (document.hidden) stopAll(); });
    window.addEventListener('pagehide', function () { stopAll(); saveScroll(); });
    var t = null; window.addEventListener('scroll', function () { if (t) return; t = setTimeout(function () { t = null; saveScroll(); }, 400); }, { passive: true });
    var y = state.scroll[state.lang] || 0; if (y > 0) { try { window.scrollTo(0, y); } catch (e) { /* */ } }
  }

  // 試験と将来の差し替えのための小さな窓口（外部には何も送らない）
  window.phrase30 = { state: state, play: play, stopAll: stopAll, setLang: setLang, pickVoice: pickVoice, voiceScore: voiceScore };

  fetch('data/phrases.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(init)
    .catch(function (e) {
      $loading.textContent = 'データを読み込めませんでした。電波の良い所で開き直してください。（' + e.message + '）';
    });
})();
