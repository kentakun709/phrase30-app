# 周回6 東条（Codex gpt-5.6-sol）— phrase30-app HEAD 29f0e24・2026-10-20 11:16〜11:41（codex-reviewer 経由の要約＋原文）

## 要約（codex-reviewer）
- P0: なし
- P1: **固定帯がスクロールで消える。** 幅390・タイ語の「声の足し方を見る」を押し scrollY=1083 で `.top` は sticky のまま top=-1083px。`overflow-x:hidden` を実行時に `clip` へ変えると即座に top=0 に復帰。場所 style.css:13・:17。直し方: `html,body` の overflow-x:hidden を clip に
- P2: 21本の1周目だけ AC1 がページ準備中に30秒で時間切れ（冷間起動・2周目は21本全部○）→ 全体の時間切れを60秒に／AC10 試験は最上部で tabs.y<80 を見るだけで固定性を検査していない → 中段へ送った後も `.top` の top===0 を足す
- 試して問題なし: 320/390/599 は2列・600/768/1024/1280 は3列、1・16 と 1・11・21 の y 差 0、横溢れ 0、全30マス枠内、最小マス高 68px／欄の更新（露→タイ）・8番「言い換えの型」・27番「別の言い方」／.playing の移動・旧 onend で新しい光が消えない・cancel→speak 4組／10px 境界（11px で7番、10px・9px で8番）／帯 111px・案内 119〜200px・枠 208px から・「声の足し方を見る」で details が開く／ダークモードのコントラスト 14.59:1・枠 6.15:1・光り 7.27:1／幅1024の URL は 8798 に解決／AC3/4/7/9 ○・localStorage 3鍵・差し込み 0件
- 試験: npm run check ○・Playwright 21本×2周 41 passed／1 failed（1周目の AC1 冷間起動）・追加破壊試験 6/6・公開 200
- 後片付け: 8798 停止・追跡ファイルの差分なし（SHA-256 一致）
- **納品可否: 納品不可。固定帯が消える P1 を修正し、21本×2周を再実行する必要あり**

## 原文（sol_review.md）
## P0

なし。

## P1

- 固定帯がスクロールで消える。幅390・モバイル設定でタイ語の「声の足し方を見る」を押し、`scrollY=1083` まで移動すると `.top` は `position:sticky` のまま `top=-1083px / bottom=-972px` になった。`overflow-x:hidden` を実行時に `clip` へ変えると即座に `top=0 / bottom=111px` に復帰。[style.css](/Users/omoya160/Kenta/dev/phrase30-app/style.css:13)、[style.css](/Users/omoya160/Kenta/dev/phrase30-app/style.css:17)。直し方: `html,body` の `overflow-x:hidden` を `overflow-x:clip` にする。

## P2

- 21本の1周目だけ AC1 がページ準備中に30秒でタイムアウトした。アプリへの遷移前で、2周目は同じ AC1 を含む21本すべて成功。冷間起動時に試験が不安定。[playwright.config.mjs](/Users/omoya160/Kenta/dev/phrase30-app/playwright.config.mjs:6)。直し方: 全体タイムアウトを60秒へ延長する。
- AC10試験は最上部で `tabs.y < 80` を見るだけで、スクロール後も帯が固定されることを検査していないため、上記P1を検出できない。[tests/app.spec.mjs](/Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs:398)。直し方: 中段へスクロール後も `.top.getBoundingClientRect().top === 0` を追加する。

## 試したが問題なかった項目

1. 320／390／599pxは全6言語で2列、600／768／1024／1280pxは3列。1・16または1・11・21のY座標差0px、横溢れ0px、全30マス枠内。最小マス高68px、幅320の英・露は87px。
2. 未選択で案内表示、8番は「言い換えの型」、27番は「別の言い方」、8番の注を確認。選択後に露→タイへ切り替えると本文・訳もタイ語へ更新。
3. `.playing` は別マスへ移動し、旧`onend/onerror`では新しい光が消えず、現行`onend/onerror`で消えた。最終`pending=false`、`speaking=false`、`cancel→speak`を4組確認。
4. 10px境界は、見え量11pxで7番、10px・9pxで8番を選び、言語切替後も同番号。一番上での切替は`scrollY=0`。
5. 固定性以外の配置・導線は正常。帯111px、案内119〜199.78px、枠207.78px開始。「声の足し方を見る」で`details`が開き、見出しは画面内517.19pxに表示。
6. ダークモード実測コントラストは通常文字14.59:1、枠6.15:1、再生中文字11.73:1、光り7.27:1。
7. AC10の1024px確認は3列で、実際のURLは `http://127.0.0.1:8798/`。`browser.newContext()`後の相対`/`も同URLへ解決され、既存試験自身も8798の絶対URLを開いている。
8. AC3/4/7/9は成功。localStorageは`phrase30.lang`・`phrase30.slow`・`phrase30.scroll`の3鍵を保存し、タイ語・ゆっくり・`scrollY=500`を復元。`< > " ' &`入りデータは文字として描画され、要素差し込み0件。

## 試験の結果

- `npm run check`: データ180/180、外部通信・鍵・登録・課金なし。
- Playwright 21本×2周: 合計41 passed／1 failed。
  - 1周目: 20 passed／AC1のページ準備1件失敗、2.4分（実時間161.27秒）。
  - 2周目: 21 passed、54.3秒（実時間56.48秒）。
- 追加破壊試験: 最終6/6 passed、17.0秒（実時間18.29秒）。
- 公開URL: HTTP 200、2372 bytes。

## 後片付け

- 手動の8798サーバを停止。`lsof`で8798の待受なし。
- `git status --short` は開始時と終了時で一致:
  - ` M docs/CURRENT.md`
  - `?? docs/loop/round-6/`
- 上記は開始前からの状態。追跡差分SHA-256も開始時・終了時で完全一致し、本作業による追跡ファイルの変更なし。

## 納品可否

**納品不可。固定帯が消えるP1を修正し、21本×2周を再実行する必要あり。**