'use strict';

const CONFIG = {
  gumroadUrl: 'https://gumroad.com/l/placeprint-pro',
  productId: 'VzboQ_LfHCca7MaZUkDztA==',
};

const TILEJSON = 'https://tiles.openfreemap.org/planet';
// The preview map renders at S times its on-screen size and is scaled down,
// so its tiles carry street detail close to what the print will show.
const S = 3;
const FREE_LONG = 1600;
const TILE = 2048;
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const THEMES = [
  { id: 'ink', name: 'Ink', bg: '#f3eee4', water: '#d3d8d4', park: '#e6e2d4', road: '#1d1d1b', text: '#1d1d1b' },
  { id: 'midnight', name: 'Midnight', bg: '#0f1b2c', water: '#1b3250', park: '#13243a', road: '#ece5d4', text: '#ece5d4' },
  { id: 'noir', name: 'Noir', bg: '#151514', water: '#262624', park: '#1b1b19', road: '#d3b06e', text: '#d3b06e' },
  { id: 'terracotta', name: 'Terracotta', bg: '#f2e6d6', water: '#a9bfbe', park: '#e7d7c0', road: '#9c472c', text: '#6b2e1d' },
  { id: 'sage', name: 'Sage', bg: '#edefe4', water: '#bccbc1', park: '#dce2ce', road: '#33402f', text: '#2b3527' },
  { id: 'blush', name: 'Blush', bg: '#f6e8e2', water: '#e5c9c3', park: '#efdcd3', road: '#86343f', text: '#86343f' },
  { id: 'harbor', name: 'Harbor', bg: '#f3f5f6', water: '#2f5f84', park: '#e2e8eb', road: '#1b3350', text: '#1b3350' },
];

const SHAPES = [
  { id: 'classic', name: 'Classic', icon: '<rect x="5" y="3" width="14" height="13" rx="1"/><path d="M8 20h8"/>' },
  { id: 'bleed', name: 'Full', icon: '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M8 18h8"/>' },
  { id: 'circle', name: 'Circle', icon: '<circle cx="12" cy="10" r="7"/><path d="M8 21h8"/>' },
  { id: 'heart', name: 'Heart', icon: '<path d="M12 17s-6.5-3.8-6.5-8.4A3.4 3.4 0 0 1 12 7a3.4 3.4 0 0 1 6.5 1.6C18.5 13.2 12 17 12 17z"/><path d="M8 21h8"/>' },
];

// `pro` is the print-ready pixel size; its ratio drives every other size too.
const FORMATS = [
  { id: '3:4', name: '3:4', sizes: '12×16″ · 18×24″', pro: [5400, 7200] },
  { id: '2:3', name: '2:3', sizes: '20×30″ · 24×36″', pro: [4800, 7200] },
  { id: '4:5', name: '4:5', sizes: '8×10″ · 16×20″', pro: [4800, 6000] },
  { id: 'A', name: 'A sizes', sizes: 'A4 · A3 · A2', pro: [4961, 7016] },
  { id: '1:1', name: 'Square', sizes: '12×12″', pro: [6000, 6000] },
  { id: 'phone', name: 'Phone', sizes: 'Wallpaper', pro: [1290, 2796] },
];

const FONTS = [
  { id: 'serif', name: 'Serif', family: '"DM Serif Display"', weight: 400, size: 0.084, track: 0.16, upper: true },
  { id: 'sans', name: 'Sans', family: 'Jost', weight: 500, size: 0.068, track: 0.36, upper: true },
  { id: 'script', name: 'Script', family: '"Pinyon Script"', weight: 400, size: 0.115, track: 0, upper: false },
];

// Road groups: classes, width at a 1000px-wide map framed at zoom 12, and the
// framing zoom below which the group is hidden.
const ROADS = [
  { id: 'path', classes: ['path', 'track'], w: 0.22, minZf: 13.6 },
  { id: 'service', classes: ['service'], w: 0.3, minZf: 12.2 },
  { id: 'minor', classes: ['minor', 'minor_construction'], w: 0.55, minZf: 9.5 },
  { id: 'tertiary', classes: ['tertiary', 'tertiary_construction'], w: 0.9, minZf: 0 },
  { id: 'secondary', classes: ['secondary', 'primary', 'secondary_construction', 'primary_construction'], w: 1.25, minZf: 0 },
  { id: 'major', classes: ['trunk', 'motorway', 'trunk_construction', 'motorway_construction'], w: 1.7, minZf: 0 },
];

const STARTS = [
  { title: 'Barcelona', subtitle: 'Spain', center: [2.1655, 41.3915], zf: 13.0 },
  { title: 'Paris', subtitle: 'France', center: [2.3431, 48.8590], zf: 12.5 },
  { title: 'Amsterdam', subtitle: 'Netherlands', center: [4.8936, 52.3708], zf: 13.3 },
  { title: 'Venezia', subtitle: 'Italia', center: [12.3327, 45.4380], zf: 13.6 },
  { title: 'Manhattan', subtitle: 'New York', center: [-73.9790, 40.7590], zf: 12.4 },
  { title: 'San Francisco', subtitle: 'California', center: [-122.4330, 37.7700], zf: 12.5 },
  { title: 'Kyoto', subtitle: 'Japan', center: [135.7650, 35.0100], zf: 12.7 },
  { title: 'Buenos Aires', subtitle: 'Argentina', center: [-58.4100, -34.6100], zf: 12.3 },
];

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clampZ = (z) => clamp(z, 4, 18);

const state = {
  center: [0, 0], zf: 12, theme: 'ink', shape: 'classic', format: '3:4', font: 'serif',
  title: '', subtitle: '', coords: true,
};
const theme = () => THEMES.find((t) => t.id === state.theme) || THEMES[0];
const fmt = () => FORMATS.find((f) => f.id === state.format) || FORMATS[0];
const font = () => FONTS.find((f) => f.id === state.font) || FONTS[0];

/* ---------- colors ---------- */

function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function rgba(h, a) { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; }

/* ---------- map style ---------- */

const LINE = ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]];

// Line widths in px for a render whose map area is `renderW` px wide.
function widths(zf, renderW, preview) {
  const k = (renderW / 1000) * clamp(Math.pow(2, (zf - 12) * 0.6), 0.35, 5);
  // Keep preview hairlines at least ~0.8 device pixels so they don't vanish.
  const min = preview ? Math.max(0.4 * S, (0.8 * S) / (window.devicePixelRatio || 1)) : 0.6;
  const w = (u) => Math.max(u * k, min);
  const out = { waterway: w(0.7), rail: w(0.3), aeroway: w(1.1) };
  for (const r of ROADS) out['road-' + r.id] = w(r.w);
  return out;
}

function buildStyle(t, zf, renderW, preview) {
  const W = widths(zf, renderW, preview);
  const src = { source: 'omt' };
  const round = { 'line-cap': 'round', 'line-join': 'round' };
  const layers = [
    { id: 'land', type: 'background', paint: { 'background-color': mix(t.bg, t.road, 0.04) } },
    { id: 'park', type: 'fill', ...src, 'source-layer': 'park', paint: { 'fill-color': t.park } },
    { id: 'green', type: 'fill', ...src, 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['wood', 'grass']]], paint: { 'fill-color': t.park, 'fill-opacity': 0.75 } },
    { id: 'water', type: 'fill', ...src, 'source-layer': 'water', filter: ['!=', ['get', 'brunnel'], 'tunnel'], paint: { 'fill-color': t.water } },
    { id: 'waterway', type: 'line', ...src, 'source-layer': 'waterway', filter: ['!=', ['get', 'brunnel'], 'tunnel'], layout: round, paint: { 'line-color': t.water, 'line-width': W.waterway } },
    { id: 'aeroway', type: 'line', ...src, 'source-layer': 'aeroway', filter: LINE, layout: round, paint: { 'line-color': t.road, 'line-width': W.aeroway, 'line-opacity': 0.35 } },
    { id: 'rail', type: 'line', ...src, 'source-layer': 'transportation', filter: ['all', LINE, ['==', ['get', 'class'], 'rail']], paint: { 'line-color': t.road, 'line-width': W.rail, 'line-opacity': 0.5 } },
  ];
  for (const r of ROADS) {
    layers.push({
      id: 'road-' + r.id, type: 'line', ...src, 'source-layer': 'transportation',
      filter: ['all', LINE, ['in', ['get', 'class'], ['literal', r.classes]]],
      layout: { ...round, visibility: zf >= r.minZf ? 'visible' : 'none' },
      paint: { 'line-color': t.road, 'line-width': W['road-' + r.id] },
    });
  }
  return { version: 8, sources: { omt: { type: 'vector', url: TILEJSON } }, layers };
}

/* ---------- poster layout (shared by preview and export) ---------- */

function layout(W, H, shape) {
  const u = Math.min(W, H * 0.8);
  const L = { W, H, u, shape };
  if (shape === 'bleed') {
    L.box = { x: 0, y: 0, w: W, h: H };
    L.pad = 0.055 * u;
  } else {
    const m = 0.075 * u;
    L.box = { x: m, y: m, w: W - 2 * m, h: H - m - 0.235 * u };
    L.pad = m;
  }
  const textTop = H - 0.235 * u;
  if (shape === 'circle' || shape === 'heart') {
    const s = Math.min(L.box.w, L.box.h) * 0.98;
    L.map = { x: L.box.x + (L.box.w - s) / 2, y: L.box.y + (L.box.h - s) / 2, w: s, h: s };
  } else {
    L.map = { ...L.box };
  }
  L.titleY = textTop + 0.105 * u;
  L.ruleY = textTop + 0.138 * u;
  L.subY = textTop + 0.172 * u;
  L.coordY = textTop + 0.2 * u;
  L.footY = H - 0.03 * u;
  return L;
}

function heartPath(x, y, s) {
  const p = (a, b) => `${(x + a * s).toFixed(2)} ${(y + b * s).toFixed(2)}`;
  return `M${p(0.5, 0.96)} C${p(0.17, 0.74)} ${p(0, 0.54)} ${p(0, 0.32)} C${p(0, 0.13)} ${p(0.14, 0.02)} ${p(0.29, 0.02)} ` +
    `C${p(0.4, 0.02)} ${p(0.47, 0.08)} ${p(0.5, 0.17)} C${p(0.53, 0.08)} ${p(0.6, 0.02)} ${p(0.71, 0.02)} ` +
    `C${p(0.86, 0.02)} ${p(1, 0.13)} ${p(1, 0.32)} C${p(1, 0.54)} ${p(0.83, 0.74)} ${p(0.5, 0.96)} Z`;
}

function clipMap(ctx, m) {
  if (state.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
    ctx.clip();
  } else if (state.shape === 'heart') {
    ctx.clip(new Path2D(heartPath(m.x, m.y, m.w)));
  } else {
    ctx.beginPath();
    ctx.rect(m.x, m.y, m.w, m.h);
    ctx.clip();
  }
}

function coordText() {
  const [lng, lat] = state.center;
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}   ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
}

function spacedWidth(ctx, s, track) {
  let w = 0;
  for (const ch of s) w += ctx.measureText(ch).width;
  return w + track * Math.max(0, [...s].length - 1);
}

function drawSpaced(ctx, s, cx, y, track) {
  if (!track) { ctx.textAlign = 'center'; ctx.fillText(s, cx, y); return; }
  let x = cx - spacedWidth(ctx, s, track) / 2;
  ctx.textAlign = 'left';
  for (const ch of s) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + track; }
}

// Everything drawn above the map: fade, title block, attribution.
function drawOver(ctx, L, { credit }) {
  const t = theme(), f = font(), u = L.u, cx = L.W / 2;
  if (L.shape === 'bleed') {
    const y0 = L.H - 0.52 * u, y1 = L.H - 0.2 * u;
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, rgba(t.bg, 0));
    g.addColorStop(1, rgba(t.bg, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, L.W, L.H - y0);
  }
  ctx.fillStyle = t.text;
  ctx.textBaseline = 'alphabetic';

  const title = f.upper ? state.title.toUpperCase() : state.title;
  if (title) {
    let size = f.size * u;
    ctx.font = `${f.weight} ${size}px ${f.family}`;
    const maxW = L.W - 2 * L.pad - 0.04 * u;
    const w = spacedWidth(ctx, title, f.track * size);
    if (w > maxW) { size *= maxW / w; ctx.font = `${f.weight} ${size}px ${f.family}`; }
    drawSpaced(ctx, title, cx, L.titleY, f.track * size);
  }
  if (f.upper) ctx.fillRect(cx - 0.03 * u, L.ruleY, 0.06 * u, Math.max(1, 0.0022 * u));

  let y = L.subY;
  if (state.subtitle) {
    const size = 0.024 * u;
    ctx.font = `400 ${size}px Jost`;
    drawSpaced(ctx, state.subtitle.toUpperCase(), cx, y, 0.3 * size);
    y = L.coordY;
  }
  if (state.coords) {
    const size = 0.019 * u;
    ctx.globalAlpha = 0.75;
    ctx.font = `400 ${size}px Jost`;
    drawSpaced(ctx, coordText(), cx, y, 0.14 * size);
  }
  ctx.globalAlpha = 0.5;
  ctx.font = `400 ${0.0105 * u}px Jost`;
  ctx.textAlign = 'right';
  ctx.fillText('© OpenStreetMap contributors', L.W - L.pad, L.footY);
  if (credit) {
    ctx.textAlign = 'left';
    ctx.fillText('Made with Placeprint · vl3.github.io/placeprint', L.pad, L.footY);
  }
  ctx.globalAlpha = 1;
}

/* ---------- preview ---------- */

const poster = $('#poster'), mapwrap = $('#mapwrap'), mapinner = $('#mapinner'), over = $('#over');
let pm = null;
let P = null;

const previewRenderW = () => P.map.w * S;
const previewZoom = () => state.zf + Math.log2(previewRenderW() / 1000);

function sizePoster() {
  const stage = $('#stage');
  const narrow = window.innerWidth < 960;
  const padX = narrow ? 20 : 56, padY = narrow ? 20 : 48;
  const [fw, fh] = fmt().pro;
  const r = fh / fw;
  const w = Math.floor(Math.min(stage.clientWidth - 2 * padX, (stage.clientHeight - 2 * padY) / r));
  const h = Math.floor(w * r);
  poster.style.width = w + 'px';
  poster.style.height = h + 'px';
  poster.style.background = theme().bg;
  P = layout(w, h, state.shape);
  const m = P.map;
  Object.assign(mapwrap.style, { left: m.x + 'px', top: m.y + 'px', width: m.w + 'px', height: m.h + 'px' });
  mapwrap.style.clipPath = state.shape === 'circle' ? 'circle(50% at 50% 50%)'
    : state.shape === 'heart' ? `path('${heartPath(0, 0, m.w)}')` : 'none';
  Object.assign(mapinner.style, { width: m.w * S + 'px', height: m.h * S + 'px', transform: `scale(${1 / S})` });
  if (pm) {
    pm.resize();
    pm.jumpTo({ center: state.center, zoom: previewZoom() });
    applyWidths();
  }
  drawOverlay();
}

function drawOverlay() {
  if (!P) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  over.width = Math.round(P.W * dpr);
  over.height = Math.round(P.H * dpr);
  const ctx = over.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, P.W, P.H);
  drawOver(ctx, P, { credit: false });
}

function applyWidths() {
  if (!pm || !pm.isStyleLoaded()) return;
  const W = widths(state.zf, previewRenderW(), true);
  for (const [id, w] of Object.entries(W)) if (pm.getLayer(id)) pm.setPaintProperty(id, 'line-width', w);
  for (const r of ROADS) pm.setLayoutProperty('road-' + r.id, 'visibility', state.zf >= r.minZf ? 'visible' : 'none');
}

function restyle() {
  poster.style.background = theme().bg;
  if (pm) pm.setStyle(buildStyle(theme(), state.zf, previewRenderW(), true), { diff: true });
  drawOverlay();
}

function initMap() {
  pm = new maplibregl.Map({
    container: mapinner,
    style: buildStyle(theme(), state.zf, previewRenderW(), true),
    center: state.center,
    zoom: previewZoom(),
    interactive: false,
    attributionControl: false,
    pixelRatio: Math.max(0.5, (window.devicePixelRatio || 1) / S),
    fadeDuration: 0,
    renderWorldCopies: false,
    maxZoom: 22,
  });
}

function syncFromMap() {
  const c = pm.getCenter();
  state.center = [c.lng, c.lat];
  state.zf = pm.getZoom() - Math.log2(previewRenderW() / 1000);
  drawOverlay();
  scheduleCommit();
}

let commitTimer = null;
function scheduleCommit() {
  clearTimeout(commitTimer);
  commitTimer = setTimeout(() => { applyWidths(); saveHash(); }, 180);
}

function zoomBy(dz, point) {
  const z = clampZ(state.zf + dz);
  const real = z - state.zf;
  if (Math.abs(real) < 1e-4) return;
  const opts = { duration: 0 };
  if (point) opts.around = pm.unproject(point);
  pm.zoomTo(pm.getZoom() + real, opts);
  syncFromMap();
}

function bindGestures() {
  const pts = new Map();
  let pinch = null;
  const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const mid = () => {
    const [a, b] = [...pts.values()], r = mapwrap.getBoundingClientRect();
    return [((a.x + b.x) / 2 - r.left) * S, ((a.y + b.y) / 2 - r.top) * S];
  };
  mapwrap.addEventListener('pointerdown', (e) => {
    mapwrap.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    mapwrap.classList.add('dragging');
    if (pts.size === 2) pinch = { d: dist() };
  });
  mapwrap.addEventListener('pointermove', (e) => {
    const prev = pts.get(e.pointerId);
    if (!prev || !pm) return;
    const cur = { x: e.clientX, y: e.clientY };
    pts.set(e.pointerId, cur);
    if (pts.size === 1) {
      pm.panBy([(prev.x - cur.x) * S, (prev.y - cur.y) * S], { duration: 0 });
      syncFromMap();
    } else if (pts.size === 2 && pinch) {
      const d = dist();
      zoomBy(Math.log2(d / pinch.d), mid());
      pinch.d = d;
    }
  });
  const end = (e) => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (!pts.size) mapwrap.classList.remove('dragging');
  };
  mapwrap.addEventListener('pointerup', end);
  mapwrap.addEventListener('pointercancel', end);
  mapwrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (!pm) return;
    const r = mapwrap.getBoundingClientRect();
    const k = e.deltaMode === 1 ? 0.05 : 0.0022;
    zoomBy(-e.deltaY * k, [(e.clientX - r.left) * S, (e.clientY - r.top) * S]);
  }, { passive: false });
  $('#zin').addEventListener('click', () => pm && zoomBy(0.5));
  $('#zout').addEventListener('click', () => pm && zoomBy(-0.5));
}

/* ---------- controls ---------- */

function radio(container, items, key, render, onChange) {
  const el = $(container);
  el.innerHTML = '';
  for (const it of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.dataset.id = it.id;
    b.innerHTML = render(it);
    b.addEventListener('click', () => { state[key] = it.id; mark(); onChange(); saveHash(); });
    el.appendChild(b);
  }
  const mark = () => el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.id === state[key])));
  mark();
  return mark;
}

const marks = [];
function buildControls() {
  marks.push(radio('#themes', THEMES, 'theme', (t) =>
    `<svg viewBox="0 0 30 40" aria-hidden="true"><rect width="30" height="40" fill="${t.bg}"/>` +
    `<path d="M0 29 Q9 25 17 30 T30 28 V40 H0Z" fill="${t.water}"/>` +
    `<path d="M5 0 L12 40 M0 12 L30 8 M23 0 L19 40 M0 21 L30 19" stroke="${t.road}" stroke-width="1.3" fill="none"/></svg>` +
    `<span>${t.name}</span>`, () => { restyle(); $('#themename').textContent = theme().name; }));
  $('#themes').querySelectorAll('button').forEach((b) => { b.className = 'swatch'; b.title = THEMES.find((t) => t.id === b.dataset.id).name; });
  const name = document.createElement('div');
  name.className = 'themename';
  name.id = 'themename';
  name.textContent = theme().name;
  $('#themes').after(name);

  marks.push(radio('#shapes', SHAPES, 'shape', (s) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">${s.icon}</svg>${s.name}`,
    sizePoster));
  marks.push(radio('#formats', FORMATS, 'format', (f) => `<b>${f.name}</b><small>${f.sizes}</small>`, () => { sizePoster(); updateBuy(); }));
  marks.push(radio('#fonts', FONTS, 'font', (f) =>
    `<span style="font-family:${f.family.replace(/"/g, '&quot;')};font-weight:${f.weight}" aria-hidden="true">Aa</span><span class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">${f.name}</span>`,
    drawOverlay));

  const title = $('#title'), subtitle = $('#subtitle'), coords = $('#coords');
  title.addEventListener('input', () => { state.title = title.value; drawOverlay(); scheduleCommit(); });
  subtitle.addEventListener('input', () => { state.subtitle = subtitle.value; drawOverlay(); scheduleCommit(); });
  coords.addEventListener('change', () => { state.coords = coords.checked; drawOverlay(); saveHash(); });
}

function syncInputs() {
  $('#title').value = state.title;
  $('#subtitle').value = state.subtitle;
  $('#coords').checked = state.coords;
  marks.forEach((m) => m());
  const n = $('#themename');
  if (n) n.textContent = theme().name;
}

/* ---------- search ---------- */

const ZOOM_BY_TYPE = {
  country: 6.5, state: 8.5, county: 10.5, city: 12.3, town: 13.2, village: 14, hamlet: 14.5,
  district: 13.4, borough: 13.2, suburb: 13.8, quarter: 14, neighbourhood: 14.4, locality: 14,
  street: 15, house: 15.6,
};

function merc(lng, lat) { return maplibregl.MercatorCoordinate.fromLngLat([lng, lat]); }

function bindSearch() {
  const q = $('#q'), list = $('#results');
  let timer = null, ctrl = null, items = [], active = -1;
  const hide = () => { list.hidden = true; active = -1; };
  const highlight = () => list.querySelectorAll('li').forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));

  q.addEventListener('input', () => {
    clearTimeout(timer);
    const v = q.value.trim();
    if (v.length < 2) { hide(); return; }
    timer = setTimeout(() => run(v), 280);
  });
  q.addEventListener('keydown', (e) => {
    if (list.hidden || !items.length) {
      if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); const v = q.value.trim(); if (v) run(v, true); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % items.length; highlight(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + items.length) % items.length; highlight(); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(items[Math.max(0, active)]); }
    else if (e.key === 'Escape') hide();
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) hide(); });

  async function run(v, pickFirst) {
    if (ctrl) ctrl.abort();
    ctrl = new AbortController();
    try {
      const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(v)}&limit=6`, { signal: ctrl.signal });
      const j = await r.json();
      items = (j.features || []).filter((f) => f.geometry && f.geometry.type === 'Point');
      if (pickFirst && items.length) { pick(items[0]); return; }
      list.innerHTML = '';
      if (!items.length) {
        list.innerHTML = '<li aria-disabled="true">No places found. Try adding the country.</li>';
      }
      items.forEach((f, i) => {
        const { name, context } = describe(f.properties);
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.innerHTML = `${esc(name)}<small>${esc(context)}</small>`;
        li.addEventListener('click', () => pick(items[i]));
        list.appendChild(li);
      });
      list.hidden = false;
      active = -1;
    } catch (err) {
      if (err.name !== 'AbortError') {
        list.innerHTML = '<li aria-disabled="true">Search is unavailable right now. Try again in a moment.</li>';
        list.hidden = false;
      }
    }
  }

  function pick(f) {
    hide();
    const p = f.properties;
    const [lng, lat] = f.geometry.coordinates;
    const type = p.type || p.osm_value;
    let zf = ZOOM_BY_TYPE[type];
    if (zf === undefined && p.extent) {
      const [minx, maxy, maxx, miny] = p.extent;
      const a = merc(minx, maxy), b = merc(maxx, miny);
      const fitW = Math.log2((1000 * 0.85) / (512 * Math.max(1e-9, Math.abs(b.x - a.x))));
      const fitH = Math.log2((1000 * (P.map.h / P.map.w) * 0.85) / (512 * Math.max(1e-9, Math.abs(b.y - a.y))));
      zf = clamp(Math.min(fitW, fitH), 10, 16);
    }
    if (zf === undefined) zf = 14.5;
    const { name, context } = describe(p);
    state.center = [lng, lat];
    state.zf = clampZ(zf);
    state.title = name;
    state.subtitle = ['city', 'town', 'village', 'hamlet', 'country', 'state', 'county'].includes(type)
      ? (type === 'country' ? '' : p.country || '')
      : context.split(', ').slice(-2).join(', ');
    q.value = '';
    syncInputs();
    if (pm) { pm.jumpTo({ center: state.center, zoom: previewZoom() }); applyWidths(); }
    drawOverlay();
    saveHash();
  }
}

function describe(p) {
  const name = p.name || [p.street, p.housenumber].filter(Boolean).join(' ') || 'Somewhere';
  const parts = [p.district, p.city, p.county, p.state, p.country].filter((x) => x && x !== name);
  const context = [...new Set(parts)].slice(-3).join(', ');
  return { name, context };
}

function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* ---------- URL state ---------- */

function saveHash() {
  const h = new URLSearchParams({
    c: state.center.map((v) => v.toFixed(5)).join(','), z: state.zf.toFixed(2),
    t: state.theme, s: state.shape, f: state.format, ff: state.font,
    ti: state.title, st: state.subtitle, co: state.coords ? '1' : '0',
  });
  history.replaceState(null, '', '#' + h.toString());
}

function loadHash() {
  if (location.hash.length < 3) return false;
  const h = new URLSearchParams(location.hash.slice(1));
  const c = (h.get('c') || '').split(',').map(Number);
  const z = Number(h.get('z'));
  if (c.length !== 2 || c.some((v) => !Number.isFinite(v)) || !Number.isFinite(z)) return false;
  state.center = [clamp(c[0], -180, 180), clamp(c[1], -85, 85)];
  state.zf = clampZ(z);
  const pickId = (list, v, d) => (list.some((x) => x.id === v) ? v : d);
  state.theme = pickId(THEMES, h.get('t'), state.theme);
  state.shape = pickId(SHAPES, h.get('s'), state.shape);
  state.format = pickId(FORMATS, h.get('f'), state.format);
  state.font = pickId(FONTS, h.get('ff'), state.font);
  state.title = (h.get('ti') || '').slice(0, 40);
  state.subtitle = (h.get('st') || '').slice(0, 60);
  state.coords = h.get('co') !== '0';
  return true;
}

/* ---------- export ---------- */

function once(map, ev) { return new Promise((res) => map.once(ev, res)); }

function idle(map) {
  return new Promise((res) => {
    const t = setTimeout(res, 25000);
    map.once('idle', () => { clearTimeout(t); res(); });
    map.triggerRepaint();
  });
}

// Renders the map area at full size in square tiles on one offscreen map,
// so the output can exceed the GPU's maximum canvas size.
async function renderMap(w, h, onProgress) {
  const z = state.zf + Math.log2(w / 1000);
  const world = 512 * Math.pow(2, z);
  const c = merc(state.center[0], state.center[1]);
  const x0 = Math.round(c.x * world - w / 2), y0 = Math.round(c.y * world - h / 2);
  const T = Math.min(TILE, Math.ceil(Math.max(w, h) / 2) * 2);

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d');
  const div = document.createElement('div');
  Object.assign(div.style, { position: 'fixed', left: '-20000px', top: '0', width: T + 'px', height: T + 'px' });
  document.body.appendChild(div);
  const map = new maplibregl.Map({
    container: div, style: buildStyle(theme(), state.zf, w, false), center: state.center, zoom: z,
    interactive: false, attributionControl: false, preserveDrawingBuffer: true, pixelRatio: 1,
    fadeDuration: 0, renderWorldCopies: false, maxZoom: 24,
  });
  try {
    await once(map, 'load');
    const cols = Math.ceil(w / T), rows = Math.ceil(h / T);
    let done = 0;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const cx = x0 + col * T + T / 2, cy = y0 + r * T + T / 2;
        map.jumpTo({ center: new maplibregl.MercatorCoordinate(cx / world, cy / world).toLngLat(), zoom: z });
        await idle(map);
        const tw = Math.min(T, w - col * T), th = Math.min(T, h - r * T);
        octx.drawImage(map.getCanvas(), 0, 0, tw, th, col * T, r * T, tw, th);
        onProgress(++done / (cols * rows));
      }
    }
  } finally {
    map.remove();
    div.remove();
  }
  return out;
}

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(bytes) { let c = 0xffffffff; for (const b of bytes) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

// Writes a pHYs chunk so print software reads the intended DPI.
async function withDpi(blob, dpi) {
  const src = new Uint8Array(await blob.arrayBuffer());
  const dv = new DataView(src.buffer);
  const ppm = Math.round(dpi / 0.0254);
  const phys = new Uint8Array(21);
  const pv = new DataView(phys.buffer);
  pv.setUint32(0, 9);
  phys.set([0x70, 0x48, 0x59, 0x73], 4);
  pv.setUint32(8, ppm);
  pv.setUint32(12, ppm);
  phys[16] = 1;
  pv.setUint32(17, crc32(phys.subarray(4, 17)));
  const parts = [src.subarray(0, 8)];
  let off = 8;
  while (off < src.length) {
    const len = dv.getUint32(off);
    const type = String.fromCharCode(...src.subarray(off + 4, off + 8));
    const end = off + 12 + len;
    if (type !== 'pHYs') parts.push(src.subarray(off, end));
    if (type === 'IHDR') parts.push(phys);
    off = end;
  }
  return new Blob(parts, { type: 'image/png' });
}

function fontsReady() {
  return Promise.all(['400 20px "DM Serif Display"', '500 20px Jost', '400 20px Jost', '400 20px "Pinyon Script"']
    .map((f) => document.fonts.load(f))).catch(() => {});
}

function slug(s) { return (s || 'map').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'map'; }

function exportSize(pro) {
  const [pw, ph] = fmt().pro;
  let k = pro ? 1 : FREE_LONG / Math.max(pw, ph);
  if (pro && IOS) k = Math.min(1, 4096 / Math.max(pw, ph));
  return [Math.round(pw * k), Math.round(ph * k)];
}

let busy = false;
async function exportPoster(pro) {
  if (busy || !pm) return;
  busy = true;
  const box = $('#progress'), text = $('#progressText'), bar = $('#progressBar');
  const show = (msg, p) => { box.hidden = false; text.textContent = msg; bar.style.width = Math.round(p * 100) + '%'; };
  try {
    show('Loading map data…', 0.02);
    await fontsReady();
    const [W, H] = exportSize(pro);
    const L = layout(W, H, state.shape);
    const m = { x: Math.round(L.map.x), y: Math.round(L.map.y), w: Math.round(L.map.w), h: Math.round(L.map.h) };
    const img = await renderMap(m.w, m.h, (p) => show(`Drawing streets… ${Math.round(p * 100)}%`, 0.05 + p * 0.85));
    show('Saving the file…', 0.93);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = theme().bg;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    clipMap(ctx, m);
    ctx.drawImage(img, m.x, m.y);
    ctx.restore();
    img.width = 0;
    drawOver(ctx, L, { credit: !pro });
    let blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Your browser could not create an image this large.'))), 'image/png'));
    c.width = 0;
    if (pro) blob = await withDpi(blob, 300);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `placeprint-${slug(state.title)}-${W}x${H}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    track(pro ? 'download_pro' : 'download_free');
    box.hidden = true;
  } catch (err) {
    console.error(err);
    show(`Something went wrong: ${err.message || err}. Try again, or a smaller size.`, 0);
    setTimeout(() => { box.hidden = true; }, 6000);
  } finally {
    busy = false;
  }
}

/* ---------- purchase ---------- */

const LS_KEY = 'placeprint.license';
const store = {
  get() { try { return localStorage.getItem(LS_KEY); } catch { return null; } },
  set(v) { try { localStorage.setItem(LS_KEY, v); } catch { /* private mode */ } },
};
let unlocked = !!store.get();

async function verifyLicense(key) {
  const body = new URLSearchParams({ product_id: CONFIG.productId, license_key: key, increment_uses_count: 'false' });
  const r = await fetch('https://api.gumroad.com/v2/licenses/verify', { method: 'POST', body });
  const j = await r.json().catch(() => ({}));
  const p = j.purchase || {};
  return Boolean(j.success && !p.refunded && !p.chargebacked && !p.disputed);
}

function updateBuy() {
  const [W, H] = exportSize(true);
  for (const id of ['#cta', '#cta2']) {
    const a = $(id);
    if (unlocked) {
      a.removeAttribute('data-gumroad-overlay-checkout');
      a.href = '#';
      a.removeAttribute('target');
    } else {
      a.href = CONFIG.gumroadUrl ? CONFIG.gumroadUrl + '?wanted=true' : '#pricing';
      a.target = '_blank';
      a.rel = 'noopener';
    }
  }
  $('#cta').textContent = unlocked ? 'Download print-ready PNG' : 'Get the print-ready file · $12';
  $('#cta2').textContent = unlocked ? 'Unlocked: download above' : 'Get print-ready · $12';
  $('#ctaFine').textContent = unlocked
    ? `${W}×${H} px, 300 DPI${IOS ? ' (use a computer for full size)' : ''}. No credit line.`
    : '300 DPI, up to 7200 px, no credit line. One payment, unlimited posters.';
  $('#licenseBox').hidden = unlocked;
}

function bindBuy() {
  const onCta = (e) => {
    if (unlocked) { e.preventDefault(); exportPoster(true); return; }
    track('checkout_click');
  };
  $('#cta').addEventListener('click', onCta);
  $('#cta2').addEventListener('click', (e) => {
    if (unlocked) { e.preventDefault(); $('#stage').scrollIntoView({ behavior: 'smooth' }); return; }
    track('checkout_click');
  });
  $('#free').addEventListener('click', () => exportPoster(false));
  $('#licenseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = $('#licenseKey').value.trim();
    const msg = $('#licenseMsg');
    const btn = e.target.querySelector('button');
    if (!key) { msg.className = 'msg err'; msg.textContent = 'Paste the key from your Gumroad receipt.'; return; }
    btn.disabled = true;
    msg.className = 'msg';
    msg.textContent = 'Checking…';
    try {
      if (await verifyLicense(key)) {
        store.set(key);
        unlocked = true;
        updateBuy();
        msg.className = 'msg ok';
        msg.textContent = 'Unlocked. Thank you!';
        track('license_ok');
      } else {
        msg.className = 'msg err';
        msg.textContent = "That key wasn't recognized. Copy it again from your Gumroad receipt email.";
      }
    } catch {
      msg.className = 'msg err';
      msg.textContent = "Couldn't reach Gumroad. Check your connection and try again.";
    } finally {
      btn.disabled = false;
    }
  });
}

function track(name) {
  try { if (window.posthog) window.posthog.capture(name); } catch { /* analytics is optional */ }
}

/* ---------- boot ---------- */

function boot() {
  if (!loadHash()) {
    const s = STARTS[Math.floor(Math.random() * STARTS.length)];
    Object.assign(state, { center: s.center.slice(), zf: s.zf, title: s.title, subtitle: s.subtitle });
  }
  buildControls();
  syncInputs();
  bindSearch();
  bindGestures();
  bindBuy();
  updateBuy();
  sizePoster();
  try {
    initMap();
  } catch (err) {
    console.error(err);
    $('#stage').insertAdjacentHTML('beforeend', '<p class="hint" style="display:block">This browser can’t draw the map (WebGL is off or unavailable).</p>');
    return;
  }
  fontsReady().then(drawOverlay);
  let raf = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sizePoster); });
}

boot();
