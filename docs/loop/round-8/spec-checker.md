# 周回8 検査官（spec-checker）の報告 — 2026-10-20 22:55〜23:03

結論: AC11 が未達（②③）。AC1〜AC7・AC9・AC10 と K1 は○。AC8 は公開版の HTTP 200 だけ○、HEAD との一致は main へ入れてから判定（保留）。
検査中に HEAD が 9044eb0→b3965d1（LOOP_LOG の追記だけ）。要件は f8dbb8f から差分なし。

| AC | 判定 | 証拠 |
|---|---|---|
| AC1 | ○ | npm run check「言語 6/6・フレーズ 30/30・表現 180/180」exit 0。PW_PORT=8801 で Playwright 2回とも 23 passed |
| AC2 | ○ | check-data exit 0。試験 AC2 ✓ |
| AC3 | ○ | 試験 AC3 ✓（speak 2回） |
| AC4 | ○ | 試験 AC4 ✓（cancel→speak・pending=false） |
| AC5 | ○ | viewport index.html:5。試験 AC5 ✓（6言語 scrollWidth≤390・30マス≥44） |
| AC6 | ○ | check-no-external exit 0。fetch は data/phrases.json だけ |
| AC7 | ○ | 試験 AC7・AC7b・AC5b ✓。自前でも #notice が見える・「タイ語」「設定」・600px 送っても画面の中・pageerror 0 |
| AC8 | ○（200）／一致は保留 | curl -sI → HTTP/2 200 text/html |
| AC9 | ○ | 試験 AC9 ✓ |
| AC10 | ○ | 試験 AC10・AC10b・AC5c ✓。②を自前確認（scrollTo 1200 後 elementFromPoint(195,70) は #tabs・押した前後の最初のマス 11→10・scrollY 差132・帯の上端0）。⑥最長で欄 286px（上限337）。高さ664は記録だけ {"h":266,"sh":285,"ch":265} |
| AC11 | × | ①○ ②× ③× ④○ ⑤○ |
| K1 | ○ | 幅390・600・1024×6言語の全30マスで .reading が30個・見える・データと一致・枠の内側 |

AC11 の内訳:
- ①○ 読み 180/180・中国語は声調記号つき漢字なし。ほか150件のうち例の13文字を含まない物が20件（ko28・ru5 等）あるが、ʌ ɯ ɕ ɨ ʰ など「等」に当たる文字を含む
- ②× pypinyin 0.55 と14件食い違い。13件は DECISIONS の規則（軽声 1,2,3,6,12,13,15,16,21,29／一の変調 20,24,30）で説明できる。**25番 谁 shéi（pypinyin は shuí。多音字）の理由が無い**
- ③× (a) AC は「機械の出力を元にし」だが実際は照合用 (b) 規則にも約束にも当たらない決め方: en2 繋ぎの r／en5 about の強勢／en28 強勢の位置／es11 estuˈdjando／es13 vez の強勢／es22 ir の強勢／ru1・ru19 вас /vas/／ru3・ru29 o か ɵ／ru10 ʂɛ か ʂe／ru23 ts か t͡s／軽い差: ko2 の区切り点
- ④○ 試験 AC11 ✓
- ⑤○ AC5・AC10 の試験はそのまま通った

AC の書き方の不備: ①の「等」で範囲が開いている（IPA_RE を正本と指せば決まる）。③は残すべき証拠と理由の置き場所が決まっていない。

非スコープ違反: なし。許可外の行為: なし（round-8 は remote に出ていない）。
合計: ○9（AC1〜7・9・10）、AC8 は 200 の部分だけ○、AC11 ×、K1 ○。
