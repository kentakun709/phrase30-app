# 周回2 検査官（spec-checker）の原文 — 2026-10-20（○ 9/9）

## 受入基準の判定
対象: /Users/omoya160/Kenta/dev/phrase30-app（commit 9bc0f18。作業ツリーに未コミットの変更なし、origin/main と同じ）
要件: /Users/omoya160/Kenta/dev/phrase30-app/docs/会議の紙.md:33-41（原文は /Users/omoya160/Kenta/dev/phrase30-app/docs/調査/2026-10-19_要件定義書v0.1.md:71）

**Playwright の取り直しについて**: 1回目は 7 passed / 5 failed。落ちた5本はすべて `net::ERR_CONNECTION_REFUSED at http://127.0.0.1:8787/` でした。原因は、同じ時刻に別の `playwright test --reporter=list`（pid 32222、7:41開始）が走っていたことです。設定が `reuseExistingServer: true` のため、自分の試験がその別の試験の 8787 番の受け口を使い回し、別の試験が終わった時点で受け口ごと消えました。「同時に別の試験は無い」という前提と違います。pid 32222 の終了を待ってから取り直し、2回続けて **12 passed**（exit=0）でした。以下の判定はこの結果と、作り手の試験とは別に自分で書いた確認用スクリプトの結果によります。確認用スクリプトは /private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/probe/probe.mjs で、8799 番に自分で受け口を立て、Chrome・390×844・isMobile で動かしました。

| AC | 判定 | 確認方法 | 証拠 |
|---|---|---|---|
| AC1: 言語タブが6つあり、押すと30項目の表記がその言語に切り替わる | ○ | `node scripts/check-data.mjs`、`npx playwright test` の「言語タブ」の試験、確認用スクリプト | check-data: `言語 6/6・フレーズ 30/30・表現 180/180`、`○ check-data: 異常なし` exit=0。Playwright: `✓ 1 … AC1 言語タブが6つあり、押すと30項目の表記が切り替わる`。確認用スクリプト: タブ6つ `en=English/英語, zh=中文/中国語, ko=한국어/韓国語, es=Español/スペイン語, ru=Русский/ロシア語, th=ไทย/タイ語`。押すたびに1番のカードが `What's your name?`→`你叫什么名字？`→`이름이 뭐예요?`→`¿Cómo te llamas?`→`Как вас зовут?`→`คุณชื่ออะไรครับ` と変わり、カードはどの言語でも30枚 |
| AC2: 180件すべてに example と ja が空でなく入り、〇〇入りは template も持つ | ○ | `node scripts/check-data.mjs` が exit 0（中身も自分で数え直した） | check-data は exit=0。data/phrases.json を自分で数え直した結果は `{total:180, emptyEx:0, emptyJa:0, tplItems:96, noTpl:0}`（〇〇入り16フレーズ×6言語＝96件すべてに template あり）。例: 8番の英語 `{"template":"Do you speak 〇〇?","example":"Do you speak English?","ja":"英語を話しますか？"}` |
| AC3: カードを押すと speechSynthesis.speak が呼ばれ、同じカードをもう一度押しても再び呼ばれる | ○（Playwright の部分）。「実機で耳で確認」は検査官は未実施 | Playwright で speechSynthesis を差し替えて2回押す | `✓ 3 … AC3 カードを押すと読み上げが呼ばれ、同じカードをもう一度押すとまた呼ばれる`。確認用スクリプトで同じカードを2回押した呼び出し記録: `["cancel","speak:What's your name?","cancel","speak:What's your name?"]`。speak は2回 |
| AC4: タップのたびに speak の前に cancel が呼ばれ、pending が true のまま残らない | ○ | Playwright の差し替えで呼び出し順を記録 | `✓ 4 … AC4 新しいタップのたびに cancel → speak の順で呼ばれ…`。確認用スクリプトで、鳴っている最中に別のカード、続けて同じカードを押した順: `["cancel","speak:What's your name?","cancel","speak:Where are you from?","cancel","speak:Where are you from?"]`。読み上げ中は `[speaking=true, pending=false]`、鳴り終わった後は `[pending=false, speaking=false]`。実装は app.js:169（`stopAll()` を speak より先に呼ぶ）と app.js:107（`synth.cancel()`） |
| AC5: viewport の meta があり、幅390pxで横スクロールが出ず（scrollWidth<=390）、カードの高さが44px以上 | ○ | Playwright の設定（Chrome・390×844）で計測。念のため Playwright 組み込みの iPhone 13（390×664）でも計測 | `✓ 5 … AC5 幅390pxで横スクロールが出ず、カードとタブは44px以上…`。meta は index.html:5 の `width=device-width, initial-scale=1, viewport-fit=cover`。確認用スクリプトでは6言語すべて `sw:390`、30枚の中で最も低いカードが 81.59px。iPhone 13 の設定でも6言語すべて `sw:390`、最も低いカード 81.59px |
| AC6: ログイン・APIキー・課金・外部の有料サービスへの通信がない | ○ | `grep -rn "fetch(\|XMLHttpRequest\|apiKey\|api_key" index.html app.js` | 当たったのは `app.js:249:  fetch('data/phrases.json', { cache: 'no-cache' })` の1行だけで、fetch の行き先は data/phrases.json のみ。補足として `grep -n "https\?://" index.html app.js style.css` は0件。`npm run check` は `○ check-no-external: 外部通信・鍵・ログイン・課金なし` |
| AC7: 対象言語の声が無い時、カードの上に案内（声が無いこと・設定で足せること）が出て、タップしてもエラーで止まらない | ○ | Playwright で、声の一覧が空の状態と、声はあるが対象言語の声が無い状態の両方について、#notice が見え、本文に言語名と「設定」が含まれるかを見る | `✓ 6 … AC7` と `✓ 7 … AC7b`。確認用スクリプトで実際に取った #notice の本文は下の3つ。<br>(a) 一覧が空・タイ語: visible=true、「端末の音声の一覧をまだ読み込めていません。…それでも【タイ語】が鳴らない時は、設定で音声を追加してください。 iPhone: 設定 → アクセシビリティ → 読み上げコンテンツ → 声 → タイ語 を追加。Android: 設定 → テキスト読み上げ → …」。英語のときは同じ文面で【英語】。<br>(b) 声は en-US と ja-JP だけ・タイ語: visible=true、「この端末には【タイ語】の音声が入っていません。押しても鳴らないか、別の言語の声で読まれることがあります。 iPhone: 設定 → アクセシビリティ → 読み上げコンテンツ → 声 → タイ語 を追加。…」。ロシア語のときは同じ文面で【ロシア語】。<br>位置は案内の上端 186px に対し1番のカードの上端 416〜436px で、カードより上。どの場合も押した後に pageerrors=[] で、speak まで進み、カードは30枚のまま。文面は app.js:73 と app.js:75 |
| AC8: GitHub Pages の URL が HTTP 200 で index.html を返す | ○ | `curl -sI https://kentakun709.github.io/phrase30-app/`。公開版と手元を cmp で比べた | `HTTP/2 200`、`content-type: text/html; charset=utf-8`。公開URLの本文は手元の index.html と cmp で一致。index.html・app.js・style.css・data/phrases.json の4つとも http=200 で cmp が SAME（sha256 の先頭: 07b3906af17d / 153559311582 / 5bd75056c94b / f65f75862921） |
| AC9: 各項目に audio 欄があり、値が入っていれば読み上げの代わりにその音声ファイルを鳴らす経路がある | ○ | Playwright で audio を仮に入れた項目を押すと `<audio>` の play が呼ばれるか | 180件すべてに audio 欄があり、値は全部空（noAudio:0、audioFilled:0）。`✓ 9 … AC9` と `✓ 10 … AC9b`。確認用スクリプトで HTMLMediaElement.prototype.play を見張った結果: `[{"tag":"AUDIO","src":"http://127.0.0.1:8799/audio/en/01.wav"}]`、この間 speak は0回。audio が空の2番のカードでは `speak:Where are you from?`。経路は app.js:170 と app.js:162 |

## 非スコープ違反: なし
- 学習記録の保存はしていない。localStorage に入れているのは `phrase30.lang`（言語）と `phrase30.slow`（ゆっくり）の2つの設定だけ（app.js:213・223・231）
- 音声ファイルは作っていない（node_modules と .git を除いて mp3/wav/m4a/ogg は0件）
- アプリストア配布の痕跡は無い（manifest も serviceWorker も無い）
- ログインと課金の語は check-no-external で0件

## 許可外の行為: なし
- push 先は `origin https://github.com/kentakun709/phrase30-app.git` だけで、これは任せる範囲に入っている
- scripts/probe-voices.mjs と scripts/save-handback.py は、どちらも手元（127.0.0.1 とローカルのファイル）しか触らない

## ACの書き方の不備: あり
- AC3: 確認方法の「実機で耳で確認」は機械では判定できません。どの端末で、何をもって合格とするかが書かれていないためです。検査官は実施していません。機械で判定できるようにするなら、端末名・言語・「鳴り始めた（speaking が true になった）」などの合格条件を書くか、実機の確認はこのACから外して未確認事項として報告に回す形にします。
- AC5: 「Playwright iPhone 13 の設定」が2通りに読めます。手元の設定（/Users/omoya160/Kenta/dev/phrase30-app/playwright.config.mjs）は Chrome の 390×844 で、Playwright 組み込みの `devices['iPhone 13']` は WebKit の 390×664 です。今回はどちらで測っても同じ結果でした。直すなら「playwright.config.mjs の設定（Chrome・390×844）で」と書きます。
- AC6: 条件は「外部の有料サービスへの通信がない」なのに、確認方法の grep は fetch・XMLHttpRequest・apiKey しか見ていません。WebSocket・sendBeacon・外部の `<script src>` などは対象外です。直すなら、確認方法を `node scripts/check-no-external.mjs` が exit 0、に置き換えます。

## 結論: 全○(9/9)
未達0件、判定不能0件。AC3 の「実機で耳で確認」の部分だけは検査官が実施していません（上の不備の欄）。
