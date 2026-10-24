#!/usr/bin/env node
// Сборщик токенов: system/core/tokens/*.json + system/brands/*/brand.json
//   → packages/ui/src/tokens.css             (все бренды, для пакета)
//   → system/generated/tokens.json           (для витрины и агента)
//   → system/generated/brands/<id>/tokens.css и tokens.dtcg.json (пакет одного бренда)
//
// Заодно стережёт правило слоёв:
//   примитивы — ни на что не ссылаются;
//   бренд     — только на примитивы;
//   семантика — на бренд, на акцент бренда {accent.N} и на примитивы.
// Нарушение — код 1, файл не пишется. Сбой самого сборщика — код 3.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.on("uncaughtException", (e) => { console.error(`Токены не собраны — инструмент упал:\n${e?.stack ?? e}`); process.exit(3); });

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const T = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, "system/core/tokens", f), "utf8"));
const prim = T("primitives.json");
const sem = T("semantic.json");
// бренды: каждая папка system/brands/<id> с brand.json; токены бренда — поле tokens
const BRANDS_DIR = path.join(ROOT, "system/brands");
const brandFiles = fs.readdirSync(BRANDS_DIR).filter((d) => fs.existsSync(path.join(BRANDS_DIR, d, "brand.json"))).sort();
const brandMeta = Object.fromEntries(brandFiles.map((d) => [d, JSON.parse(fs.readFileSync(path.join(BRANDS_DIR, d, "brand.json"), "utf8"))]));
const brands = {
  default: brandFiles.find((d) => brandMeta[d].status === "active") ?? brandFiles[0],
  brands: Object.fromEntries(brandFiles.map((d) => [d, { label: brandMeta[d].name, about: brandMeta[d].tagline ?? "", ...brandMeta[d].tokens }])),
};

const RAMPS = Object.keys(prim.color).filter((k) => typeof prim.color[k] === "object");
const THEMES = ["light", "dark"];
const errors = [];

// ---------- разбор ссылок ----------
// Возвращает { css, layer, resolve(brand, theme) -> hex|string, chain(brand, theme) -> [шаги] }
function ref(expr, where, allowed) {
  const m = /^\{([^}]+)\}$/.exec(expr);
  if (!m) return { css: expr, layer: "literal", resolve: () => expr, chain: () => [expr] };
  const p = m[1].split(".");
  let out;
  if (RAMPS.includes(p[0]) && p.length === 2) {
    const n = +p[1];
    out = {
      css: `var(--p-${p[0]}-${n})`, layer: "primitive",
      resolve: (_b, t) => prim.color[p[0]][t][n - 1],
      chain: (_b, t) => [`${p[0]}.${n}`, prim.color[p[0]][t][n - 1]],
    };
  } else if (p[0] === "accent" && p.length === 2) {
    const n = +p[1];
    out = {
      css: `var(--b-accent-${n})`, layer: "brand",
      resolve: (b, t) => prim.color[rampOf(b)][t][n - 1],
      chain: (b, t) => [`accent.${n}`, `${rampOf(b)}.${n}`, prim.color[rampOf(b)][t][n - 1]],
    };
  } else if (p[0] === "color" && (p[1] === "white" || p[1] === "black")) {
    out = { css: `var(--p-${p[1]})`, layer: "primitive", resolve: () => prim.color[p[1]], chain: () => [`color.${p[1]}`, prim.color[p[1]]] };
  } else if (p[0] === "color" && RAMPS.includes(p[1])) {
    out = { css: null, layer: "primitive", ramp: p[1], resolve: () => p[1], chain: () => [p[1]] };
  } else if (p[0] === "radius") {
    const v = prim.radius[p[1]];
    out = { css: `var(--p-radius-${p[1]})`, layer: "primitive", resolve: () => `${v}px`, chain: () => [`radius.${p[1]}`, `${v}px`] };
  } else if (p[0] === "font" && p[1] === "family") {
    const v = prim.font.family[p[2]];
    out = { css: `var(--p-font-family-${p[2]})`, layer: "primitive", resolve: () => v, chain: () => [`font.family.${p[2]}`] };
  } else if (p[0] === "brand") {
    const key = p.slice(1).join(".");
    out = {
      css: `var(--b-${key.replace(/\./g, "-")})`, layer: "brand",
      resolve: (b, t) => ref(brands.brands[b][key], "", ["primitive"]).resolve(b, t),
      chain: (b, t) => [`brand.${key}`, ...ref(brands.brands[b][key], "", ["primitive"]).chain(b, t)],
    };
  } else {
    errors.push(`${where}: неизвестная ссылка ${expr}`);
    return { css: "initial", layer: "?", resolve: () => "?", chain: () => ["?"] };
  }
  if (allowed && !allowed.includes(out.layer)) {
    errors.push(`${where}: ссылка ${expr} ведёт в слой «${out.layer}», а отсюда можно только в ${allowed.join(", ")}`);
  }
  return out;
}
const rampOf = (b) => /^\{color\.([a-z]+)\}$/.exec(brands.brands[b].accent)[1];

// ---------- проверка бренда ----------
for (const [id, b] of Object.entries(brands.brands)) {
  for (const [k, v] of Object.entries(b)) {
    if (k === "label" || k === "about") continue;
    ref(v, `бренд ${id}.${k}`, ["primitive"]);
  }
}

// ---------- семантика: развернуть дерево в плоский список ----------
const flat = []; // { name, cssVar, group, light, dark, themed }
function walk(node, trail) {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith("$")) continue;
    const t = [...trail, k];
    const isLeaf = typeof v === "string" || (v && typeof v === "object" && ("light" in v || "dark" in v));
    if (isLeaf) {
      const themed = typeof v === "object";
      const name = t.join(".");
      flat.push({
        name, group: t[0], cssVar: `--${t.join("-")}`,
        light: themed ? v.light : v, dark: themed ? v.dark : v, themed,
      });
    } else walk(v, t);
  }
}
walk(sem, []);
const SEM_ALLOWED = ["primitive", "brand", "literal"];

// ---------- CSS ----------
const L = [];
const line = (s = "") => L.push(s);
line("/* Сгенерировано tools/tokens/build.mjs из system/core/tokens и system/brands. Не править руками. */");
line();
// 1. шкалы и константы — на :root, от темы не зависят
line(":root {");
line(`  --p-white: ${prim.color.white};`);
line(`  --p-black: ${prim.color.black};`);
for (const [k, v] of Object.entries(prim.space)) line(`  --space-${k}: ${v}px;`);
for (const [k, v] of Object.entries(prim.radius)) line(`  --p-radius-${k}: ${v}px;`);
for (const [k, v] of Object.entries(prim.font.family)) line(`  --p-font-family-${k}: ${v};`);
for (const [k, v] of Object.entries(prim.font.size)) line(`  --font-size-${k}: ${v}px;`);
for (const [k, v] of Object.entries(prim.font.weight)) line(`  --font-weight-${k}: ${v};`);
line("}");
line();
// 2. темы: цветовые ряды + темозависимые значения семантики (--t-*)
function themeBlock(theme) {
  const out = [];
  for (const r of RAMPS) prim.color[r][theme].forEach((hex, i) => out.push(`  --p-${r}-${i + 1}: ${hex};`));
  for (const f of flat.filter((x) => x.themed)) {
    out.push(`  --t-${f.cssVar.slice(2)}: ${ref(f[theme], `семантика ${f.name} (${theme})`, SEM_ALLOWED).css};`);
  }
  out.push(`  color-scheme: ${theme};`);
  return out;
}
line(':root, [data-theme="light"] {');
themeBlock("light").forEach(line);
line("}");
line('[data-theme="dark"] {');
themeBlock("dark").forEach(line);
line("}");
line("@media (prefers-color-scheme: dark) {");
line('  :root:not([data-theme="light"]) {');
themeBlock("dark").forEach((s) => line("  " + s));
line("  }");
line("}");
line();
// 3. бренды
for (const [id, b] of Object.entries(brands.brands)) {
  const sel = id === brands.default ? `:root, [data-brand="${id}"]` : `[data-brand="${id}"]`;
  line(`${sel} {`);
  for (let n = 1; n <= 12; n++) line(`  --b-accent-${n}: var(--p-${rampOf(id)}-${n});`);
  for (const [k, v] of Object.entries(b)) {
    if (["label", "about", "accent"].includes(k)) continue;
    line(`  --b-${k.replace(/\./g, "-")}: ${ref(v, `бренд ${id}.${k}`, ["primitive"]).css};`);
  }
  line("}");
}
line();
// 4. семантика — переобъявляется на каждом элементе с брендом или темой,
//    чтобы var() пересчитался в их области, а не застыл на :root
line(":root, [data-brand], [data-theme] {");
for (const f of flat) {
  const css = f.themed ? `var(--t-${f.cssVar.slice(2)})` : ref(f.light, `семантика ${f.name}`, SEM_ALLOWED).css;
  line(`  ${f.cssVar}: ${css};`);
}
line("}");

if (errors.length) {
  console.error("Токены не собраны — нарушено правило слоёв:\n  " + [...new Set(errors)].join("\n  "));
  process.exit(1);
}

fs.writeFileSync(path.join(ROOT, "packages/ui/src/tokens.css"), L.join("\n") + "\n");

// ---------- resolved.json: для витрины и агента ----------
const brandIds = Object.keys(brands.brands);
const resolved = {
  generated: new Date().toISOString().slice(0, 10),
  rule: "Компоненты используют только семантические токены (--color-*, --radius-*, --font-*, --shadow-*) и шкалы --space-*, --font-size-*, --font-weight-*. Ссылки на --p-* и --b-* и литеральные цвета в компонентах запрещены.",
  brands: Object.fromEntries(brandIds.map((id) => [id, {
    label: brands.brands[id].label, about: brands.brands[id].about, accent: rampOf(id),
    overrides: Object.fromEntries(Object.entries(brands.brands[id]).filter(([k]) => !["label", "about"].includes(k))),
  }])),
  defaultBrand: brands.default,
  primitives: {
    ramps: Object.fromEntries(RAMPS.map((r) => [r, prim.color[r]])),
    space: prim.space, radius: prim.radius, font: prim.font,
  },
  semantic: flat.map((f) => ({
    name: f.name, group: f.group, cssVar: f.cssVar, themed: f.themed,
    source: f.themed ? { light: f.light, dark: f.dark } : f.light,
    layer: ref(f.light, "", null).layer,
    values: Object.fromEntries(brandIds.map((b) => [b, Object.fromEntries(THEMES.map((t) => [t, {
      value: ref(f[t], "", null).resolve(b, t),
      chain: ref(f[t], "", null).chain(b, t),
    }]))])),
  })),
};
const GEN = path.join(ROOT, "system/generated");
fs.mkdirSync(GEN, { recursive: true });
fs.writeFileSync(path.join(GEN, "tokens.json"), JSON.stringify(resolved, null, 2) + "\n");

// пакет одного бренда: CSS только с его блоком и DTCG-JSON для импорта в Figma
const cssAll = L.join("\n");
for (const id of brandIds) {
  const dir = path.join(GEN, "brands", id);
  fs.mkdirSync(dir, { recursive: true });
  const own = cssAll
    .replace(/\n(:root, )?\[data-brand="([a-z0-9-]+)"\] \{[^}]*\}/g, (m, _r, b) => (b === id ? m.replace(`[data-brand="${id}"]`, `:root, [data-brand="${id}"]`).replace(":root, :root, ", ":root, ") : ""));
  fs.writeFileSync(path.join(dir, "tokens.css"), `/* Токены бренда ${brands.brands[id].label}. Сгенерировано tools/tokens/build.mjs. */\n` + own + "\n");
  const dtcg = {};
  const put = (pathArr, val) => { let o = dtcg; for (const k of pathArr.slice(0, -1)) o = o[k] ??= {}; o[pathArr[pathArr.length - 1]] = val; };
  for (const f of flat) {
    const v = (t) => ref(f[t], "", null).resolve(id, t);
    const type = f.group === "color" ? "color" : f.group === "radius" ? "dimension" : f.group === "font" ? "fontFamily" : "shadow";
    put(f.name.split("."), { $type: type, $value: v("light"), $extensions: { "ds-proto": { dark: v("dark"), source: f.light } } });
  }
  fs.writeFileSync(path.join(dir, "tokens.dtcg.json"), JSON.stringify({ $description: `Токены бренда ${brands.brands[id].label} в формате DTCG. Значение — светлая тема, тёмная — в $extensions.`, ...dtcg }, null, 2) + "\n");
}
console.log(`Токены: ${flat.length} семантических, брендов: ${brandIds.length}, ${RAMPS.length} цветовых рядов. Правило слоёв соблюдено.`);
