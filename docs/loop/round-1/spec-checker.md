# 周回1 検査官（spec-checker）の原文 — 2026-10-20（○ 8/9・AC7 ×）

## 結論: AC1〜AC9 のうち 8件が ○、AC7 の1件が ×（8/9）

AC7 が × なのは、確認方法そのものの条件で案内の中身が足りないためです。声の一覧を空にすると、案内文に言語名も端末の設定で声を足す方法も出ません。文中の「下の案内」も画面のどこにもありません。
AC1 は最初の実行で1回落ちました。ブラウザの立ち上げ中に時間切れになったもので、試験の判定まで進んでいません。同じ時刻に別の検査が走っていた跡があり、単独で再実行したら 9/9 通過を2回続けて確認しました。

## 受入基準の判定
| AC | 判定 | 確認方法 | 証拠 |
|---|---|---|---|
| AC1: 言語タブ6つ（英・中・韓・西・露・タイ）、押すと30項目が切り替わる | ○ | `node scripts/check-data.mjs`、`npx playwright test` の AC1 試験 | `言語 6/6・フレーズ 30/30・表現 180/180`、exit 0。言語コード: en・zh・ko・es・ru・th。試験: `✓ 1 … AC1 言語タブが6つあり… (1.7s)`、`9 passed (14.9s)`（07:12）。もう一度回しても `9 passed (28.1s)`。1番カードの本文は6言語ですべて異なる（例: What's your name? → 你叫什么名字？）。※最初の全体実行と AC1 単独の再実行は `Test timeout of 30000ms exceeded while setting up "page"` で落ちた。このとき test-results には自分の実行ではない `browserType.launch … kill EPERM` の記録が9件あり、`docs/loop/round-1/` も途中で作られていた |
| AC2: 180件すべてに example と ja、〇〇入りは template も持つ | ○ | `node scripts/check-data.mjs` が exit 0 | `○ check-data: 異常なし`、exit=0。自分で数え直した結果: 〇〇入りは16フレーズ×6言語＝96件、template に〇〇があるのも96件 |
| AC3: 押すと speak、同じカードを再度押すとまた speak | ○ | Playwright で speechSynthesis を差し替えて2回押す | `✓ 3 … AC3`。試験は `tests/app.spec.mjs:69-72`（2回押して speak が2件）。実装は `app.js:125`。**実機で耳で聞く確認は検査官には実施できず、未実施** |
| AC4: タップのたびに cancel→speak、pending が true のまま残らない | ○ | Playwright の差し替えで呼び出し順を記録 | `✓ 4 … AC4`。4回押して speak 4件、毎回直前が cancel（`tests/app.spec.mjs:83-89`）。300ms 後の pending は false。実装は `app.js:104` の stopAll（cancel）の後に `:125` の speak。自分の計測でも順番は `["cancel","speak","cancel","speak"]` |
| AC5: viewport の meta あり、幅390で横スクロールなし、カード高さ44px以上 | ○ | Playwright の iPhone 13 設定で計測 | 試験 `✓ 5 … AC5`。Playwright 標準の `devices['iPhone 13']`（幅390・倍率3・スマホ扱い・タッチあり）でも測り直した: 6言語すべて scrollWidth=390、カード30枚の最小の高さ 168.8px、meta は `width=device-width, initial-scale=1, viewport-fit=cover`（`index.html:5`）。WebKit が入っていないため、エンジンは Chrome |
| AC6: ログイン・APIキー・課金・有料サービスへの通信なし | ○ | `grep -rn "fetch(\|XMLHttpRequest\|apiKey\|api_key" index.html app.js` | 当たりは `app.js:190: fetch('data/phrases.json', …)` の1件だけ。`npm run check` も `○ check-no-external`、exit 0 |
| AC7: 対象言語の声が無い時、カードの上に案内（その言語の音声が端末に無いこと・端末の設定で足せること）が出て、押してもエラーで止まらない | × | Playwright で getVoices を空にして案内が見えるか | 見える（`✓ 7 AC7b`）、カードの上にある（案内の下端174 < 1枚目の上端213）、2回押してもエラー0件、の3点は ○。**ただし getVoices を空にしたときの文面は `app.js:61`「端末の音声の一覧をまだ読み込めていません。カードを1回押すと読み込まれることがあります。それでも鳴らない時は、下の案内のとおり音声を追加してください。」で、言語名も設定の手順も無い。「下の案内」も画面に無い（フッターは操作の説明だけ）**。声の一覧はあるが対象言語の声が無い場合（`app.js:63-64`）は「【タイ語】の音声が入っていません…iPhone: 設定 → アクセシビリティ…」と出て条件を満たす（`✓ 6 AC7`） |
| AC8: GitHub Pages の URL が 200 で index.html を返す | ○ | `curl -sI https://kentakun709.github.io/phrase30-app/` | 2026-10-20 07:09:57 JST に `HTTP/2 200`、`content-length: 1092`（手元の index.html も1092バイト）。公開版とローカル版を `cmp` で比べ、index.html・app.js・style.css・data/phrases.json の4本とも一致 |
| AC9: 各項目に audio 欄があり、値が入っていればその音声ファイルを鳴らす | ○ | Playwright で audio を仮に入れた項目を押し、play が呼ばれるか | `✓ 8 … AC9`。play は1回で、src に `audio/en/01.mp3` を含む。speak は0件、audio の無い項目は speak 1件（`tests/app.spec.mjs:135-155`）。実装は `app.js:105` → `playFile`（`:90-99`）。audio 欄は180件中180件にあり、中身は全件空 |

## 非スコープ違反: なし
- 音声ファイル（mp3・wav・m4a・ogg）は1つも作られていない。アプリ配布用の manifest や sw.js も無い。
- ログイン・課金の仕組みは無い（check-no-external の結果）。
- 端末に残しているのは選んだ言語（`phrase30.lang`、`app.js:163,176`）だけ。学習記録は保存していない。

## 許可外の行為: なし
- 送り先の git の設定は `https://github.com/kentakun709/phrase30-app.git` の1つだけで、これは許可された範囲内。
- 追跡外の `scripts/probe-voices.mjs` は、この Mac の中の 127.0.0.1:8787 にしか繋がない。

## ACの書き方の不備: あり
- **AC7**: 確認方法が「案内の要素が見える」だけで、本文の中身（その言語の音声が無いこと・設定で足せること）を調べていない。そのため Playwright が通っても中身の欠けが見逃される。直すなら、「getVoices を空にした状態と、声はあるが対象言語の声が無い状態の両方で、#notice に言語名（例: タイ語）と『設定』の文字が含まれる」と書く。
- **AC3**: 「実機で耳で確認」は機械では判定できない。誰が、どの端末で、どの言語を確認し、どこに記録すれば○かを書く（例: 「iPhone の Safari で6言語の1番を鳴らし、結果を docs/ に記録」）。
- **AC5**: 「iPhone 13 の設定」が、Playwright 標準の `devices['iPhone 13']`（幅390×高さ664・WebKit）なのか、試験設定の独自の値（幅390×高さ844・Chrome）なのかが書かれていない。判定に効くのは幅390なので結果は変わらないが、どちらを使うか明記するとよい。

## 結論: 未達1件（AC7）／○ 8/9

確認に使ったスクリプト: /private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/measure.mjs（リポジトリのファイルは何も変えていない）
