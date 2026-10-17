"""Regenerate outlined SVG logos. Requires fonttools and brotli; no network access."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import zipfile

root = Path(__file__).resolve().parents[1]
out = root / 'public/brand'
font = instantiateVariableFont(TTFont(root / 'public/fonts/manrope-latin.woff2'), {'wght': 650})
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
scale = 48 / font['head'].unitsPerEm
x = 82
paths = []
for char in 'CercaVet':
    glyph = cmap[ord(char)]
    pen = SVGPathPen(glyphs)
    glyphs[glyph].draw(TransformPen(pen, (scale, 0, 0, -scale, x, 50)))
    paths.append(pen.getCommands())
    x += font['hmtx'][glyph][0] * scale - 1.3
width = round(x + 4)
arc = 'M43 14a22 22 0 1 0 0 36'

def symbol(ink, dot):
    return f'<path d="{arc}" fill="none" stroke="{ink}" stroke-width="9" stroke-linecap="round"/><circle cx="46" cy="32" r="6" fill="{dot}"/>'

def svg(body, w=64, h=64):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="CercaVet"><title>CercaVet</title>{body}</svg>\n'

for variant, ink, dot in [('primary','#234b42','#6a815b'),('reverse','#f7f7f0','#d6e6b7'),('mono','#234b42','#234b42')]:
    word = ''.join(f'<path d="{path}" fill="{ink}"/>' for path in paths)
    (out / f'cercavet-logo-{variant}.svg').write_text(svg(symbol(ink,dot)+word,width))
    (out / f'cercavet-symbol-{variant}.svg').write_text(svg(symbol(ink,dot)))
icon = svg('<rect width="64" height="64" rx="18" fill="#234b42"/>'+symbol('#f7f7f0','#d6e6b7'))
(out / 'cercavet-app-icon.svg').write_text(icon)
(root / 'public/favicon.svg').write_text(icon)
with zipfile.ZipFile(out / 'cercavet-brand-kit.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for p in sorted(out.glob('*.svg')): archive.write(p,p.name)
    archive.write(root / 'public/fonts/OFL-Manrope.txt','OFL-Manrope.txt')
    if (root / 'docs/BRAND.md').exists(): archive.write(root / 'docs/BRAND.md','GUIA-DE-MARCA.md')
