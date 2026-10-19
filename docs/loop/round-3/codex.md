# 周回3 東条（Codex）の原文 — 2026-10-20（出荷可・P0 0・P1 1＝es n20 の型・P2 2）

# 周回3 東条（Codex）確認レビュー 回収結果 — phrase30-app（HEAD=62182a2・2026-10-20）

Codex（sol・既定の最高モデル・`-m` 指定なし）の出力を要約せず構造だけ整えた。橋渡し役の補足は「0.」のみ。

## 0. 実行環境の注記（橋渡し役の補足・レビュー内容ではない）
- Codex のサンドボックスでは Chrome が起動できないため、`npx playwright test`（15本）は橋渡し役が同じ Mac で **1回** 実行し、生ログをファイルで Codex に渡した。
- **実測: 15 passed / 0 failed（35.4s）。落ちた物なし**（trace・エラー本文の記録対象なし）。
- `node scripts/check-data.mjs` ○（言語 6/6・フレーズ 30/30・表現 180/180）、`node scripts/check-no-external.mjs` ○（点検 3/3・外部通信・鍵・ログイン・課金なし）。
- Codex は `-s workspace-write`・cwd=scratchpad で実行（プロジェクト側は書き込み不可）。`git status` で app.js 等の変更なしを確認済み。実行中に `docs/loop/round-2/judge.md`・`docs/loop/round-3/spec-checker.md`・`user-panel.md` が新たに現れたが、これは親側の他エージェントの書き込み（judge.md の見出しは「周回2 judge の原文」）。Codex のログに禁止ファイルを読んだ形跡はない（禁止指示の行と `git status` の一覧に名前が出るのみ）。
- 他のレビュアーの出力（reviewer / judge / spec-checker / user-panel / codex-raw）は Codex に読ませていない（読むなと明示）。Codex 自身の周回2原文 `docs/loop/round-2/codex.md` と作る側の実機記録 `docs/loop/round-3/probe-mac-chrome.md` は渡した。
- Codex の破壊試験ハーネスは橋渡し役が再実行して exit 0・表どおりの出力を確認（a: "AU local" 選択／b: "Thai remote"・speak 1回・案内なし／c: 2500ms 見張りタイマー計2本・5000ms の silent 案内が 5200ms の onstart で消える／d: speak 0・案内なし／e: busy cancel→speak の間隔 80ms・80ms、最終発声 "How about you?"（n5）／f: novoice:en を閉じた後タイ語は表示・英語は再表示なし）。
- ファイル:
  - Codex 出力原文: /private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/sol_review_r3.md
  - 模擬ハーネス: /private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/codex-work-r3/destructive-harness.cjs
  - Playwright 生ログ（Codex に渡した物）: /private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/codex-work-r3/playwright-raw-results.md
- 番号の対応に注意: Codex は依頼どおり新規指摘を振り直したので、**周回3の P1-1（n20 template）は新規**、**周回3の P2-1＝周回2の P2-2（長文分割）**、**周回3の P2-2＝周回2の P2-3（同点声の列挙順）**。

## 0b. 試験結果（橋渡し役の実測・生ログより）
```
✓  1 AC1 言語タブが6つあり、押すと30項目の表記が切り替わる (1.9s)
✓  2 AC2 どの言語でも30枚すべてに本文と日本語訳があり、〇〇入りは型も見え、言語の説明が出る (2.3s)
✓  3 AC3 カードを押すと読み上げが呼ばれ、同じカードをもう一度押すとまた呼ばれる（英語は en-AU 等を選ぶ） (986ms)
✓  4 AC4 新しいタップのたびに cancel → speak の順で呼ばれ、読み上げの列が溜まらない（連打・鳴っている最中も） (2.5s)
✓  5 AC5 幅390pxで横スクロールが出ず、カードとタブは44px以上、本文は広い列にある (1.2s)
✓  6 AC7 その言語の声が無い端末では言語名と設定の手順つきの案内が出て、押してもエラーで止まらない。声が後から増えたら消える (1.2s)
✓  7 AC7b 声の一覧が空（まだ読めていない）の時も、言語名と設定の手順つきの案内が出る。閉じると消える (715ms)
✓  8 AC7c 読み上げが始まらない・例外になる時は、光ったままにせず案内を出す (6.5s)
✓  9 AC7d 閉じた案内は言語ごとに覚え、別の案内を閉じても出し直さない。声が無い間は「声: なし」が残る (7.1s)
✓ 10 AC9 audio にファイルが入っている項目は、読み上げの代わりにその音声を本当に鳴らす（鳴り終わりまで） (2.6s)
✓ 11 AC9b 音声ファイルが読めない（404）時は、案内を出して端末の読み上げで鳴らす (792ms)
✓ 12 AC9c 音声ファイルが鳴り終わった後に error が来ても、読み上げには戻らない (1.7s)
✓ 13 声の選び方: 端末内の声を優先し、機械っぽい名前は避け、中国語は香港の声を使わず台湾の声は最後の手段 (537ms)
✓ 14 スクロール位置は言語ごとに覚え、次に開いた時も戻る (2.1s)
✓ 15 言語とゆっくりの選択は次に開いた時も残る (877ms)
15 passed (35.4s)
```

---

# Codex(東条) 周回3 レビュー結果（原文）

# 1.結論

**出荷可**。P0なし、提示ログ15/15・破壊試験6/6。スペイン語n20のみ公開前修正を推奨。

# 2.周回2指摘の○×

| 指摘 | 判定・根拠 |
|---|---|
| P0-1 | ○ `app.js:43-64`。local全地域→remote全地域の2段探索 |
| P0-2 | **判定対象外（作る側で確認済み）** |
| P1-1 | ○ `app.js:136,146-153`。onstartで案内消去、watchdog再待機は1回 |
| P1-2 | ○ `tests/app.spec.mjs:299-303`。goto後にカード30枚を待つ |
| P1-3 | ○ `data/phrases.json:1330-1354`。英語・スペイン語とも料理／usted形 |
| P2-1 | ○ `app.js:166-174`。ended後は`settled`でfallback抑止 |
| P2-2 | × `app.js:127-162`。長文分割・keepaliveなし。ただし現30件は短文 |
| P2-3 | × `app.js:42`。同点声は依然として列挙順依存 |

# 3.破壊試験の表

| ケース | 操作 | 起きたこと | 判定 | 対応 |
|---|---|---|---|---|
| a | remote en-NZ＋local en-AU | local en-AU選択 | ○ | P0-1 |
| b | タイ語localなし、remoteのみ | remote選択、speak 1回、例外なし | ○ | P0-1 |
| c | onstartを3.0秒／5.2秒遅延 | watchdogは計2回。3秒では案内なし、5秒案内も5.2秒開始時に消去 | ○ | P1-1 |
| d | Audio ended→error | TTS 0回、案内なし | ○ | P2-1 |
| e | 40ms間隔×5 | busy cancel→speakは各80ms。発声0/120/200ms、途中分はcancel、最後の5番のみ継続 | ○ | AC4 |
| f | 英語声なしを閉じ→タイ→英語、silent→err | タイは表示、英語は再表示なし。silent/errは別キーで各表示 | ○ | AC7 |

模擬: destructive-harness.cjs（上記パス）。`node destructive-harness.cjs`で確認。プロジェクト変更なし。

# 4.指摘一覧

P0: 指摘なし。

- **P1-1** 場所: `data/phrases.json:53,1015-1016`／問題: n20の注記・exampleはustedだがtemplateだけtú／根拠: 画面に「別の言い方」として`Puedes`が出る／直し方: templateも`¿Puede repetirlo, por favor?`へ統一。
- **P2-1** 場所: `app.js:127-162`／問題: 長文化時の切断対策なし／根拠: 1 utterance固定／直し方: 将来長文を入れる際に文節分割。
- **P2-2** 場所: `app.js:42`／問題: 同点声が列挙順依存／根拠: score差だけでsort／直し方: 同点時の声名順位を追加。

# 5.訳の再点検

韓国語30件は自然で、無理に全語尾を`세요`にしていない点も適切。スペイン語n14/n30、8番6言語、n27英西、中国語n19/n28は○。スペイン語n20のみP1-1。

# 6.AC判定

AC1 ○／AC2 ○／AC3 ○／AC4 ○／AC5 ○／AC6 ○／AC7 ○／**AC8 判定対象外（作る側で確認済み）**／AC9 ○。

