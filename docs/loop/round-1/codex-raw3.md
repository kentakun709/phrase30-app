## P0確定版

- 旧P0-1: 取り下げ。サンドボックス外の同一構成でPlaywright 9/9 passedのため、受入試験未実行ではない。
- P0-1: AC6不適合。`localService=false`のリモート音声を選択でき、外部通信なしを保証できない。
- P0-2: AC8未確認。GitHub PagesのHTTP 200が出荷前に確認されていない。

## 追加指摘

### P1

- 場所: [tests/app.spec.mjs:137](/Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs:137)、[app.js:97](/Users/omoya160/Kenta/dev/phrase30-app/app.js:97)  
  根拠: テストは`HTMLMediaElement.prototype.play`を「必ず成功するPromise」に置換している。実ファイルが404でも`play()`呼び出しだけで合格するため、実際に取得・デコード・再生できることは検証していない。  
  直し案: `audio/en/01.mp3`へ有効な短い音声をroute.fulfillし、ネイティブ`play()`の成功と`ended`まで確認する。併せて404時に案内が表示される失敗テストを追加する。

判定: 現テストはAC9の「audio値ありならWeb Speechではなくaudio.playへ進む経路」は検証できている。一方、「音が実際に鳴る」ことは検証できていない。404はアプリの欠陥ではなくテストの偽陽性要因。

旧P0の`speak()`同期例外未捕捉はP1へ格下げ。正式な声なしテストは通過しており、残るのは例外的な端末実装への防御不足。

## D. 更新版

| AC | 判定 | 根拠 |
|---|---|---|
| AC1 | 満たす | Chrome・390×844で6タブ、各言語30項目の切替テストが成功 |
| AC2 | 満たす | 180件の必須欄検査と全言語の画面表示テストが成功 |
| AC3 | 満たす | 同一カードの再タップを含め、`speak`の複数回呼び出しを確認 |
| AC4 | 満たす | 各タップの`cancel→speak`順と、待機後の`pending=false`を確認 |
| AC5 | 満たす | 390pxで横スクロールなし、カード・タブ44px以上を実測 |
| AC6 | 満たさない | 明示的外部URLはないが、リモートWeb Speech音声を選択できる |
| AC7 | 満たす | 対象声なし・voices空の両テストで案内表示とエラーなしを確認。同期例外防御はP1 |
| AC8 | 未確認 | GitHub Pages URLのHTTP 200を未確認 |
| AC9 | 満たす | audio値あり時に`audio.play`へ進み、`speechSynthesis.speak`を呼ばない経路を確認。ただし実音声再生は未確認 |