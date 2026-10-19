# 1.結論

**出荷可**。P0なし、提示ログ15/15・破壊試験6/6。スペイン語n20のみ公開前修正を推奨。

# 2.周回2指摘の○×

| 指摘 | 判定・根拠 |
|---|---|
| P0-1 | ○ `app.js:43-64`。local全地域→remote全地域の2段探索 |
| P0-2 | **判定対象外（作る側で確認済み）** |
| P1-1 | ○ `app.js:136,146-153`。onstartで案内消去、watchdog再待機は1回 |
| P1-2 | ○ `tests/app.spec.mjs:299-303`。goto後にカード30枚を待つ |
| P1-3 | ○ `data/phrases.json:1330-1354`。英語・スペイン語とも料理／usted形 |
| P2-1 | ○ `app.js:166-174`。ended後は`settled`でfallback抑止 |
| P2-2 | × `app.js:127-162`。長文分割・keepaliveなし。ただし現30件は短文 |
| P2-3 | × `app.js:42`。同点声は依然として列挙順依存 |

# 3.破壊試験の表

| ケース | 操作 | 起きたこと | 判定 | 対応 |
|---|---|---|---|---|
| a | remote en-NZ＋local en-AU | local en-AU選択 | ○ | P0-1 |
| b | タイ語localなし、remoteのみ | remote選択、speak 1回、例外なし | ○ | P0-1 |
| c | onstartを3.0秒／5.2秒遅延 | watchdogは計2回。3秒では案内なし、5秒案内も5.2秒開始時に消去 | ○ | P1-1 |
| d | Audio ended→error | TTS 0回、案内なし | ○ | P2-1 |
| e | 40ms間隔×5 | busy cancel→speakは各80ms。発声0/120/200ms、途中分はcancel、最後の5番のみ継続 | ○ | AC4 |
| f | 英語声なしを閉じ→タイ→英語、silent→err | タイは表示、英語は再表示なし。silent/errは別キーで各表示 | ○ | AC7 |

模擬: [destructive-harness.cjs](/private/tmp/claude-502/-Users-omoya160-Kenta-dev/9997bf82-4035-4b58-a4ba-05d83d831d88/scratchpad/codex-work-r3/destructive-harness.cjs)。`node destructive-harness.cjs`で確認。プロジェクト変更なし。

# 4.指摘一覧

P0: 指摘なし。

- **P1-1** 場所: `data/phrases.json:53,1015-1016`／問題: n20の注記・exampleはustedだがtemplateだけtú／根拠: 画面に「別の言い方」として`Puedes`が出る／直し方: templateも`¿Puede repetirlo, por favor?`へ統一。
- **P2-1** 場所: `app.js:127-162`／問題: 長文化時の切断対策なし／根拠: 1 utterance固定／直し方: 将来長文を入れる際に文節分割。
- **P2-2** 場所: `app.js:42`／問題: 同点声が列挙順依存／根拠: score差だけでsort／直し方: 同点時の声名順位を追加。

# 5.訳の再点検

韓国語30件は自然で、無理に全語尾を`세요`にしていない点も適切。スペイン語n14/n30、8番6言語、n27英西、中国語n19/n28は○。スペイン語n20のみP1-1。

# 6.AC判定

AC1 ○／AC2 ○／AC3 ○／AC4 ○／AC5 ○／AC6 ○／AC7 ○／**AC8 判定対象外（作る側で確認済み）**／AC9 ○。