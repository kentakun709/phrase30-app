# 周回5 judge の原文 — 2026-10-20（92/100・合格・P0 0・P1 0）

# 周回5 judge 裁定 — phrase30-app（HEAD＝「周回5 審査後の直し」・2026-10-20）

前提: 自分で全文を読んだ物＝app.js・index.html・style.css・data/phrases.json（全1535行）・tests/app.spec.mjs・README・scripts/check-data.mjs・check-no-external.mjs・docs/会議の紙.md・要件 v0.1・DECISIONS・CURRENT・PIPELINE・LOOP_LOG・周回4 judge・周回5の4本（検査官・構造の読み手・使う人役・東条）・probe。シェルが無いので `git diff 3d0b2b7 HEAD` は実行せず、HEAD の現物で「審査後の直し」の全件を1つずつ確かめた（下）。fact-checker は今回なし（訳は AI 製・未検品と画面脚注に明記＝法令・重大事実誤りに当たらない）。

## 審査後の直し（3d0b2b7 → HEAD）の確認＝全部入っている
- 構造の読み手 P1（一番上から初めての言語で1番へ送られる）: `app.js:276-277` に `inList` の2行（一覧の中まで下りている時だけ番号で引き継ぐ）＋ `:288` の `!curCard` 分岐。試験 `tests/app.spec.mjs:217-227`（ko を一番上から開いて scrollY<5・#langnote が帯の下）。消えた
- 折り畳みの旗2つ（構造の読み手 P2-1／東条 P2-2・模擬 h の×）: `:102-105` 開いていても「見た」印を付ける、`:317` summary を手で押したら howtoAuto=false。試験 `:201-214`（声の無い言語が2つ続く／手で開け直した物は畳まない）。消えた
- 一覧が空では開かない（構造の読み手 P2-2／使う人役 P1候補）: `:96-99` は案内＋「声: 読み込み中」だけ、自動で開くのは `:100-106`（一覧はあるのに声が無い）側だけ。試験 `:277-278`。消えた（案内そのものは AC7 が要求するので残る＝正しい）
- 見張りの1回目（構造の読み手 P2-3）: `:176-181` 鳴っていれば1回目から1秒ごとの見守り、読み込み待ち（pending）だけ待ち直す。消えた
- 同点の識別名（東条 P2-1・模擬 c の×）: `:57` 名前→voiceURI→lang で固定。消えた
- コメントと +1/−1 の往復（構造の読み手 P2-4）: `:41-43`・`:49` が今の動きと一致、voiceScore に default の加点なし、`:54` に −1 なし、goHowto は `topOffset()` 使用。消えた（残り: `$noticetext` が `#noticebody` を指す命名だけ）
- es 8番 usted（構造の読み手 P2-5）: `phrases.json:439-442` `¿Habla 〇〇?`／`¿Habla inglés?`／注に友達用 ¿Hablas と japonés。`:53` の説明を「tú（1〜7・9〜18番）／usted（8・19・20・27・30番）」に。消えた（下の訳の裁定で承認）
- README「19本」（構造の読み手 P2-6）: `README.md:30` は 19本に直っているが、**その後に試験を足したので実態は 20本**（spec の `test(` を数えて20。CURRENT.md:12 と LOOP_LOG:43 は 20本）。→ 唯一の提出前の直し（下）
- CURRENT.md（構造の読み手 P2-6）: 11:3x に周回5の状態へ更新済み。消えた

## ① 採点（`AI-OS/QUALITY_GATE.md`「コード・スクリプト」5軸）
| 軸 | 周回4 | 周回5 | 根拠（1行） |
|---|---|---|---|
| 要件適合 | 18 | 19 | AC 9/9 を検査官・東条の橋渡し（19/19）・作る側（HEAD 20本×2周 40/40）が確認。v0.1 主文「端末内の音声から自然な声を優先」が上から順の比較で実装され、NZ 優先・案内・差し替え口・登録課金なしが揃う。残: 「自然な声」の経路が対象端末（iPhone）で未確認 |
| 正しさ | 17 | 19 | 周回4の P1 3件（足し算・折り畳み・代用）と周回5の P1 1件が消え、東条の模擬で×だった2件（同名別URI・手で開け直し）も HEAD で消えた。残: 中南米の声しか無い端末の「代用」文言／「もっと自然な声に」で位置の記憶が上書き／summary 約41px |
| テスト | 17 | 18 | 20本・声の選び方20検・長い案内2場面の帯・折り畳み3条件・一番上からの切替・番号の引き継ぎ。残: 見守り（poll）経路と同名別URIの同点に試験なし／HEAD の直しは作る側の 40/40 と私のコード読みだけで、第三者の実行は 3d0b2b7 まで |
| 保守性 | 17 | 18 | README:27・DECISIONS:5-8・会議の紙:57-58・コメント:41-49 が同じ決まり。best() と +1/−1 の往復が消えた。CURRENT が最新。残: README:30 の本数（19→20）／`$noticetext` の命名／帯の閾値が 250 と 253 の2つ |
| 安全性 | 18 | 18 | 変更なし（check-no-external 3/3・fetch は data/phrases.json だけ・audio は audio/ 配下だけ・esc() で全差し込み・localStorage 3鍵・秘密なし） |
| **合計** | **87** | **92** | **+5** |

## ② 合否: **合格**（92 ≥ 85・P0 0・P1 0・AC 9/9・実行テスト PASS・公開版 cmp 一致（3d0b2b7 時点）・fact-checker 致命なし）→ **/submit へ**
統合後の集計（HEAD で消えた物は消えたと数える）: **P0 0・P1 0・P2 8**（棄却 4・Idea 多数・Experiment 4）。周回4比: P1 3→0、P2 13→8。

提出前にやること（gate ではなく記録の正確さ・1か所）:
1. **[P2・提出前] `/Users/omoya160/Kenta/dev/phrase30-app/README.md:30`** — 「Playwright 19本」が実態（20本）と違う（dev の決まり「記録に実態と違う値を入れない」）。→ 「19本」を「20本」に。試験の再実行は不要。commit → push → 公開版の4ファイルを HEAD で cmp し直す（検査官の cmp は 3d0b2b7 時点）。PIPELINE.md の「周回: 4」は /submit のスキルが 5 に更新する

残る P2（次版・納品の紙の「改善案」へ。今回は直さない）:
2. `app.js:84,115` スペイン語で中南米の声しか無い端末では「スペイン語（スペイン）の声が無いので代用」と出て、手順の「どれでも可」と食い違う（使う人役 P2-4・頻度低） → es は es-* のどれでも「代用」と言わない
3. `app.js:318-321,327` 「もっと自然な声に」で先頭へ飛ぶと 400ms 後に scroll の記憶が上書きされ、設定から戻ると元のカードを失う。名前がアプリ内のスイッチに読める（使う人役 P2-2） → 飛ぶ前の番号を覚えて戻す・名前を「声を良くする方法」に
4. `style.css:29` `.notice .nlink` が 32px（使う人役×・周回4の処方は 44px）。構造の読み手は帯の高さ優先で妥当と判断。裁定: 帯 ≤250px を優先して今回は受け入れ → 次版で `min-height:44px;margin:-6px 0`（帯の高さ据え置き）
5. `data/phrases.json:30` 中国語の説明に声の仕組み（台湾の声で代用）が残る＝英語で消した二重と同じ（使う人役 P2-5） → 次版で外す
6. `app.js:9` `$noticetext` が `#noticebody` を指す命名／`tests/app.spec.mjs:170,237` 同じ帯に 253 と 250 の2閾値／`style.css:45` summary 約41px（構造の読み手の小物）
7. 試験の穴: 見守り経路（`app.js:177-179`・差し替えの speaking は onstart と同時なので通らない）と同名別URIの同点（Codex P2-1 の残り） → 差し替えに「speaking=true で onstart を出さない」旗を足して1本
8. 字の多いカード（ロシア語8番・各言語9/11番）（使う人役 P2-6・B）

### 棄却した指摘（理由1行）
- 使う人役 P2-1「英語の帯の『代用』を消す／短く」: NZ の声が無い事実を隠さない（要件「可能なら NZ」への正直な表示・周回3〜4の裁定・AC3 試験が固定）→ 短縮案は Idea
- 使う人役（懐疑役）「19番 Tienen は ustedes」: 説明は「店に聞く Tienen」と明記しており誤りではない（店への複数形は普通）
- 使う人役「ru n26 Который час?」: 周回2〜4の裁定を維持（ネイティブ検品前に揺らさない）
- 構造の読み手 P2-2 の「一覧が空の時は案内も出さない」部分: AC7 が「getVoices が空でも #notice に言語名と『設定』」を要求 → 自動で開く方だけ止めた HEAD が上限

### 訳の裁定（言語ごと・争点は es 8番）
- **英語**: 採る＝なし（説明は「言い方の注意」済み・How's it going?／sweet as／bill は本文4・17・29番に実在）。n27 の短い形は注のまま
- **中国語**: 採る（次版）＝説明から「普通話の声が無ければ台湾の声で代用」を外す。n24「〇路」は維持
- **韓国語**: 採る＝なし（n9「〇〇을/를 の所を 일본어를 に」3者一致・8番の注 ○）
- **スペイン語**: **採る＝8番の usted 化（¿Habla inglés?）を承認**。理由: 8番の注「旅先で相手に通じる言葉を聞く」は知らない人への場面で、他5言語の8番（아세요・Вы・ครับ）と丁寧さが揃い、中南米でも無難。友達用 ¿Hablas は注に残る。説明の範囲を30件と突き合わせ一致（tú: 1 te llamas・2 eres・3 vives・4 estás・5 tú・7 te dedicas・9 estudias・11 llevas・12 haces・13 has・15 llegaste・16 te gusta・18 sabes／usted: 8 Habla・19 Tienen・20 Puede・27 recomienda・30 podría。6・10・14・17・21〜26・28・29 は人称なし）
- **ロシア語**: 採る＝なし（説明の ты の実例 Как тебя зовут? ○・8番 по-японски ○）。n26 維持
- **タイ語**: 採る＝なし（8番の注 ○・「別の言い方（鳴るのは上の文）」○）

### 納品の紙に書く「既知の制約」（3行）
1. 声はスマホの読み上げ機能。iPhone 標準の声は「簡易版」で機械っぽく、自然にするには言語ごとに設定で数十〜数百MB を入れる必要がある。スマホには NZ 英語の声がほぼ無いので、英語はオーストラリアなど近い地域の声で鳴り、帯に「代用」と出る
2. 訳は AI が作り、ネイティブの確認は未実施。韓国語・ロシア語は丁寧な形が中心、スペイン語は友達向け tú と店向け usted を番号で分けている（説明に明記）
3. 電波の無い所では開けない（データを毎回取りに行く）。閉じた案内と自動で開いた手順はその回だけ覚える。Chrome 内蔵の Google の声（端末内に声が無い時だけ）は読み上げ時に Google と通信することがある（鍵・課金・ログインは不要）

### 納品の紙に書く「未確認事項」（3行）
1. iPhone Safari・Android Chrome の実機では未確認（確かめたのは Mac の Chrome 155 で6言語の読み上げ ○）。特に、設定で入れた「拡張」「プレミアム」の声にこのアプリが切り替わるか、タブを押し直して反映されるか
2. iPhone で開いた直後に一瞬「声: 読み込み中」と黄色い案内が出ることがあるか（声の一覧が最初の操作の後に届く端末）
3. 日本語表示の端末で声の名前に「拡張」「プレミアム」が入るか（加点の語に入れてあるが効果は未確認）

## ④ Idea／Experiment 候補
**Idea（要件の外・納品報告の「改善案」へ）**: 事前生成の自然な音声（`audio` 欄＝使う人役の総意・根本解決）／帯を「声: Karen（豪）・簡易版」に短縮し NZ の話は手順へ／「もっと自然な声に」→「声を良くする方法」＋戻る位置の保持／es は es-* どれでも「代用」と言わない／読み（カナ・ローマ字・ピンイン）／自動くり返し・停止タイマー／PWA（電波なし）／友達向け切替（ты・반말・tú）／今日の5枚・聞いた回数／閉じた案内を翌日も覚える／ネイティブ検品後に画面へ表示／zh 説明から声の話を外す／nlink 44px（負のマージン）／「別の言い方」も押して聞ける
**Experiment（Evidence C・実機で確かめてから）**: iPhone Safari で premium/enhanced の声が getVoices に出て選ばれるか・設定から戻って反映されるか（使う人役 P0候補）／Android で一覧が空で届く頻度と「読み込み中」の見え方／onstart も onend も来ない端末が本当にあるか（poll 経路の前提）／Playwright WebKit

## ⑤ 判定理由（3行）
1. AC 9/9 を3者が独立に確認・20本×2周 PASS・公開版 cmp 一致・周回4の P1 3件と P2 9件が全部入り、周回5で出た唯一の P1 と東条の模擬の×2件も HEAD で消えている（コードと試験で確認）→ 92点・P0/P1 ゼロで共通ゲートと追加ゲートを満たす
2. 残る P2 8件はどれも目的（タップ1回で聞ける・何度でも）を妨げない。提出前に直すのは README:30 の本数（19→20）の1か所だけ
3. 実機未確認（iPhone/Android）とネイティブ検品は会議の紙の「やらないこと」「未確認として報告する」の範囲 → 上の「既知の制約」「未確認事項」を納品の紙に書いて /submit（Kenta の「OK／直して」が最終判断）

関連ファイル: /Users/omoya160/Kenta/dev/phrase30-app/app.js, /Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs, /Users/omoya160/Kenta/dev/phrase30-app/README.md, /Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json, /Users/omoya160/Kenta/dev/phrase30-app/style.css, /Users/omoya160/Kenta/dev/phrase30-app/index.html, /Users/omoya160/Kenta/dev/phrase30-app/docs/CURRENT.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/PIPELINE.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/LOOP_LOG.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/DECISIONS.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/会議の紙.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/loop/round-5/{spec-checker,reviewer,user-panel,codex,probe-mac-chrome}.md, /Users/omoya160/Kenta/dev/phrase30-app/docs/loop/round-4/judge.md, /Users/omoya160/Kenta/dev/ai-config/AI-OS/QUALITY_GATE.md
