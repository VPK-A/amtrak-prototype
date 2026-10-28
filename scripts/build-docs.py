"""Inline the library into docs/index.html so the docs page is one self-contained file."""
import json, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / "docs/src.html").read_text()
css = "\n".join((root / f"css/{n}.css").read_text() for n in ("tokens", "icons", "components"))
tokens = json.loads((root / "dist/tokens.resolved.json").read_text())
icons = sorted(json.loads((root / "icons/icons.json").read_text()).keys())
def logo(name):
    s = (root / f"logos/{name}.svg").read_text().strip()
    return re.sub(r'width="\d+" height="\d+"', 'style="display:block;width:100%;height:auto"', s, count=1)
out = (src.replace("/*__ADS_CSS__*/", css)
          .replace("/*__TOKENS__*/null", json.dumps(tokens, separators=(",", ":")))
          .replace("/*__ICONS__*/[]", json.dumps(icons))
          .replace("/*__IA__*/null", (root / "ia/app-shell.json").read_text())
          .replace("__LOGO_H__", logo("travelmark-horizontal"))
          .replace("__LOGO_V__", logo("travelmark-vertical")))
(root / "docs/index.html").write_text(out)
print("docs/index.html", len(out) // 1024, "KB")
