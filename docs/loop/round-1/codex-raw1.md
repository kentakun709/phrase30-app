Chrome起動がサンドボックスに拒否されました。`127.0.0.1:8787/index.html` は HTTP 200 で、失敗箇所はChrome起動です。全9件で同じエラーです。代表1件のエラー全文:

```text
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,BlockOriginHeaderModificationOnRedirect,Translate,AutoDeElevate,OptimizationHints,NetworkTimeServiceQuerying,AimEnabled,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --disable-updater-scheduler --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/var/folders/vw/h87pm5k103s4rlpl2ckw8_4r0000gp/T/playwright_chromiumdev_profile-Czg03x --remote-debugging-pipe --no-startup-window
<launched> pid=23358
Call log:
  - <launching> /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,BlockOriginHeaderModificationOnRedirect,Translate,AutoDeElevate,OptimizationHints,NetworkTimeServiceQuerying,AimEnabled,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --disable-updater-scheduler --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/var/folders/vw/h87pm5k103s4rlpl2ckw8_4r0000gp/T/playwright_chromiumdev_profile-Czg03x --remote-debugging-pipe --no-startup-window
  - <launched> pid=23358
  - [pid=23358] <gracefully close start>
  - [pid=23358] <kill>
  - [pid=23358] <will force kill>
  - [pid=23358] exception while trying to kill process: Error: kill EPERM
  - [pid=23358] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=23358] starting temporary directories cleanup
  - [pid=23358] finished temporary directories cleanup
  - [pid=23358] <gracefully close end>

Error Context: test-results/app-30フレーズ（スマホ幅・読み上げは差し替え）-AC1-言語タブが6つあり、押すと30項目の表記が切り替わる/error-context.md
```

## A. 試験の実行結果

### `npm run check`

終了コード0、成功。

```text
> phrase30-app@0.1.0 check
> node scripts/check-data.mjs && node scripts/check-no-external.mjs

言語 6/6・フレーズ 30/30・表現 180/180
○ check-data: 異常なし
点検したファイル 3/3
○ check-no-external: 外部通信・鍵・ログイン・課金なし
```

### `npx playwright test`

`0 passed / 9 failed`。9件ともアサーション失敗ではなくChrome起動失敗です。

```text
9 failed
  tests/app.spec.mjs:34:3 › 30フレーズ（スマホ幅・読み上げは差し替え） › AC1 言語タブが6つあり、押すと30項目の表記が切り替わる
  tests/app.spec.mjs:49:3 › 30フレーズ（スマホ幅・読み上げは差し替え） › AC2 どの言語でも30枚すべてに本文と日本語訳があり、〇〇入りは型も見える
  tests/app.spec.mjs:65:3 › 30フレーズ（スマホ幅・読み上げは差し替え） › AC3 カードを押すと読み上げが呼ばれ、同じカードをもう一度押すとまた呼ばれる（英語は en-AU 等を選ぶ）
  tests/app.spec.mjs:79:3 › 30フレーズ（スマホ幅・読み上げは差し替え） › AC4 新しいタップのたびに cancel → speak の順で呼ばれ、読み上げの列が溜まらない
  tests/app.spec.mjs:96:3 › 30フレーズ（スマホ幅・読み上げは差し替え） › AC5 幅390pxで横スクロールが出ず、カードとタブは44px以上
  tests/app.spec.mjs:112:3 › 30フレーズ（スマホ幅・読み上げは差し替え） › AC7 その言語の声が無い端末では案内が出て、押してもエラーで止まらない
  tests/app.spec.mjs:128:3 › 30フレーズ（スマホ幅・読み上げは差し替え） › AC7b 声の一覧が空（まだ読めていない）の時も案内が出る
  tests/app.spec.mjs:135:3 › 30フレーズ（スマホ幅・読み上げは差し替え） › AC9 audio にファイルが入っている項目は、読み上げの代わりにその音声を鳴らす
  tests/app.spec.mjs:158:3 › 30フレーズ（スマホ幅・読み上げは差し替え） › 言語の選択は次に開いた時も残る
```

### 破壊試験

| 項目 | 再現手順 | 実際に起きたこと | 期待 | 直し案 |
|---|---|---|---|---|
| a 同じカード連打 | Node上で100ms間隔、n1を10回 | `cancel=10 / speak=10`、終了後`pending=false` | 毎回cancel→speak、列なし | Node模擬では指摘なし。実機は未確認 |
| a 別カード連打 | n1/n2を交互に100ms間隔で10回 | `cancel=10 / speak=10`、終了後`pending=false` | 最新だけ再生 | Node模擬では指摘なし。実機は未確認 |
| b 再生中の言語切替 | n1再生直後に中国語へ切替 | `speak→cancel→getVoices`、`pending=false`、再生表示解除 | 旧音声停止、勝手に新言語を再生しない | 指摘なし |
| c タブ高速切替 | 6言語を120回同期切替 | 例外なし、最後は英語、カード30枚、cancel 120回 | 最後の選択に一致 | 指摘なし |
| d voices空 | `getVoices()`を空配列 | 「音声の一覧をまだ読み込めていません」を表示 | 案内して停止しない | 指摘なし |
| d voiceschanged | 後から`en_NZ`を追加してイベント発火 | `Late NZ`を選択、案内が消えた | 遅延ロードへ追従 | 指摘なし。ただしiOSでイベント自体が来ない場合は後述 |
| d 対象言語なし | 英語声だけでタイ語へ切替しタップ | 案内後、voiceなし・`th-TH`指定で`speak`を呼ぶ | 案内し、例外でも止まらない | `speak`をtry/catchし、声なしなら再生しない |
| d `speak()`例外 | `speak`が同期的に例外を投げるモック | `Error: speak blocked`が外へ伝播、カードは再生中表示のまま | エラーを捕捉し表示解除・案内 | [app.js:125](/Users/omoya160/Kenta/dev/phrase30-app/app.js:125)をtry/catch |
| e XSS | name/nameJa/example/ja/template/noteへ`<script>`・`<img onerror>` | 生タグなし、`&lt;...&gt;`へ変換 | DOMとして実行されない | 指摘なし。Node描画実測、実ブラウザは未確認 |
| f localStorage例外 | getItem/setItemが例外、またはgetItemがnull | 初期化・言語切替とも例外なし | 保存不能でも利用可能 | 指摘なし |
| g fetch 404 | HTTP 404を返す | `データを読み込めませんでした（HTTP 404）` | 画面内案内、例外停止なし | 指摘なし |
| g ネットワーク失敗 | fetchをreject | `Failed to fetch`を画面表示 | 同上 | 指摘なし |
| g JSON壊れ | `json()`がSyntaxError | `Unexpected token`を画面表示 | 同上 | 指摘なし |
| h visibilitychange | 再生中にhidden→visible | hidden時にcancel・表示解除、復帰時は停止状態 | 背景で再生継続しない | 指摘なし |
| h pagehide | リスナーを静的解析 | `pagehide`リスナーなし | iOS/BFCache遷移でも停止 | `pagehide`でも`stopAll()` |

音声ファイル経路もNode実測し、`audio/en/01.mp3`設定時は`cancel→audio.play`、`speechSynthesis.speak`なしでした。

## B. 指摘一覧

### P0（出荷停止）

1. ブラウザ受入試験が全件未実行  
   場所: [playwright.config.mjs:9](/Users/omoya160/Kenta/dev/phrase30-app/playwright.config.mjs:9)  
   根拠: Chromeが起動直後にSIGABRT。9件すべて同じ基盤エラーで、AC1・AC3・AC4・AC5・AC7・AC9を実ブラウザ確認できていない。ローカルHTTPは200。  
   直し案: サンドボックス外の同Mac Chromeで`npx playwright test`を再実行する。  
   対応: AC1、AC3、AC4、AC5、AC7、AC9

2. `speechSynthesis.speak()`の同期例外が未捕捉  
   場所: [app.js:123](/Users/omoya160/Kenta/dev/phrase30-app/app.js:123)、[app.js:125](/Users/omoya160/Kenta/dev/phrase30-app/app.js:125)  
   再現: 声なし状態で`speak()`に例外を投げさせる。  
   実際: 例外がクリックハンドラ外へ伝播し、カードが再生中表示のまま残る。  
   直し案: `speak()`をtry/catchし、失敗時に`setPlaying(null)`と案内表示。  
   対応: AC7

3. リモート音声を選び得るため「外部通信なし」を保証できない  
   場所: [app.js:19](/Users/omoya160/Kenta/dev/phrase30-app/app.js:19)、[app.js:34](/Users/omoya160/Kenta/dev/phrase30-app/app.js:34)、[scripts/check-no-external.mjs:6](/Users/omoya160/Kenta/dev/phrase30-app/scripts/check-no-external.mjs:6)  
   根拠: `localService`は加点1だけで、名前に`Natural`等があるリモート声は加点5。Node実測で`Google Natural(localService=false)`がローカル声に勝った。検査スクリプトも実行時TTS通信を検査しない。  
   直し案: AC6を厳密適用するなら`localService !== false`の声だけを候補にする。  
   対応: AC6

4. 公開URLのHTTP 200未確認  
   場所: [docs/会議の紙.md:40](/Users/omoya160/Kenta/dev/phrase30-app/docs/会議の紙.md:40)  
   根拠: 外部ネットワーク禁止のため指定URLへ接続していない。  
   直し案: 配信直後、外部通信可能な環境で`curl -sI https://kentakun709.github.io/phrase30-app/`を実行する。  
   対応: AC8

### P1（出荷前に直す）

1. `cancel()`直後の同一タスク内`speak()`はiOS Safari／Chromeで無音化する既知傾向がある  
   場所: [app.js:104](/Users/omoya160/Kenta/dev/phrase30-app/app.js:104)、[app.js:125](/Users/omoya160/Kenta/dev/phrase30-app/app.js:125)  
   根拠: cancelの内部処理が非同期の実装では、直後のutteranceまで取り消されることがある。現在は待ち時間ゼロ。  
   直し案: 世代トークンを持ち、再生中だった場合だけ50〜100ms後に最新utteranceをspeakする実機検証済み経路へ変更。  
   対応: AC3、AC4

2. iOSで`voiceschanged`が来ない場合、新規追加した対象言語声を再取得できない  
   場所: [app.js:107](/Users/omoya160/Kenta/dev/phrase30-app/app.js:107)、[app.js:182](/Users/omoya160/Kenta/dev/phrase30-app/app.js:182)  
   根拠: タップ時の再取得条件は「全voiceが0件」のみ。英語声はあるがタイ語声がない状態では、`voiceschanged`が来ない限り更新されない。  
   直し案: `state.noVoice`時もユーザータップごとに`refreshVoices()`する。  
   対応: AC7

3. TTSからaudioへ切り替えた後、旧utteranceの遅延イベントが再生表示を消す  
   場所: [app.js:84](/Users/omoya160/Kenta/dev/phrase30-app/app.js:84)、[app.js:105](/Users/omoya160/Kenta/dev/phrase30-app/app.js:105)、[app.js:114](/Users/omoya160/Kenta/dev/phrase30-app/app.js:114)  
   再現: TTS再生→audio項目タップ→旧utteranceの`canceled`を遅延発火。  
   実際: audioの`playing=2`が旧イベントで`null`になった。音は再生されるが表示が消える。  
   直し案: cancel前に`state.utter=null`とし、旧イベントを無効化する。  
   対応: AC9、再生中表示要件

4. `pagehide`で停止しない  
   場所: [app.js:184](/Users/omoya160/Kenta/dev/phrase30-app/app.js:184)  
   根拠: `visibilitychange`のみ。iOS Safariのページ遷移・BFCacheでは`pagehide`だけ通る場合がある。  
   直し案: `window.addEventListener('pagehide', stopAll)`を追加。  
   対応: AC4

5. 中国語voice除外が不完全  
   場所: [app.js:28](/Users/omoya160/Kenta/dev/phrase30-app/app.js:28)、[data/phrases.json:28](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:28)  
   根拠: `zh-HK`と`yue`しか除外しない。Node実測で`zh-Hant-HK`を選択し、`zh-TW`単独時も選択した。データ定義の「zh-TWは使わない」と不一致。  
   直し案: script/regionを解析し、`HK`・`TW`・`Hant`・`yue`を普通話候補から除外する。  
   対応: AC3、AC7

6. audio欄の外部URLを検査しない  
   場所: [app.js:93](/Users/omoya160/Kenta/dev/phrase30-app/app.js:93)、[scripts/check-no-external.mjs:6](/Users/omoya160/Kenta/dev/phrase30-app/scripts/check-no-external.mjs:6)  
   根拠: 検査対象がHTML/JS/CSSのみ。JSONのaudioへHTTPS URLが入ると外部通信できる。現データは全件空。  
   直し案: audioは空または同一オリジン相対パスだけ許可する検査を追加。  
   対応: AC6、AC9

7. Playwrightモックが`voiceschanged`と実際のcancel競合を再現しない  
   場所: [tests/app.spec.mjs:18](/Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs:18)、[tests/app.spec.mjs:21](/Users/omoya160/Kenta/dev/phrase30-app/tests/app.spec.mjs:21)  
   根拠: `addEventListener`は空実装。pendingは全utterance共通のbooleanで、旧タイマーが新utteranceを終了扱いにできる。  
   直し案: utteranceごとの状態、同期例外、遅延cancel、voiceschanged発火を持つモックを追加。  
   対応: AC3、AC4、AC7

8. 翻訳・テンプレートに意味ずれ、助詞・丁寧度の問題  
   場所: [data/phrases.json](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json)  
   根拠: Cに全件列挙。特に全言語n24、4言語n27、タイ語の丁寧粒子。  
   直し案: C記載の表現へ修正後、ネイティブ最終確認。  
   対応: AC2の品質要件

### P2（後で）

1. Chromeの長文切断対策なし  
   場所: [app.js:108](/Users/omoya160/Kenta/dev/phrase30-app/app.js:108)、[app.js:125](/Users/omoya160/Kenta/dev/phrase30-app/app.js:125)  
   根拠: 単一utteranceをそのまま渡すため、Chromeで約15秒を超える長文が途中停止する既知傾向への分割・keepaliveがない。現30文は短いため直近影響は小さい。  
   直し案: 将来長文化する場合は文節分割して順次読み上げる。  
   対応: AC3

2. 声品質の同点時はブラウザ列挙順依存  
   場所: [app.js:19](/Users/omoya160/Kenta/dev/phrase30-app/app.js:19)、[app.js:34](/Users/omoya160/Kenta/dev/phrase30-app/app.js:34)  
   根拠: Google/OS標準の明示順位がなく、同点なら`getVoices()`順。  
   直し案: 許可するローカル声名と品質順位を言語別に定義する。  
   対応: AC3

指定論点のうち、以下は指摘なしです。

- user activation: UI上の`speak()`はカードのclickから同期的に到達するため、初回操作前の自動再生はない（[app.js:155](/Users/omoya160/Kenta/dev/phrase30-app/app.js:155)）。
- utteranceのGC: `state.utter`で参照保持している（[app.js:122](/Users/omoya160/Kenta/dev/phrase30-app/app.js:122)）。ただしaudio切替時の古い参照はP1-3。
- 大文字小文字・`en_NZ`: `normLang()`が小文字化と`_`→`-`変換を行い、Node実測で選択成功（[app.js:15](/Users/omoya160/Kenta/dev/phrase30-app/app.js:15)）。
- `en-NZ→en-AU→en-GB→en-*`、`ko-KR`、`ru-RU`、`th-TH`、`es-ES→es-MX`の順序はデータ定義どおり。問題は中国語script/regionとリモート声優先。

## C. 180表現のレビュー

### 英語

- n24・英語・`Which 〇〇?`に対して例文が`Which bus should I take?`で、「どの〇〇ですか？」から「どれに乗るべきか」へ意味が変化 → `Which bus is it?`／「どのバスですか？」へ揃える（[data/phrases.json:1186](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1186)）。
- n27・英語・`What do you recommend?`は自然だが料理に限定されず、原文とjaも一般化 → `What would you recommend from the menu?`／「メニューのおすすめは何ですか？」（[data/phrases.json:1330](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1330)）。

その他は指摘なし。NZ向けの`Sweet as`、`bill`、NZ→AU→GBの綴り・語彙選択は問題なし。

### 中国語

- n24・中国語・`哪〇〇？`は量詞がなく、例文`我应该坐哪路车？`とも構造・意味が不一致 → `我应该坐哪（量词）〇〇？`など、量詞を含む型として明示（[data/phrases.json:1193](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1193)）。
- n28・中国語・`我要这个。`は自然だが、他言語のplease相当より直接的 → `请给我这个。`（[data/phrases.json:1385](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1385)）。
- n29・中国語・`买单。`は通じるが命令的で丁寧度が低い → `麻烦买单。`（[data/phrases.json:1433](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1433)）。

その他は指摘なし。

### 韓国語

- n17・韓国語・`'〇〇'이 무슨 뜻이에요?`は、〇〇が母音終わりなら`가`が必要 → `'〇〇'이/가 무슨 뜻이에요?`（[data/phrases.json:864](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:864)）。
- n18・韓国語・`수영 할 줄 알아요?`は`수영하다`の活用なので分かち書きが不自然 → `수영할 줄 알아요?`、型も`〇〇할 줄 알아요?`（[data/phrases.json:912](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:912)）。
- n24・韓国語・型`어느 〇〇예요?`に対して例文`어느 버스를 타야 해요?`が「どれに乗るべきか」へ変化 → `어느 버스예요?`／「どのバスですか？」（[data/phrases.json:1200](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1200)）。

その他は指摘なし。

### スペイン語

- n14・スペイン語・`¿Puedo sacar una foto?`は中南米寄り。es-ES優先なら`hacer una foto`がより自然 → `¿Puedo hacer una foto?`（[data/phrases.json:728](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:728)）。
- n23・スペイン語・型`a 〇〇`と例文`al aeropuerto`は冠詞縮約のため直接置換できない → 例を`¿Cómo llego a la estación?`にし、〇〇へ`la estación`を入れられる形にする（[data/phrases.json:1159](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1159)）。
- n24・スペイン語・`¿Qué 〇〇?`に対して`¿Qué autobús tengo que tomar?`が意味拡張 → `¿Qué autobús es?`／「どのバスですか？」（[data/phrases.json:1207](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1207)）。
- n27・スペイン語・`¿Qué me recomiendas?`は一般的なおすすめで、料理指定が消えている → `¿Qué plato me recomiendas?`（[data/phrases.json:1351](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1351)）。

その他は指摘なし。

### ロシア語

- n08・ロシア語・`Вы говорите по-〇〇?`は言語名をそのまま代入できず、`русский→по-русски`の派生が必要 → 型に「〇〇には`русски/английски`等の副詞形」と注記する（[data/phrases.json:446](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:446)）。
- n14・ロシア語・`Можно сфотографировать?`は他動詞なのに目的語がなく不完全に聞こえる → 撮影許可なら`Можно здесь фотографировать?`（[data/phrases.json:735](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:735)）。
- n24・ロシア語・`Какой 〇〇?`に対して`На какой автобус мне сесть?`が意味拡張 → `Какой это автобус?`／「どのバスですか？」（[data/phrases.json:1214](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1214)）。
- n27・ロシア語・`Что вы посоветуете?`は料理に限定されない → `Какое блюдо вы посоветуете?`（[data/phrases.json:1358](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1358)）。

その他は指摘なし。

### タイ語

- n01〜30・タイ語・例文から丁寧粒子を一律省略しており、他言語より丁寧度が下がる。メタ注記も女性形を常に`ค่ะ`としているが、質問では通常`คะ` → 男性・女性の例文を分けるか、話者を固定して質問に`ครับ/คะ`、平叙文に`ครับ/ค่ะ`を付ける（[data/phrases.json:73](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:73)）。
- n03・タイ語・`คุณอยู่ที่ไหน`は「今どこにいますか？」にも読め、居住地の意味が曖昧 → `คุณอาศัยอยู่ที่ไหน`（[data/phrases.json:213](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:213)）。
- n12・タイ語・`งานอดิเรกของคุณคืออะไร`は文法的には正しいが会話では硬い → `เวลาว่างคุณชอบทำอะไร`（[data/phrases.json:645](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:645)）。
- n24・タイ語・型`〇〇ไหน`に対して`ต้องขึ้นรถเมล์สายไหน`が「どれに乗る必要があるか」へ意味拡張 → `รถเมล์คันไหน`など「どのバスですか」に揃える（[data/phrases.json:1221](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1221)）。
- n27・タイ語・`มีอะไรแนะนำไหม`は一般的なおすすめで料理指定がない → `มีเมนูอะไรแนะนำไหม`（[data/phrases.json:1365](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1365)）。
- n28・タイ語・`เอาอันนี้`は粒子なしでは直接的 → `ขออันนี้ครับ/ค่ะ`（[data/phrases.json:1413](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1413)）。
- n29・タイ語・`เช็คบิลด้วย`は通じるが、表記と丁寧度を整えるなら → `คิดเงินด้วยครับ/ค่ะ`（[data/phrases.json:1461](/Users/omoya160/Kenta/dev/phrase30-app/data/phrases.json:1461)）。

その他は指摘なし。

## D. AC1〜AC9判定

| AC | 判定 | 根拠 |
|---|---|---|
| AC1 | 満たす | データ6言語×30件、Node描画で6タブ・30カード・高速切替を確認。ただしChrome実テストは基盤失敗 |
| AC2 | 満たす | `check-data`で180/180のexample・ja・template・audio欄を確認。表現品質はCの修正要 |
| AC3 | 未確認 | Nodeでは再タップごとにspeak 10回。実ブラウザは未実行で、cancel直後speakの端末依存リスクあり |
| AC4 | 未確認 | Nodeでは各回cancel→speak、終了後pending=false。実Chrome/iOSのキュー状態は未確認 |
| AC5 | 未確認 | viewport・CSSのmin-heightは静的確認済み。390px実測テストはChrome起動失敗 |
| AC6 | 満たさない | 明示的外部URLはないが、`localService=false`のWeb Speech音声を選べるため外部通信を保証できない |
| AC7 | 満たさない | 案内は出るが、`speak()`同期例外が未捕捉で再生表示が残る。iOSでvoice再取得できない経路もある |
| AC8 | 未確認 | 外部ネットワーク禁止のためGitHub Pages URLのHTTP 200を未確認 |
| AC9 | 満たす | 全180件にaudio欄あり。Node実測で値あり時はaudio.play、speechSynthesisなし |

ファイル変更なし。テストランナーによる`test-results/`出力以外は書き換えていません。