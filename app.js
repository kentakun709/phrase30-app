/* 30フレーズ音声アプリ（ベータ）。登録・課金・外部APIなし。音声は端末の Web Speech API。
   data/phrases.json の各項目に audio（同じサイト内の音声ファイルのパス）が入っていれば、読み上げの代わりにそれを鳴らす（将来の差し替え口）。 */
(function () {
  'use strict';
  var synth = window.speechSynthesis || null;
  var state = { data: null, lang: 'en', voices: [], voice: null, playing: null, utter: null, audioEl: null,
    noVoice: false, slow: false, gen: 0, watchdog: null, dismissed: '', noticeKey: '' };
  var $ = function (id) { return document.getElementById(id); };
  var $tabs = $('tabs'), $list = $('list'), $notice = $('notice'), $noticetext = $('noticetext'), $noticeclose = $('noticeclose');
  var $voiceinfo = $('voiceinfo'), $loading = $('loading'), $langnote = $('langnote'), $slow = $('slow');

  var SPEAKER_SVG = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';
  var LANG_JA = { 'en-nz': 'ニュージーランド英語', 'en-au': 'オーストラリア英語', 'en-gb': 'イギリス英語', 'en-ie': 'アイルランド英語', 'en-us': 'アメリカ英語',
    'en-in': 'インド英語', 'en-za': '南アフリカ英語', 'en-ca': 'カナダ英語', 'zh-cn': '中国語（普通話）', 'zh-tw': '台湾の中国語', 'zh-hk': '香港の中国語',
    'ko-kr': '韓国語', 'es-es': 'スペイン語（スペイン）', 'es-mx': 'スペイン語（メキシコ）', 'es-us': 'スペイン語（米国）', 'es-ar': 'スペイン語（アルゼンチン）',
    'ru-ru': 'ロシア語', 'th-th': 'タイ語' };

  function normLang(l) { return String(l || '').replace(/_/g, '-').toLowerCase(); }
  function langDef(code) { code = code || state.lang; for (var i = 0; i < state.data.languages.length; i++) if (state.data.languages[i].code === code) return state.data.languages[i]; return state.data.languages[0]; }
  function langJa(l) {
    l = normLang(l); if (LANG_JA[l]) return LANG_JA[l];
    var base = l.split('-')[0];
    for (var i = 0; i < state.data.languages.length; i++) { var d = state.data.languages[i]; for (var j = 0; j < d.bcp47.length; j++) if (normLang(d.bcp47[j]).split('-')[0] === base) return d.nameJa + '（' + l + '）'; }
    return l;
  }

  // 自然な声を優先する点数。名前と識別名（voiceURI）の手がかりと、端末内の声（localService）かどうかで決める
  function voiceScore(v) {
    var name = String(v.name || '').toLowerCase(), n = name + ' ' + String(v.voiceURI || '').toLowerCase(), s = 0;
    if (/eloquence|espeak|novelty|whisper|bells|bubbles|organ|cellos|zarvox|trinoids|boing|bad news|good news|jester|wobble|albert|fred|junior|ralph|kathy/.test(n)) s -= 10;
    if (/^(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/.test(name)) s -= 10;
    if (/compact/.test(n)) s -= 3;
    if (/premium|enhanced|neural|natural|wavenet|journey|studio|siri/.test(n)) s += 5;
    if (v.localService !== false) s += 20;          // 端末内の声を常に先に（外に通信しない）。外の声は端末内に無い時だけ
    if (v.default) s += 1;
    return s;
  }
  function best(cands) { cands.sort(function (a, b) { return voiceScore(b) - voiceScore(a); }); return cands[0]; }
  function pickVoice(def, voices) {
    var hard = def.code === 'zh' ? /(^|-)hk($|-)|^yue|hant-hk/ : null;      // 香港の広東語は使わない
    var soft = def.code === 'zh' ? /(^|-)tw($|-)|hant/ : null;              // 台湾の声は、普通話の声が無い時だけ
    var ok = function (l, allowSoft) { return !(hard && hard.test(l)) && (allowSoft || !(soft && soft.test(l))); };
    var prefs = def.bcp47.map(normLang), i, cands;
    for (i = 0; i < prefs.length; i++) {
      var p = prefs[i];
      cands = voices.filter(function (v) { var l = normLang(v.lang); return (l === p || l.indexOf(p + '-') === 0) && ok(l, false); });
      if (cands.length) return best(cands);
    }
    var bases = {}; prefs.forEach(function (p) { bases[p.split('-')[0]] = 1; });
    cands = voices.filter(function (v) { var l = normLang(v.lang); return bases[l.split('-')[0]] && ok(l, false); });
    if (cands.length) return best(cands);
    cands = voices.filter(function (v) { var l = normLang(v.lang); return bases[l.split('-')[0]] && ok(l, true); });
    if (cands.length) return best(cands);
    return null;
  }

  function refreshVoices() {
    if (!synth) return;
    try { state.voices = synth.getVoices() || []; } catch (e) { state.voices = []; }
    state.voice = pickVoice(langDef(), state.voices);
    state.noVoice = !state.voice;
    renderVoiceState();
  }

  function howToAdd(def) {
    return ' iPhone: 設定 → アクセシビリティ → 読み上げコンテンツ → 声 → ' + def.nameJa + ' を追加。Android: 設定 → テキスト読み上げ → Google の音声で ' + def.nameJa + ' をインストール。';
  }
  function renderVoiceState() {
    var def = langDef();
    if (!synth) { showNotice('nosynth', 'このブラウザは読み上げ（Web Speech API）に対応していません。iPhone の Safari か Android の Chrome で開いてください。'); $voiceinfo.textContent = ''; return; }
    if (state.noVoice) {
      if (state.voices.length === 0) {
        showNotice('novoice:' + def.code, '端末の音声の一覧をまだ読み込めていません。カードを1回押すと読み込まれることがあります。それでも【' + def.nameJa + '】が鳴らない時は、設定で音声を追加してください。' + howToAdd(def));
      } else {
        showNotice('novoice:' + def.code, 'この端末には【' + def.nameJa + '】の音声が入っていません。押しても鳴らないか、別の言語の声で読まれることがあります。' + howToAdd(def));
      }
      $voiceinfo.textContent = '';
    } else {
      hideNotice('novoice:');
      var vl = normLang(state.voice.lang), first = normLang(def.bcp47[0]);
      var txt = '声: ' + state.voice.name + '（' + langJa(vl) + '）';
      if (vl !== first && LANG_JA[first]) txt += '。' + langJa(first) + 'の声はこの端末に無いため';
      $voiceinfo.textContent = txt;
    }
  }
  function showNotice(key, text) {
    if (key === state.dismissed) return;            // 閉じた案内は、同じ件では出し直さない
    state.noticeKey = key; $noticetext.textContent = text; $notice.hidden = false;
  }
  function hideNotice(prefix) { if (!prefix || state.noticeKey.indexOf(prefix) === 0) { $notice.hidden = true; $noticetext.textContent = ''; state.noticeKey = ''; } }

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

  function stopAll() {
    state.gen++;                                   // これより前の読み上げ・遅延の予約を全部無効にする
    state.utter = null;                            // 止めた読み上げの遅いイベント（onend/onerror）が後から効かないように
    clearWatchdog();
    if (synth) { try { synth.cancel(); } catch (e) { /* 端末差で例外になることがある */ } }
    if (state.audioEl) { try { state.audioEl.onplay = state.audioEl.onended = state.audioEl.onerror = state.audioEl.onpause = null; state.audioEl.pause(); state.audioEl.currentTime = 0; } catch (e) { /* */ } }
    setPlaying(null);
  }

  function speakItem(item, n, def, wasBusy) {
    if (!synth) { renderVoiceState(); return; }
    if (state.voices.length === 0 || state.noVoice) refreshVoices();   // iOS は最初の操作の後に一覧が入る・声を追加した直後にも効く
    var gen = state.gen;
    var u = new SpeechSynthesisUtterance(item.example);
    u.lang = state.voice ? state.voice.lang : def.bcp47[0];
    if (state.voice) u.voice = state.voice;
    u.rate = state.slow ? 0.7 : 0.9; u.pitch = 1; u.volume = 1;
    var started = false;
    u.onstart = function () { if (state.utter !== u) return; started = true; clearWatchdog(); setPlaying(n); };
    u.onend = function () { if (state.utter !== u) return; clearWatchdog(); setPlaying(null); };
    u.onerror = function (ev) {
      if (state.utter !== u) return;
      clearWatchdog(); setPlaying(null);
      var code = ev && ev.error;
      if (code && code !== 'interrupted' && code !== 'canceled') showNotice('err', '読み上げに失敗しました（' + code + '）。端末に【' + def.nameJa + '】の音声があるか確かめてください。' + howToAdd(def));
    };
    state.utter = u;                               // 参照を持つ（持たないと途中で止まるブラウザがある）
    setPlaying(n);                                 // 押した瞬間に光らせる（onstart が遅い端末がある）
    var go = function () {
      if (state.gen !== gen || state.utter !== u) return;
      try { if (synth.paused) synth.resume(); synth.speak(u); }
      catch (e) { setPlaying(null); showNotice('err', '読み上げを始められませんでした。もう一度押してください。' + (state.noVoice ? howToAdd(def) : '')); return; }
      // 鳴り始めない時の見張り（鳴らないのに光ったままにしない）
      state.watchdog = setTimeout(function () {
        if (state.utter !== u || started) return;
        var speaking = false; try { speaking = !!synth.speaking; } catch (e) { /* */ }
        if (speaking) return;
        setPlaying(null);
        showNotice('silent', '鳴りませんでした。もう一度押してください。音量と消音スイッチも確かめてください。' + (state.noVoice ? howToAdd(def) : ''));
      }, 2500);
    };
    if (wasBusy) setTimeout(go, 80); else go();    // 止めた直後の speak が落ちる端末があるので、鳴っていた時だけ少し待つ
  }

  function playFile(src, item, n, def) {
    if (!state.audioEl) state.audioEl = new Audio();
    var a = state.audioEl, gen = state.gen, fell = false;
    var fallback = function () {
      if (fell || state.gen !== gen) return; fell = true;
      showNotice('audiofail', '音声ファイルが読めないので、端末の読み上げで鳴らしました（' + src + '）。');
      speakItem(item, n, def, false);
    };
    a.onplay = function () { if (state.gen === gen) setPlaying(n); };
    a.onended = function () { if (state.gen === gen) setPlaying(null); };
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
    var wasBusy = false; try { wasBusy = !!(synth && (synth.speaking || synth.pending)); } catch (e) { /* */ }
    stopAll();                                     // 前の音声を止め、読み上げの列を空にしてから鳴らす（溜めない）
    if (item.audio) { playFile(item.audio, item, n, def); return; }
    speakItem(item, n, def, wasBusy);
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
      if (it.template && it.template !== it.example) html += '<span class="tpl">言い換えの型: ' + esc(it.template) + '（' + esc(p.ja) + '）</span>';
      html += SPEAKER_SVG;
      b.innerHTML = html;
      b.addEventListener('click', function () { play(p.n); });
      li.appendChild(b);
      $list.appendChild(li);
    });
    $langnote.textContent = def.note || '';
  }

  function setLang(code) {
    state.lang = code;
    try { localStorage.setItem('phrase30.lang', code); } catch (e) { /* プライベートモード等 */ }
    stopAll();
    hideNotice('');
    var tabs = $tabs.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].setAttribute('aria-selected', tabs[i].getAttribute('data-lang') === code ? 'true' : 'false');
    renderList();
    refreshVoices();
  }
  function setSlow(on) {
    state.slow = !!on; $slow.setAttribute('aria-pressed', state.slow ? 'true' : 'false');
    try { localStorage.setItem('phrase30.slow', state.slow ? '1' : '0'); } catch (e) { /* */ }
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function init(data) {
    state.data = data;
    var saved = null, slow = null;
    try { saved = localStorage.getItem('phrase30.lang'); slow = localStorage.getItem('phrase30.slow'); } catch (e) { /* */ }
    if (saved && data.languages.some(function (l) { return l.code === saved; })) state.lang = saved;
    setSlow(slow === '1');
    $loading.hidden = true;
    renderTabs();
    renderList();
    refreshVoices();
    if (synth && typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', refreshVoices);
    else if (synth) synth.onvoiceschanged = refreshVoices;
    $slow.addEventListener('click', function () { setSlow(!state.slow); });
    $noticeclose.addEventListener('click', function () { state.dismissed = state.noticeKey; hideNotice(''); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stopAll(); });
    window.addEventListener('pagehide', stopAll);
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
