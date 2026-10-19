# 周回4 judge の原文 — 2026-10-20（87/100・不合格＝P1 3・周回5の修正9件）

# 周回4 judge 裁定 — phrase30-app（commit 87730cc・2026-10-20）

前提: `/Users/omoya160/Kenta/dev/phrase30-app/.git/refs/heads/main` = 87730ccff… で審査対象＝作業ツリー。index.html・app.js・style.css・data/phrases.json（全1535行）・tests/app.spec.mjs・scripts/*.mjs・playwright.config.mjs・README・DECISIONS・会議の紙・要件 v0.1・LOOP_LOG・PIPELINE・周回3 judge・周回4の4本のレビューと probe を全文読んだ。上に書いた6点は自分で現物を当たって確かめた。fact-checker の報告は今回なし（訳はAI製・ネイティブ未検品と画面の脚注に明記済みで、法令・重大な事実誤りには当たらない）。

## ① 採点（`AI-OS/QUALITY_GATE.md`「コード・スクリプト」5軸）
| 軸 | 周回3 | 周回4 | 根拠（1行） |
|---|---|---|---|
| 要件適合 | 17 | 18 | AC 9/9 を3者（検査官・東条の橋渡し・作る側×2周）が独立に確認。NZ 必須・端末内優先・案内の短縮・非対応ブラウザの案内は入った。残: 「自然な声を優先」が「普通の豪 vs プレミアムの米」で逆転／長い案内の時の帯の高さが未計測（画面の3割を超える見込み） |
| 正しさ | 16 | 17 | 周回3の P1 4件は4件とも入った（9/11番の注・閉じた記憶・案内の手順・NZ）。残: 足し算の逆転／「声の足し方」が毎回開き直り声が見つかっても閉じない（作る側も Mac Chrome で再現）／「代用」の誤表示／ko n9 の助詞／es 説明の「1〜19番」／失敗案内が無い見出し名を指す |
| テスト | 16 | 17 | 17本を3者が独立実行（34/34・17/17・17/17）・PW_PORT・帯の高さ・非対応ブラウザ・スクロール引き継ぎ・声選び13検。残: 「普通 vs プレミアム」の組み合わせが無い（東条の追加模擬で2件×）／長い案内の帯／折り畳みの開閉／「代用」の表示 |
| 保守性 | 15 | 17 | README の本数・小見出し・CSS 1か所化・DECISIONS の8番・会議の紙の AC3/5/6 が合った。残: 声の決まりが会議の紙:57-58・DECISIONS:11 で古いまま／app.js:43-45 のコメントと README:27 が実際の動き（足し算）と違う／未使用の `best()`:42 |
| 安全性 | 18 | 18 | 変更なし（check-no-external 3/3・audio は audio/ 配下だけ・esc・秘密なし） |
| **合計** | **82** | **87** | **+5**（PDCA 停止条件に当たらず。周回5は上限） |

## ② 合否: **不合格**（87 ≥ 85 だが P1 3件。追加ゲート＝実行テスト PASS・AC 9/9・公開版 cmp 一致 は満たす）
統合後の集計（重複は1件に）: **P0 0・P1 3・P2 13**。棄却 3・Idea 1・Experiment 3（下）。

### 争点の裁定
**(1) 声の比べ方 → 「上から順」に変える（足し算をやめる）。順は NZ → 自然さ（既定の +1 は除く）→ 地域 → 既定の声 → 名前。** 理由: v0.1 の主文は「端末内の音声から自然な声を優先」で、周回3の裁定文も「自然さを地域より先・地域は同点の並びだけ」。**足し算の具体的な処方（差8と同幅）は周回3の judge＝私の誤りで、「簡易 vs プレミアム」の時しか意図どおりにならない。** 作る側は処方どおりに実装しており、責めは処方にある。構造の読み手・東条が独立に一致（A・Node 模擬で再現）。上から順にしても既存13検＋AC3 は全部通ることを追った。同点の列挙順依存（東条 P2-1・周回3から持ち越し）も同じ1か所で消す。
**(2) 周回5で合格に届かない場合**: 周回5で P0=0・AC 9/9・試験 PASS なら、残った P1/P2 を納品報告の「既知の制約」に書いた上で妥協受領を提案して /submit（上限5＝人間へ上げる条件。Kenta の「OK／直して」が最終判断）。P0 か AC× が出たら提出せず止めて報告。

### 訳の裁定（言語ごと）
- **英語**: 採る＝説明(:17)を声の仕組みの説明から「言い方の注意」に（声は帯と README が言う）。採らない＝n27 の短い形を主役に（周回2・3の裁定。注で十分）。
- **中国語**: 採る＝8番に「旅先で通じる言葉を聞く形。自分の言語なら〇〇に 日语」の注。採らない＝n24「〇路」の表記変更（意味は通る。構造の読み手も不要と判断）。
- **韓国語**: 採る＝n9 の注を「〇〇을/를 の所を 일본어를 に」（3者一致）・8番の注。採らない＝他（n5・n11 は自然）。
- **スペイン語**: 採る＝説明を「tú（1〜18番）／usted（19番は店に聞く Tienen・20・27・30番）」（2者一致。周回3で私が通した文案の誤り）・8番の注。採らない＝他（n20 は自然）。
- **ロシア語**: 採る＝説明に ты の実例（1番 Как тебя зовут?）を足す（使う人役。今の「4番はそのまま」は ты の例になっていない）・8番は既存の注に「日本語なら по-японски」を1語足す。採らない＝n26 の変更（周回2・3の裁定）。
- **タイ語**: 採る＝8番の注・「別の言い方」の見出しに「鳴るのは上の文」（読めない文字で効く。th n12/n27/n28 に当たる）。採らない＝他（n3 は自然）。

## ③ 優先修正リスト（重要度順・9件。周回5は最後なので全部入れる。終わったら `npm run check` → `PW_PORT=<空き> npx playwright test` を直列で2回 → commit → 公開版 cmp → 再審査）

1. **[P1] `/Users/omoya160/Kenta/dev/phrase30-app/app.js:31-68`・`tests/app.spec.mjs:320-342`** — 点数の足し算で「普通の豪 8 > プレミアムの米 7」「普通の es-ES 8 > プレミアムの es-AR 7」になり、裁定・コメント:44・README:27 の「自然さが先・地域は同点の並びだけ」と食い違う。同点は列挙順依存（東条）。→ (a) :38 の `if (v.default) s += 1;` を voiceScore から消す。(b) :42 の未使用 `best()` を消す。(c) :64 の sort を上から順に: `main.sort(function (a, b) { var ra = regionScore(def, normLang(a.lang)), rb = regionScore(def, normLang(b.lang)); var nzA = ra >= 100 ? 1 : 0, nzB = rb >= 100 ? 1 : 0; return (nzB - nzA) || (voiceScore(b) - voiceScore(a)) || (rb - ra) || ((b.default ? 1 : 0) - (a.default ? 1 : 0)) || String(a.name + '|' + a.voiceURI).localeCompare(String(b.name + '|' + b.voiceURI)); });`（regionScore は NZ=100 のまま。:50 のコメント「差 8 と同じ幅」は消す）。(d) :43-45 のコメントを「NZ があれば必ず → 自然さ → 地域 → 既定の声 → 名前（上から順。足し算ではない）」に。(e) 試験「声の選び方」に4本足す: `pick('en',[{name:'Karen',lang:'en-AU'},{name:'Samantha',lang:'en-US',voiceURI:'com.apple.voice.premium.en-US.Samantha'}])==='Samantha'`／`pick('es',[{name:'Mónica',lang:'es-ES'},{name:'Diego',lang:'es-AR',voiceURI:'com.apple.voice.premium.es-AR.Diego'}])==='Diego'`／`pick('en',[{name:'Zoe',lang:'en-AU'},{name:'Amy',lang:'en-AU'}])` と逆順の結果が同じ／`pick('en',[{name:'Karen',lang:'en-AU'},{name:'Samantha',lang:'en-US',default:true}])==='Karen'`。既存13検と AC3 はそのまま通る（追った）。README:27 の文も「上から順」に直す（項目6）。

2. **[P1] `/Users/omoya160/Kenta/dev/phrase30-app/app.js:6-7（state）・84-104（renderVoiceState）・286-290（noticehow）`・`tests/app.spec.mjs`** — 声なしの言語で押すたびに「声の足し方」が開き直り（:96・:140）、声の一覧が一瞬空だった後に声が見つかっても開いたまま（:103 に閉じる処理なし。構造の読み手 P2-2・使う人役 P2-1・作る側の画面写しが一致）。→ state に `howtoAuto: {}` を足す。:96 を `$howto.hidden = false; if (!state.howtoAuto[def.code]) { $howto.open = true; state.howtoAuto[def.code] = 'open'; }` に。:103 の直後に `if (state.howtoAuto[def.code] === 'open') { $howto.open = false; state.howtoAuto[def.code] = 'closed'; }`（使う人が自分で開けた物は畳まない）。:287 の noticehow 押下で `state.howtoAuto[state.lang] = 'user';`。試験1本「声の足し方は言語ごとに1回だけ自動で開き、閉じたら押しても開き直さず、声が見つかったら畳む」: `MOCK_SYNTH([Samantha en-US])` → th → `#howto` の open が true → `#howtosum` を押して閉じる → 1番を押して 200ms → open が false のまま → `__fireVoices([Samantha, Kanya th-TH])` → open false・`#notice` hidden。続けて `MOCK_SYNTH([])` で開いた直後 open true → `__fireVoices(VOICES_ALL)` → open false・`#voiceinfo` に Karen。

3. **[P1] `/Users/omoya160/Kenta/dev/phrase30-app/app.js:99-101`・`tests/app.spec.mjs:320-342`** — 第1候補の地域の声が端末にあっても、より自然な別地域の声を選ぶと「〇〇の声が無いので代用」と出る（事実と違う。構造の読み手 P2-1・使う人役「嘘くさい」が一致）。括弧の二重「（スペイン語（スペイン）・簡易版）」も同時に。項目1で起きる場面が増える。→ :99-101 を `var vl = normLang(state.voice.lang), first = normLang(def.bcp47[0]); var hasFirst = state.voices.some(function (v) { if (v.localService === false) return false; var l = normLang(v.lang); return l === first || l.indexOf(first + '-') === 0; }); var txt = '声: ' + state.voice.name + '・' + langJa(vl) + (isCompact(state.voice) ? '・簡易版' : ''); if (!hasFirst && LANG_JA[vl] && LANG_JA[first] && LANG_JA[vl] !== LANG_JA[first]) txt += '。' + LANG_JA[first] + 'の声が無いので代用';`（AC3 :101-103 の Karen・オーストラリア英語・末尾「代用」はそのまま通る）。試験「声の選び方」の末尾に: `__fireVoices([{Mónica es-ES voiceURI com.apple.voice.compact.es-ES.Monica},{Paulina es-MX voiceURI com.apple.voice.enhanced.es-MX.Paulina}])` → es タブ → `#voiceinfo` に Paulina を含み「代用」を含まない。

4. **[P2・3者/2者一致] `/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:483,53`** — ko n9 の注を型に当てると `일본어를을/를`（構造の読み手・使う人役・東条）。es 説明「tú（1〜19番）」が19番 `¿Tienen wifi?` と合わない（構造の読み手・使う人役）。→ :483 を「相手に聞かれる形（答えは10番）。自分が聞くなら 〇〇을/를 の所を 일본어를 に」。:53 を「友達・同年代との会話は tú（1〜18番）。店や店員・目上の人には usted（19番は店に聞く Tienen、20・27・30番）。スペインでも中南米でも通じる言い方」。`node scripts/check-data.mjs` を通す。

5. **[P2] `/Users/omoya160/Kenta/dev/phrase30-app/app.js:91,153,165,171`・`style.css:29,43`・`tests/app.spec.mjs:173-186`** — 帯の高さの試験は一番短い案内（34字）しか測っておらず、未読込（78字）・鳴らない＋声なし（72字）は 250px と画面の3割（253px）を超える見込み。:153 は声なしの時に存在しない見出し「もっと自然な声にする」を指す。:165 は声が無いのに「もう一度押して」が先頭。`.nlink` 32px・summary の display:flex で開閉の印が消える。→ :91 を「声の一覧をまだ読めていません。カードを1回押してください。それでも【X】が鳴らない時は、端末の設定で声を足せます。」（AC7b の「英語」「設定」は残る）。:153 を「読み上げに失敗しました。端末に【X】の音声があるか確かめてください。」（括弧を消す）。:165 を `state.noVoice ? '鳴りませんでした。この端末に【X】の声が無いためです。端末の設定で足せます。' : '鳴りませんでした。もう一度押してください。音量と消音（マナーモード）も確かめてください。'`（AC7d の「鳴りませんでした」は残る）。:171 の末尾も「【X】の声は端末の設定で足せます。」に。style.css:29 を `min-height:44px;display:inline-flex;align-items:center`、:43 は `display:flex` をやめ `display:list-item;line-height:44px`（印を残す）。AC5b に2場面を足す: `MOCK_SYNTH([])` で開いた直後（en・未読込の案内）と、`MOCK_SYNTH([Samantha])` → th → `__silent=true` で1番を押して「鳴りませんでした」が出た後。両方で `.top` の高さ ≤ 250 かつ < 844×0.3。超えたら文をさらに削る。

6. **[P2] 記録と設定の整合 `/Users/omoya160/Kenta/dev/phrase30-app/docs/DECISIONS.md:5（追記先）`・`docs/会議の紙.md:57-58`・`README.md:27`・`docs/LOOP_LOG.md`・`docs/PIPELINE.md`** — 声の決まりが Kenta の読む「仮に置いたこと」と DECISIONS で「en-NZ → en-AU → en-GB → その他」「es-ES（無ければ es-*）」のまま（構造の読み手 P2-7）。→ DECISIONS に「2026-10-20（周回3裁定・周回5実装）: 声は端末内の声から選ぶ（通信する声は端末内に無い時だけ）。英語は NZ があれば必ず NZ。無ければ自然さ（premium/enhanced 等）→ 地域の近さ（豪→英→愛→米）→ 既定の声 → 名前 の順で上から比べる（足し算ではない）。理由: 要件 v0.1「端末内の音声から自然な声を優先」「可能なら NZ」。代替: 地域を先にする（簡易版の近い地域が勝つので採らない）・足し算（普通の豪がプレミアムの米に勝つので採らない）」を足す。会議の紙:57-58 を同じ趣旨の2行に。README:27 を項目1の順に書き換える。LOOP_LOG の周回4に審査結果の行（検査官 9/9・P1 3・87点）と周回5の節。PIPELINE の周回数と履歴に周回4の結果。

7. **[P2] `/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:17,63,428,435,442,449,456`・`app.js:234`** — 訳まわりの小物（使う人役。上の「訳の裁定」）。→ :17 を「NZで日常に聞く言い方を選んでいる（How's it going?／sweet as／bill）。米とは少し違う」。:63 を「初対面に使う丁寧な вы の形。友達には ты の形（例: 1番は Как тебя зовут?。4番の Как дела? はそのまま使える）」。8番の注（zh :428「旅先で相手に通じる言葉を聞く形。自分の言語なら〇〇に 日语 を」／ko :435「…〇〇に 일본어 を」／es :442「…〇〇に japonés を」／ru :449 の既存の注の末尾に「。日本語なら по-японски」／th :456「…〇〇に ญี่ปุ่น を」）。app.js:234 の見出しを「別の言い方（鳴るのは上の文）: 」に（試験 :78 の「別の言い方」は通る）。check-data の「Japanese」検査は英語以外に英単語を入れなければ通る。

8. **[P2] `/Users/omoya160/Kenta/dev/phrase30-app/app.js:162-163`** — 2回目の見張りが「鳴っているので黙る」と決めた後、onstart も onend も来ない端末では光が消えない（構造の読み手 P2-8。:163 の前提そのものが「onstart が来ない端末」なので、その前提の中では論理の穴）。→ :163 を「鳴っていれば1秒ごとに見直し、止まったら光を消す。上限30秒」に: `if (speaking) { (function poll(k) { state.watchdog = setTimeout(function () { if (state.utter !== u) return; var s = false; try { s = !!synth.speaking; } catch (e) {} if (s && k < 30) poll(k + 1); else setPlaying(null); }, 1000); })(0); return; }`。試験は任意（差し替えに「speaking=true で onstart を出さない」旗を足せるなら1本）。

9. **[P2] `/Users/omoya160/Kenta/dev/phrase30-app/app.js:245-260`・`tests/app.spec.mjs:344-363`** — 初めて開く言語に引き継ぐのが画素の位置なので、注の数や折り返しが違う言語では見えている番号がずれる（構造の読み手 P2-9。言語ごとの記憶は変えない）。→ setLang の先頭で、帯の下端より下にある最初の `.card` の data-n を取る（`var top = document.querySelector('.top'), h = top ? top.getBoundingClientRect().height : 0;` で `.card` を順に見て `getBoundingClientRect().top >= h - 1` の最初）。renderList の後、`!(code in state.scroll)` の時だけ、その番号のカードの `offsetTop - h - 8` へ scrollTo（記憶がある言語は今までどおり）。試験 :352 を「英語で20番の上端が帯の下に来るまで scroll → 初めて zh へ → 20番の上端が帯の下端 ±40px」に変え、:353 以降（言語ごとの記憶・reload）はそのまま。

良い所（壊さない）: 世代番号＋utter の二重の守り／失敗案内の出す・消す・待ち直す（AC7c/7d）／閉じた記憶は状態の案内だけ／check-data が注の英単語を止める／CSS が1か所ずつ／端末内→全部の2段探索／AC9 の戻り道／言語ごとのスクロール記憶／注の「現場の言い方」（使う人役が一番刺さった所）。

### 棄却した指摘（理由1行）
- 使う人役「en n27 の短い形を主役に」: 周回2・3の裁定どおり（料理を指す形。注に短い形あり）
- 使う人役「ru n26 Который час?」: 周回2・3の裁定を維持（ネイティブ検品前に揺らさない）
- 構造の読み手「zh n24 の〇路」: 本人も不要と判断。意味は通る
- 使う人役 P2-5「帯の簡易版から手順へ」: 周回3と同じく Idea（帯を軽く保つ裁定と衝突。折り畳みは本文先頭に常設済み）
- 使う人役 P2-8 既定の言語／PWA／翌日まで覚える: 要件の外 → Idea

## ④ Idea／Experiment 候補
**Idea（要件の外・納品報告の「改善案」へ）**: 事前生成の自然な音声（`audio` 欄。声の問題の根本解決＝使う人役の総意）／帯の「簡易版」を押すと手順へ／読み（カナ・ローマ字・ピンイン）／自動くり返し・停止タイマー／PWA（電波なしでも開く。今は no-cache で毎回取りに行く）／最初に言語を選ばせる／続ける仕掛け（今日の5枚・聞いた回数）／友達向け（ты・반말・tú）切り替え／声なし案内を翌日も覚える／ネイティブ検品後に画面へ表示。
**Experiment（Evidence C・実機で確かめてから）**: iPhone Safari で「拡張」「プレミアム」の声が getVoices に出て項目1の順で選ばれるか・設定から戻ってタブを押し直すと切り替わるか（使う人役の P0候補。納品報告の未確認項目へ）／日本語表示の端末で声の名前に「拡張」「プレミアム」が入るか（構造の読み手。regex に `拡張|プレミアム` を足すのは害が無いので入れてもよいが効果は未確認）／Android で一覧が最初に空で届く頻度／Playwright WebKit。

## ⑤ 判定理由（3行）
1. AC 9/9 を3者が独立に確認・17本×3者 PASS・公開版 cmp 一致・周回3の P1 4件と持ち越し6件が全部入った（82→87）。点数は合格圏に入った。
2. しかし P1 が3件: 声の比べ方の足し算が「普通の豪 > プレミアムの米」で裁定に反する（2者一致。処方を出した周回3の私の誤り）、声の足し方の折り畳みが毎回開き直し声が見つかっても閉じない（3者一致・Mac Chrome で再現）、「代用」の誤表示（2者一致）。いずれも数行〜十数行。
3. 周回5は上限。9件とも作る側の用意済みの直しとほぼ一致しているので、入れて直列で2回 PASS → commit → cmp → 再審査で合格圏。届かなければ上の「(2)」の扱い（P0=0 なら既知の制約を明記して妥協受領を提案し /submit）。

関連ファイル: /Users/omoya160/Kenta/dev/phrase30-app/app.js, /Users/omoya160/Kenta/dev/phrase30-app/index.html, /Users/omoya160/Kenta/dev/phrase30-app/style.css, /Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json, /Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs, /Users/omoya160/Kenta/dev/phrase30-app/scripts/check-data.mjs, /Users/omoya160/Kenta/dev/phrase30-app/README.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/DECISIONS.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/会議の紙.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/LOOP_LOG.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/PIPELINE.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/loop/round-4/{spec-checker,reviewer,user-panel,codex,probe-mac-chrome}.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/loop/round-3/judge.md, /Users/omoya160/Kenta/dev/ai-config/AI-OS/QUALITY_GATE.md
