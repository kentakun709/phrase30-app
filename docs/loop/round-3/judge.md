# 周回3 judge の原文 — 2026-10-20（82/100・不合格・P0 0・P1 4）

# 周回3 judge 裁定 — phrase30-app（commit 62182a2・2026-10-20）

前提: `/Users/omoya160/Kenta/dev/phrase30-app/.git/refs/heads/main` = 62182a2d… で、審査対象と作業ツリーは一致（周回2の問題は解消）。index.html・app.js・style.css・data/phrases.json・tests/app.spec.mjs・scripts/*.mjs・README・playwright.config・DECISIONS・会議の紙・要件 v0.1・4本のレビュー・周回1/2の judge・probe を全文読んだ。grep で 9/11番の「Japanese を」12件、es n20 の `¿Puedes repetirlo`、zh n19 の「ここに Wi-Fi」、en n28 の `I'll have this, please.`、th n3 の `อาศัย` が現物にあることを自分で確認した。

## ① 採点（`AI-OS/QUALITY_GATE.md`「コード・スクリプト」5軸）
| 軸 | 周回2 | 周回3 | 根拠（1行） |
|---|---|---|---|
| 要件適合 | 16 | 17 | AC 9/9 ○（検査官が独自スクリプトでも確認）。残: 声選びが端末内の中で「地域」を「自然さ」より上に置く（v0.1 の主文は「端末内の音声から自然な声を優先」）／固定帯の案内に手順の全文が残り「1画面で完結」を削る／読み上げ非対応ブラウザでは押すまで案内が出ない |
| 正しさ | 15 | 16 | 失敗案内の始末（onstart/onplay で消す・pending 待ち直し）・連打の80ms・ended 後の error 無視は正しく入った。残: 9/11番の注が5言語で誤り（10枚）／閉じた案内の記憶が一度きりの失敗案内まで飲む／es n20 の型／zh n19 訳・n24 注／ko n5 の見出し |
| テスト | 15 | 16 | 15本で AC 全部＋AC7b/c/d・AC9b/c・声選び・記憶。3者が独立に 15/15（作る側×3周・検査官・東条の橋渡し）。残: 案内ありの帯の高さ・非対応ブラウザの試験なし／PW_PORT 未で検査官の1回目が8787の取り合いで6本落ちた／check-data が注の誤りを捕まえない |
| 保守性 | 16 | 15 | README が「12本」「自己紹介・会話を始める」で実物と違う／DECISIONS・会議の紙が8番の既定と食い違う／CSS が「周回2」「周回3」の3層上書き／スクロール記憶が4か所。記録のずれが周回2より増えた |
| 安全性 | 18 | 18 | 変更なし。外部通信なし・audio は `audio/` 配下の相対パスだけ・esc/textContent |
| **合計** | **80** | **82** | **+2** |

## ② 合否: **不合格**（82 < 85、P1 4件）
- 受入基準 9/9 ○・実行テスト PASS（15/15）・AC8 の公開版4ファイル cmp 一致 ＝ 追加ゲートは満たす。落ちたのは点数と P1。
- 統合後の集計（重複は1件に）: **P0 0・P1 4・P2 11**。棄却 10（下）。
- 周回2の修正10件は「案内から手順を外す（3b/3d/3e）」「es n20 の型」「th n3」「en n28」「n8 の記録」「PW_PORT」が周回4送りになっており、今回の P1 の半分はその持ち越し。**周回4は最後から2番目の周回なので、持ち越しを作らない。**
- PDCA 停止条件には当たらない（+12 → +2。2周連続 2点未満ではない）。

### 争点の裁定
**(1) 声の選び方 → 「端末内の声を母集団（周回2の裁定を維持）→ その中で NZ の声があれば NZ（可能なら）→ 無ければ自然さの点数を地域より先に → 地域の順は同点の並びだけ」の1本にする。** 理由: v0.1 の主文は「端末内にある対象言語の音声から、自然な声を優先選択する」で地域は書いていない。NZ は「可能なら」の添え書き。会議の紙の en-NZ→AU→GB→US は AI が置いた仮置きで、同点の並びとして残す。通信する声は端末内に無い時だけ（2段目は同じ規則で全部の声）。
- 構造の読み手 P2-5「NZ の通信する声 > 端末内の豪」は採らない: v0.1 は端末内を母集団と書いており、対象はスマホで NZ の声は端末内に無い（変わるのは PC の Edge だけ）。周回2の裁定を崩してまで得る物がない。
- 使う人役 P1-1「地域の順より質」は採る（上の形で）。「案内に地域を書く」も合わせて入れる。

**(2) スクロール記憶 → 言語ごとの記憶は変えない。** 使う人役が「一番刺さった」側に挙げ、試験も付いている。聞き比べの流れは B の仮説。ただし「初めて開く言語は先頭へ飛ぶ」だけは1行で直す（今の位置を引き継ぐ）。番号1つの設計は Experiment。

**(3) 閉じた案内の記憶 → 状態の案内（nosynth・novoice-empty・novoice）だけ覚える（構造の読み手の案を採る）。** 失敗の案内（silent・err・audiofail）は閉じても次の失敗でまた出る。使う人役 P2-7 は同じ穴の別の直し方（言語ごと）なので、こちらに統合。

### 訳の裁定（言語ごと・採る／採らない）
- **英語**: 採る＝n28 型を例文と同じに（周回2の持ち越し）。採らない＝他（自然）。
- **中国語**: 採る＝n19 訳「Wi-Fi はありますか？」・n24 注「路＝バスの系統番号。バスは 哪一路（何番）で聞く」・9/11番の注 日语。採らない＝他。
- **韓国語**: 採る＝9/11番の注 일본어（9番は 일본어를）・n5 の見出し（型に〇〇があるので「言い換えの型」）。採らない＝n11 の -시- 化（自然。東条も一致）。
- **スペイン語**: 採る＝n20 型を `¿Puede repetirlo, por favor?` にし note に「友達には ¿Puedes repetirlo?」（東条の P1 は P2 に落として採る。tú 形は誤りでなく、説明の tú/usted と合う。周回2の指示「型も」の持ち越し）・言語の説明を「同年代・友達との会話は tú（1〜19番）。店員や目上の人には usted（20・27・30番）」（「初対面には usted」と小見出し「初対面で聞く」の矛盾を説明側で解く。1〜12番は tú のまま）・9/11番の注 japonés。
- **ロシア語**: 採る＝9/11番の注 японский（учите японский。n8 の по-японски とは別）。採らない＝n4/n26 の変更（周回2の裁定を維持。ネイティブ検品前に揺らさない）。
- **タイ語**: 採る＝n3 を型・例文とも `บ้านคุณอยู่ที่ไหนครับ`（周回1・2の裁定。使う人役の `คุณอยู่ที่ไหนครับ` は「今どこ？」と取られる）・9/11番の注 ญี่ปุ่น。
- **8番**: 作る側の「相手に通じる言葉を聞く」（英語カードは Japanese・他5言語は English）を**採用して記録を合わせる**（構造の読み手・東条が筋が通ると一致）。訳の統一（話せますか／話しますか／できますか）は採らない: 各訳はその言語の例文に忠実で、型の原文「〇〇語を話しますか？」は見出しに出る。

## ③ 優先修正リスト（重要度順・10件）

1. **[P1] `/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:476,483,490,497,504（n9）・572,579,586,593,600（n11）`・`scripts/check-data.mjs`** — 「自分が聞くなら〇〇に Japanese を」が英語以外の5言語に英単語のまま入り、中国語の型に入れると「你为什么学Japanese？」になる（構造の読み手 P1・使う人役 P1-2 が独立に一致・A・10枚）。→ zh「〇〇に 日语 を」／ko「〇〇に 일본어 を（9番は 일본어를）」／es「〇〇に japonés を」／ru「〇〇に японский を」／th「ภาษา〇〇 の〇〇に ญี่ปุ่น を」。英語の2枚はそのまま。`check-data.mjs` の各項目の点検に `if (c !== 'en' && x.note && /Japanese/.test(x.note)) errs.push(\`n=${p.n} ${c}: note に英単語 Japanese\`)` を1行。
2. **[P1] `/Users/omoya160/Kenta/dev/phrase30-app/app.js:44-64（pickVoice）・74-77（howToAdd）`・`data/phrases.json:17`・`README.md:27`・`tests/app.spec.mjs:297-314`** — 端末内の中で地域の順が自然さより先なので、案内どおり高品質の声を別地域で入れても簡易版が鳴り続ける（使う人役 P1-1・A/B。争点1の裁定）。→ `find(pool)` の地域ごとの for ループをやめ、`bases[base] && ok(l,false)` で母集団の候補を1回で集め、`voiceScore(v) + regionBonus(normLang(v.lang))` の降順で先頭を取る（無ければ `ok(l,true)` で台湾の声を許して同じ事をする。端末内→全部の2段は今のまま）。`regionBonus(l)`: prefs の何番目に当たるか（完全一致または `p + '-'` の前方一致）を i とし、`def.code === 'en' && i === 0` なら +100（NZ があれば必ず）、それ以外は `2 * (prefs.length - 1 - i)`（en: AU 8・GB 6・IE 4・US 2・en 0。premium/enhanced +5 と compact −3 の差8と同じ幅なので、拡張の米 7 > 簡易の豪 5、簡易の豪 5 > 簡易の米 −1 となり、地域は同点の並びに落ちる）、どれにも当たらなければ 0。試験「声の選び方」の既存8本は全部そのまま通る（Hayley en_NZ は +100、Eddy は −10 で負ける）ので残し、4本足す: `pick('en',[Karen compact en-AU(voiceURI com.apple.voice.compact.en-AU.Karen), Samantha en-US(voiceURI com.apple.voice.enhanced.en-US.Samantha)])==='Samantha'`／`pick('en',[Karen compact, Samantha compact])==='Karen'`／`pick('es',[Mónica compact es-ES, Paulina enhanced es-MX])==='Paulina'`／`pick('en',[Hayley compact en-NZ, Karen enhanced en-AU])==='Hayley'`。`howToAdd` の iOS 文を「声 → 英語 → オーストラリア（NZ に一番近い。他の地域でも可）を選び、名前に「拡張」か「プレミアム」と付いた声をダウンロード」に（英語以外は「→ タイ語 を選び、名前に「拡張」か「プレミアム」と付いた声を」。iOS の表記が実機で違えばその語に直す）。`phrases.json:17` の en note を「NZ の声が端末にあればそれを使う。無ければ自然な声を優先し、同じなら NZ に近いオーストラリアの声から」に、README:27 を同じ趣旨の1行に。
3. **[P1] `/Users/omoya160/Kenta/dev/phrase30-app/app.js:81-98（renderVoiceState）`・`index.html:15,24`・`style.css:62`・`tests/app.spec.mjs:173-192`** — 固定帯の案内に声を足す手順の全文が残り（main の details と二重）、声が無い時に見出し「機械っぽい時は」が合わず、開閉ボタンが 28px（構造の読み手 P2-3・使う人役 P2-3/初見役が一致。周回2 judge 3(b)(d) の持ち越し）。→ (a) :85 を「端末の音声の一覧をまだ読み込めていません。カードを1回押すと読み込まれることがあります。それでも【' + def.nameJa + '】が鳴らない時は、端末の設定で音声を足してください。」、:87 を「この端末には【' + def.nameJa + '】の音声が入っていません。端末の設定で足せます。」にし、`howToAdd(def)` を案内から外す（「設定」と言語名は残るので AC7 は○）。(b) index.html:15 の `.notice` に `<button type="button" id="noticehow" class="nlink" hidden>声の足し方を見る</button>` を足し、`showNotice` で key が `novoice` で始まる時だけ表示。押したら `$howto.open = true; window.scrollTo(0, $howto.offsetTop - document.querySelector('.top').offsetHeight - 8)`（スクロール位置が戻った翌日でも届く）。(c) `renderVoiceState` で summary の文を切り替える: 声なしなら「【' + def.nameJa + '】の声の足し方」で `$howto.open = true`、声ありなら「声が機械っぽい時は → もっと自然な声にする（言語ごとに1回）」。(d) `style.css:62` の `min-height:28px` → `44px`、`.nlink` は 44px の押せる見た目。(e) 試験 AC7（:179 の直後）に `expect((await page.locator('.top').boundingBox()).height).toBeLessThan(844 * 0.3)` を足し、案内ありの帯の高さを固定する。`showNotice('err'…)`（:142, :158）と `silent`（:152）の末尾の `howToAdd(def)` も外して「手順は下の『声の足し方』」に。
4. **[P1] `/Users/omoya160/Kenta/dev/phrase30-app/app.js:274（閉じるボタン）・183-191（play）`・`tests/app.spec.mjs:225-243`** — 閉じた記憶が全キー共通なので「鳴りませんでした」を1回閉じると、その後どの言語で失敗しても理由が出ない。audiofail は次に音声ファイルが鳴るまで残る（構造の読み手 P2-4・使う人役 P2-7 が一致・A。争点3の裁定）。→ :274 を `if (/^(nosynth|novoice)/.test(state.noticeKey)) state.dismissed[state.noticeKey] = true; hideNotice('');` に。`play()` の `stopAll()` の直後に `hideFailNotices(['audiofail']);`（また失敗すればまた出る。AC9b は fallback が後から出すので通る）。AC7d の題を「声なしの案内は閉じたら言語ごとに出し直さない。失敗の案内は閉じても次の失敗でまた出る」にし、:240 の後に「`__silent=true` で3番を押す → 7秒以内に『鳴りませんでした』が再び出る」を足す。
5. **[P2] `/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:53,1015-1019`** — es の説明「店員・初対面には usted」が小見出し「初対面で聞く（1〜12）」の tú と食い違う（構造の読み手 P2-2・High）。n20 の型だけ tú（東条 P1-1→P2）。→ :53 を「スペインでも中南米でも通じる言い方。同年代・友達との会話は tú（1〜19番）。店員や目上の人には usted（20・27・30番）」。:1015 の template を `¿Puede repetirlo, por favor?`、:1018 の note を「友達には ¿Puedes repetirlo?」。
6. **[P2] `/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:213-214,955,1196,1378`・`app.js:221`・`tests/app.spec.mjs:76`** — 訳の小さな持ち越しと見出しの1枚（構造の読み手 P2-9・使う人役 P2-5/P2-11・周回2の持ち越し）。→ th n3 の template と example を `บ้านคุณอยู่ที่ไหนครับ`／zh n19 の ja を「Wi-Fi はありますか？」／zh n24 の note を「路＝バスの系統番号。バスは 哪一路（何番）で聞く」／en n28 の template を `I'll have this one, please.`（例文と同じ＝行が消える）。app.js:221 の条件を `(p.ja.indexOf('〇〇') >= 0 || it.template.indexOf('〇〇') >= 0)` にして ko n5 を「言い換えの型: 〇〇 씨는요?（あなたはどうですか？）」に。試験 :76 の条件も同じ形に。終わったら `node scripts/check-data.mjs`。
7. **[P2] `/Users/omoya160/Kenta/dev/phrase30-app/app.js:66-67`・`tests/app.spec.mjs`** — 読み上げ機能の無いブラウザでは開いても案内が出ず、言語を切り替えると消える。押した時だけ出る（構造の読み手 P2-8・コード上は A）。→ `refreshVoices` の先頭を `if (!synth) { renderVoiceState(); return; }`。試験1本: `addInitScript` で `delete window.speechSynthesis`（または `Object.defineProperty(window,'speechSynthesis',{value:undefined})`）→ 開いた直後に `#notice` が「対応していません」を含み、タブを th に切り替えても見えている。
8. **[P2] `/Users/omoya160/Kenta/dev/phrase30-app/app.js:244`・`tests/app.spec.mjs:322-323`** — 初めて開く言語は 0 へ飛ぶ（構造の読み手 P2-7 の「飛ぶ」部分だけ採る。争点2の裁定）。→ `var y = (code in state.scroll) ? state.scroll[code] : (state.scroll[prev] || 0);`（`prev` は :235 で保存する前の言語）。試験 :323 を `toBeGreaterThan(1000)`（zh が英語の位置を引き継ぐ）にし、その後「zh で 300 へ → en に切り替え → >1000 → zh に戻る → 300 付近」を1組足して言語ごとの記憶が残ることを示す。
9. **[P2] 記録と設定の整合（構造の読み手 P2-10・High／検査官の AC の書き方／周回2 judge 6・10 の持ち越し）** — `README.md:15` を「初対面で聞く・会話を始める（1〜12）」、`:30` を「15本」。`docs/DECISIONS.md` に「2026-10-20 周回3: 8番は相手に通じる言葉を聞く形（英語カードは Japanese・他5言語は English）。9・11番はその言語自身。理由: 旅行と NZ での実用（構造の読み手・東条が一致）」を足し、`docs/会議の紙.md:59` の例を合わせる。会議の紙 AC3 の「実機で耳で確認」を外して納品報告の未確認項目へ、AC5 を「playwright.config.mjs の設定（Chrome・390×844）で 6言語×30枚」に。`style.css:44-66` の「周回2」「周回3」の区画を元の規則に溶かし、`.hint/.langnote/.toggle/.nclose/.notice/.voiceinfo/.card .note/.list` を各1か所に（挙動は変えない。AC5 で確認）。`playwright.config.mjs` に `const PORT = process.env.PW_PORT || 8787` を通して command/url/baseURL で使う（検査官の1回目は 8787 の取り合いで6本落ちた）。`docs/LOOP_LOG.md` の周回3に審査結果の行（検査官 9/9・P1 4・82点）。
10. **[P2] `/Users/omoya160/Kenta/dev/phrase30-app/app.js:81,95`・`index.html:24`** — 英語を開くたびに帯に3行の言い訳が出る／「1回だけ」は言語ごとに要る（使う人役 P2-1・P2-4・A）。→ :95 の文を「。' + LANG_JA[first] + 'の声が無いので代用」の短い形に（試験 AC3 :100-101 は Karen・オーストラリア英語を見るので通る）。:81 の「Wi-Fi で1回だけ」→「Wi-Fi で、言語ごとに1回」。index.html:24 の summary は項目3(c)で切り替えるので「（1回だけ）」の固定文は消す。

良い所（壊さない）: 世代番号＋utter の二重の守り／失敗案内の出す・消す・待ち直すの一本の流れ（AC7c まで試験で確かめている）／「言い換えの型／別の言い方」の出し分け／check-data の件数点検／AC9 の戻り道／カード全体が押せて光る見た目／訳は全体に自然（構造の読み手・東条が一致）。

### 棄却した指摘（理由1行）
- 東条 P2-1 長文分割: 30文は短い（周回1・2と同じ）
- 構造の読み手 P2-5 NZ の通信する声を端末内の豪より先に: v0.1 の母集団は端末内。対象のスマホに NZ の声は無く、変わるのは PC の Edge だけ
- 構造の読み手 P2-7 スクロール記憶を番号1つに: 使う人役が価値を挙げ、試験済み。聞き比べは B → 「飛ぶ」だけ直す（項目8）、設計は Experiment
- 構造の読み手 P2-6 80ms の時計戻り・2回目の見張りに `synth.speaking`: Low。onstart が来ない端末で光が消えなくなる副作用の恐れ → Experiment
- 構造の読み手 P2-9 8番の訳の統一／ko n11 の -시- 化: 各訳は例文に忠実、n11 は自然（東条も一致）
- 使う人役 P2-10 ru n4/n26 の変更・th n3 の `คุณอยู่ที่ไหน`: 周回2の裁定を維持（「今どこ？」と取られる）
- 使う人役 P0候補（iOS で拡張の声が選ばれるか）・P2-6（空一覧の案内を遅らせる）: C → Experiment
- 使う人役 P2-8 既定の言語・P2-9 ホーム画面の手順・P2-2 帯の「簡易版」を押せるように: 要件の外または項目3(b)のボタンで半分解決 → Idea
- 使う人役「文法記号（아/어・в/на）に説明」: 周回1・2の裁定どおり標準表記のまま残す
- 検査官 AC7「読み込めていない」の表現: 条件は変えず、紙の確認方法に書き分ける（項目9に含めた）

## ④ Idea／Experiment 候補
**Idea（要件の外・次版）**: 事前生成の自然な音声（`audio` 欄。声の問題の根本解決。納品報告の改善案に）／読み（カナ・ローマ字・ピンイン）／自動くり返し・連続再生・停止タイマー／PWA＋ホーム画面のアイコン／初回に言語を選ばせる／ホーム画面追加の手順を一言（iPhone: 共有 → ホーム画面に追加）／帯の「簡易版」を押すと手順へ／同点の声の名前順位（東条 P2-2）／「別の言い方」も押して聞ける／自己紹介の答えの文・友達向け（ты・반말）切り替え／ru n26 の別形 `Сколько сейчас времени?` を note に／ネイティブ検品が済んだら画面に出す。
**Experiment（Evidence C・実機で確かめてから）**: iPhone Safari で「拡張」「プレミアム」の声が `getVoices` に出て項目2の規則で選ばれるか（差し替え試験は通るが実機は未確認。使う人役の P0候補）／iOS 設定画面の「拡張」「プレミアム」の表記／声を足してアプリに戻った直後に一覧が更新されるか（voiceschanged が来ない端末）／空一覧の案内を1〜2秒遅らせるべきか／2回目の見張りに `synth.speaking` を見せるか／スクロール記憶を「見えている最初のカード番号1つ」にするか／Playwright WebKit／Edge の Molly Online（en-NZ・通信）と端末内の豪の聞き比べ（周回2と同じ・Kenta の判断）。

## ⑤ 判定理由（3行）
1. AC 9/9・試験 15/15 を3者が独立に実行・公開版と HEAD の一致。周回2の10件のうち8件が入り、失敗案内の始末と80msは機械で確かめられる形になった（80→82）。
2. しかし P1 が4件残る: 9/11番の注が5言語で英単語のまま（2者一致・10枚）、声選びが v0.1 の「自然な声を優先」より地域を上に置く（争点1の裁定）、固定帯の案内に手順の全文（周回2 P1 の持ち越し・2者一致）、閉じた案内が失敗の案内まで飲む（2者一致）。85 未達。
3. 4件とも数行〜数十行で、持ち越し6件（案内の手順・es n20・th n3・en n28・n8 の記録・PW_PORT・CSS）を今度こそ入れれば周回4で合格圏。周回4は上限5の一つ手前なので、持ち越しを残さず、単独実行で 15/15（＋新規5本）を2回 → commit → 公開版 cmp → 再審査。

関連ファイル: /Users/omoya160/Kenta/dev/phrase30-app/app.js, /Users/omoya160/Kenta/dev/phrase30-app/index.html, /Users/omoya160/Kenta/dev/phrase30-app/style.css, /Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json, /Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs, /Users/omoya160/Kenta/dev/phrase30-app/scripts/check-data.mjs, /Users/omoya160/Kenta/dev/phrase30-app/playwright.config.mjs, /Users/omoya160/Kenta/dev/phrase30-app/README.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/会議の紙.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/DECISIONS.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/LOOP_LOG.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/loop/round-3/{spec-checker,reviewer,user-panel,codex,probe-mac-chrome}.md
