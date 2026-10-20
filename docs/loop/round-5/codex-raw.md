## 1. 指摘リスト

- P2-1｜`app.js:58`／最終比較が名前だけで、同名・別`voiceURI`の声は列挙順で反転する／名前同点時に`voiceURI`、必要なら`lang`も固定比較する。
- P2-2｜`app.js:103-115,313-319`／自動展開後、summaryで閉じて手動再開しても`howtoAuto`が残り、声到着時に畳まれる。別言語へ開いたまま移ると初回済み記録も付かない／自動展開状態を言語別に持ち、summaryの手動toggleで解除する。

## 2. 周回4指摘の○×表

| 指摘 | 判定 | 根拠 |
|---|---:|---|
| P1-1 | ○ 解消 | `app.js:51-58`。NZ→既定分を除いた`voiceScore`→地域→default→名前の順で個別比較 |
| P2-1 | △ 部分 | `app.js:58`。Alpha/Zulu逆順は常にAlphaだが、同名・別URIでは選択URIが反転 |
| P2-2 | ○ 解消 | `data/phrases.json:480-483`。「〇〇을/를」全体を「일본어를」に置換する指示になった |

## 3. 模擬の結果

| ケース | 期待 | 実際 | ○× |
|---|---|---|---:|
| a | enhanced US | Samantha・US enhanced | ○ |
| b | premium AR | Diego・es-AR premium | ○ |
| c | 逆順でも同じ声 | Alpha/Zuluは常にAlpha。同名Sameでは`uri-z`↔`uri-a`と反転 | × |
| d | defaultは自然さ・地域同点時だけ | 同点ではdefault、地域差ではAU、品質差ではpremium US | ○ |
| e | NZ compact | Hayley・NZ compact | ○ |
| f | local AU | Karen・local AU | ○ |
| g | CN優先、HK除外、CNなしならTW | CN／TW／HKのみはnull | ○ |
| h | 自動開→声到着で閉、閉後は再開なし、手動開は維持 | 前2件と案内ボタン経由は○。summaryで手動再開すると声到着時に閉じる | × |
| i | 初回は同じ番号、端では末尾 | 20番を引継ぎ。全言語30件のため端超過なし。短縮時の明示clampはない | ○ |

`app.js`の`voiceScore`・`regionScore`・`compareVoices`・`pickVoice`をNodeへ写し、AU/US、es-ES/es-AR、同名別URI、default、NZ、local/remote、CN/TW/HK配列で実行。h/iは`app.js:90-115,263-286`と`tests/app.spec.mjs:190-254,396-417`を照合。

## 4. 訳の再点検

指摘なし。

## 5. 試験結果

passed: **19**／failed: **0**。ファイル変更なし。