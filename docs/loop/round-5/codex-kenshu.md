# 納品前の東条（Codex）の検収 — 2026-10-20（納品「可」・Node 模擬 10/10・20本 passed）

# Codex（東条）納品の検収（相見積）— 回収結果

対象: /Users/omoya160/Kenta/dev/phrase30-app の a244b16（周回5の審査後の直し。周回5審査対象 3d0b2b7 からの差分）
Codex: codex-cli 0.144.1 / model gpt-5.6-sol（config.toml 既定・`-m` 指定なし）/ `-s read-only` / CODEX_EXIT=0 / ファイル変更なし（`git status --short` 空）。Node の模擬 3回実行（ログ上の `node -` 呼び出し数）。読んでよいと明示した過去記録は Codex 自身の round-4/round-5 の codex.md・codex-raw.md のみ。judge.md・reviewer.md・user-panel.md・spec-checker.md・probe-*.md は開かないよう指示し、実行ログに開いた形跡なしを grep で確認済み。

## 橋渡し役が同じ Mac で実行した試験（生の結果・2026-10-20 09:10〜09:11）
- `PW_PORT=8798 npx playwright test` → **20 passed (50.0s)**、failed 0（この Mac の Chrome・幅390×844）
- `npm run check` → 「言語 6/6・フレーズ 30/30・表現 180/180・〇〇なしで「別の言い方」を持つ物 7件／○ check-data: 異常なし／点検したファイル 3/3／○ check-no-external: 外部通信・鍵・ログイン・課金なし」 **exit 0**
- 補助（AC8 用に橋渡し役が取った事実）: `curl -sI https://kentakun709.github.io/phrase30-app/` → **HTTP/2 200**（server: GitHub.com、last-modified Tue, 20 Oct 2026 00:09:47 GMT）。公開中の app.js と data/phrases.json の sha256 が HEAD の同ファイルと一致。`git status -sb` = `main...origin/main`（ahead/behind なし）

---

## Codex の出力（原文のまま・要約なし）

### 1. 納品可否

**可** — P2-1・P2-2は解消し、Node模擬全件・AC1〜AC9・Playwright 20本が通過。残件はREADMEの試験数表記だけ。

### 2. 指摘リスト

- P3｜`README.md:30`／「Playwright 19本」だが、`tests/app.spec.mjs`の実数と実行結果は20本／「20本」に直す。

P0〜P2の指摘なし。機能上の新しい穴なし。

### 3. P2-1・P2-2

| 指摘 | 判定 | 根拠 |
|---|---:|---|
| P2-1 同点比較 | ○ | `app.js:50-57`。名前→`voiceURI`→`lang`で固定。逆順でも同じ声を選択 |
| P2-2 折り畳み | ○ | `app.js:94-119,317-319`。言語別の初回済み記録、summary操作で自動旗解除、一覧空では自動展開しない |

### 4. Node模擬

| ケース | 期待 | 実際 | ○× |
|---|---|---|---:|
| 同名・別URIを逆順 | 常に`uri-a` | `uri-a / uri-a` | ○ |
| URIまで同点 | `lang`で固定 | 常に`es-AA` | ○ |
| 声一覧が空 | 開かず未処理 | `open=false・済=false` | ○ |
| 自動開→声到着 | 自動で畳む | `open=false` | ○ |
| 手で再度開く→声到着 | 畳まない | `open=true・auto=false` | ○ |
| 開いたまま別言語へ | 別言語も初回済み | `ko済=true・再開なし` | ○ |
| 最上部で言語変更 | 最上部維持 | `y=0` | ○ |
| 一覧8番で言語変更 | 8番を引継ぐ | `card=8` | ○ |
| 見張り1回目で発声中 | 警告せず見守る | 警告0・poll開始・停止後消灯 | ○ |
| es 8番 | usted形 | `¿Habla 〇〇? / ¿Habla inglés?` | ○ |

`compareVoices`・折り畳み遷移・`setLang`分岐・watchdogを`app.js`からNodeへ写し、状態と順序を反転して実行。

### 5. AC1〜AC9

| AC | 何をどう試したか | ○× |
|---|---|---:|
| AC1 | check-dataで6言語×30、全タブで1・30番を切替 | ○ |
| AC2 | 180件のexample・ja・templateをcheck-dataと画面で確認 | ○ |
| AC3 | 同じカード2回で`speak`が2回 | ○ |
| AC4 | 連打時も`cancel→speak`、終了後pending=false | ○ |
| AC5 | Chrome 390×844で横幅≤390、カード・タブ≥44px | ○ |
| AC6 | check-no-externalで通信・鍵・ログイン・課金なし | ○ |
| AC7 | 声0件／対象言語なし／発声失敗で案内と継続動作 | ○ |
| AC8 | 提示済みcurl 200、公開2ファイルとHEADのSHA一致 | ○ |
| AC9 | audio欄180件、音声再生・404時読み上げ復帰を確認 | ○ |

### 6. 試験結果

- Playwright: **20 passed / 0 failed**
- `npm run check`: **passed / 0 failed**
- Node模擬: **10 passed / 0 failed**
- ファイル変更なし。

---

## 補足（橋渡し役の事実のみ・評価なし）
- **Codex 実行中に HEAD が a244b16 → 47e55f7 に進んだ**（「周回5 合格（92点）: README の試験の本数を20本に・PIPELINE を検収待ちに・judge と審査後の実機記録」）。a244b16..47e55f7 の変更は README.md・docs/LOOP_LOG.md・docs/PIPELINE.md・docs/loop/round-5/judge.md・docs/loop/round-5/probe-mac-chrome.md・docs/loop/submit-check.md の6ファイルのみで、app.js・data/phrases.json・tests/app.spec.mjs・index.html・style.css に変更なし（`git diff --name-only` で確認）。
- Codex の唯一の指摘 P3（README.md:30「Playwright 19本」）は a244b16 時点では事実（`git show a244b16:README.md` 30行目に「19本」）で、47e55f7 で「20本」に直っている（現 README.md:30 は「Playwright 20本」）。
- 公開中の app.js・phrases.json のハッシュ一致は a244b16 の作業木で取った物。47e55f7 はコードを変えていないので、公開物と現 HEAD のコードも同一。
- Codex の AC5 の「カード・タブ≥44px」、AC9 の「audio欄180件」は Codex が自分で読んで書いた記述（橋渡し役は検証していない）。
- 他のレビュアーの出力は渡していない。

## 関連ファイル（絶対パス）
- Codex 出力原本: /private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/sol_kenshu.md
- Codex に渡した依頼文: /private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/sol_prompt_kenshu.md
- Codex 実行ログ（stdout/stderr・模擬コード含む）: /private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/sol_kenshu_stdout.log
- 周回5の Codex 原文（今回参照を許可した物）: /Users/omoya160/Kenta/dev/phrase30-app/docs/loop/round-5/codex.md
