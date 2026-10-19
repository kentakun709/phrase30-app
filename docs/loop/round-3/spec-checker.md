# 周回3 検査官（spec-checker）の原文 — 2026-10-20（○ 9/9）

## 結論: 9件中9件が○。未達0件、判定できなかったもの0件
ただし AC3 の確認方法のうち「実機で耳で確認」は、検査官には実行できないので確かめていません（下の「ACの書き方の不備」に書きました）。

## 受入基準の判定
| AC | 判定 | 確認方法（実行したもの） | 証拠 |
|---|---|---|---|
| AC1: 言語タブが6つ、押すと30項目がその言語に切り替わる | ○ | `node scripts/check-data.mjs` ／ `npx playwright test`（AC1の試験）／ 自前の確認スクリプト | check-data の出力 `言語 6/6・フレーズ 30/30・表現 180/180` `○ check-data: 異常なし`（exit 0）。Playwright の出力 `✓ 1 … AC1 言語タブが6つあり、押すと30項目の表記が切り替わる`。自前の確認: タブは `English/英語・中文/中国語・한국어/韓国語・Español/スペイン語・Русский/ロシア語・ไทย/タイ語`、カードは30枚。タブを押した後の1番のカードの本文は en `What's your name?`、zh `你叫什么名字？`、ko `이름이 뭐예요?`、es `¿Cómo te llamas?`、ru `Как вас зовут?`、th `คุณชื่ออะไรครับ` で、6つとも違う文 |
| AC2: 180件すべてに example と ja があり、〇〇入りは template を持つ | ○ | `node scripts/check-data.mjs` が exit 0 になるか | exit=0。自前の集計: 全180件のうち example が空0件、ja が空0件。〇〇入りの96件は96件とも template に〇〇を含む |
| AC3: カードを押すと speak が呼ばれ、同じカードを再び押しても呼ばれる | ○（機械で確かめる部分） | Playwright で speechSynthesis を差し替えて2回押す ／ 実機で耳で確認（未実施） | Playwright の出力 `✓ 3 … AC3 カードを押すと読み上げが呼ばれ、同じカードをもう一度押すとまた呼ばれる`。自前の差し替えでの記録 `cancel, speak:What's your name?, cancel, speak:What's your name?`（speak は2回）。耳での確認はしていない |
| AC4: タップのたびに speak の前に cancel、pending が true のまま残らない | ○ | Playwright の差し替えで、呼び出しの順が cancel→speak になっているかを記録 | Playwright の出力 `✓ 4 … AC4 新しいタップのたびに cancel → speak の順で呼ばれ…`。自前の記録（4回続けて押した）は `cancel, speak, cancel, speak, cancel, speak, cancel, speak`。cancel を挟まない speak は0件。終わった後は `pending=false`、`speaking=false` |
| AC5: viewport の meta がある、幅390pxで横スクロールが出ない、カードの高さが44px以上 | ○ | Playwright で計測（試験側の設定は390×844。加えて自前で Playwright 標準の `devices['iPhone 13']` 設定（390×664）でも計測） | index.html:5 の `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`。Playwright の出力 `✓ 5 … AC5 幅390pxで横スクロールが出ず、カードとタブは44px以上…`。iPhone 13 設定での自前計測: 6言語すべてで `scrollWidth=390`。カードは30枚すべてを測り、一番低いものが `81.59px` |
| AC6: ログイン・APIキー・課金・外部有料サービスへの通信がない | ○ | `grep -rn "fetch(\|XMLHttpRequest\|apiKey\|api_key" index.html app.js` ／ `npm run check` | grep で見つかったのは1行だけ: `app.js:284:  fetch('data/phrases.json', { cache: 'no-cache' })`。`npm run check` の出力 `点検したファイル 3/3` `○ check-no-external: 外部通信・鍵・ログイン・課金なし`（exit 0） |
| AC7: 対象言語の声が無い時、カードの上に案内（言語名と「設定」）が出て、押してもエラーで止まらない | ○ | Playwright で、声の一覧が空の状態と、声はあるが対象言語の声が無い状態の両方で #notice を見る | 試験の出力 `✓ 6 AC7`、`✓ 7 AC7b`。自前で取った #notice の本文は下の「AC7 の #notice 本文」に全文を載せた。両方の状態で、案内は見えていて、カードより上にある（`noticeAboveCard=true`）。カードを2回押すと speak は2回呼ばれ、ページのエラーは0件（`pageerrors=[]`） |
| AC8: GitHub Pages の URL が HTTP 200 で index.html を返す | ○ | `curl -sI https://kentakun709.github.io/phrase30-app/` と、手元のファイルとの一致を cmp で確認 | `HTTP/2 200`、`content-type: text/html`、`content-length: 1905`。cmp の結果は index.html・app.js・style.css・data/phrases.json の4つとも一致。URL そのものの中身も index.html と一致。手元の HEAD `62182a2` は、公開先リポジトリの main（`git ls-remote origin main`）と同じ |
| AC9: 全項目に audio 欄があり、値が入っていれば `<audio>` の play が呼ばれる | ○ | Playwright で、audio に値を仮に入れた項目を押す | audio 欄があるのは180件中180件（値が入っているのは0件）。試験の出力 `✓ 10 AC9`、`✓ 11 AC9b`、`✓ 12 AC9c`。自前の確認: `HTMLMediaElement.prototype.play` を見張ったところ `plays=[{tag:"AUDIO", src:".../audio/en/01.wav"}]`、speak は0回。audio が空の2番のカードは speak が1回 |

### AC7 の #notice 本文（自前で取ったもの）
- 声の一覧が空・英語: 「端末の音声の一覧をまだ読み込めていません。カードを1回押すと読み込まれることがあります。それでも【英語】が鳴らない時は、設定で音声を追加してください。iPhone: 設定 → アクセシビリティ → 読み上げコンテンツ → 声 → 英語 を選び、声をダウンロード（高品質の物を選ぶとより自然）。」
- 声の一覧が空・タイ語: 上の文の【英語】が【タイ語】になったもの（言語名と「設定」を含む）
- 声はあるが対象言語の声が無い・タイ語（en-US と ja-JP の声だけがある状態）: 「この端末には【タイ語】の音声が入っていません。押しても鳴らないか、別の言語の声で読まれることがあります。iPhone: 設定 → アクセシビリティ → 読み上げコンテンツ → 声 → タイ語 を選び、声をダウンロード（高品質の物を選ぶとより自然）。」
- 同じ状態でロシア語に切り替えた時: 【ロシア語】で同じ文が出る。英語の時は案内が出ない（en-US の声があるため）

### Playwright を2回走らせた件
- 1回目: 9件通過、6件失敗。失敗したのは後ろの6本（AC9、AC9b、AC9c、声の選び方、スクロール、言語とゆっくり）。原因は、出力で詳しく見えた分については `page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:8787/` で、試験の途中で 8787 番のサーバーが止まったものです。試験の判定が外れたのではありません。
- 2回目（許可どおり1回だけ取り直し）: `15 passed (32.9s)`、exit 0。全文は /private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/pw-run2.txt にあります。
- 自前の確認スクリプト: /private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/probe/inspect.mjs（別のポート 8799 を使い、リポジトリには何も書いていません）

## 非スコープ違反: なし
- 高品質の音声ファイル: audio/ フォルダは無く、音声ファイル（mp3/wav/m4a/ogg）も無い。audio 欄に値が入っているのは0/180件。
- ログイン・課金: check-no-external で何も見つからなかった。
- アプリストア配布: manifest や service worker のファイルは無い。
- 学習記録の保存: localStorage に保存しているのは `phrase30.lang`・`phrase30.slow`・`phrase30.scroll` の3つ（app.js:237・251・255）。どれも言語・ゆっくり・スクロール位置の設定で、何を何回聞いたかといった学習の記録は保存していない。

## 許可外の行為: なし
- git の送り先は `https://github.com/kentakun709/phrase30-app.git` だけで、これは許可された範囲です。
- scripts・tests・設定ファイルに出てくる URL は `127.0.0.1` だけで、他の外部への送信は見つかりませんでした。

## ACの書き方の不備: あり（3件。どれも判定は○のまま）
- **AC3**: 確認方法の「実機で耳で確認」は、検査官にもプログラムにも実行できない。直し方の案: 耳での確認は見せる場面（公開した時）の人の確認に移し、AC には Playwright の部分だけを残す。または「どの端末・どの言語で鳴ったかを docs に記録してある」のように、機械で確かめられる文に書き換える。
- **AC5**: 「Playwright iPhone 13 の設定」が、Playwright 標準の `devices['iPhone 13']`（390×664・WebKit）を指すのか、リポジトリの試験の「相当」設定（390×844・Chrome）を指すのかが決まっていない。また「カードの高さ44px以上」が全部のカードなのか1枚目だけなのかも書いていない（試験は1枚目だけを測っている）。今回は両方の設定で測り、全カードを測っても○でした。直し方の案: 設定名と「6言語×30枚すべて」を確認方法に書く。
- **AC7**: 確認方法が見ているのは「言語名」と「設定」の2つの文字だけで、本文にある「その言語の音声が端末に無いこと」は見ていない。声の一覧が空の時の文は「まだ読み込めていません…それでも鳴らない時は設定で音声を追加」で、「無い」とは言っていない。直し方の案: 空の時に案内で伝える内容（「読み込めていない」の表現でよいのか）を条件の本文に書き分ける。

## 結論: 全○(9/9)（AC3 の耳での確認は未実施）
