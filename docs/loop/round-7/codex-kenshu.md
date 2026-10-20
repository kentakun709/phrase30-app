# 周回7 東条（Codex）の納品検収（送信2）— phrase30-app・2026-10-20 12:46〜12:52（HEAD 8f50840）→ 直して再検収（HEAD 08abe1b）

## 1回目（HEAD 8f50840）の要約
- P0 なし／P1: A群の反映 1○ 2×（幅599で「30マスが枠内」の assertion が欠落）3×（`.detail.playing{background}` が無く実測で背景が透明）4○ 5○ 6○／P2 なし
- 試したこと: Chrome 155・HTTP 200／npm run check 2周○／Playwright 22本×2周 44/44（70.35秒・67.06秒）／自作の台本で playing の付外し・silent 消去・横向き static（board 下端 937・dock 上端 945）・区切り名の省略なしを実測／CSS 故障注入で内部スクロール・44px・599/600 枠内・1024 固定・AC7b 案内・AC10 dock の各条件は崩すと落ちると確認／公開版4ファイル HEAD と一致／git diff --check 正常
- 納品可否: **不可**（上の2点）
- 橋渡し: sandbox の loopback EPERM → network_access=true。launch-server は 127.0.0.1 で立て直し

## 直し（13:1x・HEAD 08abe1b）
- tests: 幅599で `inside(c599, …)` を追加／style.css: `.detail.playing{background:var(--play-bg)}` を追加 → Playwright 22本×2周 44/44 → push
- 再検収の結果（12:57〜13:01・HEAD 08abe1b）: **可**。差分2点○（tests:481 inside・style.css:73 --play-bg）／幅599で 30/30 が枠内、1番を右へ 700px 動かすと意図どおり落ちる／幅390・8番の再生中は rgb(255,246,224)＝--play-bg、onend 後は透明に戻る／npm run check ○・Playwright 22/22×2周（68.06秒・66.34秒）・回帰なし・追跡ファイルの差分なし。紙に載せる1行（原文）: 「幅599の30マス枠内と再生中の欄背景を実測し、意図的破壊試験および22本×2周を通過。」

## 原文（1回目・main.md）
## P0

なし

## P1

A群の反映結果:

1. ○ `tests/app.spec.mjs:196-211,287-288`  
   4割条件に `scrollHeight <= clientHeight + 1` を追加。390×664も assertion なしで記録（`h=266, sh=266, ch=265`）。

2. × `tests/app.spec.mjs:476-486`  
   幅599は1番・16番のyを検査するが、`inside(c599, ...)` がなく「30マスが枠内」の assertion が欠落。幅600、1024、AC7b、AC10の20番、タブ中心、旧文言は反映済み。

3. × `app.js:132-134`、`style.css:73`、`tests/app.spec.mjs:101-105`  
   `#detail.playing` の付外しと番号色・試験は反映。しかし指定された `.detail.playing{background:var(--play-bg)}` がない。実測でも背景は透明 `rgba(0,0,0,0)`。

4. ○ `data/phrases.json:1522`、`README.md:13`  
   「初対面で聞く」に短縮。390px実測で省略・横溢れなし。

5. ○ `app.js:110-111`、`tests/app.spec.mjs:295-303`  
   指定とは同等の条件分岐でsilent案内を消去。実測でもvoiceschanged後にhidden。

6. ○ `style.css:39`、`README.md:35`  
   高さ500px未満でdockをstatic化。844×390実測で `position:static`、board下端937px・dock上端945px。

## P2

なし

## 試したこと（箇条書き・コマンドと結果）

- 接続確認: Chrome 155、HTTP 200。
- `npm run check`: 2周ともデータ6言語・180表現、外部通信等の点検が正常。
- 指定Playwrightコマンド: 2周とも全通過。
- `node log/sol-s2-manual.mjs`: playingの付外し、silent消去、横向き配置、区切り名を実測。
- CSS故障注入: 内部スクロール、44px、599/600枠内、1024固定、AC7b案内、AC10 dockの各条件は崩すと判定できた。ただし製品試験には幅599の枠内判定自体がない。
- 公開版: HTTP 200、`index.html`・`style.css`・`app.js`・`phrases.json` はHEADと一致。
- `git diff --check` 正常。追跡ファイル変更なし。既存未追跡2ファイルのみ。

## 試験の結果

- 1周目: 22 passed、失敗0、70.35秒
- 2周目: 22 passed、失敗0、67.06秒
- AC1〜AC10の機能回帰は認めず。ただしA群の必須修正2点が未完。

## 納品可否

不可 — 幅599の枠内assertion欠落と、再生中の欄背景指定欠落のため。