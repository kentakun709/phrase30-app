# 周回7 東条（Codex gpt-5.6-sol）— phrase30-app HEAD 80cbb15・2026-10-20 12:0x〜12:3x（codex-reviewer 経由の要約＋原文）

## 実行経緯（橋渡し側の注記）
- 1回目（sandbox）: localhost の listen と Chrome 起動が拒否され22本は0本。静的解析で P2 3件・「納品不可（検証未完）」の仮報告
- 3回目（採用）: 橋渡し側が sandbox の外で `npx playwright launch-server`（Chrome・headless）を立て、Codex は中から接続して実測。この構成の分だけ「冷間起動」は条件が甘い（ブラウザは温まっている）
- 後始末: browser server 停止・8798 空き・追跡ファイルの差分なし（一時ファイルは log/ と /tmp）

## 要約
- P0: なし／P1: なし
- P2: (1) 声が後から届いても直前の「鳴りませんでした」案内が残る（app.js:110, 164）→ 声取得成功時に silent 案内も消す (2) `#voiceinfo` に aria-live="polite" が残る（index.html:30）(3) AC5c は欄の高さだけで内部スクロールを検出しない（実画面の最長状態は clientHeight=275/scrollHeight=275 で問題なし）→ scrollHeight <= clientHeight を足す
- 試験: `npm run check` ○・Playwright 22本×2周 44/44（1周目 AC1 1.2秒）
- 固定帯: 幅390 scrollY 0/600/1092（上限）で .top=0・#tabs 58〜102・y=70 は #tabs。幅1280 も同じ。locator.click 後の差 −153px（390）・−58px（1280）、押した後も帯 0。幅320/390/599/600/1024 × 6言語で横溢れなし
- #dock: scrollY 0/300/900 で y=690.84〜844。最下端で枠下端との差 8px＝本来位置。最長状態 275.84px（32.7%）・内部スクロールなし。#noticehow・#voicehow は 44px で押せて手順が開く
- 最下段 15・30番は最下端で欄に隠れず押せる。言語切替前後の最初の可視番号 12→12
- 案内の出入りで1番の y は 162.59px で不動（初期／声なし／声到着／閉じる／silent／閉じる）
- 欄の再生: cancel→speak。英語8番→タイ語で本文・訳・型・注が更新
- ダークモード: 欄 6.55:1・帯 16.29:1・区切り名 6.43:1
- 回帰: AC3/4/7/9 ○・localStorage 3鍵（lang・slow・scroll.v2）・`<img onerror>` を入れても文字列として表示（esc ○）・画面写し5枚と矛盾なし
- 周回6の指摘: 固定帯 消えた／冷間起動 消えた／AC10 の固定性検査 消えた
- **納品可。** P0/P1 なし、22本×2周が安定。P2 の3件は主要操作を壊さない

## 原文（codex-r7c-out.md）
## P0

なし。

## P1

なし。

## P2

- 声が後から到着しても、直前の「鳴りませんでした」案内が残る。タイ語の声なし状態で8番を押し、`noticeKey="silent"` を確認後、`Kanya Compact / th-TH` を到着させたところ、声表示は更新されたが案内は表示されたままだった。[app.js](/Users/omoya160/Kenta/dev/phrase30-app/app.js:110)、[app.js](/Users/omoya160/Kenta/dev/phrase30-app/app.js:164)。直し方: 声取得成功時に `silent` 案内も消す。
- `aria-live` は完全には無くなっておらず、`#voiceinfo` に `aria-live="polite"` が残る。ブラウザで `[aria-live]` を全件取得すると、この1件だけだった。[index.html](/Users/omoya160/Kenta/dev/phrase30-app/index.html:30)。直し方: `#voiceinfo` の `aria-live` を外す。
- AC5cは欄の高さだけを検査し、内部スクロールを検出しない。実画面の最長状態は `clientHeight=275 / scrollHeight=275` で今回は問題ないが、試験は `scrollHeight > clientHeight` を見ていない。[tests/app.spec.mjs](/Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs:185)、[tests/app.spec.mjs](/Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs:198)。直し方: 最長状態で `scrollHeight <= clientHeight` を追加する。

## 試験の結果

- `npm run check`: 成功。6言語・30フレーズ・180表現、外部通信・鍵・登録・課金なし。
- Playwright 22本×2周:
  - 1周目: 22 passed、1.0分。ブラウザ接続直後の先頭AC1は **1.2秒**。
  - 2周目: 22 passed、59.9秒。
  - 失敗: 0件。
- 固定帯:
  - 幅390: scrollY 0／600／1092（1200指定時の上限）／最下端1092で、`.top.top=0`、`#tabs=58〜102px`、y=70は全て`#tabs`。
  - 幅1280: 0／228（600・1200指定時の上限）／最下端228でも同じく `.top.top=0`、`#tabs=58〜102px`、y=70はタブ。
  - `locator.click()` 後のscrollY差は幅390で−153px、幅1280で−58px。同じ段への復元範囲内で、押した後も帯上端は0。
  - 幅320／390／599／600／1024、全6言語で横溢れなし。htmlは全幅で `scrollWidth=clientWidth`、bodyも1024時の960pxを含め一致。
- `#dock`:
  - scrollY 0／300／900では `y=690.84〜844px`。最下端では `y=485.97〜639.13px`、枠下端477.97pxとの差8pxで本来位置へ戻った。
  - 最長状態は高さ275.84px（844pxの32.7%、上限40%以内）。内部スクロールなし。
  - `#noticehow` と `#voicehow` はともに44px。中央の`elementFromPoint`は各ボタン自身で、両方クリックして手順が開いた。
- 最下段:
  - 15番・30番は最下端で `y=367.19〜475.97px`。中央の`elementFromPoint`はそれぞれ該当カードで、欄に隠れていない。
  - 言語切替前後の最初の可視番号は12→12。同じ段を維持した。
- 案内の出入り:
  - 1番のyは、初期／声なし案内／声到着／閉じる／silent案内／silentを閉じる、すべて162.59pxで不動。
- 欄の再生:
  - 欄を押した呼出順は `cancel → speak`。英語8番からタイ語へ切り替えると本文・訳・型・注もタイ語へ更新。
- ダークモードのコントラスト:
  - 欄 6.55:1、帯 16.29:1、区切り名 6.43:1。いずれも視認可能。
- 回帰:
  - AC3／AC4／AC7／AC9は22本の両周で成功。
  - localStorageは `phrase30.lang`・`phrase30.slow`・`phrase30.scroll.v2` の3鍵を確認。
  - `<img src=x onerror="…">'&` をデータへ入れて再描画しても、画像要素0・コード実行なし・文字列として表示。`esc()`のエスケープを確認。
  - 指定された画面写し5枚も照合し、実測と矛盾なし。

## 周回6の指摘の消え具合

- P1 固定帯: **消えた**。幅390・1280とも最下端まで `.top.top=0`。
- P2 冷間起動: **消えた**。1周目AC1は1.2秒、22本完走。[playwright.config.mjs](/Users/omoya160/Kenta/dev/phrase30-app/playwright.config.mjs:6)
- P2 AC10の固定性検査: **消えた**。1200px送った後の帯・タブ・y=70・`locator.click()`後まで検査されている。[tests/app.spec.mjs](/Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs:409)

## 納品可否

**納品可。** P0/P1なし、22本×2周が安定成功。P2の3件は残るが、主要操作・固定帯・欄・最下段を壊さない。

## 後始末

- HEAD: `80cbb15`。
- `git diff`・`git diff --cached`: 空。追跡ファイルの変更なし。
- `git status --short`: `?? docs/loop/round-7/` のみ（開始前から存在、中身は未読）。
- 8798: 手動サーバを停止し、`lsof`で待受なしを確認。
- 9798のbrowser serverは停止・killしていない。
- 一時ファイル:
  - `log/sol-r7-browser-probe.mjs`
  - `/tmp/sol-r7-browser-probe.json`
  - `/tmp/sol-r7-node-probes.json`
  - Playwright生成: `test-results/.last-run.json`