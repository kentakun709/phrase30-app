# 周回2 judge の原文 — 2026-10-20（80/100・不合格・P0 0・P1 6）

# 周回2 judge 裁定 — phrase30-app（commit 9bc0f18・2026-10-20）

## 前提（先に1つ）
裁定の対象は **commit 9bc0f18**（`/Users/omoya160/Kenta/dev/phrase30-app/.git/refs/heads/main`＝9bc0f18、reflog の末尾も同じ）。ただし作業ツリーには**未コミットの周回3の編集が既に入っている**（`style.css:57` に「周回3」の印、`app.js` の2段 pickVoice・`hideFailNotices`・`dismissed:{}`、`tests/app.spec.mjs` が15本、`data/phrases.json` の韓国語 -세요 形など）。自分で全文読んだのはこの作業ツリーで、9bc0f18 の状態は4本のレビューの引用行・コミットメッセージ・`log/phrase30-en-390.png`／`log/phrase30-th-390.png`（07:33 の画面写し。固定帯が約27%、「〜無いため」で途切れた文、〇〇の無いタイ語03に「言い換えの型」を自分の目で確認）で突き合わせた。**採点と合否は 9bc0f18 に対する物。** 各修正項目に「作業ツリー: 済／一部／未」を添えた。未コミット分は、単独実行の試験→commit→push→公開版 cmp→再審査を経るまで合格の根拠にならない。次回は審査に出す物と作業ツリーを一致させる（審査中は触らない、または周回3を先にコミットしてから審査へ）。

## ① 採点（`AI-OS/QUALITY_GATE.md`「コード・スクリプト」5軸）
| 軸 | 周回1 | 周回2 | 根拠（1行） |
|---|---|---|---|
| 要件適合 | 13 | 16 | AC 9/9 ○（検査官が独自スクリプトでも確認）。残: 「端末内の声を優先」が地域をまたぐと破れる／固定帯が画面の約27%で「1画面で完結・見やすいカード」を削る／型と例文が食い違う6枚・〇〇なし14枚に「言い換えの型」 |
| 正しさ | 11 | 15 | 世代番号＋utter の二重の守り・cancel→speak・AC9 の戻り道は正しい。残: 失敗の案内が成功後も残る（3者一致・再現あり）／見張りが pending を見ず誤報／声の表示が途切れ・完全一致で逆の案内／閉じた案内の枠1つ／ended 後の error で再フォールバック／audio 欄が先頭「/」を通す |
| テスト | 12 | 15 | 12本で AC 全部＋AC7b/c・AC9b・声の選び方。残: #11 が初期化を待たず10周で3回落ちる／2つの試験が 8787 を取り合うと結果が再現しない／「成功で案内が消える」「地域またぎの端末内優先」「案内ありの帯の高さ」の試験が無い／Chromium のみ |
| 保守性 | 15 | 16 | 小さく読みやすい・データ点検は良い。残: README／コメントが実挙動（端末内優先）と食い違う／CSS の同じ規則の書き重ね／audio 検査が2本に二重 |
| 安全性 | 17 | 18 | esc・textContent・try/catch・外部通信なし・audio 外部URL拒否。残: 先頭「/」の漏れ（404 で読み上げに戻るので事故にはならない） |
| **合計** | **68** | **80** | **+12** |

## ② 合否: **不合格**（80 < 85、P1 6件）
- 受入基準 9/9 ○・実行テスト PASS（単独で 12/12 を2回連続・検査官）は満たす。落ちたのは点数と P1。
- 統合後の集計（重複は1件に）: **P0 0・P1 6・P2 7**。棄却 5。
- 周回1 の修正リスト10件のうち、文字どおりには入っていない物が3つ（項目2 `<details>` 畳み／項目4 pending と onstart／項目9 端末内を常に先）。これが P1 の半分。

### 2つの P0 の裁定
- **東条 P0-1「上位地域の通信する声が下位地域の端末内の声に勝つ」→ P1（修正2）**。理由: v0.1「端末内にある音声から」、README・コードのコメント、周回1 judge 項目9（端末内を先）の3つに反し、構造の読み手も独立に同じ所を指摘（複数一致＋東条の模擬 h で再現）。P0 でない理由: 鳴ることは鳴る（目的は達成）、送られるのは公開済みの30文で利用者データでなく、AC6「外部の有料サービス」にも当たらない（周回1の裁定を維持。AC6 は ○）。
- **使う人役 P0「簡易版の声の時、自然な声への案内が手元に無い」→ P2（修正8に含める）**。理由: v0.1 が「6言語の音質や再生を保証しないこと」と明記し、案内自体は脚注にある。離脱の予測は Evidence B/C の単独仮説。ただし「適切な案内」に沿い、直す費用が小さいので入れる。

## ③ 優先修正リスト（重要度順・10件）

1. **[P1] `/Users/omoya160/Kenta/dev/phrase30-app/app.js` speakItem／playFile（9bc0f18: 121-142）** — 失敗の案内（鳴りませんでした／読み上げに失敗／音声ファイルが読めない）が次に鳴っても消えず、見張りが `speaking` しか見ないので声の読み込みが遅いだけで誤報（reviewer P1・使う人役 P1-3・東条 P1-1 の3者一致、周回1 項目4の未完）。→ `u.onstart` と `a.onplay` で `silent/err/audiofail` を消す。見張りは `speaking||pending` なら1回だけ 2.5秒張り直し、2回目は無条件で案内。試験 AC7c の末尾に「`__throw=false` に戻して押すと `#notice` が消える」。**作業ツリー: 済**（`hideFailNotices`・`armWatchdog(second)`・AC7c 末尾）。

2. **[P1] `app.js` pickVoice（9bc0f18: 38-53）・`/Users/omoya160/Kenta/dev/phrase30-app/README.md:27,34`** — 端末内 +20 が同じ地域の中でしか効かず、Edge の en-NZ 通信声が端末内 en-AU に勝つ。README・コメントの「端末内を常に優先」と食い違う（東条 P0-1→P1・reviewer P2、周回1 項目9の未完）。→ 2段構え: `voices.filter(v => v.localService !== false)` で全手順を回し、無ければ全部の声で同じ手順。試験「声の選び方」に `pick('en',[Molly Online en-NZ remote, Karen en-AU local])==='Karen'` と `pick('th',[Google Thai remote のみ])==='Google Thai'`。README は「端末内の声を地域をまたいで先に。通信する声は端末内に無い時だけ」。**作業ツリー: 済**。

3. **[P1] `/Users/omoya160/Kenta/dev/phrase30-app/index.html:12-27`・`/Users/omoya160/Kenta/dev/phrase30-app/style.css:15,24-26,44-56`・`app.js` howToAdd** — 固定帯が画面の約27%（画面写し）、案内が出ると半分近く。周回1 項目2の `<details>` 畳みが未実施。ゆっくり 32px・× 28px（reviewer P2・使う人役 P1-2、周回1 項目2の未完）。→ (a) 使い方の1行・言語の説明・声の足し方を `.top` の外（`main` の先頭）へ。(b) `#notice` の本文から iPhone/Android の手順を外し「この端末には【タイ語】の音声が入っていません。端末の設定で追加できます（手順は下の「もっと自然な声にする」）」の2文に（AC7 の「言語名」「設定」は残る。空一覧の案内も同様に短く）。手順は `main` の `<details id="howto">` だけに置く。(c) `.toggle`・`.nclose` を 44px。(d) 試験 AC5 に「声なし・タイ語・案内あり」で `.top` の高さ ≤ 250px（390×844）を追加し、実測値を LOOP_LOG に書く。(e) `.hint/.langnote/.toggle/.nclose/.notice/.voiceinfo/.card .note` の二重定義を1か所に（「周回3」ブロックで上書きせず元の行を直す）。**作業ツリー: 一部**（(a)(c) 済。(b) 未＝案内に手順が残る。(d) 案内なしの「3割」だけ。(e) 未＝上書き方式）。

4. **[P1] `/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json`・`app.js` renderList** — 同じカードで型と例文の丁寧さ・意味が食い違う6枚、〇〇なしの14枚に「言い換えの型」の見出し（reviewer P2 High・使う人役 P1-5・東条 P1-3 が重なる。周回1 項目7の ru n11 未完）。→ 型を揃える: ko n2 `어디에서 오셨어요?`／ko n3 `어디 사세요?`／ko n15 `언제 〇〇(으)셨어요?`／es n27 `¿Qué plato me recomienda?`／ru n11 `Как давно вы учите 〇〇?`／th n3 は型・例文とも `บ้านคุณอยู่ที่ไหนครับ`（周回1 judge の指示。口語で「今どこ？」とも取られない）／en n27 `What dish would you recommend?`（ja「おすすめの料理は何ですか？」、note に短い `What do you recommend?` を残す）／en n28 の型を例文と同じに（差が one だけで行が増える）。`p.ja` に〇〇が無い項目は見出しを「別の言い方:」に。`scripts/check-data.mjs` に「〇〇なしで template≠example の件数」を画面に出す行（落とさない・数の見える化）。**作業ツリー: 一部**（th n3・en n28・件数表示 未。es n20 は例文だけ usted にして型が `¿Puedes…` のまま＝新しい食い違い→修正7で直す）。

5. **[P1] `app.js` renderVoiceState（9bc0f18: 80-83）・`data/phrases.json:17,30`（en／zh の note）** — 声の表示が「ニュージーランド英語の声はこの端末に無いため」で途切れ、言語タグの完全一致なので `cmn-Hans-CN` 等で「無い」と逆の案内。既定の英語で、ほぼ全端末の最初の画面に出る（reviewer P2・使う人役 P1-4）。→ 文を「…の声がこの端末に無いので、代わりにこの声で読みます」に。比較は `LANG_JA[vl] && LANG_JA[first] && LANG_JA[vl] !== LANG_JA[first]`（LANG_JA に zh-hans／zh-hans-cn／cmn-cn／cmn-hans-cn → 中国語（普通話））。en の note「NZの声が端末にあればそれを使う。無ければNZに近いオーストラリアの声→英→米の順」、zh「中国本土の標準語（簡体字）。普通話の声が無ければ台湾の声で代用」。試験 AC3 に `#voiceinfo` が「代わりにこの声で読みます」で終わることを追加。**作業ツリー: 済**（試験の追加だけ未）。

6. **[P1] `/Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs:240-245`・`/Users/omoya160/Kenta/dev/phrase30-app/playwright.config.mjs:17-22`** — #11 が `page.goto` 直後に `state.data.languages` を読み10周で3回落ちる（東条 P1-2・再現あり）。別に、2つの試験が同時に走ると `reuseExistingServer:true` で 8787 を取り合い、先に終わった側が受け口を消す（検査官1回目の 5 failed はこれ。東条 run3 の #9/#10/#12 も時刻が重なる＝同じ原因の可能性が高い）。→ #11 の冒頭に `await expect(page.locator('.card')).toHaveCount(30)`。config は `const PORT = process.env.PW_PORT || 8787` を command／url／baseURL に通す。LOOP_LOG に「周回2 の不安定は2因（初期化待ちなし／2つの試験が 8787 を共有）。審査の試験は直列に」と1行。周回3 の記録は**単独実行で 15/15 を2回連続**。**作業ツリー: 一部**（#11 の待ち 済、PORT 未）。

7. **[P2] `data/phrases.json`** — 訳の裁定の反映（言語別の採否は下）。→ ko: n4 `잘 지내세요?`／n9 `왜 〇〇을/를 공부하세요?`／n13 `〇〇아/어 보신 적 있으세요?`／n16 `〇〇 좋아하세요?`／n18 `〇〇할 줄 아세요?`（型も）。ko の note は「初対面に使う丁寧な形（〜요。相手のことを聞く時は 〜세요）。「あなた（당신）」は使わず名前＋씨」（「統一」とは書かない）。es: n20 `¿Puede repetirlo, por favor?`（型も）／n30 `¿Me podría ayudar?`（型 `¿Me podría 〇〇?`）／n14 `tomar una foto`／n17 note「（スペインの言い方）」／note「友達には tú、店員・初対面には usted（20・27・30番）」。zh: n19 `有Wi-Fi吗？`（ja「Wi-Fi はありますか？」）／n28 の例文を型と同じ `我要这个。` に戻す（周回1 judge どおり）。**n8/n9/n11 の〇〇は `docs/DECISIONS.md` の既定（その言語自身の言語名）に6言語とも揃える**（作業ツリーは en だけ Japanese・他5言語は English で既定と違う）。その note「自分が聞くなら〇〇に 日本語 を」は各言語の語で書く（日语／일본어／japonés／по-японски／ญี่ปุ่น。英単語 Japanese を中国語の文に入れさせない）。終わったら `node scripts/check-data.mjs`。**作業ツリー: 一部**（ko 5件・es n30/n14/n17/note・zh n19/n28 済。es n20 の型・n8 の既定・note の言語名 未）。

8. **[P2] `app.js` showNotice／hideNotice／renderVoiceState／howToAdd・`index.html`** — 閉じた案内の枠が1つ（別の案内を閉じると前の物が復活、空一覧と声なしが同じキー）／err の案内に英語のコード名／Android の道順が機種依存／「消音スイッチ」／簡易版の声の時に自然な声への道が脚注にしか無い（reviewer P2・使う人役 P2-11/12/14・使う人役 P0→P2）。→ `state.dismissed={}` でキーごとに記憶、キーを `novoice-empty:<code>` と `novoice:<code>` に分け `hideNotice('novoice')` で両方消す。声が無い間は `#voiceinfo` に「声: なし（〇〇語の声がこの端末にありません）」を常に出す。err の案内から `(language-unavailable)` を外す。Android は「設定 → ユーザー補助（機種により システム → 言語と入力）→ テキスト読み上げ」。「消音（マナーモード）」。簡易版なら `#voiceinfo` に「・簡易版」を添え、その直下の `<details>`「声が機械っぽい時は → もっと自然な声にする（1回だけ・Wi-Fiで・数十〜数百MB）」は端末の種類に合わせ片方の手順だけ。試験 AC7d。**作業ツリー: 済**。

9. **[P2] `app.js` playFile（9bc0f18: 149-163）・play（144,168）** — 鳴り終わった後の error で読み上げへ再フォールバック（東条 P2-1・再現）／鳴っている最中に 80ms 以内で2回押すと2回目が待たずに speak（reviewer P2）。→ `settled` の旗で ended 後の error を無視。`play()` で `if (wasBusy) state.busyCancelAt = Date.now()`、待ちは `Math.max(0, 80 - (Date.now() - busyCancelAt))`。試験 AC9c と AC4 の「busy な cancel から次の speak まで ≥75ms」。**作業ツリー: 済**。

10. **[P2] `/Users/omoya160/Kenta/dev/phrase30-app/scripts/check-data.mjs:33`・`/Users/omoya160/Kenta/dev/phrase30-app/scripts/check-no-external.mjs:15-18`・`/Users/omoya160/Kenta/dev/phrase30-app/docs/会議の紙.md` AC3/AC5/AC6** — audio 欄が先頭「/」を通す（GitHub Pages の案件サイトではドメイン直下を指し 404）、同じ検査が2本に二重／AC の確認方法の書き方（reviewer P2 High・検査官）。→ 条件を `/^audio\/[^\s]+$/` にし check-no-external 側は消す。会議の紙は条件を変えず確認方法だけ: AC3「実機で耳で確認」は AC から外し納品報告の未確認項目へ／AC5「playwright.config.mjs の設定（Chrome・390×844）で」／AC6「`node scripts/check-no-external.mjs` が exit 0」。**作業ツリー: 済**（紙は未）。

付記（修正ではなく報告の話）: 納品報告の未確認項目に「自動試験は Chromium のみ／iPhone Safari・Android Chrome 実機は未確認／訳はネイティブ未検品／en-NZ の声は主要スマホにほぼ無く実際は豪の声になる」を明記。高品質音声への改善案は `audio` 欄（差し替え口は本物の WAV と 404 で試験済み）。

良い所（壊さない）: 世代番号＋utter の二重の守り／check-data の件数点検／AC9 の戻り道／教科書との違いの note（使う人役が一番刺さった所）／カード全体が押せて光る見た目／訳は全体に自然（reviewer・東条が一致）。

### 訳の裁定（言語ごと・採る／採らない）
- **英語**: 採る＝n27 `What dish would you recommend?`（原文の「料理」と他5言語の 菜／메뉴／блюдо／plato／เมนู に意味を揃える。短い形は note に残す）・n28 型＝例文。採らない＝n15/n24 の再変更（今の形で自然）。
- **中国語**: 採る＝n19 `有Wi-Fi吗？`（本文の note 自身が口語形を推すなら口語を鳴らす）・n28 例文を `我要这个。` に戻す（型と一致・周回1 judge どおり）・n24 ja の「何路の」を外す（作業ツリー 済）。採らない＝n29 の変更（麻烦买单 は店で自然）。
- **韓国語**: 採る＝相手の動作・状態を聞く5文（n4/9/13/16/18）だけ -세요 に・型も揃える・n2/n3/n15 の型＝例文。採らない＝全件の 〜세요 統一（東条の言うとおり n6/n10/n14 など話し手側の文で不自然。note も「統一」とは書かない）・型の文法記号 아/어・을/를 の削除（標準的な表記・周回1 judge の指示どおり）。
- **スペイン語**: 採る＝店・見知らぬ人に向ける n20/n27/n30 を usted（型も）・n14 tomar・n17 note「スペインの言い方」・note の文。採らない＝n13/n23/n24 等の友達向け質問の usted 化（tú のまま。note で筋が通る）・es-MX を先頭に（利用者の友達しだい→Experiment）。
- **ロシア語**: 採る＝n11 型 давно。採らない＝n4/n26/n27 の変更（Который час? は定番で通じる。Сколько сейчас времени? は note 候補→Idea）。
- **タイ語**: 採る＝n3 を型・例文とも `บ้านคุณอยู่ที่ไหนครับ`（周回1 judge の指示）。採らない＝n12/n27/n28 の型の差し替え（「別の言い方」で出せば足りる）・女性形の説明の削除（修正3で帯から出れば足りる）。

### 棄却した指摘（理由1行）
- 東条 P0-2 AC8 未確認: 作る側（07:09・07:4x）と検査官が独立に HTTP/2 200・4ファイル cmp 一致。欠陥ではない
- 東条 AC6 ×（通信する声）: 周回1の裁定を維持（ブラウザ内蔵の声・鍵/課金/ログイン不要・利用者データなし）。修正2で露出はさらに減る
- 東条 P2-2 長文分割: 30文は全部短い（周回1と同じ）
- 使う人役「型の文法記号を外す」: 型の標準表記・周回1 judge の指示どおり。残す
- 使う人役「30文で終わる／Google翻訳で足りる／続ける仕掛け」: 要件の外 → Idea

## ④ Idea／Experiment 候補
**Idea（要件の外・次版）**: 事前生成の自然な音声（`audio` 欄。機械っぽい声の根本解決。納品報告の改善案に）／読み（カナ・ローマ字・ピンイン）／自動くり返し・連続再生・停止タイマー／PWA／30文の追加（自己紹介の答え・NZ の bus interchange）／今日の5枚・覚えた印／言語別の声名の順位（東条 P2-3）／初回に言語を選ばせる／ru n26 の別形 `Сколько сейчас времени?` を note に。
**Experiment（Evidence C・実機で確かめてから）**: iPhone Safari・Android Chrome で6言語の選ばれる声と cancel→80ms→speak が鳴るか／消音スイッチ・マナーモードで消えるか／Safari が voiceURI に compact を返すか（修正8の「簡易版」判定が効くか）／声の一覧が遅れる端末で空一覧の案内を1〜2秒遅らせるべきか／0.7倍が逆に機械っぽく聞こえないか／Edge（Windows）の Molly Online（en-NZ・通信）と端末内 Catherine（en-AU）の聞き比べ→「NZ の自然な声なら通信してでも」に切り替えるかは Kenta の判断／es-MX を先頭にするか／Playwright WebKit project。

## ⑤ 判定理由（3行）
1. 周回1の P0 2件（段組み・AC7 文面）は直り、AC 9/9・試験も通る。土台は出荷に近い（68→80、+12）。
2. しかし周回1の修正リストのうち「見張りと onstart」「`<details>` で畳む」「端末内を常に先」の3つが文字どおりには入っておらず、3者一致の P1（失敗の案内が残る）を含む P1 6件が残る。85 未達。
3. 作業ツリーには周回3の編集が既に進み、10件の大半が入っている。残りは案内から手順を外す・th n3・es n20 の型・n8 の既定・PORT・CSS の統合。単独実行で 15/15 ×2 → commit → 公開版 cmp → 再審査で合格圏。

関連ファイル: /Users/omoya160/Kenta/dev/phrase30-app/app.js, /Users/omoya160/Kenta/dev/phrase30-app/index.html, /Users/omoya160/Kenta/dev/phrase30-app/style.css, /Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json, /Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs, /Users/omoya160/Kenta/dev/phrase30-app/playwright.config.mjs, /Users/omoya160/Kenta/dev/phrase30-app/scripts/check-data.mjs, /Users/omoya160/Kenta/dev/phrase30-app/scripts/check-no-external.mjs, /Users/omoya160/Kenta/dev/phrase30-app/README.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/会議の紙.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/LOOP_LOG.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/DECISIONS.md
