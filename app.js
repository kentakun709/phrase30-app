/* 30フレーズ音声アプリ（ベータ）。登録・課金・外部APIなし。音声は端末の Web Speech API。
   data/phrases.json の各項目に audio（ファイルのパス）が入っていれば、読み上げの代わりにそれを鳴らす（将来の差し替え口）。 */
(function () {
  'use strict';
  var synth = window.speechSynthesis || null;
  var state = { data: null, lang: 'en', voices: [], voice: null, playing: null, utter: null, audioEl: null, noVoice: false };
  var $tabs = document.getElementById('tabs');
  var $list = document.getElementById('list');
  var $notice = document.getElementById('notice');
  var $voiceinfo = document.getElementById('voiceinfo');
  var $loading = document.getElementById('loading');

  var SPEAKER_SVG = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';

  function normLang(l) { return String(l || '').replace(/_/g, '-').toLowerCase(); }
  function langDef() { for (var i = 0; i < state.data.languages.length; i++) if (state.data.languages[i].code === state.lang) return state.data.languages[i]; return state.data.languages[0]; }

  // 自然な声を優先する点数（名前の手がかりだけ。端末ごとの名前は保証されない）
  function voiceScore(v) {
    var n = String(v.name || '').toLowerCase(), s = 0;
    if (/compact|eloquence|espeak|novelty|whisper|bells|bubbles|organ|cellos|zarvox|trinoids|boing|bad news|good news|jester|wobble|albert|fred|junior|ralph|kathy/.test(n)) s -= 10;
    if (/premium|enhanced|neural|natural|siri|wavenet|journey|studio/.test(n)) s += 5;
    if (v.default) s += 1;
    if (v.localService) s += 1;
    return s;
  }
  function pickVoice(def, voices) {
    var avoid = def.code === 'zh' ? /^(zh-hk|yue)/ : /^$/;
    var prefs = def.bcp47.map(normLang), i, cands;
    for (i = 0; i < prefs.length; i++) {
      var p = prefs[i];
      cands = voices.filter(function (v) { var l = normLang(v.lang); return l === p || l.indexOf(p + '-') === 0; });
      cands = cands.filter(function (v) { return !avoid.test(normLang(v.lang)); });
      if (cands.length) { cands.sort(function (a, b) { return voiceScore(b) - voiceScore(a); }); return cands[0]; }
    }
    // 地域が違っても同じ言語なら使う（例: 英語で en-NZ が無く en-IN だけ、など）
    var bases = {}; prefs.forEach(function (p) { bases[p.split('-')[0]] = 1; });
    cands = voices.filter(function (v) { var l = normLang(v.lang); return bases[l.split('-')[0]] && !avoid.test(l); });
    if (cands.length) { cands.sort(function (a, b) { return voiceScore(b) - voiceScore(a); }); return cands[0]; }
    return null;
  }

  function refreshVoices() {
    if (!synth) return;
    try { state.voices = synth.getVoices() || []; } catch (e) { state.voices = []; }
    var def = langDef();
    state.voice = pickVoice(def, state.voices);
    state.noVoice = !state.voice;
    renderVoiceState();
  }

  function renderVoiceState() {
    var def = langDef();
    if (!synth) {
      show($notice, 'このブラウザは読み上げ（Web Speech API）に対応していません。iPhone の Safari か Android の Chrome で開いてください。');
      $voiceinfo.textContent = '';
      return;
    }
    if (state.noVoice) {
      if (state.voices.length === 0) {
        show($notice, '端末の音声の一覧をまだ読み込めていません。カードを1回押すと読み込まれることがあります。それでも鳴らない時は、下の案内のとおり音声を追加してください。');
      } else {
        show($notice, 'この端末には【' + def.nameJa + '】の音声が入っていません。押しても鳴らないか、別の言語の声で読まれることがあります。' +
          ' iPhone: 設定 → アクセシビリティ → 読み上げコンテンツ → 声 → ' + def.nameJa + ' を追加。Android: 設定 → 言語と入力 → テキスト読み上げ → Google の音声で ' + def.nameJa + ' をインストール。');
      }
      $voiceinfo.textContent = '';
    } else {
      $notice.hidden = true; $notice.textContent = '';
      $voiceinfo.textContent = '声: ' + state.voice.name + ' (' + state.voice.lang + ')';
    }
  }
  function show(el, text) { el.textContent = text; el.hidden = false; }

  function setPlaying(n) {
    state.playing = n;
    var cards = $list.querySelectorAll('.card');
    for (var i = 0; i < cards.length; i++) {
      var on = Number(cards[i].getAttribute('data-n')) === n;
      cards[i].classList.toggle('playing', on);
      cards[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function stopAll() {
    if (synth) { try { synth.cancel(); } catch (e) { /* 端末差で例外になることがある */ } }
    if (state.audioEl) { try { state.audioEl.pause(); state.audioEl.currentTime = 0; } catch (e) { /* */ } }
    setPlaying(null);
  }

  function playFile(src, n) {
    if (!state.audioEl) { state.audioEl = new Audio(); }
    var a = state.audioEl;
    a.src = src;
    a.onplay = function () { setPlaying(n); };
    a.onended = a.onerror = a.onpause = function () { if (state.playing === n && (a.ended || a.paused)) setPlaying(null); };
    setPlaying(n);
    var p = a.play();
    if (p && typeof p.catch === 'function') p.catch(function () { setPlaying(null); show($notice, '音声ファイルを再生できませんでした: ' + src); });
  }

  function play(n) {
    var item = state.data.phrases[n - 1].langs[state.lang];
    var def = langDef();
    stopAll();                                   // 前の音声を止め、読み上げの列を空にしてから鳴らす（溜めない）
    if (item.audio) { playFile(item.audio, n); return; }
    if (!synth) { renderVoiceState(); return; }
    if (state.voices.length === 0) refreshVoices();   // iOS は最初の操作の後に一覧が入ることがある
    var u = new SpeechSynthesisUtterance(item.example);
    u.lang = state.voice ? state.voice.lang : def.bcp47[0];
    if (state.voice) u.voice = state.voice;
    u.rate = 0.9; u.pitch = 1; u.volume = 1;
    u.onstart = function () { if (state.utter === u) setPlaying(n); };
    u.onend = function () { if (state.utter === u) setPlaying(null); };
    u.onerror = function (ev) {
      if (state.utter !== u) return;
      setPlaying(null);
      var code = ev && ev.error;
      if (code && code !== 'interrupted' && code !== 'canceled') {
        show($notice, '読み上げに失敗しました（' + code + '）。端末に【' + def.nameJa + '】の音声があるか確かめてください。');
      }
    };
    state.utter = u;                             // 参照を持つ（持たないと途中で止まるブラウザがある）
    setPlaying(n);                               // 押した瞬間に光らせる（onstart が遅い端末がある）
    try { if (synth.paused) synth.resume(); } catch (e) { /* */ }
    synth.speak(u);
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
    state.data.phrases.forEach(function (p) {
      var it = p.langs[state.lang];
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'card'; b.setAttribute('data-n', String(p.n)); b.setAttribute('aria-pressed', 'false');
      var html = '<span class="num">' + (p.n < 10 ? '0' + p.n : p.n) + '</span>' +
        '<span class="text" lang="' + esc(langDef().bcp47[0]) + '">' + esc(it.example) + '</span>' +
        '<span class="ja">' + esc(it.ja) + '</span>';
      if (it.template && it.template !== it.example) html += '<span class="tpl">型: ' + esc(it.template) + '（' + esc(p.ja) + '）</span>';
      if (it.note) html += '<span class="note">' + esc(it.note) + '</span>';
      html += SPEAKER_SVG;
      b.innerHTML = html;
      b.addEventListener('click', function () { play(p.n); });
      li.appendChild(b);
      $list.appendChild(li);
    });
  }

  function setLang(code) {
    state.lang = code;
    try { localStorage.setItem('phrase30.lang', code); } catch (e) { /* プライベートモード等 */ }
    stopAll();
    var tabs = $tabs.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].setAttribute('aria-selected', tabs[i].getAttribute('data-lang') === code ? 'true' : 'false');
    renderList();
    refreshVoices();
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function init(data) {
    state.data = data;
    var saved = null;
    try { saved = localStorage.getItem('phrase30.lang'); } catch (e) { /* */ }
    if (saved && data.languages.some(function (l) { return l.code === saved; })) state.lang = saved;
    $loading.hidden = true;
    renderTabs();
    renderList();
    refreshVoices();
    if (synth && typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', refreshVoices);
    else if (synth) synth.onvoiceschanged = refreshVoices;
    document.addEventListener('visibilitychange', function () { if (document.hidden) stopAll(); });
  }

  // 試験と将来の差し替えのための小さな窓口（外部には何も送らない）
  window.phrase30 = { state: state, play: play, stopAll: stopAll, setLang: setLang, pickVoice: pickVoice };

  fetch('data/phrases.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(init)
    .catch(function (e) {
      $loading.textContent = 'データを読み込めませんでした（' + e.message + '）。file:// で開いている場合は、簡易サーバー（README）か公開URLで開いてください。';
    });
})();
