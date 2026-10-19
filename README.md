# Placeprint

Minimalist map posters of any place, made in the browser.

- Live: https://vl3.github.io/placeprint/
- Map data © OpenStreetMap contributors, tiles by OpenFreeMap, search by Photon.

Everything runs client-side: MapLibre renders OpenFreeMap vector tiles, and print-size
exports are drawn in 2048px tiles on an offscreen map so they can exceed GPU canvas limits.
