"""
Сборка карты Ленинградской области для блока «Карта отделений»
(wp-theme/konstanta/assets/map.svg) из открытых данных.

Источники:
  - границы районов и Санкт-Петербурга: OpenStreetMap (© участники OpenStreetMap, ODbL);
  - суша, озёра, реки, границы государств: Natural Earth 10m (public domain).

Запуск (нужны shapely и pyproj):
  python build-map.py <папка-с-данными>

В папке должны лежать districts.json и spb.json (ответы Overpass API, см. OVERPASS ниже),
а также ne_10m_land/lakes/rivers_lake_centerlines/admin_0_countries .geojson
из https://github.com/nvkelso/natural-earth-vector/tree/master/geojson.

Скрипт печатает координаты подписей районов для konstanta_map_regions() (inc/branches.php).
"""

import json
import sys
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import LineString, MultiPolygon, Polygon, box, mapping, shape, Point
import warnings
from shapely.ops import linemerge, polygonize, polylabel, transform, unary_union

warnings.filterwarnings("ignore", category=DeprecationWarning)

OVERPASS = {
    "districts.json": '[out:json];rel(176095);map_to_area->.a;'
    'rel(area.a)["boundary"="administrative"]["admin_level"="6"];out geom;',
    "spb.json": "[out:json];rel(337422);out geom;",
}

# id района на карте (их хранят отделения в админке) <- начало названия в OSM
DISTRICTS = {
    "Выборгский": "vyborgskiy",
    "Приозерский": "priozerskiy",
    "Всеволожский": "vsevolozhskiy",
    "Кировский": "kirovskiy",
    "Волховский": "volkhovskiy",
    "Лодейнопольский": "lodeynopolskiy",
    "Подпорожский": "podporozhskiy",
    "Тихвинский": "tikhvinskiy",
    "Бокситогорский": "boksitogorskiy",
    "Киришский": "kirishskiy",
    "Тосненский": "tosnenskiy",
    "Гатчинский": "gatchinskiy",
    "Сосновоборский": "sosnovoborskiy",
    "Волосовский": "volosovskiy",
    "Кингисеппский": "kingiseppskiy",
    "Сланцевский": "slantsevskiy",
    "Лужский": "luzhskiy",
    "Ломоносовский": "lomonosovskiy",
}

W, H = 800, 600
PAD = 14

CITIES = [  # название, долгота, широта, смещение подписи (dx, dy), якорь
    ("Выборг", 28.75, 60.71, (6, 4), "start"),
    ("Приозерск", 30.13, 61.04, (6, 4), "start"),
        ("Кингисепп", 28.61, 59.37, (0, 13), "middle"),
    ("Сланцы", 28.09, 59.12, (6, 4), "start"),
    ("Волосово", 29.49, 59.44, (0, -7), "middle"),
    ("Гатчина", 30.12, 59.57, (6, 4), "start"),
    ("Луга", 29.85, 58.74, (6, 4), "start"),
    ("Тосно", 30.88, 59.54, (6, 4), "start"),
    ("Кировск", 30.99, 59.88, (6, 4), "start"),
    ("Всеволожск", 30.64, 60.02, (6, -3), "start"),
    ("Волхов", 32.34, 59.92, (6, 4), "start"),
    ("Кириши", 32.02, 59.45, (-6, 4), "end"),
    ("Тихвин", 33.60, 59.64, (6, 4), "start"),
    ("Бокситогорск", 33.85, 59.47, (6, 4), "start"),
    ("Лодейное Поле", 33.55, 60.73, (6, 4), "start"),
    ("Подпорожье", 34.17, 60.91, (6, 4), "start"),
]

AREA_LABELS = [  # подписи акваторий и соседей: текст, долгота, широта, класс
    ("Финский залив", 28.35, 60.2, "map-water-label"),
    ("Ладожское озеро", 31.75, 60.75, "map-water-label"),
    ("Онежское озеро", 35.25, 61.25, "map-water-label"),
    ("ФИНЛЯНДИЯ", 27.95, 61.15, "map-country-label"),
    ("ЭСТОНИЯ", 27.35, 59.05, "map-country-label"),
    ("Республика Карелия", 33.3, 61.45, "map-neighbor-label"),
    ("Новгородская обл.", 32.4, 58.65, "map-neighbor-label"),
    ("Псковская обл.", 28.75, 58.45, "map-neighbor-label"),
    ("Вологодская обл.", 35.1, 58.95, "map-neighbor-label"),
]

RIVERS = {"Neva", "Svir'", "Svir", "Volkhov", "Luga", "Narva", "Vuoksi", "Syas'", "Pasha", "Oyat'", "Tosna", "Mga"}


def osm_shape(rel):
    outer, inner = [], []
    for m in rel["members"]:
        if m["type"] != "way" or "geometry" not in m:
            continue
        line = LineString([(p["lon"], p["lat"]) for p in m["geometry"]])
        (inner if m["role"] == "inner" else outer).append(line)
    poly = unary_union(list(polygonize(linemerge(outer))))
    if inner:
        poly = poly.difference(unary_union(list(polygonize(linemerge(inner)))))
    return poly


def load_osm(path):
    return {e["id"]: (e["tags"].get("name"), osm_shape(e)) for e in json.loads(path.read_text("utf8"))["elements"]}


def load_ne(path, bbox, pred=lambda p: True):
    feats = json.loads(path.read_text("utf8"))["features"]
    out = []
    for f in feats:
        if not pred(f["properties"]):
            continue
        g = shape(f["geometry"])
        if g.intersects(bbox):
            out.append((f["properties"], g.intersection(bbox)))
    return out


def path_d(geom, nd=1):
    """SVG path из (Multi)Polygon / (Multi)LineString в экранных координатах."""
    parts = []

    def ring(coords, close):
        pts = [(round(x, nd), round(y, nd)) for x, y in coords]
        dedup = [pts[0]] + [p for a, p in zip(pts, pts[1:]) if p != a]
        if close and len(dedup) < 4:
            return
        fmt = lambda p: f"{p[0]:g} {p[1]:g}"
        parts.append("M" + "L".join(fmt(p) for p in dedup) + ("Z" if close else ""))

    def walk(g):
        if g.is_empty:
            return
        t = g.geom_type
        if t == "Polygon":
            ring(g.exterior.coords, True)
            for i in g.interiors:
                ring(i.coords, True)
        elif t == "LineString":
            ring(g.coords, False)
        elif hasattr(g, "geoms"):
            for s in g.geoms:
                walk(s)

    walk(geom)
    return "".join(parts)


def main():
    data = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    districts_osm = load_osm(data / "districts.json")
    spb_osm = load_osm(data / "spb.json")

    proj = Transformer.from_crs(
        "EPSG:4326", "+proj=lcc +lat_1=59 +lat_2=61 +lat_0=60 +lon_0=31.5 +units=m", always_xy=True
    ).transform

    region_ll = unary_union([g for _, g in districts_osm.values()] + [g for _, g in spb_osm.values()])
    minx, miny, maxx, maxy = transform(proj, region_ll).bounds
    # Экранный масштаб: область вписана с полями, остальное поле — соседи.
    k = min((W - 2 * PAD) / (maxx - minx), (H - 2 * PAD) / (maxy - miny))
    ox = (W - (maxx - minx) * k) / 2 - minx * k
    oy = (H - (maxy - miny) * k) / 2 + maxy * k

    def to_px(x, y, z=None):
        X, Y = proj(x, y)
        return (X * k + ox, oy - Y * k)

    # Видимая рамка в градусах (с запасом), чтобы обрезать подложку.
    inv = Transformer.from_crs(
        "+proj=lcc +lat_1=59 +lat_2=61 +lat_0=60 +lon_0=31.5 +units=m", "EPSG:4326", always_xy=True
    ).transform
    corners = [inv((px - ox) / k, (oy - py) / k) for px in (-20, W + 20) for py in (-20, H + 20)]
    bbox_ll = box(min(c[0] for c in corners) - 0.3, min(c[1] for c in corners) - 0.2,
                  max(c[0] for c in corners) + 0.3, max(c[1] for c in corners) + 0.2)
    frame = box(-2, -2, W + 2, H + 2)

    px = lambda g: transform(to_px, g).intersection(frame)
    tol = 0.55  # упрощение, пикселей

    land = unary_union([g for _, g in load_ne(data / "ne_10m_land.geojson", bbox_ll)])
    lakes = unary_union([g for _, g in load_ne(data / "ne_10m_lakes.geojson", bbox_ll)])
    landmask = land.difference(lakes)
    foreign = load_ne(data / "ne_10m_admin_0_countries.geojson", bbox_ll,
                      lambda p: p.get("ADM0_A3") in ("FIN", "EST"))
    rivers = load_ne(data / "ne_10m_rivers_lake_centerlines.geojson", bbox_ll,
                     lambda p: (p.get("name") or "") in RIVERS or (p.get("name_en") or "") in RIVERS)

    land_px = px(landmask).simplify(tol)
    lakes_px = px(lakes).simplify(tol)
    foreign_px = px(unary_union([g for _, g in foreign]).intersection(landmask)).simplify(tol)
    rivers_px = px(unary_union([g for _, g in rivers]).intersection(landmask)).simplify(tol)

    spb_ll = unary_union([g for _, g in spb_osm.values()])
    spb_px = px(spb_ll.intersection(landmask)).simplify(tol * 0.6)

    out_d = {}
    labels = {}
    by_name = {n.split()[0]: (n, g) for n, g in districts_osm.values()}
    for prefix, key in DISTRICTS.items():
        name, g = by_name[prefix]
        g = g.difference(spb_ll).intersection(landmask)
        gp = px(g).simplify(tol * 0.6 if key == "sosnovoborskiy" else tol)
        out_d[key] = (name, gp)
        biggest = max(gp.geoms, key=lambda s: s.area) if isinstance(gp, MultiPolygon) else gp
        c = polylabel(biggest, 0.5)
        labels[key] = (name, round(c.x), round(c.y))

    region_px = unary_union([g for _, g in out_d.values()] + [spb_px]).simplify(tol)

    def cpx(lon, lat):
        x, y = to_px(lon, lat)
        return round(x, 1), round(y, 1)

    svg = []
    svg.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" class="lenoblast-map" '
        'role="img" aria-label="Карта отделений ООО «Константа» в Ленинградской области">'
    )
    svg.append("  <!-- Данные: © участники OpenStreetMap (ODbL), Natural Earth. Сборка: wp-theme/tools/build-map.py -->")
    svg.append(f'  <rect class="map-sea" x="0" y="0" width="{W}" height="{H}"/>')
    svg.append(f'  <path class="map-land" d="{path_d(land_px)}"/>')
    svg.append(f'  <path class="map-foreign" d="{path_d(foreign_px)}"/>')
    svg.append(f'  <path class="map-lake" d="{path_d(lakes_px)}"/>')
    svg.append('  <g id="districts">')
    for key, (name, g) in out_d.items():
        svg.append(f"    <!-- {name} -->")
        svg.append(f'    <path class="map-district" data-id="{key}" d="{path_d(g)}"/>')
    # Сосновый Бор на карте — несколько пикселей; добавляем увеличенную зону клика.
    sx, sy = (round(v) for v in to_px(29.10, 59.895))
    svg.append(
        f'    <path class="map-district map-district-hit" data-id="sosnovoborskiy" '
        f'd="M{sx - 7} {sy}a7 7 0 1 0 14 0a7 7 0 1 0 -14 0Z"/>'
    )
    svg.append("  </g>")
    svg.append(f'  <path class="map-river" d="{path_d(rivers_px)}"/>')
    svg.append(f'  <path class="map-region-outline" d="{path_d(region_px)}"/>')
    svg.append(f'  <path class="map-spb" d="{path_d(spb_px)}"/>')

    svg.append('  <g class="map-context" aria-hidden="true">')
    for text, lon, lat, cls in AREA_LABELS:
        x, y = cpx(lon, lat)
        svg.append(f'    <text class="{cls}" x="{x}" y="{y}">{text}</text>')
    sb = to_px(29.10, 59.895)
    svg.append(f'    <circle class="map-city" cx="{round(sb[0], 1)}" cy="{round(sb[1], 1)}" r="2.6"/>')
    for text, lon, lat, (dx, dy), anchor in CITIES:
        x, y = cpx(lon, lat)
        svg.append(f'    <circle class="map-city" cx="{x}" cy="{y}" r="2.6"/>')
        svg.append(
            f'    <text class="map-city-label" x="{round(x + dx, 1)}" y="{round(y + dy, 1)}" '
            f'text-anchor="{anchor}">{text}</text>'
        )
    x, y = cpx(30.32, 59.94)
    svg.append(f'    <circle class="map-capital" cx="{x}" cy="{y}" r="4.5"/>')
    svg.append(f'    <text class="map-capital-label" x="{x}" y="{round(y + 15, 1)}">Санкт-Петербург</text>')
    svg.append("  </g>")
    svg.append('  <g class="map-labels" aria-hidden="true"></g>')
    svg.append("</svg>")

    out = Path(__file__).resolve().parent.parent / "konstanta" / "assets" / "map.svg"
    out.write_text("\n".join(svg) + "\n", "utf8")
    print(f"{out}: {out.stat().st_size // 1024} КБ")
    for key, (name, x, y) in labels.items():
        print(f"\t\t'{key}' => array( '{name}', {x}, {y} ),")


if __name__ == "__main__":
    main()
