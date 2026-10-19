# 周回1 東条（Codex・codex-reviewer）の原文 — 2026-10-20（P0 2・P1 10・P2 2）

# Codex(東条) レビュー結果 — phrase30-app（AC1〜AC9・壊すテスト・180表現）

## 0. 実行環境の注記（橋渡し役の補足・レビュー内容ではない）
- Codex は最高モデル（gpt-5.6-sol / reasoning high、`-m` 指定なし）。3往復（初回レビュー → 実テスト結果を渡して判定更新）。
- **Codex のサンドボックス内では Chrome 起動が SIGABRT で拒否**され、Codex 自身の `npx playwright test` は 0 passed / 9 failed（全件 `browserType.launch` の基盤エラー・アサーション失敗ではない）。`-s danger-full-access` での再実行はこの環境の権限で拒否された。
- そのため **`npx playwright test` は橋渡し役が同じ Mac・同じ設定（channel:'chrome'・390×844・既存 http.server 8787 再利用）で実行 → 9 passed (32.2s)**。この生結果を Codex に渡して判定を更新させた（下の P0 確定版・D 更新版はそれを踏まえた Codex の結論）。
- **AC8（GitHub Pages の 200）は Codex（外部通信禁止）・橋渡し役（curl が権限で拒否）とも未確認。**
- Codex の破壊試験は Node 上で app.js を模擬 DOM／模擬 speechSynthesis で実行したもの。実 Chrome での破壊試験（連打・XSS 等）は Codex 側では実行できていない。
- ファイル変更なし（test-results/ への Playwright 出力のみ）。
- 原文: /private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/sol_review.md（初回）、同 /sol_review3.md（更新）

## A. 試験の実行結果
- `npm run check`（Codex 実行）: 終了コード 0
  - `言語 6/6・フレーズ 30/30・表現 180/180` / `○ check-data: 異常なし` / `点検したファイル 3/3` / `○ check-no-external: 外部通信・鍵・ログイン・課金なし`
- `npx playwright test`（橋渡し役がサンドボックス外で実行）: **9 passed / 0 failed (32.2s)**
  - AC1・AC2・AC3・AC4・AC5・AC7・AC7b・AC9・「言語の選択は次に開いた時も残る」すべて ✓
  - 注: AC9 テスト通過時、http.server ログに `GET /audio/en/01.mp3 → 404`（Codex 追加指摘 P1-9 参照）

## B. 指摘一覧（Codex 確定版）

### P0（出荷停止）
1. **AC6 不適合: リモート音声を選び得るため「外部通信なし」を保証できない**
   - 場所: app.js:19、app.js:34、scripts/check-no-external.mjs:6
   - 根拠: `localService` は加点1だけで、名前に `Natural` 等があるリモート声は加点5。Node 実測で `Google Natural (localService=false)` がローカル声に勝った。検査スクリプトも実行時 TTS 通信を検査しない
   - 直し案: AC6 を厳密適用するなら `localService !== false` の声だけを候補にする
2. **AC8 未確認: 公開 URL の HTTP 200 が出荷前に確認されていない**
   - 場所: docs/会議の紙.md:40
   - 直し案: 配信直後に外部通信可能な環境で `curl -sI https://kentakun709.github.io/phrase30-app/` を実行する
- （取り下げ）旧 P0「受入試験が全件未実行」→ サンドボックス外で 9/9 passed のため取り下げ
- （格下げ）旧 P0「`speak()` 同期例外が未捕捉」→ P1 へ（正式な声なしテストは通過。残るのは例外的な端末実装への防御不足）

### P1（出荷前に直す）
1. **`cancel()` 直後の同一タスク内 `speak()` は iOS Safari／Chrome で無音化する既知傾向**（AC3・AC4）
   - 場所: app.js:104、app.js:125
   - 根拠: cancel の内部処理が非同期の実装では直後の utterance まで取り消されることがある。現在は待ち時間ゼロ
   - 直し案: 世代トークンを持ち、再生中だった場合だけ 50〜100ms 後に最新 utterance を speak する経路へ変更
2. **iOS で `voiceschanged` が来ない場合、新規追加した対象言語声を再取得できない**（AC7）
   - 場所: app.js:107、app.js:182
   - 根拠: タップ時の再取得条件は「全 voice が 0 件」のみ。英語声はあるがタイ語声がない状態では `voiceschanged` が来ない限り更新されない
   - 直し案: `state.noVoice` 時もユーザータップごとに `refreshVoices()` する
3. **TTS から audio へ切り替えた後、旧 utterance の遅延イベントが再生表示を消す**（AC9・再生中表示要件）
   - 場所: app.js:84、app.js:105、app.js:114
   - 再現: TTS 再生 → audio 項目タップ → 旧 utterance の `canceled` を遅延発火 → audio の `playing=2` が旧イベントで `null` になった（音は鳴るが表示が消える）
   - 直し案: cancel 前に `state.utter=null` とし、旧イベントを無効化する
4. **`pagehide` で停止しない**（AC4）
   - 場所: app.js:184
   - 根拠: `visibilitychange` のみ。iOS Safari のページ遷移・BFCache では `pagehide` だけ通る場合がある
   - 直し案: `window.addEventListener('pagehide', stopAll)` を追加
5. **中国語 voice 除外が不完全**（AC3・AC7）
   - 場所: app.js:28、data/phrases.json:28
   - 根拠: `zh-HK` と `yue` しか除外しない。Node 実測で `zh-Hant-HK` を選択し、`zh-TW` 単独時も選択した。データ定義の「zh-TW は使わない」と不一致
   - 直し案: script/region を解析し、`HK`・`TW`・`Hant`・`yue` を普通話候補から除外する
6. **audio 欄の外部 URL を検査しない**（AC6・AC9）
   - 場所: app.js:93、scripts/check-no-external.mjs:6
   - 根拠: 検査対象が HTML/JS/CSS のみ。JSON の audio へ HTTPS URL が入ると外部通信できる。現データは全件空
   - 直し案: audio は空または同一オリジン相対パスだけ許可する検査を追加
7. **Playwright モックが `voiceschanged` と実際の cancel 競合を再現しない**（AC3・AC4・AC7）
   - 場所: tests/app.spec.mjs:18、tests/app.spec.mjs:21
   - 根拠: `addEventListener` は空実装。pending は全 utterance 共通の boolean で、旧タイマーが新 utterance を終了扱いにできる
   - 直し案: utterance ごとの状態、同期例外、遅延 cancel、voiceschanged 発火を持つモックを追加
8. **翻訳・テンプレートに意味ずれ、助詞・丁寧度の問題**（AC2 の品質要件）
   - 場所: data/phrases.json — 詳細は C。特に全言語 n24、4言語 n27、タイ語の丁寧粒子
9. **AC9 テストは「鳴る経路」しか検証せず、「実際に鳴る」ことは検証していない**（追加指摘）
   - 場所: tests/app.spec.mjs:137、app.js:97
   - 根拠: テストは `HTMLMediaElement.prototype.play` を「必ず成功する Promise」に置換。実ファイルが 404 でも `play()` 呼び出しだけで合格する（404 はアプリの欠陥ではなくテストの偽陽性要因）
   - 直し案: `audio/en/01.mp3` へ有効な短い音声を route.fulfill し、ネイティブ `play()` の成功と `ended` まで確認。併せて 404 時に案内が表示される失敗テストを追加
10. **`speechSynthesis.speak()` の同期例外が未捕捉**（AC7・旧 P0 から格下げ）
   - 場所: app.js:123、app.js:125
   - 再現: 声なし状態で `speak()` に例外を投げさせる → 例外がクリックハンドラ外へ伝播し、カードが再生中表示のまま残る
   - 直し案: `speak()` を try/catch し、失敗時に `setPlaying(null)` と案内表示

### P2（後で）
1. **Chrome の長文切断対策なし**（AC3）
   - 場所: app.js:108、app.js:125
   - 根拠: 単一 utterance をそのまま渡すため、約15秒超の長文が途中停止する既知傾向への分割・keepalive がない。現30文は短く直近影響は小
   - 直し案: 将来長文化する場合は文節分割して順次読み上げる
2. **声品質の同点時はブラウザ列挙順依存**（AC3）
   - 場所: app.js:19、app.js:34
   - 直し案: 許可するローカル声名と品質順位を言語別に定義する

### 指摘なし（指定論点のうち）
- user activation: UI 上の `speak()` はカードの click から同期的に到達（app.js:155）。初回操作前の自動再生なし
- utterance の GC: `state.utter` で参照保持（app.js:122）。audio 切替時の古い参照は P1-3
- 大文字小文字・`en_NZ`: `normLang()` が小文字化と `_`→`-` 変換（app.js:15）。Node 実測で選択成功
- `en-NZ→en-AU→en-GB→en-*`、`ko-KR`、`ru-RU`、`th-TH`、`es-ES→es-MX` の順序はデータ定義どおり

## B'. 破壊試験の結果（Codex・Node 模擬。実ブラウザ未実行）
| 項目 | 再現手順 | 実際に起きたこと | 直し案 |
|---|---|---|---|
| a 同じカード連打 | 100ms 間隔で n1 を10回 | cancel=10 / speak=10、終了後 pending=false | 指摘なし（実機未確認） |
| a 別カード連打 | n1/n2 交互に100ms 間隔で10回 | cancel=10 / speak=10、pending=false | 指摘なし（実機未確認） |
| b 再生中の言語切替 | n1 再生直後に中国語へ | speak→cancel→getVoices、pending=false、表示解除 | 指摘なし |
| c タブ高速切替 | 6言語を120回同期切替 | 例外なし、最後は英語、カード30枚、cancel 120回 | 指摘なし |
| d voices 空 | getVoices() を空配列 | 「音声の一覧をまだ読み込めていません」表示 | 指摘なし |
| d voiceschanged | 後から `en_NZ` 追加して発火 | `Late NZ` を選択、案内が消えた | 指摘なし（iOS で来ない場合は P1-2） |
| d 対象言語なし | 英語声だけでタイ語タップ | 案内後、voice なし・`th-TH` 指定で speak を呼ぶ | speak を try/catch、声なしなら再生しない |
| d speak() 例外 | speak が同期例外 | 例外が外へ伝播、再生中表示のまま | P1-10 |
| e XSS | name/nameJa/example/ja/template/note に `<script>`・`<img onerror>` | 生タグなし、`&lt;...&gt;` へ変換（textContent 経路） | 指摘なし（Node 描画実測・実ブラウザ未確認） |
| f localStorage 例外/null | getItem/setItem が例外、null | 初期化・切替とも例外なし | 指摘なし |
| g fetch 404 | HTTP 404 | 「データを読み込めませんでした（HTTP 404）」 | 指摘なし |
| g ネットワーク失敗 | fetch reject | `Failed to fetch` を画面表示 | 指摘なし |
| g JSON 壊れ | json() が SyntaxError | `Unexpected token` を画面表示 | 指摘なし |
| h visibilitychange | 再生中 hidden→visible | hidden 時に cancel・表示解除、復帰は停止状態 | 指摘なし |
| h pagehide | 静的解析 | リスナーなし | P1-4 |
- audio 経路: `audio/en/01.mp3` 設定時は cancel→audio.play、speechSynthesis.speak なし（Node 実測）

## C. 180表現のレビュー（n番号・言語・現状→直し案）
### 英語（NZ 向け `Sweet as`・`bill`・綴り・語彙は問題なし）
- n24: `Which 〇〇?` に対し例文 `Which bus should I take?` で意味が「どれに乗るべきか」へ変化 → `Which bus is it?`／ja「どのバスですか？」（phrases.json:1186）
- n27: `What do you recommend?` は料理に限定されず、原文と ja も一般化 → `What would you recommend from the menu?`／「メニューのおすすめは何ですか？」（:1330）
### 中国語
- n24: `哪〇〇？` は量詞がなく、例文 `我应该坐哪路车？` と構造・意味が不一致 → 量詞を含む型として明示（:1193）
- n28: `我要这个。` は他言語の please 相当より直接的 → `请给我这个。`（:1385）
- n29: `买单。` は命令的で丁寧度が低い → `麻烦买单。`（:1433）
### 韓国語
- n17: `'〇〇'이 무슨 뜻이에요?` は母音終わりなら `가` が必要 → `'〇〇'이/가 무슨 뜻이에요?`（:864）
- n18: `수영 할 줄 알아요?` は分かち書きが不自然 → `수영할 줄 알아요?`、型も `〇〇할 줄 알아요?`（:912）
- n24: 型 `어느 〇〇예요?` に対し例文 `어느 버스를 타야 해요?` が意味変化 → `어느 버스예요?`（:1200）
### スペイン語
- n14: `¿Puedo sacar una foto?` は中南米寄り。es-ES 優先なら → `¿Puedo hacer una foto?`（:728）
- n23: 型 `a 〇〇` と例文 `al aeropuerto` は冠詞縮約のため直接置換できない → 例を `¿Cómo llego a la estación?` にし `la estación` を入れられる形に（:1159）
- n24: `¿Qué 〇〇?` に対し `¿Qué autobús tengo que tomar?` が意味拡張 → `¿Qué autobús es?`（:1207）
- n27: `¿Qué me recomiendas?` は料理指定が消えている → `¿Qué plato me recomiendas?`（:1351）
### ロシア語
- n08: `Вы говорите по-〇〇?` は言語名をそのまま代入できず `русский→по-русски` の派生が必要 → 型に副詞形の注記（:446）
- n14: `Можно сфотографировать?` は他動詞で目的語がなく不完全 → `Можно здесь фотографировать?`（:735）
- n24: `Какой 〇〇?` に対し `На какой автобус мне сесть?` が意味拡張 → `Какой это автобус?`（:1214）
- n27: `Что вы посоветуете?` は料理に限定されない → `Какое блюдо вы посоветуете?`（:1358）
### タイ語
- n01〜30: 例文から丁寧粒子を一律省略しており他言語より丁寧度が下がる。メタ注記も女性形を常に `ค่ะ` としているが質問では通常 `คะ` → 男女で分けるか話者固定で質問 `ครับ/คะ`・平叙 `ครับ/ค่ะ` を付ける（:73）
- n03: `คุณอยู่ที่ไหน` は「今どこにいますか？」とも読め曖昧 → `คุณอาศัยอยู่ที่ไหน`（:213）
- n12: `งานอดิเรกของคุณคืออะไร` は会話では硬い → `เวลาว่างคุณชอบทำอะไร`（:645）
- n24: 型 `〇〇ไหน` に対し `ต้องขึ้นรถเมล์สายไหน` が意味拡張 → `รถเมล์คันไหน` 等（:1221）
- n27: `มีอะไรแนะนำไหม` は料理指定なし → `มีเมนูอะไรแนะนำไหม`（:1365）
- n28: `เอาอันนี้` は粒子なしでは直接的 → `ขออันนี้ครับ/ค่ะ`（:1413）
- n29: `เช็คบิลด้วย` → `คิดเงินด้วยครับ/ค่ะ`（:1461）

## D. AC1〜AC9 判定（Codex 更新版・実テスト 9/9 反映後）
| AC | 判定 | 根拠 |
|---|---|---|
| AC1 | 満たす | Chrome・390×844 で6タブ、各言語30項目の切替テスト成功 |
| AC2 | 満たす | 180件の必須欄検査と全言語の画面表示テスト成功（表現品質は C の修正要） |
| AC3 | 満たす | 同一カード再タップを含め speak の複数回呼び出しを確認（cancel 直後 speak の端末依存リスクは P1-1） |
| AC4 | 満たす | 各タップの cancel→speak 順と待機後 pending=false を確認 |
| AC5 | 満たす | 390px で横スクロールなし、カード・タブ 44px 以上を実測 |
| AC6 | **満たさない** | 明示的外部 URL はないが、リモート Web Speech 音声を選択できる（P0-1） |
| AC7 | 満たす | 対象声なし・voices 空の両テストで案内表示とエラーなし。同期例外防御は P1-10 |
| AC8 | **未確認** | GitHub Pages URL の HTTP 200 を未確認（P0-2） |
| AC9 | 満たす | audio 値あり時に audio.play へ進み speak を呼ばない経路を確認。実音声再生は未確認（P1-9） |

