# 周回6 検査官（spec-checker）— phrase30-app HEAD 29f0e24・2026-10-20 11:29〜11:37

## 結論: 未達1件（AC10）。○は9/10、判定不能は0
AC10 の「言語の選択が画面の一番上（固定の帯）にあり」が満たせていない。確認方法に書かれた項目はすべて通るが、画面を下へ送ると言語タブが画面の外へ消える。

| AC | 判定 | 何で確かめたか |
|---|---|---|
| AC1 | ○ | 11:29 check-data exit 0（6/30/180）。Playwright 2回目で AC1 ○、11:37 単独でも ○。※1回目は AC1 だけ「Test timeout … while setting up "page"」＝ブラウザ起動段階で止まった（同時刻に別の審査が 8798 で Playwright を動かしていた） |
| AC2 | ○ | check-data exit 0（example・ja 非空、template、〇〇入りは template に〇〇） |
| AC3 | ○ | Playwright AC3 ○（speak 2回→3回） |
| AC4 | ○ | AC4 ○（speak の直前が cancel・最後に pending/speaking false） |
| AC5 | ○ | viewport meta あり・config 390×844 isMobile。AC5 ○（6言語 scrollWidth ≤390・44px）。自分の計測 scrollW=390 |
| AC6 | ○ | check-no-external 3/3 exit 0。grep は app.js:344 の fetch('data/phrases.json') だけ |
| AC7 | ○ | AC7（en-US・ja-JP だけでタイ語）○: #notice に「タイ語」「設定」・pageerror 0。AC7b（一覧が空）○ |
| AC8 | ○ | 11:34 curl -sI → HTTP/2 200（last-modified 11:27 JST）。?v= 付きで4ファイルを取り HEAD と cmp 一致（index.html 2372B・style.css 6734B・app.js 25740B・phrases.json 43349B） |
| AC9 | ○ | audio 欄 180/180。AC9 ○（speak 0回・audioEl.ended true）。経路 app.js:199/213 |
| AC10 | **×** | 確認方法の項目は全部○（#tabs 下端102 < #board 上端119／幅390で x 2種類／幅1024で3種類・1/11/21 同じ y／30マス全部枠の内側（390・599・600・1024・1280）／8番で #detail に「言い換えの型: Do you speak 〇〇?…」枠の下8px）。**ところが「固定の帯」は成り立たない**: 幅390で scrollY=600 のとき .top 上端 -600・#tabs 上端 -542、画面 y=70 にあるのは .card。幅1280でも scrollY=205 で .top 上端 -205。計算値は html も body も overflowY=auto（style.css:11-13 の html,body{overflow-x:hidden}）・.top は sticky |
| K1「UI違う 四角形の中に並べて 言語は上で選ぶ感じで」 | ○（言葉どおりの範囲） | HEAD で撮り直し: 幅390はタブが一番上・その下に1つの枠・2列（左01〜15・右16〜30）。幅1280は3列×10。ただし下へ送るとタブは消える。「固定の帯」まで含めて読むなら × |

## 非スコープ違反: なし／許可外の行為: なし（送り先は kentakun709/phrase30-app だけ・公開サイトは HEAD と一致）

## AC の書き方の不備
- AC10「固定の帯」: 読み込み直後しか測らない → 「scrollTo(0,600) の後も .top の上端が 0・#tabs の上端が 0 以上・画面 y=70 の要素が #tabs の中」
- AC10「幅600px以上で3列」: 幅1024しか測らない → 599で2列・600で3列の境目を入れる（補助で測ると本文どおり）
- AC10「各マスに番号・文・訳が常時見え」: 確認方法に無い（補助で測ると5つの幅で英語30マスすべてにある）
- AC10「30個すべてが枠の内側」: どの幅か書いていない（幅1024は左右と10番の下端しか測らない）
- AC5「44px以上」: 全マスか1番だけか書いていない（試験は1番だけ）
- AC8: 確認方法に URL が書かれていない
