# 周回2 構造の読み手（reviewer）の原文 — 2026-10-20（P1 1・P2 9）

注記: この環境ではシェルが使えないため `git diff 6fe8da6 HEAD` は実行していません。代わりに、指定の全ファイルの現行版を全文読み、周回1の judge の修正リスト（docs/loop/round-1/judge.md）と1項目ずつ突き合わせました。

周回1の修正リスト10項目の状況: 完了7・一部だけ3。
- 項目2: 手順の長文を `<details>` で畳む件は未実施。
- 項目4: 見張りが pending を見ていない。onstart が来たら案内を消す処理も無い。
- 項目7: 露 n11 の型が `долго` のまま。

---

Finding: 「鳴りませんでした」「読み上げに失敗しました」の案内が、次に鳴っても消えません。さらに見張りが pending を見ていないので、声の読み込みが遅いだけの時にも誤報を出します。
Severity: P1
Confidence: High（消えない点）／Medium（誤報の頻度）
Evidence: A。`app.js:138` は `synth.speaking` しか見ていない。`app.js:121` の onstart は `clearWatchdog(); setPlaying(n)` だけで、案内を消していない。案内を消す道は `hideNotice('novoice:')`（79行）、言語の切替（215行）、閉じるボタン（241行）の3つだけで、キーが `silent`・`err`・`audiofail` の案内は残り続ける。judge の項目4は「`!synth.speaking && !synth.pending`」と「onstart が後から来たらその案内を消す」を指定していた。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:121, 127, 134, 136-142
Recommendation:
- u.onstart と a.onplay に `hideNotice('silent'); hideNotice('err'); hideNotice('audiofail');` を足す。
- 見張りは `speaking || pending` の時に一度だけ2.5秒張り直し、2回目は無条件で案内を出す（iOS で pending のまま固まる時も拾える）。
- AC7c に「`__silent=false` に戻して押すと `#notice` が消える」を追加する。

Finding: 鳴っている最中に80ms以内で2回押すと、2回目は wasBusy が false と判定され、80ms待たずに speak します。「止めた直後の speak が落ちる」への対策が効きません。
Severity: P2
Confidence: Medium
Evidence: B。1回目の押下の stopAll で cancel 済みのため、2回目の押下の時点では `synth.speaking`・`synth.pending` が false（168行）。その結果、30ms前に鳴っていた読み上げを止めた直後に `go()` が即時に走る（144行）。押下が意図せず落ちる経路は見つからなかった（追い越された押下だけが捨てられる）。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:144, 168
Recommendation:
- play() で `if (wasBusy) state.busyCancelAt = Date.now();` と記録する。
- 待ち時間を `Math.max(0, 80 - (Date.now() - (state.busyCancelAt || 0)))` で決め、speakItem に渡す。
- 差し替えの mock に時刻を記録させ、「鳴っていた物を止めた cancel から次の speak まで80ms以上」を試験に入れる。
- iPhone 実機で、遅らせた speak が鳴るかを未確認項目に挙げる。

Finding: 閉じた案内を覚える枠が1つしかありません。別の案内を閉じると前に閉じた案内がまた出ます。「まだ読み込めていない」と「声が入っていない」が同じキーなので、前者を閉じると後者も出ません。閉じた後は「声が無い」ことが画面のどこにも残りません。
Severity: P2
Confidence: High
Evidence: A。
- 87行の `key === state.dismissed` は文字列1つだけを見ている。
- 73行と75行が同じ `'novoice:' + def.code` を使っている。
- 声が無い時は 77行で `$voiceinfo.textContent = ''` になる。
- 具体例（タイ語）: novoice を閉じる → 押す → 見張りが `silent` を出す → それを閉じる → 次に押すと 114行の refreshVoices から novoice がまた出る。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:73-77, 86-90, 241
Recommendation:
- `state.dismissed` を `{}` にし、閉じる時に `state.dismissed[state.noticeKey] = true` とする。
- キーを `novoice-empty:<code>` と `novoice:<code>` に分ける（`hideNotice('novoice')` で両方消える）。
- 声が無い間は `#voiceinfo` に「声: なし（タイ語の声がこの端末にありません）」を常に出す。

Finding: 周回2で固定ヘッダーに常時出る行が増えました（使い方の1行・言語の説明・ゆっくり）。声が無い時はそこに長い手順の案内が乗ります。新しく足したボタンは44px未満です。
Severity: P2
Confidence: Medium
Evidence:
- A: `.toggle{min-height:32px}`（style.css:50）、`.nclose{min-width:28px;min-height:28px}`（:54）。`.top` は sticky（:15）。
- A: judge の項目2は「手順の長文は `<details>` で畳み、固定ヘッダーを占領しない」だったが未実施。
- B: 小さい画面では、カードが見える範囲が大きく減る。
- A: 同じ規則の書き重ね `.notice`（24/52）・`.voiceinfo`（26/49）・`.card .note`（36/56）が後の編集で混乱を招く。
場所: /Users/omoya160/Kenta/dev/phrase30-app/style.css:15, 24-26, 36, 44-56 ／ /Users/omoya160/Kenta/dev/phrase30-app/index.html:15-21 ／ /Users/omoya160/Kenta/dev/phrase30-app/app.js:65-67
Recommendation:
- `.toggle` と `.nclose` を `min-height:44px`（nclose は `min-width:44px` も）にする。
- `.hint` と `#langnote` を `.top` の外（`main` の先頭）へ出す。
- howToAdd の手順を `<details><summary>声の足し方</summary>…</details>` で畳む。
- Playwright で 390×667・タイ語・案内ありの `.top` の高さを測り、上限を決めて試験に入れる。
- 書き重ねた規則は1か所にまとめる。

Finding: 声の表示が言語タグの完全一致で比べています。普通話の別表記（`cmn-Hans-CN`・`zh-Hans-CN` 等。データ自身が優先リストに入れている形）の声が選ばれると、「中国語（普通話）の声はこの端末に無いため」と事実と逆のことを出します。文も「〜無いため」で途切れています。
Severity: P2
Confidence: Medium
Evidence:
- B: 82行の `vl !== first` で、`cmn-hans-cn` と `zh-cn` は一致しない。
- A: langJa は `中国語（cmn-hans-cn）` を返すので、1行の中で矛盾する。
- A: 文末が「無いため」で終わっている。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:13-16, 80-83
Recommendation:
- 82行の条件を `LANG_JA[vl] && LANG_JA[vl] !== LANG_JA[first]` に変える（別の地域だと分かる時だけ書く）。
- LANG_JA に `zh-hans`・`zh-hans-cn`・`cmn-cn`・`cmn-hans-cn` → '中国語（普通話）' を足す。
- 文を「…の声がこの端末に無いので、代わりにこの声を使っています」にする。

Finding: 「端末内の声を常に先に」と書いてありますが、+20点は同じ地域の中でしか効きません。上位の地域に通信する声があると、下位の地域の端末内の声より先に選ばれます（例: Edge のニュージーランド英語のオンライン音声が、端末内の英国英語・米国英語より先）。
Severity: P2
Confidence: Medium
Evidence:
- A: 地域の順に回して、候補があればそこで決まる（44-48行）。点数は `best()` の中でだけ比べている。
- A: コメント（34行）と README:27 の記述と食い違っている。
- B: Edge のニュージーランド英語は通信する声として出てくる。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:34, 39-55 ／ /Users/omoya160/Kenta/dev/phrase30-app/README.md:27
Recommendation:
- pickVoice を2段にする。1段目は `voices.filter(v => v.localService !== false)` で今の全手順を回し、見つからなければ2段目で全部の声に対して回す。
- 試験に `pick('en', [{name:'Molly Online', lang:'en-NZ', localService:false}, {name:'Karen', lang:'en-AU'}]) === 'Karen'` を足す。
- 通信してでもニュージーランドの声を優先すると決めるなら、コメントと README の方を「同じ地域の中では端末内を先に」に直す。

Finding: 周回2で例文だけ直し、型を古いまま残した所があります。カードの「言い換えの型」に、丁寧さや意味が例文と食い違う文が出ます。
Severity: P2
Confidence: High
Evidence: A。食い違っている所:
- 韓 n2: 型 `어디에서 왔어요?`、例文 `어디에서 오셨어요?`（144-145行）
- 韓 n3: 型 `어디에 살아요?`、例文 `어디 사세요?`（192-193行）
- 韓 n15: 型 `언제 〇〇어요?`（過去形の印が無い）、例文 `여기 언제 오셨어요?`（768-769行）
- 西 n27: 型 `¿Qué me recomiendas?`（tú）、例文 usted（1351-1352行）
- 露 n11: 型 `Как долго…`、例文 `Как давно…`（590-591行。judge が「型も давно」と指定していた）
- タイ n3: 型 `คุณอยู่ที่ไหนครับ` は「今どこにいますか」とも取れる。例文は `คุณอาศัยอยู่ที่ไหนครับ`（213-214行）
場所: /Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:144, 192, 768, 590, 1351, 213 ／ /Users/omoya160/Kenta/dev/phrase30-app/app.js:201
Recommendation:
- 型を次のように直す。
  - 韓 n2 → `어디에서 오셨어요?`
  - 韓 n3 → `어디 사세요?`
  - 韓 n15 → `언제 〇〇(으)셨어요?`
  - 西 n27 → `¿Qué me recomienda?`
  - 露 n11 → `Как давно вы учите 〇〇?`
  - タイ n3 → 例文と同じにする
- 原文に〇〇が無い項目で型と例文が違う時は、見出しを「言い換えの型」ではなく「別の言い方」にする（app.js:201 で `p.ja.includes('〇〇')` を見て切り替える）。

Finding: 韓国語を「〜세요に統一」としたはずが統一されておらず、同じ形の文で敬語の有無が分かれています。
Severity: P2
Confidence: High（不一致があること）／Medium（どちらに揃えるか）
Evidence: A。
- n8 は `한국어 할 줄 아세요?`、n18 は `수영할 줄 알아요?`（同じ「할 줄 알다」の形）。
- n7 は `무슨 일 하세요?`、n9 は `왜 한국어를 공부해요?`。
- n4 `잘 지내요?`、n13 `가 본 적 있어요?`、n16 `좋아해요?` も -시- が無い。
- 文としてはどれも自然だが、言語の説明と周回2の方針（統一）に合っていない。
場所: /Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:241, 433, 481, 673, 817, 913（言語の説明は 40行）
Recommendation:
- 相手の動作を聞く文を -시- に揃え、型も合わせる: n4 `잘 지내세요?`／n9 `왜 한국어를 공부하세요?`／n13 `일본에 가 보신 적 있으세요?`／n16 `초밥 좋아하세요?`／n18 `수영할 줄 아세요?`。
- 揃えないなら、周回2の報告と言語の説明を「〜요が基本。相手の動作には〜세요も」に直す。

Finding: スペイン語は usted を n27 にしか使っていません。見知らぬ人や店員に向けやすい n20・n30 が tú のままで、特に n30（「〜していただけますか」）は他の5言語と丁寧さがずれています。n14 の `hacer una foto` は、言語の説明にある「スペインでも中南米でも通じる」より、スペイン寄りの言い方です。
Severity: P2
Confidence: Medium
Evidence: B。
- n30 は `¿Me podrías ayudar?`（1496行）。韓・露は同じ項目で敬語（`도와주시겠어요`・`Вы не могли бы`）を使っている。
- n20 は `¿Puedes repetirlo…?`（1016行）。
- 言語の説明（53行）は「店員には usted（27番）」としている。
場所: /Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:53, 728, 1016, 1495-1496
Recommendation:
- n30 を `¿Me podría ayudar?`（型 `¿Me podría 〇〇?`）にする。
- n20 を `¿Puede repetirlo, por favor?` にする。
- n14 を `¿Puedo tomar una foto?` にする。
- 言語の説明を「友達には tú、店員・初対面には usted（20・27・30番）」に直す。

Finding: 音声ファイル欄の点検が先頭の「/」を通してしまいます。GitHub Pages の案件サイトでは `/audio/...` がドメイン直下を指して 404 になります（読み上げには戻るが、差し替えが効かない）。
Severity: P2
Confidence: High
Evidence: A。`/^(?!\/\/)(?![a-z]+:)[^\s]+$/i` は `/audio/th/01.mp3` を通す（check-data.mjs:33）。同じ趣旨の点検が check-no-external.mjs:18 にもあり、二重になっている。
場所: /Users/omoya160/Kenta/dev/phrase30-app/scripts/check-data.mjs:33 ／ /Users/omoya160/Kenta/dev/phrase30-app/scripts/check-no-external.mjs:18
Recommendation:
- check-data の条件を `/^audio\/[^\s]+$/`（README の置き場 `audio/` に限る）に変える。
- check-no-external 側の audio の点検は消して、1か所にする。

---

良い点
1. 世代番号と `state.utter` の二重の守りが一貫しています。stopAll が utter を消し、見張りを止め、audio のハンドラも外します。go() は両方を確かめます。周回1の「止めた読み上げの遅いイベントで新しい方の光が消える」は直り、AC4 の後半で試験されています。
2. 訳の方針が機械で点検されています。180件、〇〇入りの型、例文と訳に〇〇が残っていないこと、タイ語の文末 ครับ、audio は相対パスであることを、check-data が見ています。
3. AC9 の戻り道が素直です。404 でも再生拒否でも `fell` の旗で1回だけ読み上げに戻り、本物の WAV と 404 の両方で試験されています。

総評
1. 周回1の致命2件（段組み・AC7 の文面）と P1 の大半は直っており、新たな致命は見当たりません。
2. 新しい穴は P1 が1件です（失敗の案内が成功後も残り、見張りが pending を見ないため誤報が出る）。残りは、80ms 回避の漏れ・閉じた案内の扱い・声の表示の誤り・端末内の声を先にする範囲などの P2 です。
3. 訳は全体に自然です。n24 と n27 の揃え方もおおむね妥当です（気になるのは西 n27 の型に tú が残る点と、中 n24 の訳注「何路の」が日本語として通じにくい点）。ただし、例文だけ直して型を残した6か所と、韓国語の「〜세요統一」が徹底されていない点は直してほしいです。

主な対象ファイル:
- /Users/omoya160/Kenta/dev/phrase30-app/app.js
- /Users/omoya160/Kenta/dev/phrase30-app/style.css
- /Users/omoya160/Kenta/dev/phrase30-app/index.html
- /Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json
- /Users/omoya160/Kenta/dev/phrase30-app/scripts/check-data.mjs
- /Users/omoya160/Kenta/dev/phrase30-app/scripts/check-no-external.mjs
- /Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs
- /Users/omoya160/Kenta/dev/phrase30-app/README.md
