# 周回1 judge の原文 — 2026-10-20（68/100・不合格・P0 2・P1 5）

# 周回1 judge 裁定 — phrase30-app（2026-10-20）

## ① 採点軸と点数（QUALITY_GATE.md「コード・スクリプト」の5軸）
| 軸 | 点 | 根拠（1行） |
|---|---|---|
| 要件適合 | 13/20 | 6言語×30・タブ・タップ再生・cancel→speak・差し替え口・公開は揃う。だがスマホで「見やすいカード」になっておらず、AC7 の文面が×、言語ごとの説明が画面に出ない |
| 正しさ | 11/20 | 段組み崩れ（画面写しで確認）。声の点数が name だけで Eddy（機械声）が選ばれた実績。speak 失敗時に光が残る。stopAll が utter を消さない。型の文法誤りが数件 |
| テスト | 12/20 | 9本＋点検2本は全部通るが、P0 の段組み崩れ・AC7 の文面・404 時の挙動を1本も捕まえていない。Chromium のみ |
| 保守性 | 15/20 | 小さく読みやすい。template/example/ja/audio の分離と件数点検は良い。.gitignore が差し替え口を塞ぐ、データの note とコードが食い違う |
| 安全性 | 17/20 | esc()・textContent・try/catch が行き届く。外部通信なし（確認済み）。audio 欄の外部URL検査が無い |
| **合計** | **68/100** | |

## ② 合否: **不合格**
- 85点未満／P0 2件／P1 5件／受入基準 8/9（AC7 ×）。実行テストは Chromium で 9/9 PASS（追加ゲートは満たす）。
- 統合後の集計（重複は1件に）: **P0 2・P1 5・P2 6（うち3件を修正リストに）**。棄却 6。

### 東条の P0 2件の裁定
- **AC6「リモート声＝外部通信」→ P2 に格下げ（修正リスト9で採用）**。理由: (1) v0.1 は Web Speech API の採用を明示しており、Chrome 内蔵の Google 声はブラウザの機能で、鍵・課金・ログインの一切が不要（AC6 の文言「外部の有料サービスへの通信」に当たらない）。(2) 送られるのはアプリ固有の公開済み30文で利用者データではなく、P0 定義の「データの事故」に当たらない。(3) リモート声を完全除外すると Windows Chrome 等でタイ語が無音になり、本来の目的（聞ける）を壊す。ただし v0.1 の「端末内にある音声から」に沿い、**ローカル声を優先し、リモートは最後の代用**にする。
- **AC8 未確認 → 棄却**。作る側が 07:09 に `HTTP/2 200` を確認し、検査官も独立に 200・4ファイルの cmp 一致を確認済み。東条は環境の都合で未確認だっただけで欠陥ではない。

## ③ 優先修正リスト（重要度順・10件）
1. **[P0] `/Users/omoya160/Kenta/dev/phrase30-app/style.css:29-37`** — `.num`/`.icon` が `grid-row` だけで `grid-column` が無く、Grid の自動配置で本文と訳が右端 28px の列に流れ 1〜2文字ずつ縦に折れる（`log/phrase30-en-390.png` で確認）。→ `.card .num{grid-column:1}` `.card .text,.card .ja,.card .tpl,.card .note{grid-column:2}` `.card .icon{grid-column:3}` を足す。`tests/app.spec.mjs` の AC5 に「1番カードの `.text` の幅 ≥ カード幅×0.6」を追加し、幅390の画面写しを撮り直して `log/` に置く。
2. **[P0] `app.js:61`** — 声の一覧が空の時の案内に言語名も設定手順も無く、「下の案内」が行き止まり（AC7 ×・検査官と使う人役が一致）。→ 文面を「端末の音声の一覧をまだ読み込めていません。カードを1回押すと読み込まれることがあります。それでも鳴らない時は【{nameJa}】の音声を端末に追加してください」にし、63-64行の iPhone/Android 手順を1つの関数に共通化して両方の案内から使う。手順の長文は `<details><summary>追加のしかた</summary>` で畳み（固定ヘッダーを占領しない）、nameJa は esc() を通す。試験 AC7b に `toContainText('英語')` と `toContainText('設定')`、AC7 に `toContainText('設定')` を追加。
3. **[P1] `app.js:19-26`** — 声の点数が `v.name` しか見ないため、この Mac の Chrome でスペイン語に Eddy（Eloquence の機械声）が選ばれた（`docs/loop/round-1/probe-mac-chrome.md`・3者一致）。→ 判定文字列を `(v.name+' '+(v.voiceURI||'')).toLowerCase()` にし、減点に `/eloquence|^(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/`（-10）と `/compact/`（-3）を足す。`scripts/probe-voices.mjs` を再実行して6言語の選ばれた声を probe-mac-chrome.md に追記。
4. **[P1] `app.js:108-126`** — `synth.speak(u)` が例外を投げる／無言で何も起きない時、カードが光ったままで案内も出ない（reviewer・使う人役・東条が一致）。→ speak を try/catch（失敗時 `setPlaying(null)`＋案内）。speak 直後に 1.5秒の見張りタイマーを1本置き、`state.utter===u && !synth.speaking && !synth.pending` なら `setPlaying(null)` にして「鳴らない時はもう一度押してください。音量と消音スイッチも確かめてください」を #notice に出す。onstart/onend/onerror で clearTimeout し、onstart が後から来たらその案内を消す。
5. **[P1] `data/phrases.json:73`＋タイ語の例文、`index.html`/`app.js`** — タイ語に丁寧語の粒子が無く、`languages[].note` は画面のどこにも出ず、note の文面も質問文では誤り（ค่ะ→คะ）（3者一致）。→ (a) タブの下に `<p id="langnote">` を足し、setLang/init で選択言語の note を textContent で1行（12px）表示。(b) 6言語分の note を利用者向けに書き直す（例 th:「例文は男性の ครับ 形。女性は質問なら คะ、それ以外は ค่ะ に替える」、zh:「普通話（簡体字）」、en:「NZ の声が端末にあれば優先」）。(c) 店・初対面で使う 1,2,7,20,21,27,28,29,30 のタイ語 example/template 末尾に ครับ を足す。
6. **[P1] `.gitignore:14-16`／`app.js:84-99`** — 音声ファイルの差し替え口（AC9）が `*.mp3` 等で git から外れ公開版で 404 になり、読めない時に読み上げへ戻らず、stopAll が `state.utter` を空にしないため旧 utterance の遅延イベントが音声ファイル再生中の光を消す（reviewer・東条が一致・再現あり）。→ `.gitignore` に `!audio/**` を足し README に置き場 `audio/<lang>/NN.mp3` を書く。`stopAll` に `state.utter = null;` を足す。読み上げ部分を `speakItem(item, def, n)` に切り出し、playFile の catch と onerror から `audio` を無視して speakItem に戻し「ファイルが読めないので端末の読み上げで鳴らしました」と案内。試験: AC9 に「audio が 404 の時 speak が1回呼ばれる」を追加。
7. **[P1] `data/phrases.json`** — 型（template）と例文の文法・自然さ（複数レビュアー一致分のみ。採否は下の「訳の裁定」）。→ ko n18「수영할 줄 알아요?」＋型「〇〇할 줄 알아요?」／ko 型 n9「왜 〇〇을/를 공부해요?」 n10「〇〇아/어서요.」 n13「〇〇아/어 본 적 있어요?」 n17「'〇〇'이/가 무슨 뜻이에요?」 n30「〇〇아/어 주시겠어요?」／zh n24 型「哪个〇〇？」・n22「我想去火车站。」／ru n11「Как давно вы учите русский?」（型も давно）・n14「Можно сделать фото?」・n28「Мне вот это, пожалуйста.」・型 n22「Я хочу поехать в/на 〇〇.」・n8 の note に「〇〇には по-русски のような副詞形が入る」／th n3「บ้านคุณอยู่ที่ไหน」・n12「เวลาว่างชอบทำอะไร」（ja「暇なときは何をするのが好きですか？（趣味は？）」）／en n4 note「NZでよく聞く形」。終わったら `node scripts/check-data.mjs`。
8. **[P2] `app.js:28`** — 除外が `/^(zh-hk|yue)/` の先頭一致だけで `zh-Hant-HK`（広東語）を拾い、データの「zh-TW は使わない」ともコードが食い違う（reviewer・東条一致）。→ avoid を `/hk|yue/`（広東語だけ除外。台湾の声は無音よりましなので最後の代用として許す）にし、data の note を「普通話の声が無ければ台湾の声で代用」に揃える（項目5(b)と同時）。
9. **[P2] AC6 補強（東条 P0 の格下げ採用）`app.js:24`／`scripts/check-data.mjs`／README** — リモート声が「natural」の加点で端末内の声に勝ち得る。audio 欄に外部URLが入っても検査が無い。→ voiceScore の `localService` を `+20`（ローカル声が常に先・リモートはローカルが無い時だけ）。check-data.mjs に「audio は空か、`^(https?:)?//` で始まらない相対パスだけ」を追加。README「既知の制約」に「Chrome 内蔵の Google 声では読み上げ時にブラウザが Google と通信することがある（鍵・課金・ログイン不要）」を1行。
10. **[P2] 細部4点（各1行）** — `app.js:107` を `if (state.voices.length === 0 || state.noVoice) refreshVoices();`（iOS で voiceschanged が来ない時の再取得・東条）／`app.js:184` の隣に `window.addEventListener('pagehide', stopAll);`（東条）／`index.html:14` の nav に `role="tablist"`（reviewer）／`scripts/check-data.mjs:27-28` を `x.template &&`・`x.example &&` で守る（reviewer）。

付記（修正ではなく報告・紙の話）: 納品報告には「自動試験は Chromium のみ・iPhone/Android 実機は未確認・訳はネイティブ未検品」を未確認項目として明記する（v0.1「動作確認した端末・言語と未確認項目」）。`docs/会議の紙.md` AC7 の確認方法は検査官の案（「#notice に言語名と『設定』が含まれる」）に書き直してよい。直し後は Playwright 全通過の記録を LOOP_LOG に残す。

### 訳の裁定（言語ごと・採る／採らない）
- **英語**: 採る＝n4 note「一番」→「よく聞く形」のみ。採らない＝n15/n24/n27/n28（今の形が自然で訳も合う。n24/n27 の型とのずれは6言語で一貫した設計）
- **中国語**: 採る＝n24 型「哪个〇〇？」・n22「火车站」。採らない＝n28/n29 の丁寧化（我要这个・买单 は店で普通）
- **韓国語**: 採る＝n18 分かち書き＋型の助詞・活用（n9/10/13/17/18/30）。採らない＝-시- への統一（note の「〜요」方針どおり・単独 Medium）・n24
- **スペイン語**: 採らない（tú 方針は一貫。n13/14/23/24/27 は好みの範囲で単独指摘）
- **ロシア語**: 採る＝n11 давно・n14 сделать фото・n28 Мне вот это・型 n22 の前置詞・n8 の副詞形 note。採らない＝n4/n24/n27
- **タイ語**: 採る＝ครับ（9文）・note 直し・n3・n12。採らない＝n29 の語の差し替え（เช็คบิล は通用・粒子だけ足す）・n24/n27

### 棄却した指摘（理由1行）
- 東条 P0-2 AC8 未確認: 作る側と検査官が独立に 200 を確認済み
- 東条 P2-1 長文分割: 30文は全部短く該当しない
- 東条 P1-7 モックの深さ: 価値はあるが今周は項目1・2・6 の試験追加で十分
- 使う人役 P1-3 読み仮名: 会議の紙で「ベータでは出さない」と決定済み → Idea
- 使う人役 P1-6/7/8（くり返し・PWA・オフライン・続ける仕掛け）: 要件の外 → Idea
- reviewer P2-10 WebKit 試験: 今周は報告に「Chromium のみ」と書けば足りる → Experiment

## ④ Idea／Experiment 候補
**Idea候補（要件の外・次版）**
- くり返し道具（カードごと3回・30文連続・ゆっくり0.7倍）— 「繰り返し聞くことが最重要」に一番効く（使う人役）
- 読み（ピンイン・ローマ字・カナ）の表示切替（使う人役。会議の紙で見送り済み）
- 声を本人が選ぶ（声1/2/3）＋「もっと自然な声の入れ方」案内（使う人役）
- PWA（manifest・アイコン・オフライン）／最後に押したカードへ戻る・聞いた回数（使う人役）
- 小見出し（自己紹介/質問/旅行と店）・初回に言語を選ばせる・「型」の呼び名と note の字を大きく・「声: Karen (en-AU)」を日常語に（使う人役）
- 30文の外（ありがとう・こんにちは・日本から来ました）— Kenta の判断（使う人役）
- 言語別の許可声リストと順位（東条 P2-2）

**Experiment候補（Evidence C・実機で確かめてから）**
- cancel() 直後の speak() が iPhone Safari／Android Chrome の連打で無音になるか（東条 P1-1・使う人役・reviewer、全員 C）。鳴らなければ 50〜100ms 遅らせる経路を足す（iOS のユーザー操作制約に注意）。項目4 の見張りで症状は軽減される
- iPhone の消音スイッチで読み上げが消えるか（reviewer・使う人役）
- iPhone Safari・Android Chrome で6言語の選ばれる声（#voiceinfo）を撮って記録 — 納品報告の「確認した端末・言語」にそのまま使う
- Playwright に WebKit project（`npx playwright install webkit`）を足す（reviewer）

## ⑤ 判定理由（3行）
1. 音声の土台・180件のデータ・公開は要件どおり動くが、CSS Grid の列指定漏れでスマホの一覧が読めない見た目になっており、「スマホで見やすいカード」という目的を外している（P0・画面写しで自分でも確認）。
2. AC7 は検査官の×が妥当（声の一覧が空の時の案内に言語名も設定手順も無い）で、受入基準 100% を満たさない。
3. P1 5件はいずれも複数レビュアーが独立に一致し、修正は小さい（CSS 3行・try/catch と見張り1本・note 表示1行・.gitignore 1行・データ編集）。周回2で 85 点到達は現実的。

関連ファイル: /Users/omoya160/Kenta/dev/phrase30-app/style.css, /Users/omoya160/Kenta/dev/phrase30-app/app.js, /Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json, /Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs, /Users/omoya160/Kenta/dev/phrase30-app/.gitignore, /Users/omoya160/Kenta/dev/phrase30-app/scripts/check-data.mjs, /Users/omoya160/Kenta/dev/phrase30-app/docs/会議の紙.md
