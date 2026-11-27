"""
Сборка логотипа ООО «Константа» (assets/brand/*.svg) из геометрии.

Знак и надпись перестроены по замерам оригинального логотипа заказчика
(PNG 1372×402): координаты ниже — в пикселях этого PNG, поэтому их легко
сверить с исходником. Запуск: python build-logo.py
"""

from pathlib import Path

TEAL = "#009a9e"
SLATE = "#465963"
WHITE = "#ffffff"

# ---------- знак ----------
# Центр круга в исходнике (165.5, 190), внешний радиус 125.
# Кольцо 107.5–125, тонкий белый зазор 104–107.5, диск 104.
# «К»: вертикаль шириной 24 по центру, горизонтальный вывод влево,
# два плеча под 45° шириной 34/√2, треугольник-«диод» и черта у его основания.
MARK_CX, MARK_CY, MARK_R = 165.5, 190, 125


def mark_body(ring, disk, accent):
    """Элементы знака в координатах с центром (0, 0); вырезы — через маску."""
    seg_y = (104**2 - 74**2) ** 0.5
    return f"""<mask id="k-cut" maskUnits="userSpaceOnUse" x="-130" y="-130" width="260" height="260">
      <rect x="-130" y="-130" width="260" height="260" fill="#fff"/>
      <g fill="#000">
        <rect x="-12" y="-83" width="24" height="166"/>
        <rect x="-130" y="-12" width="130" height="24"/>
        <path d="M12-12L140-140V-174L12-46Z"/>
        <path d="M12 12L140 140V174L12 46Z"/>
        <rect x="71" y="-79" width="3" height="158"/>
      </g>
    </mask>
    <g mask="url(#k-cut)">
      <circle r="116.25" fill="none" stroke="{ring}" stroke-width="17.5"/>
      <circle r="104" fill="{disk}"/>
      <path fill="{accent}" d="M12-12L71-71V71L12 12Z"/>
      <path fill="{accent}" d="M74-{seg_y:.2f}A104 104 0 0 1 74 {seg_y:.2f}Z"/>
    </g>"""


# ---------- надпись «КОНСТАНТА» ----------
TOP, BOT = 146, 239          # высота букв 93
S = 17                       # толщина штриха
R = 12                       # скругление внешних углов
MID = (TOP + BOT) / 2        # 192.5
BAR = (MID - S / 2, MID + S / 2)
A_BAR = (205, 222)           # перекладина «А» ниже середины
K_SLOPE = 0.885              # наклон плеч «К» (dx/dy)


def f(v):
    return f"{v:g}" if isinstance(v, int) else f"{round(v, 2):g}"


def rect(x0, y0, x1, y1):
    return f"M{f(x0)} {f(y0)}H{f(x1)}V{f(y1)}H{f(x0)}Z"


def glyph_k(x):
    stem = rect(x, TOP, x + S, BOT)
    top_l = x + 68.9       # левая кромка верхнего плеча у верхней линии
    top_r = x + 91.5       # правая кромка
    yb0, yb1 = BAR
    lx0 = top_l - (yb0 - TOP) * K_SLOPE
    rx_mid = top_r - (MID - TOP) * K_SLOPE
    arms = (
        f"M{f(x + S)} {f(yb0)}H{f(lx0)}L{f(top_l)} {TOP}H{f(top_r)}L{f(rx_mid)} {f(MID)}"
        f"L{f(top_r)} {BOT}H{f(top_l)}L{f(lx0)} {f(yb1)}H{f(x + S)}Z"
    )
    return stem + arms, x + 91


def rounded_box(x0, y0, x1, y1, tl=0, tr=0, br=0, bl=0):
    p = f"M{f(x0 + tl)} {f(y0)}H{f(x1 - tr)}"
    if tr:
        p += f"A{tr} {tr} 0 0 1 {f(x1)} {f(y0 + tr)}"
    p += f"V{f(y1 - br)}"
    if br:
        p += f"A{br} {br} 0 0 1 {f(x1 - br)} {f(y1)}"
    p += f"H{f(x0 + bl)}"
    if bl:
        p += f"A{bl} {bl} 0 0 1 {f(x0)} {f(y1 - bl)}"
    p += f"V{f(y0 + tl)}"
    if tl:
        p += f"A{tl} {tl} 0 0 1 {f(x0 + tl)} {f(y0)}"
    return p + "Z"


def hole(x0, y0, x1, y1, r=2):
    # обход в обратную сторону, чтобы работало и без evenodd
    return (
        f"M{f(x0 + r)} {f(y0)}A{r} {r} 0 0 0 {f(x0)} {f(y0 + r)}V{f(y1 - r)}A{r} {r} 0 0 0 {f(x0 + r)} {f(y1)}"
        f"H{f(x1 - r)}A{r} {r} 0 0 0 {f(x1)} {f(y1 - r)}V{f(y0 + r)}A{r} {r} 0 0 0 {f(x1 - r)} {f(y0)}Z"
    )


def glyph_o(x, w=92):
    return rounded_box(x, TOP, x + w, BOT, R, R, R, R) + hole(x + S, TOP + S, x + w - S, BOT - S), x + w


def glyph_n(x, w=92):
    return rect(x, TOP, x + S, BOT) + rect(x + w - S, TOP, x + w, BOT) + rect(x + S, BAR[0], x + w - S, BAR[1]), x + w


def glyph_s(x, w=83):
    r = 2
    p = (
        f"M{f(x + w)} {TOP}V{TOP + S}H{f(x + S + r)}A{r} {r} 0 0 0 {f(x + S)} {TOP + S + r}"
        f"V{BOT - S - r}A{r} {r} 0 0 0 {f(x + S + r)} {BOT - S}H{f(x + w)}V{BOT}H{f(x + R)}"
        f"A{R} {R} 0 0 1 {f(x)} {BOT - R}V{TOP + R}A{R} {R} 0 0 1 {f(x + R)} {TOP}Z"
    )
    return p, x + w


def glyph_t(x, w=95):
    c = x + w / 2
    return rect(x, TOP, x + w, TOP + S) + rect(c - S / 2, TOP + S, c + S / 2, BOT), x + w


def glyph_a(x, w=94):
    outer = (
        f"M{f(x)} {BOT}V{TOP + R}A{R} {R} 0 0 1 {f(x + R)} {TOP}H{f(x + w - R)}A{R} {R} 0 0 1 {f(x + w)} {TOP + R}"
        f"V{BOT}H{f(x + w - S)}V{A_BAR[1]}H{f(x + S)}V{BOT}Z"
    )
    return outer + hole(x + S, TOP + S, x + w - S, A_BAR[0]), x + w


GLYPHS = {"К": glyph_k, "О": glyph_o, "Н": glyph_n, "С": glyph_s, "Т": glyph_t, "А": glyph_a}
# Левые края букв в исходнике (межбуквенные интервалы выровнены).
POSITIONS = [343, 445, 554, 662, 759, 868, 977, 1087, 1195]


def wordmark():
    return "".join(GLYPHS[ch](x)[0] for ch, x in zip("КОНСТАНТА", POSITIONS))


# ---------- файлы ----------
X0, Y0 = MARK_CX - MARK_R, MARK_CY - MARK_R      # 40.5, 65
X1 = POSITIONS[-1] + 94                           # 1289
W, H = X1 - X0, 2 * MARK_R


def logo_svg(word, ring, disk, accent, title="Константа"):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(X0)} {Y0} {f(W)} {H}" role="img" aria-label="{title}">
  <title>{title}</title>
  <g transform="translate({MARK_CX} {MARK_CY})">
    {mark_body(ring, disk, accent)}
  </g>
  <path fill="{word}" d="{wordmark()}"/>
</svg>
"""


def mark_svg(ring, disk, accent, pad=0):
    r = MARK_R + pad
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-r} {-r} {2 * r} {2 * r}" role="img" aria-label="Константа">
  {mark_body(ring, disk, accent)}
</svg>
"""


def main():
    out = Path(__file__).resolve().parent.parent / "konstanta" / "assets" / "brand"
    files = {
        "logo.svg": logo_svg(SLATE, TEAL, SLATE, TEAL),
        # для тёмного фона (подвал): диск и надпись белые, «К» прорезана до фона
        "logo-inverse.svg": logo_svg(WHITE, TEAL, WHITE, TEAL),
        "logo-mark.svg": mark_svg(TEAL, SLATE, TEAL),
        "favicon.svg": mark_svg(TEAL, SLATE, TEAL, pad=2),
    }
    for name, body in files.items():
        (out / name).write_text(body, "utf8")
        print(name, len(body.encode()), "байт")


if __name__ == "__main__":
    main()
