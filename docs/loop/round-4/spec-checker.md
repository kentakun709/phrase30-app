# 周回4 検査官（spec-checker）の原文 — 2026-10-20（○ 9/9・17 passed）

AC1〜AC9 はすべて○（9/9）です。対象は phrase30-app の commit 87730cc（HEAD）で、origin/main も同じ commit です。各 AC は会議の紙に書かれた確認方法どおりに実行しました。それに加えて、自分で書いた試験スクリプト（/private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/probe/probe.cjs、受け口 8797・同じ Chrome とスマホ設定）でも、実物の値を取り直しました。

## 受入基準の判定
| AC | 判定 | 確認方法 | 証拠 |
|---|---|---|---|
| AC1: 言語タブが6つあり、押すと30項目の表記がその言語に切り替わる | ○ | `node scripts/check-data.mjs`、`PW_PORT=8797 npx playwright test` の AC1 試験 | check-data: 「言語 6/6・フレーズ 30/30・表現 180/180」「○ check-data: 異常なし」exit 0。Playwright: 「✓ 1 … AC1 言語タブが6つあり、押すと30項目の表記が切り替わる (2.4s)」。自前の試験: タブは en/zh/ko/es/ru/th の6つ。各言語で30枚すべてがデータと一致（不一致=0）。1番のカードの本文は英語「What's your name?」から zh「你叫什么名字？」、ko「이름이 뭐예요?」、es「¿Cómo te llamas?」、ru「Как вас зовут?」、th「คุณชื่ออะไรครับ」に変わる |
| AC2: 180件すべてに example と ja が空でなく入り、〇〇入りの項目は template も持つ | ○ | `node scripts/check-data.mjs` が exit 0 | 「check-data exit=0」。点検の中身は scripts/check-data.mjs:25-27（example・ja・template が空なら誤り）と :31（〇〇入りなのに template に〇〇が無ければ誤り）。Playwright の AC2 試験も passed |
| AC3: カードを押すと speak が呼ばれ、同じカードをもう一度押しても再び呼ばれる | ○ | speechSynthesis を差し替えて2回押し、speak が2回 | Playwright: 「✓ 3 … AC3 カードを押すと読み上げが呼ばれ、同じカードをもう一度押すとまた呼ばれる (1.3s)」（tests/app.spec.mjs:95 で speak が2回）。自前の試験: speak の記録は ["What's your name?","What's your name?"] の2件 |
| AC4: 新しいタップのたびに speak の前に cancel() が呼ばれ、pending が true のまま残らない | ○ | Playwright の差し替えで cancel→speak の順を記録 | Playwright: 「✓ 4 … AC4 … cancel → speak の順で呼ばれ、読み上げの列が溜まらない (2.8s)」（:124 で speak の直前は必ず cancel、:134 で pending=false）。自前の試験: 4回押して「cancel→speak→cancel→cancel→speak→cancel→speak」（押すたびに cancel、すべての speak の直前が cancel）。その後 pending=false。実装は app.js:198 で、毎回 stopAll() を呼んでから鳴らす（stopAll の中の app.js:132 が synth.cancel()） |
| AC5: viewport の meta があり、幅390pxで scrollWidth <= 390、カードの高さが 44px 以上 | ○ | playwright.config.mjs の設定（この Mac の Chrome・390×844・スマホ扱い）で計測 | 設定は playwright.config.mjs:10 `channel: 'chrome'`、:12 `{ width: 390, height: 844 }`、:14 `isMobile: true`。viewport は index.html:5 `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`。Playwright: 「✓ 5 … AC5 幅390pxで横スクロールが出ず、カードとタブは44px以上 (1.1s)」。自前の試験: 6言語とも scrollWidth=390、30枚の中で一番低いカードでも 81.6px |
| AC6: ログイン・APIキー・課金・外部の有料サービスへの通信がない | ○ | `node scripts/check-no-external.mjs` が exit 0、補助の grep で fetch 先が data/phrases.json だけ | 「点検したファイル 3/3」「○ check-no-external: 外部通信・鍵・ログイン・課金なし」exit 0。grep の出力は `app.js:301:  fetch('data/phrases.json', { cache: 'no-cache' })` の1件だけ。`npm run check` が呼ぶ2本も、それぞれ exit 0 |
| AC7: 対象言語の声が無い時、カードの上に案内（言語名・設定で足せること）が出て、タップしてもエラーで止まらない | ○ | getVoices が空の状態と、声はあるが対象言語の声が無い状態の両方で、#notice が見え、本文に言語名と「設定」が入る | Playwright: AC7・AC7b・AC7c・AC7d がすべて passed。自前の試験で取った #notice の本文は下の別枠に載せた。案内の位置は notice.y=97 で、1番のカード（y=497〜536）より上。カードを押しても pageerror は 0件（声が空の時も、タイ語の声が無い時も []） |
| AC8: GitHub Pages の URL が HTTP 200 で index.html を返す | ○ | `curl -sI <URL>` が 200 | `curl -sI https://kentakun709.github.io/phrase30-app/` の結果は「HTTP/2 200」「content-type: text/html」「content-length: 2107」。公開中の index.html・app.js・style.css・data/phrases.json の4つとも HTTP=200 で、手元のファイルと cmp で「一致」。URL 直下の中身も index.html と一致 |
| AC9: 各項目に audio があり、値が入っていればその音声ファイルを鳴らす経路がある | ○ | audio を仮に入れた項目を押すと `<audio>` の play が呼ばれる | 180件すべてに audio 欄があり、値はすべて空（check-data.mjs:28 でも点検）。Playwright: 「✓ 11 … AC9 audio にファイルが入っている項目は、読み上げの代わりにその音声を本当に鳴らす (2.7s)」（speak は0回、audioEl.ended=true）。自前の試験で HTMLMediaElement.prototype.play を見張ったところ、呼ばれたのは `AUDIO http://127.0.0.1:8797/audio/en/01.mp3` の1件。経路は app.js:200 から playFile、app.js:192 の `a.play()` |

AC7 で実際に取れた #notice の本文:
- 声の一覧が空の時（英語）: 「端末の音声の一覧をまだ読み込めていません。カードを1回押すと読み込まれることがあります。それでも【英語】が鳴らない時は、端末の設定で音声を足してください。 声の足し方を見る」
- 声の一覧が空の時（タイ語タブ）: 「…それでも【タイ語】が鳴らない時は、端末の設定で音声を足してください。 声の足し方を見る」
- 声はあるがタイ語の声が無い時（en-US・ja-JP だけ）: 「この端末には【タイ語】の音声が入っていません。端末の設定で足せます。 声の足し方を見る」
- 同じ状態でロシア語タブ: 「この端末には【ロシア語】の音声が入っていません。端末の設定で足せます。 声の足し方を見る」

Playwright は全体で「17 passed (45.8s)」、exit 0 でした。1回で通ったので取り直していません。8797 には先に動いている受け口が無いことを確かめてから回し、試験用のサーバーはこのリポジトリを配る形で新しく立ち上がっていました。

## 非スコープ違反: なし
- ログイン・課金・アプリストア配布: 公開物（index.html・app.js・style.css）を login/purchase/subscription/manifest/serviceWorker/store などの語で grep し、0件。
- 学習記録の保存: 端末に残すのは言語・ゆっくり・スクロール位置の3つだけ（app.js:249/263/267）。学習記録の保存は見つからない。
- 高品質TTSの音声ファイル: audio/ フォルダは無く、180件の audio 欄はすべて空。

## 許可外の行為: なし
- 書き込み先は origin（https://github.com/kentakun709/phrase30-app.git）への push だけで、「任せる範囲」に入っている。
- scripts/probe-voices.mjs と scripts/save-handback.py に外への通信は無い（接続先は 127.0.0.1 だけ）。

## ACの書き方の不備: なし

## 結論: 全○(9/9)

触ったのは読むことと試験の実行だけです。リポジトリのファイルは何も変えていません。作ったのは scratchpad の中の自前の試験スクリプト（上のパス）、Playwright の結果（/private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/pw1.txt）、公開物を照らし合わせるために取ったファイル（同じ scratchpad の pub/）です。
