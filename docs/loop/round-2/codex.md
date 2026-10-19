# 周回2 東条（Codex）の原文 — 2026-10-20（P0 2・P1 3・P2 3・試験10周 113/120）

Codex（東条・sol、gpt-5.6-sol high）周回2レビューの回収結果。以下は Codex の出力を要約せず構造だけ整えたもの。橋渡し役の補足は冒頭「0.」のみ。

## 0. 実行環境の注記（橋渡し役の補足・レビュー内容ではない）
- Codex のサンドボックスでは Chrome 起動不可のため、`npx playwright test`（12本）は橋渡し役が同じ Mac（channel chrome・390×844・http.server 8787）で実行し、生結果ファイルを Codex に渡して判定を更新させた。
- **実測: 全12本を10回まわして 7回は 12/12 passed、3回は落ちた**（run1: #11／run3: #9 AC9, #10 AC9b, #11, #12／run4: #11, #12）。追加で `--repeat-each 3`（#9〜#12）は 11/12（#11 が1回落ち）。
- 捕まえた失敗の中身（#11・毎回同じ）: `TypeError: Cannot read properties of null (reading 'languages')` at tests/app.spec.mjs:243（`page.goto('/')` 直後に `window.phrase30.state.data.languages` を読む → phrases.json の fetch 未完了で `state.data` が null）。#9/#10/#12 のエラー本文は記録できていない（再現率低）。
- Codex は `-s workspace-write`・cwd=scratchpad で実行（プロジェクト側は書き込み不可＝変更なし）。破壊試験の模擬ハーネスは /private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/codex-work/destructive-harness.cjs。Codex 出力原文は /private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/sol_review_r2.md。生の Playwright 結果は同 scratchpad の codex-work/playwright-raw-results.md。
- 他のレビュアーの出力（judge/reviewer/spec-checker/user-panel）は Codex に読ませていない（読むなと明示）。

---

# Codex(東条) 周回2 レビュー結果 — phrase30-app（HEAD=9bc0f18）

## 1. 試験結果

結論: 周回2は大幅改善したが、P0が2件残り、出荷合格にはできない。

- `npm run check`: **passed**。6言語・30フレーズ・180表現、外部URL検査とも正常。
- Playwright 10周: **113/120 passed**。7周は12/12、3周で計7失敗。追加反復は11/12。
- #11の3失敗は**テスト側の競合**。`page.goto()`直後、非同期fetch完了を待たず `state.data.languages` を読むため（tests/app.spec.mjs:243-245）。アプリ障害ではない。
- #9/#10各1回、#12は2回失敗したが、エラー本文がなく未切り分け。模擬試験では対応経路を再現できず、アプリ障害とは断定不可。trace付き再実行が必要。
- Mac Chrome実測は6言語すべて発声・終了○。
- AC8はURL記載のみ。こちらの確認はDNS解決不可だったためHTTP 200未確認。
- プロジェクト変更なし。検証用に destructive-harness.cjs を作成して実行。

## 2. 周回1指摘の ○×

- **P0-1 ×** app.js:43-47でBCP47優先枠ごとに即決するため、remote `en-NZ` がlocal `en-AU`より先に選ばれる。
- **P0-2 ×** 公開URLの記載はあるがHTTP 200の実測証拠なし。
- **P1-1 ○** app.js:103-145。`state.gen`と再生中のみ80ms待機を追加。
- **P1-2 ○** app.js:114。`noVoice`時もタップごとに声を再取得。
- **P1-3 ○** app.js:104-105、121-124。旧utteranceを無効化。
- **P1-4 ○** app.js:243。`pagehide`で`stopAll`。
- **P1-5 △** app.js:40-53。香港は除外したが、周回1で除外対象だった台湾声は最後の手段として残る。
- **P1-6 ○** scripts/check-data.mjs:33、check-no-external.mjs:15-18でaudio外部URLを拒否。
- **P1-7 ○** tests/app.spec.mjs:9-31。utterance単位の状態、遅延cancel、例外、voiceschangedを追加。
- **P1-8 △** 多くは修正済みだが、n27英語とスペイン語templateに残件。
- **P1-9 ○** tests/app.spec.mjs:207-237。実WAVの終了と404→TTSを検査。
- **P1-10 ○** app.js:133-134。`speak()`同期例外を捕捉。
- **P2-1 ×** 長文分割・keepaliveなし。
- **P2-2 ×** 同点時は依然として列挙順依存（app.js:38）。

## 3. 破壊試験の結果

| ケース | 操作 | 起きたこと | 判定 | 対応する指摘番号 |
|---|---|---|---|---|
| a | 発声中→同カード→40ms後に同／別カード | 最新タップだけ即時発声。古い80ms予約は`gen`で無効 | 期待どおり | ― |
| b | `onstart`を3秒遅延 | 2.5秒で失敗案内、その後発声して光るが案内は残留 | **壊れた** | P1-1 |
| c | 英語案内を閉じ、英語再試行→タイ語→英語 | 同じ英語案内は抑止、タイ語は再表示、英語へ戻ると抑止 | 期待どおり | ― |
| d | audio→TTS→audio連打 | 旧Audioをpause、旧TTSイベントを無視。二重再生なし | 期待どおり | ― |
| e | 声なし発声待ち中にvoiceschanged | `state.voice`は更新。進行中utteranceは不変で、次回タップから新声 | 期待どおり | ― |
| f | 80ms予約中にpagehide→復帰後タップ | 予約は無効化。復帰後の新しい発声は成功 | 期待どおり | ― |
| 追加g | Audioの`ended`後に`error` | 終了済みなのにTTS fallbackが始まる | **壊れた** | P2-1 |
| 追加h | remote en-NZ＋local en-AU | remote en-NZを選択 | **壊れた** | P0-1 |

## 4. 指摘一覧

### P0

- **P0-1** 場所: app.js:38-53、README.md:27,34／問題: 「端末内を常に優先」と異なり、上位地域のremote声が下位地域のlocal声に勝つ／根拠: 模擬でremote NZを選択／直し方: まず全優先地域からlocal候補だけを探索し、存在しない場合だけremote探索。
- **P0-2** 場所: docs/会議の紙.md AC8／問題: 公開URLのHTTP 200未確認／根拠: CURRENTの自己申告のみで、今回もDNS解決不可／直し方: 外部通信可能環境でヘッダーと本文を記録。

### P1

- **P1-1** 場所: app.js:121-142／問題: watchdog後の遅延`onstart`で、失敗案内と実発声が同時に残る／再現: `onstart=3000ms`／直し方: timeout時にutteranceを無効化・cancelするか、遅延`onstart`時に`silent`案内を消す。
- **P1-2** 場所: tests/app.spec.mjs:240-245／問題: 初期化待ちなしでテストが不安定／根拠: #11で`state.data === null`を3回確認／直し方: `.card`30件または`state.data`を待ってからevaluate。
- **P1-3** 場所: data/phrases.json:1330-1354／問題: n27英語は「料理」が消え、スペイン語templateだけtú形／直し方: Section 5の案へ統一。

### P2

- **P2-1** 場所: app.js:149-163／問題: Audioの終了後にerrorが来るとTTSへ再フォールバック／直し方: `settled`を持ち、`ended`後はerrorを無視。
- **P2-2** 場所: app.js:112-145／問題: 長文切断対策なし／直し方: 将来の長文化時に文節分割。
- **P2-3** 場所: app.js:38／問題: 同点声は列挙順依存／直し方: 言語別の声名順位を最終比較条件にする。

## 5. 訳の再点検

180/180を確認。

- 韓国語: **○**。30件すべて丁寧な`요／세요`系。n17の`이/가`、n18の分かち書き、n24も修正済み。全件を無理に`세요`終止へ揃えるのは文法的に不適切。
- タイ語: **○**。30例文すべて`ครับ`終わり。女性は質問`คะ`、それ以外`ค่ะ`との注記あり（phrases.json:73）。n3・n12・n24・n27・n28修正済み。n29の`เช็คบิลด้วยครับ`も口語として自然。
- n24六言語: **○**。すべて「どのバスですか？」へ修正。
- n27: 中国語・韓国語・ロシア語・タイ語 **○**、スペイン語 **△**、英語 **×**。
- その他の周回1指摘: 中国語n28/n29、スペイン語n14/n23/n24、ロシア語n8/n14/n24、韓国語n17/n18は **○**。

残件:

- **n27 英語**: `What would you recommend? / おすすめは何ですか？` → `What dish would you recommend? / おすすめの料理は何ですか？`
- **n27 スペイン語template**: `¿Qué me recomiendas?` → 店員向けの `¿Qué plato me recomienda?`。exampleは既にusted形で正しい。

## 6. AC1〜AC9 の判定

- **AC1 満たす**: 6タブ・各30件。Playwright通過。
- **AC2 満たす**: 180/180に本文・訳・型・audio欄あり。翻訳残件はP1-3。
- **AC3 満たす**: Mac Chromeで6言語発声、反復経路も通過。
- **AC4 満たす**: cancel・`gen`・80msで最新のみ発声。pagehideも停止。
- **AC5 満たす**: 390pxで横スクロールなし、カード列・44pxを実測。
- **AC6 満たさない**: remote声を選択でき、外部通信なしを保証できない。
- **AC7 満たす**: 言語名・追加手順・閉じる操作・例外案内あり。遅延開始の誤案内はP1-1。
- **AC8 未確認**: 公開URLのHTTP 200を確認できていない。
- **AC9 満たす**: 実音声ファイル再生と404→TTS fallbackを確認。異常イベント順はP2-1。
