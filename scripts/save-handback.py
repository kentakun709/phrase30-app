# 審査役（サブエージェント）の最終報告を、記録の JSONL から本文だけ取り出して docs/loop/round-N/ に保存する（本文は一字も変えない）
import json, sys
src, dst, key, title = sys.argv[1:5]
last = None
with open(src, encoding="utf-8") as f:
    for line in f:
        try: d = json.loads(line)
        except Exception: continue
        c = (d.get("message") or {}).get("content")
        if not isinstance(c, list): continue
        for b in c:
            if b.get("type") == "tool_use" and "Handback" in str(b.get("name", "")):
                for v in (b.get("input") or {}).values():
                    if isinstance(v, str) and key in v: last = v
            if b.get("type") == "text" and key in b.get("text", ""): last = b["text"]
if not last: sys.exit("見つからない: " + key)
open(dst, "w", encoding="utf-8").write("# " + title + "\n\n" + last + "\n")
print("saved", dst, len(last))
