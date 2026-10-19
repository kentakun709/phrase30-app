# 周回2 実機の記録 — この Mac の Chrome で本物の読み上げ（2026-10-20 07:33）

手順: `PORT=8789 python3 -m http.server 8789` → `PORT=8789 node scripts/probe-voices.mjs`（出力はミュート）。幅390×844・タッチ有効。

| 言語 | 声 | lang | 結果 | 所要 |
|---|---|---|---|---|
| 英語 | Catherine | en-AU | ○ 鳴って止まった | 2.0秒 |
| 中国語 | Li-Mu | zh-CN | ○ | 2.8秒 |
| 韓国語 | Yuna | ko-KR | ○ | 2.0秒 |
| スペイン語 | **Mónica**（周回1は Eddy＝機械っぽい声） | es-ES | ○ | 1.6秒 |
| ロシア語 | Milena | ru-RU | ○ | 2.0秒 |
| タイ語 | Kanya | th-TH | ○ | 2.0秒 |

- 端末: macOS 13・Google Chrome 155・声の総数 157。en-NZ の声は無いので en-AU
- 試験: `npm run check` ○・`npx playwright test` **12 passed**（07:3x）
- 画面: log/phrase30-en-390.png・log/phrase30-th-390.png（git外）
