# 周回4 構造の読み手（reviewer）の原文 — 2026-10-20（P0 0・P1 1＝点数の足し算・P2 9・周回3の10件 ○8△2）

# 周回4 構造の読み手（reviewer）— phrase30-app（commit 87730cc）

**結論: 致命（P0）はありません。重要（P1）が1件あります。声の選び方の点数を足し算にしたため、「自然さを地域より先」が一部で逆になっています。改善（P2）は9件です。周回3の指摘10件は ○8・△2 です。**

前提:
- シェルが使えないため `git diff 62182a2 HEAD` は実行していません。対象の現行版を全文読みました（index.html・app.js・style.css・data/phrases.json・scripts/*.mjs・tests/app.spec.mjs・playwright.config.mjs・README.md・package.json・docs/DECISIONS.md・docs/会議の紙.md・要件定義書）。
- 突き合わせには、周回3の自分の指摘（docs/loop/round-3/reviewer.md）と、LOOP_LOG.md・CURRENT.md・round-4/probe を使いました。LOOP_LOG には他の役の周回3の結果が1行ずつ書かれています。目には入りましたが、指摘の根拠には使っていません。
- 他のレビュアーの原文と judge.md は読んでいません。
- CSS は前の版と比べられないため、見た目が変わったかどうかは確かめられていません。今の版で、同じセレクタが2か所に書かれていないことは確認しました（すべて1か所ずつ）。

---

## 周回3の指摘への対応（○×）

| # | 周回3の指摘 | 判定 | 根拠と残り |
|---|---|---|---|
| P1 | 9・11番の注が英単語 | ○ | 12枚とも各言語の語に直り（phrases.json:476-504, 572-600）、check-data:29 で再発も止めた。残り: 韓国語9番の「일본어를」で助詞が重なる（P2-5） |
| P2-2 | スペイン語の説明と1〜12番の食い違い | ○ | 説明は私の文案どおり（:53）。ただし文案そのものが誤っていた: 19番 `¿Tienen wifi?` は tú ではない（P2-6。私の誤りの訂正） |
| P2-3 | 固定帯の手順の全文・summary 28px・見出し | ○ | 案内の本文は短くなった（app.js:91, 93）。ボタン（:109, :286-290）・声が無い時の見出しと開いた状態（:87, :96）・summary 44px（style.css:43）・帯の高さの試験（spec:173-186）が入った。残り: 毎回開き直す（P2-2）、長い案内の高さは測っていない（P2-3） |
| P2-4 | 閉じた記憶が失敗の案内まで | ○ | 覚えるのは nosynth/novoice だけ（:291）。audiofail は次の押下で消える（:199）。AC7d も実際の動きに合わせた（spec:244-266） |
| P2-5 | NZ 優先が効かない | △ | judge の裁定の前半「NZ は必ず」は入った（:49、spec:338）。後半「自然さを地域より先」は、足し算のため一部で逆になる（P1） |
| P2-6 | 80ms の測り方・2回目の見張り | ○ | stopAll で時刻を記録し（:127-128）、performance.now で測る（:125, :139）。2回目は鳴っていれば黙る（:162-163）。残り: 黙った後に光が残る（P2-8） |
| P2-7 | スクロール位置の記憶 | ○ | 裁定どおり、初めて開く言語は今の位置を引き継ぐ（:256、spec:344-363）。残り: 引き継ぐのが画素の位置なので、同じ番号に揃わない（P2-9） |
| P2-8 | 読み上げの機能が無い時の案内 | ○ | refreshVoices の先頭で案内を出す（:71）。試験も入った（spec:365-374） |
| P2-9 | 中国語の訳と注 | ○ | 中国語19番の訳（:955）、24番の注（:1196）、8番の訳（全言語「話せますか」）がそろった |
| P2-10 | 記録の食い違い・CSS | ○ | README の小見出し名（:15）・試験の本数17本（数えて一致）・DECISIONS の8番・会議の紙:59・CSS の1か所化・PW_PORT は済み。残り: 声の選び方の新しい決まりが会議の紙と DECISIONS に無い（P2-7） |

---

## P0
なし。

## P1

```
Finding: 声の点数を「地域の近さ＋声の質」の足し算にしたため、普通の豪州の声がプレミアムの米国の声に勝ってしまう。「無ければ自然さを地域より先に」という裁定に合わず、コメント・README・言語の説明の「地域の近さは同点の並びだけ」とも食い違う。
Severity: P1
Confidence: High
Evidence: A（コードから計算できる事実）
- 並べ方は合計点（app.js:64）。地域の点は 豪8・英6・愛4・米2（:50）、声の質は premium/enhanced +5・compact −3（:36-37）。
- 豪の普通の声 Karen en-AU（識別名に印なし）は 0+8＝8点。米のプレミアムの声 Samantha（voiceURI に premium）は 5+2＝7点。豪の声が選ばれる。
- スペイン語も同じ: es-ES の普通の声は8点、es-AR のプレミアムの声は 5+2＝7点で、es-ES が選ばれる。
- 自然さが勝つのは「簡易版とプレミアム」の差8がある時だけ。試験もその組み合わせしか見ていない（spec:334, 336, 337）。「普通の声とプレミアムの声」の組み合わせの試験が無い。
- 説明の文: コメント:44「地域の近さ…は同点の並びだけ」・README:27・言語の説明（phrases.json:17）。どれも実際の動きと違う。
- v.default の +1（:38）も合計に入っている。そのため、単純に「質→地域」の順に並べ替えると、端末の既定の声（試験では Samantha en-US default）が豪の声に勝ってしまう（AC3 の試験 spec:98 が落ちる）。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:36-38, 43-53, 64 ／ README.md:27 ／ data/phrases.json:17 ／ tests/app.spec.mjs:320-342
Recommendation: 合計点をやめ、上から順に比べる。順番は NZ → 声の質（既定の声の+1は除く）→ 地域 → 既定の声。
  function quality(v) { return voiceScore(v) - (v.default ? 1 : 0); }
  main.sort(function (a, b) {
    var ra = regionScore(def, normLang(a.lang)), rb = regionScore(def, normLang(b.lang));
    var nz = (rb >= 100 ? 1 : 0) - (ra >= 100 ? 1 : 0);
    return nz || (quality(b) - quality(a)) || (rb - ra) || ((b.default ? 1 : 0) - (a.default ? 1 : 0));
  });
試験を1本足す: pick('en', [{name:'Karen',lang:'en-AU'},{name:'Samantha',lang:'en-US',voiceURI:'com.apple.voice.premium.en-US.Samantha'}]) が 'Samantha'。
:50 のコメント「差 8 と同じ幅」と、使われていない best()（:42）を消す。
```

## P2

```
Finding: 地域より自然な声を選んだ時にも、声の表示に「スペイン語（スペイン）の声が無いので代用」と出る。実際にはその声が端末にある。
Severity: P2
Confidence: High
Evidence: A。代用の文は「選んだ声の地域名が、第1候補の地域名と違う」だけで付く（app.js:101）。試験 spec:337 の場面では、Mónica es-ES（簡易版）があるのに Paulina es-MX（拡張）を選ぶ。表示は「声: Paulina（スペイン語（メキシコ））。スペイン語（スペイン）の声が無いので代用」になる。P1 を直すと、同じ場面がもっと増える。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:99-101
Recommendation: 第1候補の地域の声が state.voices にあるかを見て、表示を分ける。
- ある時: 「。より自然な声を選びました」（または何も付けない）
- 無い時: 今の「…の声が無いので代用」
```

```
Finding: 声が無い言語では、カードを押すたびに「声の足し方」の折り畳みが開き直る。閉じても戻ってしまい、一覧の上に5行ほど差し込まれるので、押したカードの位置がずれる。
Severity: P2
Confidence: High（コード）／Medium（画面のずれ）
Evidence:
- A: speakItem は、声が無い時に毎回 refreshVoices を呼ぶ（app.js:140）。refreshVoices → renderVoiceState が `$howto.hidden = false; $howto.open = true;` を実行する（:96）。voiceschanged（:283）でも同じことが起きる。
- A: 折り畳みは main の中で、一覧のすぐ上にある（index.html:24-25）。
- B: iPhone の Safari には、内容が差し込まれた時に画面の位置を保つ仕組み（スクロールアンカー）が無い。そのため、押したカードが下へずれる見込み（要実機）。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:96, 140, 283
Recommendation: 自動で開くのは、言語ごとに最初の1回だけにする。
  if (state.noVoice && state.howtoAutoOpened !== def.code) { $howto.open = true; state.howtoAutoOpened = def.code; }
setLang で state.howtoAutoOpened を消す。試験を1本足す: 折り畳みを閉じてからカードを押しても、閉じたまま。
```

```
Finding: 帯の高さの試験（≤250px）は、一番短い案内（声が無い）でしか測っていない。それより約2倍長い案内（一覧が未読込・鳴らない＋声が無い）は測っていない。さらに、失敗の案内の1つが、もう無い見出し名を指している。押せる物の大きさにも、ばらつきが残る。
Severity: P2
Confidence: Medium
Evidence:
- A: 長さの比較。試験で測る案内（:93）は約34字。一覧が未読込の案内（:91）は約78字、鳴らない＋声が無い案内（:165）は約72字。どれにもボタン「声の足し方を見る」が付く（:109）。
  一覧が未読込の案内は、iPhone で開いた直後に一番出やすい（会議の紙:51「iOS は最初の操作の後」）。
- B: 幅390では、案内の行は1行約22字。そのため案内が2行ほど増え、帯は 226px＋約40px で 250px を超える見込み（要計測）。
- A: 読み上げの失敗の文「（手順は下の「もっと自然な声にする」）」（:153）。声が無い時の見出しは「【タイ語】の声の足し方」（:87）なので、指している名前が無い。ボタンもあるので、この括弧はもう要らない。
- A: 新しいボタン .nlink は min-height 32px（style.css:29）。ほかの押せる物は 44px にそろえてある。
- B: `.howto summary{display:flex}`（style.css:43）。Chrome では開閉の三角が出なくなる。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:91, 153, 165 ／ style.css:29, 43 ／ tests/app.spec.mjs:173-186
Recommendation:
- 文を短くする。
  - 「音量と消音（マナーモード）」は .hint にすでにあるので外す。
  - 「（手順は下）」と「（手順は下の…）」は、ボタンがあるので外す。
  - 未読込の文は「声の一覧をまだ読めていません。カードを1回押してください」にする。
- AC5b に、未読込（MOCK_SYNTH([])）と「鳴らない＋声が無い」（__silent）の2つの場面を足し、両方で ≤250 を確かめる。
- .nlink を min-height:44px にする。
- summary は display を変えずに `min-height:44px; line-height:44px` にする（または三角を `::before` で自分で描く）。
```

```
Finding: 韓国語9番の注「〇〇に 일본어를 を」をそのまま入れると、型 `왜 〇〇을/를 공부하세요?` の助詞と重なり、「일본어를을/를」になる。11番の注（일본어）とも形がそろっていない。
Severity: P2
Confidence: High
Evidence: A。型は phrases.json:480、注は :483、11番の注は :579。日本語の「を」が韓国語の「를」の直後に来るので、読みにくくもある。
場所: /Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:483
Recommendation: 注を「相手に聞かれる形（答えは10番）。自分が聞くなら〇〇に 일본어（助詞は 를）」にする。
```

```
Finding: スペイン語の説明の「tú（1〜19番）」が19番と合わない。19番 `¿Tienen wifi?` は、店に向けて聞く ustedes（3人称の複数）の形。周回3で私が出した文案の誤りなので、訂正します。
Severity: P2
Confidence: High
Evidence: A。説明は phrases.json:53、19番は :967-968。tú の形が使われているのは、1〜18番の質問文だけ。
場所: /Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:53
Recommendation: 説明を次の文にする。「友達・同年代との会話は tú（1〜18番）。店や店員・目上の人には usted（19番は店に聞く Tienen、20・27・30番）。スペインでも中南米でも通じる言い方」
```

```
Finding: 声の選び方の決まりが変わったのに、Kenta が読む「仮に置いたこと」と DECISIONS は古い決まりのまま。
Severity: P2
Confidence: High
Evidence: A。
- 古い決まり: 会議の紙:57「英語の声の優先順: en-NZ → en-AU → en-GB → その他」、:58「スペイン語 es-ES（無ければ es-*）」。DECISIONS.md:11「英語の声は en-NZ→en-AU→en-GB→en-*」。
- 今の動き: 周回3 judge の裁定（端末内の声を先・NZ は必ず・自然さを地域より先）。試験 spec:337 では、es-ES があっても es-MX を選ぶ。
- DECISIONS に、この裁定の記録が無い。会議の紙:55 は「違えば『直して＋一言』」と Kenta が読む前提の欄。
場所: /Users/omoya160/Kenta/dev/phrase30-app/docs/会議の紙.md:57-58 ／ docs/DECISIONS.md:5（追記先）
Recommendation:
- DECISIONS に「2026-10-20（周回3 judge）: 声は端末内の声から選ぶ（通信する声は、端末内に無い時だけ）。英語は NZ があれば必ず NZ。無ければ、自然さ（プレミアム・拡張）を先にし、地域の近さは同じ質の時だけ」を足す。理由として、要件の2文（要件定義書:11・:24）を書く。
- 会議の紙:57-58 を同じ文に書き換える。
```

```
Finding: アプリは「名前に『拡張』か『プレミアム』と付いた声を入れて」と案内している。しかし声の点数は英語の premium/enhanced しか見ない。日本語表示の端末の Chrome では、入れた高品質の声を見分けられないおそれがある。
Severity: P2
Confidence: Low
Evidence:
- A: 案内の文（app.js:80）。点数の語は英語だけ（:37 premium|enhanced…、:36 compact）。
- B: iPhone の Safari は voiceURI に com.apple.voice.enhanced… が入るので、見分けられる（試験の形もこれ）。一方、Mac の Chrome では voiceURI が名前と同じになる。
- C: 日本語表示の端末で、Web Speech API が返す声の名前が「（プレミアム）」「（拡張）」になるかは未確認。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:36-37, 80
Recommendation: 加点の語に「拡張」「プレミアム」を足す（:37 の正規表現を `/premium|enhanced|neural|natural|wavenet|journey|studio|siri|拡張|プレミアム/` にする）。Kenta の Mac で、プレミアムの声を1つ入れた状態で scripts/probe-voices.mjs を回し、名前の出方を確かめる。
```

```
Finding: 2回目の見張りが「鳴っているので黙る」と決めた後、光を消す人がいない。onstart も onend も来ない端末では、カードが光ったまま残る。
Severity: P2
Confidence: Low
Evidence:
- A: :163 で return した後、見張りを張り直さない。光は :156 で付けていて、消すのは onend・onerror・stopAll だけ（:148, :151, :134）。
- B: 前提にしている「onstart が来ない端末」では、onend も来ないことがある（要検証）。その場合は、次に押すまで光ったまま。要件の「再生中を視覚的に分かるようにする」に反する。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:157-166
Recommendation: :163 を次のようにする。鳴っていれば1秒ごとに見直し、止まったら光を消す。上限は30秒。
  if (speaking) { (function poll(k){ state.watchdog = setTimeout(function(){ if (state.utter !== u) return; var s=false; try{ s=!!synth.speaking; }catch(e){} if (s && k<30) poll(k+1); else setPlaying(null); }, 1000); })(0); return; }
```

```
Finding: 初めて開く言語に引き継ぐのが画素の位置なので、同じ番号のカードに揃わない。また、localStorage に残るので、引き継ぎが効くのは各言語でその端末で最初の1回だけ。
Severity: P2
Confidence: Medium
Evidence:
- A: 引き継ぐのは window.scrollY の値（app.js:246, 256）。位置の記録は端末に残る（:267, :275-277）。そのため、2回目からは `code in state.scroll` が常に真になる。
- B: 1枚の高さは言語ごとに違う。注の有無（英語は9枚に注、中国語は4枚）や、ロシア語・スペイン語の長い文の折り返しで変わる。声が無い言語では、一覧の上で折り畳みが開く。だから同じ画素の位置でも、見えている番号がずれる（要計測）。
- A: 試験は「1000px より下」しか見ていない（spec:352）。
場所: /Users/omoya160/Kenta/dev/phrase30-app/app.js:246-259 ／ tests/app.spec.mjs:344-363
Recommendation: 裁定（言語ごとに覚える）は残し、初めて開く時だけ番号で引き継ぐ。
- 切り替える前に、帯のすぐ下に見えている最初のカードの data-n を取る。
- renderList の後、そのカードの上端を「帯の高さ＋8px」の所へ戻す。
- 試験は「英語で20番が帯の下に見えている → 初めて中国語へ → 20番が帯の下に見えている」に変える。
```

---

## 訳の差分（観点3）の所見
- 9・11番の注: 中国語（日语）・スペイン語（japonés）・ロシア語（японский。対格でも形が同じなのでそのまま正しい）・タイ語（型に ภาษา が入っているので ญี่ปุ่น だけでよい）・韓国語11番（일본어）は、どれも正しく自然です。誤りは韓国語9番の助詞の重なりだけです（P2-5）。
- スペイン語20番 `¿Puede repetirlo, por favor?`＋注「友達には ¿Puedes repetirlo?」は自然です。地域も選びません。
- タイ語3番 `บ้านคุณอยู่ที่ไหนครับ`、英語28番 `I'll have this one, please.`、韓国語5番 `민수 씨는요?`（注「名前の後に 씨」）は、どれも自然です。
- 中国語19番の訳と24番の注は、例文と合いました。24番の注の「〇路」は、置き換えの印「〇〇」と見た目が似ています。ただし文の中で意味は通るので、直さなくてよい範囲です。
- 8番の訳は「話せますか」に統一され、方針（DECISIONS:5-8）とも合っています。

## 良い点
1. 閉じた案内の扱いが、筋の通った形になった。状態を知らせる案内（声が無い・読み上げが無い）は閉じたら覚え、失敗の知らせは閉じても次に失敗すればまた出る。それを AC7d が順に確かめている（spec:244-266）。
2. 周回3の注の誤りを、データの点検で止めた（check-data:29）。直したものが戻らない形になっている。
3. CSS の上書きを全部なくし、1つのセレクタは1か所だけになった。後で触る人が、元の行を直しても効かない、ということが無くなった。

## 総評
1. 周回3の指摘は ○8・△2 です。致命は無く、案内・80ms・読み上げが無い時の案内の直しは、狙いどおりに効いています。
2. 残る P1 は1件です。声の点数の足し算で、「普通の豪州の声 > プレミアムの米国の声」になります。上から順に比べる形に変え（既定の声の+1は最後に回す）、試験を1本足せば直ります。あわせて、代用の表示と、会議の紙・DECISIONS の記録もそろえてください。
3. 新しい穴は、直したところの副作用が中心です（折り畳みが毎回開く、長い案内の帯の高さ、画素での引き継ぎ）。データは、韓国語9番の助詞と、スペイン語の説明の「1〜19番」（私の前回の文案の誤り）の2か所だけです。

主な対象ファイル:
- /Users/omoya160/Kenta/dev/phrase30-app/app.js
- /Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json
- /Users/omoya160/Kenta/dev/phrase30-app/style.css
- /Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs
- /Users/omoya160/Kenta/dev/phrase30-app/README.md
- /Users/omoya160/Kenta/dev/phrase30-app/docs/会議の紙.md
- /Users/omoya160/Kenta/dev/phrase30-app/docs/DECISIONS.md
