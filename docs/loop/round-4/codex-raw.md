## 指摘リスト

P0: 指摘なし。

- P1-1｜`app.js:46-65`／自然さと地域点を加算しており「自然さ優先、地域は同点時のみ」と不一致／Node模擬で通常AU=8、enhanced US=7となり通常AUを選択／NZだけ先に確定し、以降は `voiceScore` → `regionScore` の辞書順比較にする。
- P2-1｜`app.js:64`／完全同点の声が列挙順依存／同じAU声を逆順にすると選択が Zulu→Alpha と反転／同点時に `name`・`voiceURI` 等の固定比較を追加する。
- P2-2｜`data/phrases.json:480-483`／韓国語n9の注が「〇〇に 일본어를」と指示するため、型へそのまま代入すると `일본어를을/를` になる／例文ではプレースホルダーと助詞をまとめて置換している／「`〇〇을/를` を `일본어를` に」に直す。

訳再点検: 9・11番は上記ko n9以外、es説明・n20、th n3、zh n19/n24、en n28、ko n5、各見出しは指摘なし。

## 周回3指摘の○×

| 指摘 | 判定 | 根拠 |
|---|---:|---|
| P1-1 es n20 | ○ 解消 | `data/phrases.json:1015-1018`。template/exampleともusted形、tú形は注へ分離 |
| P2-2 同点声 | × 未解消 | `app.js:64`。合計点差のみで比較し、同点規則なし |

## 模擬の結果

| ケース | 期待 | 実際 | ○× |
|---|---|---|---:|
| NZ compact / AU enhanced | NZ | NZ compact | ○ |
| AU compact / US enhanced | US | US enhanced | ○ |
| remote NZ / local AU | local AU | local AU | ○ |
| localなし・remoteのみ | remote | remote Thai | ○ |
| 閉じたnovoice/nosynth後のsilent | 状態案内は再表示せず、silentは再失敗時に表示 | その通り | ○ |
| audiofail→別カード | 消える | 消えた | ○ |
| 言語切替後の発声間隔 | 往復とも80ms | 80ms／80ms | ○ |
| speechSynthesisなし | 初期表示、切替後も残る | その通り | ○ |
| 通常AU / enhanced US（追加） | US | AU | × |
| 完全同点を逆順（追加） | 同じ声 | 列挙先頭へ反転 | × |

試験結果: **passed**（Playwright 17/17・check passed）。ファイル変更なし。