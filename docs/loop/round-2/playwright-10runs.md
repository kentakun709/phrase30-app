# 橋渡し役が同じ Mac で実行した `npx playwright test` の生結果（2026-10-20 07:40〜07:55・channel chrome・390×844・http.server 8787）
対象: /Users/omoya160/Kenta/dev/phrase30-app HEAD=9bc0f18（周回2）。テストは tests/app.spec.mjs の12本。

## 全12本を10回まわした結果
| run | 結果 | 落ちた番号 |
|---|---|---|
| 1 | 11 passed / 1 failed | #11 声の選び方 |
| 2 | 12 passed | - |
| 3 | 8 passed / 4 failed | #9 AC9, #10 AC9b, #11 声の選び方, #12 選択が残る |
| 4 | 10 passed / 2 failed | #11, #12 |
| 5 | 12 passed | - |
| 6 | 12 passed | - |
| 7 | 12 passed | - |
| 8 | 12 passed | - |
| 9 | 12 passed | - |
| 10 | 12 passed | - |
→ 10回中 7回は 12/12、3回は落ちる（不安定）。同じコード・同じ環境。

## 追加: `--repeat-each 3 -g "AC9|声の選び方|次に開いた時も残る"`（#9〜#12 を3回ずつ）
11 passed / 1 failed（#11 が1回落ちた）

## 捕まえた失敗の中身（#11・run1 と repeat-each で同一）
```
  1) tests/app.spec.mjs:240:3 › 30フレーズ（スマホ幅・読み上げは差し替え） › 声の選び方: 端末内の声を優先し、機械っぽい名前は避け、中国語は香港の声を使わず台湾の声は最後の手段
    Error: page.evaluate: TypeError: Cannot read properties of null (reading 'languages')
        at eval (eval at evaluate (:370:30), <anonymous>:2:46)
        at pick (/Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs:243:44)
        at /Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs:248:18
```
（spec 243 行目 = `window.phrase30.state.data.languages` を読む所。page.goto('/') 直後で data/phrases.json の fetch がまだ終わっていない時に state.data が null）

## 捕まえ損ねた失敗（run3 の #9/#10/#12、run4 の #12）
エラー本文は記録できていない（要約行だけ grep したため）。再現率は低い。

## 1回ぶんの通過ログ（run2）
  ✓   1 tests/app.spec.mjs:50:3  › AC1 言語タブが6つあり、押すと30項目の表記が切り替わる (2.2s)
  ✓   2 tests/app.spec.mjs:65:3  › AC2 どの言語でも30枚すべてに本文と日本語訳があり、〇〇入りは型も見え、言語の説明が出る (3.3s)
  ✓   3 tests/app.spec.mjs:84:3  › AC3 カードを押すと読み上げが呼ばれ、同じカードをもう一度押すとまた呼ばれる（英語は en-AU 等を選ぶ） (957ms)
  ✓   4 tests/app.spec.mjs:107:3 › AC4 新しいタップのたびに cancel → speak の順で呼ばれ、読み上げの列が溜まらない（連打・鳴っている最中も） (2.5s)
  ✓   5 tests/app.spec.mjs:136:3 › AC5 幅390pxで横スクロールが出ず、カードとタブは44px以上、本文は広い列にある (1.1s)
  ✓   6 tests/app.spec.mjs:161:3 › AC7 その言語の声が無い端末では言語名と設定の手順つきの案内が出て、押してもエラーで止まらない。声が後から増えたら消える (1.0s)
  ✓   7 tests/app.spec.mjs:182:3 › AC7b 声の一覧が空（まだ読めていない）の時も、言語名と設定の手順つきの案内が出る。閉じると消える (567ms)
  ✓   8 tests/app.spec.mjs:192:3 › AC7c 読み上げが始まらない・例外になる時は、光ったままにせず案内を出す (3.6s)
  ✓   9 tests/app.spec.mjs:207:3 › AC9 audio にファイルが入っている項目は、読み上げの代わりにその音声を本当に鳴らす（鳴り終わりまで） (2.5s)
  ✓  10 tests/app.spec.mjs:227:3 › AC9b 音声ファイルが読めない（404）時は、案内を出して端末の読み上げで鳴らす (676ms)
  ✓  11 tests/app.spec.mjs:240:3 › 声の選び方: 端末内の声を優先し、機械っぽい名前は避け、中国語は香港の声を使わず台湾の声は最後の手段 (511ms)
  ✓  12 tests/app.spec.mjs:256:3 › 言語とゆっくりの選択は次に開いた時も残る (777ms)
  12 passed (24.6s)
http.server ログ: AC9b で `GET /audio/en/missing.mp3 → 404`（意図どおり）。AC9 では 404 は出ていない。
