# 周回5 検査官（spec-checker）の原文 — 2026-10-20（○ 9/9・19 passed・公開版一致）

## 結論: 9件すべて○（9/9）
対象は phrase30-app の周回5（HEAD = origin/main = 3d0b2b7）です。確かめる前に、手元のファイルが HEAD と同じことを見ました（追跡外は docs/loop/round-5/ だけ）。各ACは会議の紙に書かれた確認方法どおりに実行しました。それに加えて、自分で書いた試験スクリプト（/private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/probe/probe.mjs）でも同じ点を確かめています。設定は playwright.config.mjs と同じで、この Mac の Chrome・幅390×844・スマホ扱い、受け口は 8797 です。

- `npm run check` は exit 0
- `PW_PORT=8797 npx playwright test` は **19 passed (50.5s)**。時間切れはなく、取り直していません

## 受入基準の判定
| AC | 判定 | 確認方法 | 証拠 |
|---|---|---|---|
| AC1: 6言語のタブがあり、押すと30項目がその言語に切り替わる | ○ | `node scripts/check-data.mjs` と、Playwright の言語タブの試験 | check-data の出力「言語 6/6・フレーズ 30/30・表現 180/180」。試験の「AC1 言語タブが6つあり…」は合格。自分の試験ではタブが en:English/英語、zh:中文/中国語、ko:한국어/韓国語、es:Español/スペイン語、ru:Русский/ロシア語、th:ไทย/タイ語 の6つで、どれもカード30枚。1番のカードは押すたびに "What's your name?" → "你叫什么名字？" → "이름이 뭐예요?" → "¿Cómo te llamas?" → "Как вас зовут?" → "คุณชื่ออะไรครับ" と変わり、6言語ともデータと一致 |
| AC2: 180件すべてに `example` と `ja` があり、〇〇入りは `template` も持つ | ○ | `node scripts/check-data.mjs` が exit 0 | 「○ check-data: 異常なし」・exit 0。scripts/check-data.mjs の25〜27行目で example・ja・template が空でないこと、31行目で〇〇入りの template に〇〇があることを見ている |
| AC3: 同じカードを2回押すと `speak` が2回呼ばれる | ○ | Playwright で speechSynthesis を差し替えて2回押す | 試験の「AC3 カードを押すと読み上げが呼ばれ…」は合格。自分の試験でも1番のカードを2回押して speak は2回 |
| AC4: 押すたびに cancel→speak の順で、pending が残らない | ○ | Playwright の差し替えで呼び出しの順番を記録する | 試験の「AC4 新しいタップのたびに cancel → speak…」は合格。自分の試験の記録は `cancel,speak,cancel,speak,cancel,speak,cancel,cancel,speak` で、どの speak の直前も cancel。最後の pending は false。ページのエラーは0件 |
| AC5: viewport の meta があり、幅390pxで横スクロールが出ず、カードが44px以上 | ○ | playwright.config.mjs の設定（Chrome・390×844・スマホ扱い）で計測 | config に channel 'chrome'、viewport 390×844、isMobile true がある。meta は `width=device-width, initial-scale=1, viewport-fit=cover`（index.html:5）。6言語とも scrollWidth=390（390以下）。30枚の中で一番低いカードも 81.6px（44px以上）。試験の「AC5 …」は合格 |
| AC6: ログイン・APIキー・課金・外部の有料サービスへの通信がない | ○ | `node scripts/check-no-external.mjs` が exit 0。補助に grep | 「点検したファイル 3/3」「○ check-no-external: 外部通信・鍵・ログイン・課金なし」・exit 0。grep で見つかったのは `app.js:330:  fetch('data/phrases.json', …)` の1件だけ |
| AC7: 対象言語の声が無い時、カードの上に案内が出て、押してもエラーで止まらない | ○ | Playwright で、声の一覧が空の状態と、声はあるが対象言語の声が無い状態の両方を見る | 下の「AC7 で実際に取れた案内の文」に本文。どちらの状態でも案内は見えていて、位置はカードの一覧より上。言語名と「設定」の文字を含む。カードを押した後のページのエラーは両方とも0件。試験の AC7 と AC7b も合格 |
| AC8: GitHub Pages の URL が 200 で index.html を返す | ○ | `curl -sI https://kentakun709.github.io/phrase30-app/` | 返事は `HTTP/2 200`、`content-type: text/html`。トップの本文は手元の index.html と cmp で一致。4つのファイルも cmp で一致した（index.html sha256 1ad33f955955… / app.js 920a088659f6… / style.css 789a2ebc3700… / data/phrases.json b6ae52faf408…）。最初の取得で一致したので、取り直しはしていない |
| AC9: `audio` の欄があり、値が入っていればその音声ファイルを鳴らす | ○ | Playwright で、仮に `audio` を入れた項目を押すと `<audio>` の `play` が呼ばれる | 180件すべてに audio の欄がある（どれも空）。自分の試験で HTMLMediaElement の play を見張った。en の1番に `audio/en/01.wav` を入れて押すと、play が1回呼ばれ（`http://127.0.0.1:8797/audio/en/01.wav`）、speak は0回。経路は app.js:217 → playFile → 209行目の `a.play()`。試験の AC9・AC9b・AC9c も合格 |

### AC7 で実際に取れた案内の文
- 声の一覧が空・英語: 「声の一覧をまだ読めていません。カードを1回押してください。【英語】の声は設定で足せます。 声の足し方を見る ×」
- 声の一覧が空・タイ語: 「声の一覧をまだ読めていません。カードを1回押してください。【タイ語】の声は設定で足せます。 声の足し方を見る ×」
- 声はある（en-US と ja-JP だけ）・タイ語: 「この端末には【タイ語】の音声が入っていません。端末の設定で足せます。 声の足し方を見る ×」
- 声はある（en-US と ja-JP だけ）・ロシア語: 「この端末には【ロシア語】の音声が入っていません。端末の設定で足せます。 声の足し方を見る ×」

## 非スコープ違反: なし
- 音声ファイルの生成: git の追跡ファイル（`git ls-files`）に audio/ も音声ファイルも無い。phrases.json で audio に値が入っている件数は0
- ログイン・課金・アプリストア配布: どれも無い（check-no-external は合格、manifest 等も無い）
- 学習記録の保存: localStorage に保存しているのは `phrase30.lang`・`phrase30.slow`・`phrase30.scroll` の3つだけ（app.js:276, 290, 294）。どれも設定の保存で、学習の記録ではない

## 許可外の行為: なし
送り先は remote の `https://github.com/kentakun709/phrase30-app.git`（許可済みの public リポジトリ）だけでした。scripts/save-handback.py と scripts/probe-voices.mjs は、手元のファイルと 127.0.0.1 しか使っていません。

## ACの書き方の不備: なし
AC1〜AC9 のどれにも確認方法があり、機械で判定できました。

## 結論: 全○（9/9）

