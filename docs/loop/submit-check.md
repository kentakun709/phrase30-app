# 納品前の機械チェック（作る側が自分でもう一度実行した記録・2026-10-20）

対象: HEAD a244b16（周回5 審査後の直し）。公開版 https://kentakun709.github.io/phrase30-app/ は 11:5x に4ファイル cmp 一致・HTTP/2 200。

| 完成の条件 | ○ | 何で確かめたか（日時・出力・場所） |
|---|---|---|
| AC1 6言語切替 | ○ | `npm run check` 言語 6/6（11:2x）／Playwright AC1 ○（11:2x・20本×2周 40 passed） |
| AC2 180件の型・例文・訳 | ○ | `node scripts/check-data.mjs` 表現 180/180 ○（11:2x） |
| AC3 押すと鳴る・再タップでまた鳴る | ○ | Playwright AC3 ○／本物の読み上げ6言語 ○（11:4x・docs/loop/round-5/probe-mac-chrome.md） |
| AC4 cancel→speak・列が溜まらない | ○ | Playwright AC4 ○（連打・鳴っている最中・止めてから80ms） |
| AC5 幅390・44px・横スクロール無し | ○ | Playwright AC5/AC5b/AC5c ○（固定帯 235px） |
| AC6 ログイン・鍵・課金・外部通信なし | ○ | `node scripts/check-no-external.mjs` ○／`git grep` で秘密情報なし（11:0x） |
| AC7 声が無い端末の案内 | ○ | Playwright AC7/AC7b/AC7c/AC7d ○（言語名と「設定」を含む本文を検査官が実取得） |
| AC8 GitHub Pages 200 | ○ | `curl -sI` HTTP/2 200・4ファイル cmp 一致（11:5x） |
| AC9 audio 欄の差し替え口 | ○ | Playwright AC9（本物の WAV が鳴り終わる）／AC9b（404→読み上げ）／AC9c ○ |

- 秘密情報スキャン: 成果物と commit 範囲に token／APIキー／creds なし（11:0x・`.gitignore` の `*secret*` の行だけ当たる）
- 引き継ぎ: 未commit は docs/loop/round-5/ の審査後の記録のみ（納品の commit に含める）・push 済み・CURRENT.md 更新済み
