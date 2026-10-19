# 周回1 構造の読み手（reviewer）の原文 — 2026-10-20（P0 1・P1 4・P2 5）

phrase30-app レビュー結果（読むだけ・変更なし）

P0が1件、P1が4件、P2が5件です。各指摘は「場所・何が問題か・直し案」の順に書いています。

対象（全文を読んだ）:
- /Users/omoya160/Kenta/dev/phrase30-app/index.html
- app.js
- style.css
- data/phrases.json
- scripts/check-data.mjs、check-no-external.mjs、probe-voices.mjs
- tests/app.spec.mjs
- playwright.config.mjs
- README.md
- 要件の原文と docs/会議の紙.md
- 参考に見たもの: log/*.png（画面写し）、test-results/、.gitignore

====================
■ P0（致命）
====================

【1】カードの段組みが壊れている
Finding: 本文と日本語訳が、カード右端の28px幅の列に押し込まれています。そのため1〜2文字ずつ縦に折り返し、英語は単語の途中で切れます。
Severity: P0
Confidence: High
Evidence: A
- 画面写しで確認できる: /Users/omoya160/Kenta/dev/phrase30-app/log/phrase30-en-390.png では「Wha / t's / yo / ur / na / m / e?」と縦に折れ、カード1枚が画面の約4割を占めている。タイ語版（phrase30-th-390.png）も同じ。
- 原因: style.css:29 で列を `grid-template-columns:34px 1fr 28px` と決めているが、:32 の `.num` と :37 の `.icon` は行（`grid-row:1/4`）しか指定していない。CSS Grid の自動配置は「行だけ決まった項目」を先に置く。その結果 .num が1列目、.icon が2列目（本来は本文用の1fr列）を取り、残りの .text / .ja / .tpl / .note が空いている3列目（28px）に流れ込む。
- 試験が見逃している: 今の AC5 の試験（tests/app.spec.mjs:96-110）は「高さ44px以上」と「横スクロール無し」しか見ないので、この崩れを通してしまう。要件の「スマホで見やすいカード/ボタン一覧」を満たしていない。
場所: /Users/omoya160/Kenta/dev/phrase30-app/style.css:29,32-37、/Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs:96-110
Recommendation:
- 列を明示する: `.card .num{grid-column:1}`、`.card .text,.card .ja,.card .tpl,.card .note{grid-column:2}`、`.card .icon{grid-column:3}`
- AC5 の試験に、1番のカードの `.text` の幅がカード幅の6割以上であること（または `.text` の右端が `.icon` の左端より左にあること）の確認を足す。
- 直した後に幅390pxの画面写しを撮り直して目で確かめる。

====================
■ P1（重要）
====================

【2】読み上げが無言で失敗すると、カードが光ったままで案内も出ない
Finding: 読み上げが無言で失敗したとき、カードが「再生中」の光り方のまま残り、案内も出ません。
Severity: P1
Confidence: Medium
Evidence: A＋C
- A（コード）: app.js:123 で speak の前に setPlaying(n) を呼んでいる。光を消すのは onend / onerror（:113-121）か、次のタップの stopAll だけ。一定時間たっても鳴らない時に光を消す仕掛け（時間切れの見張り）が無い。
- C（端末で起きるか）: cancel の直後の speak が無視される場合や、speechSynthesis はあるのに何も起きないアプリ内ブラウザでは、onstart / onend / onerror のどれも来ない可能性がある。
- 試験で拾えない: 試験用の差し替え（tests/app.spec.mjs:18-20）は必ず onstart と onend を返すので、この経路は試験されていない。
- 再現手順（要実機）: iPhone の Safari でカードを素早く連打する、またはアプリ内ブラウザで開く → 鳴らないのに光ったままになるか確かめる。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:108-126
Recommendation:
- speak の直後に見張りのタイマーを1本置く。例: 1.5秒後に `state.utter===u && !synth.speaking && !synth.pending` なら setPlaying(null) にして、「鳴らない時はもう一度押してください。音量と消音スイッチも確かめてください」と出す。
- onstart / onend / onerror ではこのタイマーを clearTimeout する。

【3】声の選び方が名前の文字だけを見ている
Finding: 「自然な声を優先」の判定が声の名前（name）だけを見ているため、iPhone で機械っぽい声を選ぶおそれがあります。
Severity: P1
Confidence: Medium
Evidence: C（実機での確認が必要）
- app.js:19-26 の voiceScore は v.name しか見ていない。
- iOS の Safari では、声の質の区別（compact / enhanced / premium）や Eloquence 系の機械的な声（Eddy・Flo・Grandma・Grandpa・Reed・Rocko・Sandy・Shelley）は、name ではなく voiceURI 側（`com.apple.voice.compact.…`、`com.apple.eloquence.…`）に出ると理解している。name は「Eddy (Spanish (Spain))」のような形。
- その場合、減点（-10）も加点（+5）も効かずに同点になり、getVoices の並び順で先頭の声が選ばれる。西・韓・中で機械声を選ぶおそれがある。
- scripts/probe-voices.mjs は Mac の Chrome でしか確かめていない。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:19-26
Recommendation:
- 判定の対象を `(v.name+' '+(v.voiceURI||'')).toLowerCase()` にする。
- 減点: `/eloquence/` と、名前の形 `/^(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley) \(/` を -10。`/compact/` は -1。
- 加点: `/premium|enhanced/` を +5。
- iPhone 実機で6言語それぞれに選ばれた声（画面の #voiceinfo に出る）を記録し、報告の「確認した端末」に書く。

【4】タイ語の丁寧語が例文に無く、言語ごとの説明も画面に出ない
Finding: タイ語の丁寧な文末の語（ครับ／คะ）が例文に付いていません。その説明は data に書いてあるのに画面に出ず、説明文自体も質問文については誤りです。
Severity: P1
Confidence: High
Evidence: A
- data/phrases.json:73 の説明: 「丁寧に言うときは文末に ครับ（男性）／ค่ะ（女性）を付ける。例文は付けていない」
- 説明が誤り: タイ語30文の大半は質問。女性が質問するときの文末は ค่ะ ではなく คะ。
- 画面に出ない: app.js は言語ごとの説明（languages[].note）をどこでも表示していない（使っているのは name / nameJa / bcp47 だけ。:16, 63, 135, 149）。韓国語（당신 を避ける）、スペイン語（tú の形）、ロシア語（вы の形）の説明も同じく出ない。
- 影響: 初対面の相手や店員に、文末の語なしで คุณชื่ออะไร・เอาอันนี้・เช็คบิลด้วย と言うと、ぶっきらぼうに聞こえる。要件の「必要に応じ説明を付ける」が実質できていない。
場所: /Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:40,53,63,73、/Users/omoya160/Kenta/dev/phrase30-app/app.js:52-71
Recommendation:
- (1) 言語ごとの説明を、タブの下に1行で表示する。
- (2) タイ語の説明を次のように直す: 「丁寧に言うときは文末に、男性は ครับ、女性は質問なら คะ・それ以外は ค่ะ（例: คุณชื่ออะไรครับ／คะ）」
- (3) 店や初対面で使う文（1, 2, 7, 20, 21, 27, 28, 29, 30）には、各項目の説明に「＋ครับ／คะ」を添える。

タイ語の個別の直し:
- n3「คุณอยู่ที่ไหน」: 「今どこにいるの？」の意味にも取れる。→「บ้านคุณอยู่ที่ไหน」、旅行者の滞在先を聞くなら「คุณพักอยู่ที่ไหน」
- n12「งานอดิเรกของคุณคืออะไร」: 教科書調。英・中・西は「暇なとき何する？」に寄せている。→「เวลาว่างชอบทำอะไร」、日本語訳は「暇なときは何をするのが好きですか？（趣味は？）」
- n29「เช็คบิลด้วย」: 正書法の綴りは「เช็กบิล」。ただし เช็ค の綴りも広く使われているので、直すかは任意。

【5】将来の音声ファイル差し替え口（AC9）が .gitignore で塞がれている
Finding: 音声ファイルを置いても git に載らず、公開版では鳴りません。読めなかった時に端末の読み上げへ戻す仕組みも無い。
Severity: P1
Confidence: High
Evidence: A
- .gitignore:5-16 が `assets/`・`*.mp3`・`*.m4a`・`*.wav` を除外している。
- 試験が想定している置き場所は `audio/en/01.mp3`（tests/app.spec.mjs:144）。この形で置くと git に載らず、GitHub Pages では 404 になる。
- その時は app.js:98 で案内を出すだけで、端末の読み上げに戻らない。要件の「再生できない場合は適切な案内とフォールバック」に届いていない。
- 再現手順: audio/en/01.mp3 を置き、phrases.json の audio 欄にそのパスを入れて `git status` を見る → mp3 が出てこない。
場所: /Users/omoya160/Kenta/dev/phrase30-app/.gitignore:5-16、/Users/omoya160/Kenta/dev/phrase30-app/app.js:90-99
Recommendation:
- .gitignore に `!audio/**` を足し、README に「音声ファイルの置き場は audio/」と書く。
- playFile の catch で、audio 欄を無視して speak で読み上げ直し、「ファイルが読めないので端末の読み上げで鳴らしました」と案内する。

====================
■ P2（改善）
====================

【6】韓国語の訳
Finding: 丁寧さに段差があります。ほかに分かち書きの誤り1件、不自然な言い方1件、型の語尾の欠けがあります。
Severity: P2
Confidence: Medium（丁寧さ）／High（分かち書き）
Evidence: B
場所: data/phrases.json の n2, 3, 8, 9, 10, 13, 15, 18, 24, 30（ko）
Recommendation:
- 丁寧さを揃える: 7・20・25・30 は尊敬の -시- 付き。初対面の相手に聞く文もそれに揃える。日本語訳は今のままでよい。
  - n2「어디에서 왔어요?」→「어디에서 오셨어요?」
  - n3「어디에 살아요?」→「어디 사세요?」
  - n8「한국어 할 줄 알아요?」→「한국어 할 줄 아세요?」
  - n15「언제 여기 왔어요?」→「여기 언제 오셨어요?」
- n18「수영 할 줄 알아요?」→「수영할 줄 알아요?」（수영하다 は1語なので続けて書く。n8 の「한국어 할」は別の語なので空けて正しい）
- n24「어느 버스를 타야 해요?」→「몇 번 버스 타야 돼요?」（韓国では路線番号で聞くのが普通）。型も「몇 번 〇〇 타야 돼요?」に。
- 型の語尾: n9「〇〇를」→「〇〇을/를」、n10「〇〇서요」→「〇〇아/어서요」、n13「〇〇 본 적」→「〇〇아/어 본 적」、n30「〇〇 주시겠어요」→「〇〇아/어 주시겠어요」

【7】スペイン語・ロシア語の訳
Finding: 店の場面での丁寧さの段差、型と例文の語順のずれ、不自然な言い方が数件あります。
Severity: P2
Confidence: Medium
Evidence: B
場所: data/phrases.json の es n13・n27、ru n4・n11・n14・n28
Recommendation:
- es n27「¿Qué me recomiendas?」: 店員に tú を使っている。n19「¿Tienen wifi?」は店に ustedes なので、店の場面で揃っていない。→「¿Qué me recomienda?」
- es n13: 型「¿Has 〇〇 alguna vez?」と例文「¿Has estado alguna vez en Japón?」で語順が違う。→ 型を「¿Alguna vez has 〇〇?」、例文を「¿Alguna vez has estado en Japón?」に。
- ru n11「Как долго вы учите русский?」→「Как давно вы учите русский?」または「Сколько вы уже учите русский?」
- ru n28「Это, пожалуйста.」→「Мне вот это, пожалуйста.」
- ru n14「Можно сфотографировать?」: 撮る対象が抜けた形。→「Можно сделать фото?」。その場所で撮影してよいかを聞くなら「Здесь можно фотографировать?」
- ru n4「Как дела?」→「Как у вас дела?」（вы の形にする方針と揃える。任意）

【8】英語（NZ）・中国語の細部
Finding: 根拠の無い最上級の説明が1件、教科書調の言い方、型として成り立たない形があります。
Severity: P2
Confidence: Medium
Evidence: B
場所: data/phrases.json の en n4・n15・n26・n28、zh n22・n24
Recommendation:
- en n4 の説明「ニュージーランドで一番よく聞く形」: 裏付けが無い。→「NZでよく聞く形」
- en n15「When did you come here?」: 教科書調。→ 着いた時を聞くなら「When did you get here?」（日本語訳「いつ着いたんですか？」）、移り住んだ時なら「When did you move here?」
- en n28「I'll have this, please.」→「I'll have this one, please.」
- en n26: 説明に「NZ・英では What's the time? もよく使う」を足す（任意）。
- zh n24 の型「哪〇〇？」: 量詞が無く、型として成り立たない。→「哪个〇〇？」（例文の 哪路车 はそのままでよい）
- zh n22「我想去车站。」: 駅にもバス停にも取れる。ロシア語 вокзал・タイ語 สถานีรถไฟ に揃えるなら「我想去火车站。」
- 他の英語・中国語の文は自然で、日本語訳とのずれも見当たらない。

【9】コードの細部
Finding: 説明とコードの食い違い、光が消える不具合、鳴らない時の案内不足、ARIA の誤用があります。
Severity: P2
Confidence: High（a, b, d）／Low（c）
Evidence: A（a, b, d）／C（c）
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:28,32,38,84-88,132、/Users/omoya160/Kenta/dev/phrase30-app/index.html:14,23
Recommendation:
- (a) 台湾の声: app.js:28 で除外しているのは zh-HK / yue だけ。:32 と :38 では zh-TW（台湾の声）も拾うので、data:30 の「台湾の声は使わない」と食い違う。→ 説明を「普通話の声が無ければ台湾の声で代用」に直す（鳴らないよりは良い）。代用しないなら除外に `zh-tw|zh-hant` を足す。
- (b) 光が消える: stopAll が state.utter を空にしない。読み上げ中に音声ファイル入りのカードを押すと、止めた読み上げの onend / onerror が後から届き、`state.utter===u` の確認を通ってしまう。その結果、鳴っている音声ファイルのカードの光が消える。→ stopAll に `state.utter=null;` を足す。
- (c) 鳴らない時の案内: 「音量・消音スイッチ」の案内がどこにも無い。要件の「音質や再生を保証しない」旨の表示も無い。→ フッター（index.html:23）に「声の有無・質は端末によって違います。鳴らない時は音量と消音スイッチを確かめてください」を足す（iOS の消音スイッチで読み上げが消えるかは実機で要確認）。
- (d) ARIA: 親の nav に role="tablist" が無いまま、子のボタンに role="tab" を付けている（index.html:14、app.js:132）。→ nav に role="tablist" を付ける。

【10】試験と確かめ方の穴
Finding: iPhone 実機と同じ WebKit では試験しておらず、全部通った記録も残っていません。
Severity: P2
Confidence: High
Evidence: A
- playwright.config.mjs:9,15 は、Chrome に iPhone の名乗り（UA）をさせているだけで、中身は Chromium。会議の紙の AC5 は「Playwright iPhone 13 の設定」（＝WebKit）。
- test-results/ に残っている最後の記録は、AC1 が「Test timeout of 30000ms exceeded while setting up "page"」で落ちたもの。全部通った記録が無い。
- scripts/check-data.mjs:27-28 は、template か example が欠けると TypeError で落ち、問題の一覧（:25）を出せない。
場所: /Users/omoya160/Kenta/dev/phrase30-app/playwright.config.mjs:9,15、/Users/omoya160/Kenta/dev/phrase30-app/test-results/、/Users/omoya160/Kenta/dev/phrase30-app/scripts/check-data.mjs:27-28
Recommendation:
- WebKit の試験を足す: `projects:[{name:'webkit-iphone',use:{...devices['iPhone 13']}}]`（`npx playwright install webkit` が要る）。足さない場合は、報告に「Chromium でのみ試験」と書く。
- 試験を全部通してから「完成」と書く。
- check-data は `x.template &&` と `x.example &&` で守る。
- AC8（公開）はまだ公開前なので、今は確認できない。

====================
良い点
====================
1. 文字列の扱いが安全: data の文字列はすべて esc() を通してから HTML に入れ、案内は textContent で出しているので、悪意ある文字列が混ざっても動かない。localStorage も読み書きの両方を try/catch で守っている。
2. 読み上げの土台が丁寧: 止めてから鳴らす順番（cancel→speak）、読み上げ中の参照を持ち続けること（途中で止まる対策）、古い読み上げのイベントを無視する確認（`state.utter===u`）、interrupted / canceled を誤りとして扱わないこと、画面が隠れたら止めること（visibilitychange）、一覧が空ならタップ時に読み直すこと、がそろっている。要件にない汎用化（過剰設計）も見当たらない。
3. データの設計: template（型）/ example（読む文）/ ja（訳）/ audio（音声ファイル）を分けて持ち、件数の点検（6 / 30 / 180、対象0件なら exit 2）がある。訳も教科書調を避けている（你好吗→最近怎么样、What are your hobbies→What do you do for fun、당신 の代わりに 민수 씨는요）。

====================
総評（他のレビュアーの出力は見ていない前提）
====================
1. 音声の土台と180件のデータは、要件と AC1〜4・6・7・9 の機械の基準を概ね満たしており、訳の質も全体として高い。
2. ただしカードの段組みが壊れていて、本文が28pxの列で1〜2文字ずつ折れている。「スマホで見やすい一覧」という目的を満たしておらず、今の試験はこれを通してしまう（P0）。
3. 段組みの修正と試験の追加を最優先にし、次にタイ語の丁寧語と言語ごとの説明の表示、iPhone 実機での声の選ばれ方と「鳴らないのに光ったまま」の対策、audio 欄の .gitignore 除外の解除を進めるのがよい。
