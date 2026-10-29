"""Bundle the Sprint 4 prototype into one self-contained page: prototypes/sprint4/index.html."""
import pathlib, re, subprocess
root = pathlib.Path(__file__).resolve().parent.parent
p = root / "prototypes/sprint4"
css = "\n".join((root / f"css/{n}.css").read_text() for n in ("tokens", "icons", "components"))
js = "\n".join((p / f"{n}.js").read_text() for n in ("data", "core", "screens", "clear", "flighty", "guided", "travelers", "motion", "interact", "profile", "familiar", "overview", "boot"))
logo = (root / "logos/travelmark-horizontal.svg").read_text().strip()
logo = re.sub(r'width="\d+" height="\d+"', 'aria-hidden="true" focusable="false"', logo, count=1)
assert "`" not in logo and "${" not in logo
doc = subprocess.run(["pandoc", "-f", "gfm", "-t", "html5", str(p / "HANDOFF.md")], capture_output=True, text=True, check=True).stdout
out = ((p / "src.html").read_text()
       .replace("/*__ADS_CSS__*/", css)
       .replace("/*__PROTO_CSS__*/", (p / "proto.css").read_text())
       .replace("/*__JS__*/", js.replace("__LOGO_H__", logo))
       .replace("<!--__HANDOFF__-->", doc))
(p / "index.html").write_text(out)
print("prototypes/sprint4/index.html", len(out) // 1024, "KB")
