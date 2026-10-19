# LOOP_LOG — phrase30-app（30フレーズ音声アプリ）

見せる場面（会議の紙の表から。判子②の行は除く）:
- 公開した時 → URL・使い方1行・確認した端末と言語・未確認 → Kentaの返事: OK／直して＋一言 → 返事が無い時: 見せて終わる（返事が無ければそのまま）

## 周回 1 — 2026-10-20 07:00〜07:30
- 点数: 68 / 100（初回）
- 致命的な問題(P0): 2件（カードの段組み崩れ＝本文が右端28pxの列で縦に折れる／声の一覧が空の時の案内に言語名・設定手順が無い） ／ 重要な問題(P1): 5件（声の点数が名前だけ＝Eddy の機械声／speak 失敗で光ったまま／タイ語の丁寧形と言語の説明が画面に無い／音声ファイルの差し替え口が .gitignore で塞がる・読めない時に戻らない／型の文法）
- 受入基準: AC1 ○ / AC2 ○ / AC3 ○ / AC4 ○ / AC5 ○ / AC6 ○ / AC7 × / AC8 ○（07:09 HTTP/2 200）/ AC9 ○ ＝ 8/9
- 実行テスト: `npm run check` ○・Playwright 9 passed（Chrome・幅390）・本物の読み上げ 6言語 ○（docs/loop/round-1/probe-mac-chrome.md。スペイン語は Eddy）
- 所要時間: 約30分（作る10／レビュー15／裁定7）
- Kentaの赤: なし
- 残課題（優先順）: judge の優先修正リスト10件（docs/loop/round-1/judge.md）
- レビュー原文: docs/loop/round-1/（spec-checker・reviewer・user-panel・codex・judge・probe）
- 待っている返事: なし
- 次の一手: 周回2で10件を入れ、再審査

## 周回 2 — 2026-10-20 07:30〜（作る側の記録。審査は次の節）
- 入れた物: judge の1〜10 全部（段組み＝列を明示＋AC5 試験に本文の幅・位置／AC7 の文面に言語名と手順・閉じるボタン／声の点数に voiceURI・Eddy 等の減点・compact -3・端末内の声 +20／speak の try-catch と 2.5秒の見張り・鳴っていた時だけ 80ms 待つ／言語の説明をタブの下に・タイ語30文に ครับ・note 直し／.gitignore に !audio/**・stopAll で utter を消す・読めない時は読み上げに戻る／訳の直し／zh の除外（香港は常に・台湾は最後の代用）／audio 欄の外部URL検査／pagehide・refreshVoices・role=tablist・check-data の守り）＋使う人役の P2 から「使い方の1行」「ゆっくり」「小見出し3つ」「声の表示を日常語に」
- judge の「採らない」と違えた所（作る側の判断・再審査で見てもらう）: en n15/n24/n27/n28、ko の -시- 形4件（note も揃えた）、es n13/14/23/24/27（店員は usted）、zh n28/n29、ru n4/n24/n27、th n24/n27 ＝ 複数の審査役が一致した物と、6言語で n24（どの〇〇）・n27（料理）の意味を揃える物は採った
- 実行テスト: `npm run check` ○・Playwright **12 passed**（1回だけ最初の起動が時間切れで 11/12、取り直しで 12/12）・本物の読み上げ 6言語 ○（スペイン語 Mónica。docs/loop/round-2/probe-mac-chrome.md）
