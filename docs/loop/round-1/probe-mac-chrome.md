# 周回1 実機の記録 — この Mac の Chrome で本物の読み上げ（2026-10-20 07:07）

手順: `python3 -m http.server 8787` → `node scripts/probe-voices.mjs`（出力はミュートして実行）。幅390×844・タッチ有効。
結果（言語 / 選ばれた声 / 鳴り始めて鳴り終わるまで）:

| 言語 | 声 | lang | 結果 | 所要 |
|---|---|---|---|---|
| 英語 | Catherine | en-AU | ○ 鳴って止まった | 2.2秒 |
| 中国語 | Li-Mu | zh-CN | ○ | 2.6秒 |
| 韓国語 | Yuna | ko-KR | ○ | 1.7秒 |
| スペイン語 | Eddy (スペイン語（スペイン）) | es-ES | ○ | 2.0秒 |
| ロシア語 | Milena | ru-RU | ○ | 1.5秒 |
| タイ語 | Kanya | th-TH | ○ | 1.8秒 |

- 端末: macOS 13（Darwin 22.6）・Google Chrome 155・声の総数 157
- **この Mac には en-NZ の声が無い**ので、優先順どおり en-AU（Catherine）が選ばれた（要件「可能ならNZ英語優先」＝端末に NZ の声があれば使う作り。iPhone は設定で「英語（ニュージーランド）」の声を追加できる）
- 案内（#notice）は6言語とも出なかった（声があるため）
- 画面: log/phrase30-en-390.png・log/phrase30-th-390.png（git外）
