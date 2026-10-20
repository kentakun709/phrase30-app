# 納品前の機械チェック（送信2・作る側が自分でもう一度実行した記録・2026-10-20 12:5x〜13:0x）

対象: HEAD 08abe1b（周回7 合格＋審査後の直し＋東条の検収の2点）。公開版 https://kentakun709.github.io/phrase30-app/ は 12:56:48 に4ファイル cmp 一致・HTTP/2 200。試験は 08abe1b でも 22本×2周 44/44（13:1x）。

| 完成の条件 | ○ | 何で確かめたか（日時・出力・場所） |
|---|---|---|
| AC1 6言語切替 | ○ | `npm run check` 言語 6/6（12:5x）／Playwright AC1 ○（12:5x・22本×2周 44 passed） |
| AC2 180件の型・例文・訳 | ○ | `node scripts/check-data.mjs` 表現 180/180 ○（12:5x） |
| AC3 押すと鳴る・再タップでまた鳴る | ○ | Playwright AC3 ○（押した直後に欄も光る）／本物の読み上げ6言語 ○（12:4x・docs/loop/round-7/probe-mac-chrome.md） |
| AC4 cancel→speak・列が溜まらない | ○ | Playwright AC4 ○ |
| AC5 幅390・全マス44px・横スクロール無し | ○ | Playwright AC5（6言語×30マス ≥44・訳が描かれている）／AC5b・AC5c（欄 178〜267px ≤ 337・内部スクロールなし・帯 111px）○ |
| AC6 ログイン・鍵・課金・外部通信なし | ○ | `node scripts/check-no-external.mjs` 3/3 ○（12:5x）／`git grep -n -i -E "token|api[_-]?key|secret|password" -- . ':!node_modules'` で実値なし（13:0x） |
| AC7 声が無い端末の案内（欄の中・下へ送っても画面の中） | ○ | Playwright AC7/AC7b/AC7c/AC7d/AC5b ○（一覧が空のまま 600 送っても案内が画面の中・声が届いたら「鳴りません」も消える） |
| AC8 GitHub Pages 200・公開版一致 | ○ | `curl -sI` HTTP/2 200・4ファイル cmp 一致（12:42:40・HEAD 8f50840） |
| AC9 audio 欄の差し替え口 | ○ | Playwright AC9/AC9b/AC9c ○ |
| AC10 見た目（帯は下へ送っても残る・1つの枠の中に表・欄は押した瞬間に画面の中） | ○ | Playwright AC10/AC10b ○（1200 送った後も帯 0・タブ <130・599 は2列/600 は3列・30マス枠内・欄が画面の中・最下端で枠の下 8px）／検査官の自前計測（周回7）10/10／画面写し log/r7b-*.png |

- 秘密情報スキャン: 成果物と commit 範囲に token／APIキー／creds なし（13:0x）
- 引き継ぎ: 未commit なし・push 済み（8f50840）・CURRENT.md 更新済み
- 東条（Codex）の納品検収: 1回目（8f50840）不可＝2点 → 直して再検収（08abe1b）**可**（docs/loop/round-7/codex-kenshu.md）
