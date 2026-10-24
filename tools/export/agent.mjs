#!/usr/bin/env node
// Пакеты для команды бренда. Каждая роль получает своё — и только по своему бренду.
//
//   apps/docs/public/packages/<brand>/agent-context.zip  — агенту: CLAUDE.md, system/core, бренд (без картинок),
//        снимок, отчёт линтера и токены — срезанные до бренда и его продуктов; у каждого продукта бренда —
//        product.json, rules.json и каркас src/Page.tsx; примеры шаблонов экранов из system/core/patterns
//   apps/docs/public/packages/<brand>/tokens.css         — разработчику: токены бренда
//   apps/docs/public/packages/<brand>/tokens.dtcg.json   — дизайнеру: токены в формате DTCG для Figma
//   apps/docs/public/packages/<brand>/writing.zip        — автору текстов: тон голоса, словарь, формулировки
//   apps/docs/public/packages/icons.svg                  — общий спрайт иконок
//
// Это копии файлов из репозитория; пакеты — для тех, у кого репозитория нет.
// Время в архиве — постоянное: тот же вход даёт тот же архив, байт в байт.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

process.on("uncaughtException", (e) => { console.error(`Пакеты не собраны — инструмент упал:\n${e?.stack ?? e}`); process.exit(3); });

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "apps/docs/public/packages");
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const walk = (dir, out = []) => {
  if (!exists(dir)) return out;
  for (const f of fs.readdirSync(path.join(ROOT, dir)).sort()) {
    const p = `${dir}/${f}`;
    if (fs.statSync(path.join(ROOT, p)).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};

// ---------- ZIP без зависимостей ----------
const table = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const FIXED = { year: 2026, month: 1, day: 1 }; // 2026-01-01 00:00 — не время сборки, чтобы архив не менялся от прогона к прогону
const dosTime = 0;
const dosDate = ((FIXED.year - 1980) << 9) | (FIXED.month << 5) | FIXED.day;
function zip(entries, prefix) {
  const local = []; const central = []; let offset = 0;
  for (const [name0, data] of entries) {
    const comp = zlib.deflateRawSync(data);
    const name = Buffer.from(`${prefix}/${name0}`, "utf8");
    const crc = crc32(data);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8);
    h.writeUInt16LE(dosTime, 10); h.writeUInt16LE(dosDate, 12); h.writeUInt32LE(crc, 14);
    h.writeUInt32LE(comp.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(name.length, 26);
    local.push(h, name, comp);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10);
    c.writeUInt16LE(dosTime, 12); c.writeUInt16LE(dosDate, 14); c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(offset, 42);
    central.push(c, name);
    offset += h.length + name.length + comp.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, cd, end]);
}
const file = (p) => [p, fs.readFileSync(path.join(ROOT, p))];
const json = (p, data) => [p, Buffer.from(JSON.stringify(data, null, 2) + "\n")];
const readJson = (p) => (exists(p) ? JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8")) : null);

// ---------- срез сгенерированного под бренд: только его продукты, экраны, находки, токены ----------
const ownFile = (dirs) => (f) => dirs.some((d) => String(f ?? "").startsWith(`apps/${d}/`));
function sliceSnapshot(snap, b, own) {
  if (!snap) return null;
  const ids = new Set(own.map((p) => p.id));
  const mine = ownFile(own.map((p) => p.dir));
  const ownKey = (k) => ids.has(String(k).split("/")[0]);
  const components = snap.components.map((c) => {
    const files = c.usage.files.filter((f) => mine(f.file));
    return { ...c,
      usage: { direct: files.reduce((a, f) => a + f.count, 0), files, screens: c.usage.screens.filter(ownKey), screensIndirect: c.usage.screensIndirect.filter(ownKey) },
      impact: { ...c.impact, screens: c.impact.screens.filter(ownKey) } };
  });
  const blind = Object.fromEntries(Object.entries(snap.usageScan.blind).map(([k, v]) => [k, v.filter((x) => mine(x.file))]));
  const screens = snap.screens.filter((x) => ids.has(x.product));
  return { ...snap,
    totals: { ...snap.totals, screens: screens.length, brands: 1 },
    usageScan: { ...snap.usageScan, roots: snap.usageScan.roots.filter((r) => mine(r + "/")), blind },
    components,
    brands: snap.brands.filter((x) => x.id === b).map((x) => ({ ...x, illustrations: x.illustrations.map((i) => ({ ...i, usedIn: i.usedIn.filter(mine) })) })),
    patterns: snap.patterns.map((p) => ({ ...p, screens: p.screens.filter(ownKey) })),
    patternProblems: snap.patternProblems.filter((t) => !/^(экран|продукт) /.test(t) || ids.has(/^(?:экран|продукт) ([^/:\s]+)/.exec(t)?.[1])),
    products: snap.products.filter((p) => ids.has(p.id)),
    screens,
    productHistory: snap.productHistory.map((d) => ({ ...d, changes: d.changes.filter((x) => ids.has(x.product ?? String(x.screen).split("/")[0])) })).filter((d) => d.changes.length),
  };
}
function sliceLint(lint, b, own) {
  if (!lint) return null;
  const ids = new Set(own.map((p) => p.id));
  const mine = ownFile(own.map((p) => p.dir));
  const findings = lint.findings.filter((x) => ids.has(x.product));
  const notChecked = lint.notChecked.filter((x) => ids.has(x.product));
  const components = Object.fromEntries(Object.entries(lint.components).map(([n, c]) => [n, { ...c,
    fresh: findings.filter((x) => x.component === n && x.state === "fresh").length,
    frozen: findings.filter((x) => x.component === n && x.state === "frozen").length,
    unknown: notChecked.filter((x) => x.component === n).length }]));
  const fresh = findings.filter((x) => x.state === "fresh").length;
  return { ...lint,
    scope: lint.scope.filter((d) => mine(d + "/")),
    fresh, frozen: findings.length - fresh, unknown: notChecked.length,
    anchorsBroken: lint.anchorsBroken.filter((x) => !x.product || ids.has(x.product)),
    staleBaseline: lint.staleBaseline.filter((x) => mine(x.file)),
    codeRules: lint.codeRules.filter((r) => r.level === "core" || (r.level === "brand" && r.file.startsWith(`system/brands/${b}/`)) || (r.level === "product" && mine(r.file))),
    findings, notChecked, components,
  };
}
function sliceTokens(tokens, b) {
  if (!tokens) return null;
  return { ...tokens, defaultBrand: b,
    brands: Object.fromEntries(Object.entries(tokens.brands).filter(([id]) => id === b)),
    semantic: tokens.semantic.map((t) => ({ ...t, values: Object.fromEntries(Object.entries(t.values).filter(([id]) => id === b)) })) };
}

// примеры шаблонов экранов: поле **Пример:** в system/core/patterns/*.md
const patternExamples = walk("system/core/patterns").filter((p) => p.endsWith(".md"))
  .map((p) => (/^\*\*Пример:\*\*\s*(\S+)/m.exec(fs.readFileSync(path.join(ROOT, p), "utf8")) ?? [])[1]).filter((p) => p && exists(p));

fs.mkdirSync(OUT, { recursive: true });
const brands = fs.readdirSync(path.join(ROOT, "system/brands")).filter((d) => exists(`system/brands/${d}/brand.json`));
const products = fs.readdirSync(path.join(ROOT, "apps")).filter((d) => exists(`apps/${d}/product.json`)).map((d) => ({ dir: d, ...JSON.parse(fs.readFileSync(path.join(ROOT, "apps", d, "product.json"), "utf8")) }));

for (const b of brands) {
  const dir = path.join(OUT, b);
  fs.mkdirSync(dir, { recursive: true });
  const brand = JSON.parse(fs.readFileSync(path.join(ROOT, "system/brands", b, "brand.json"), "utf8"));
  const own = products.filter((p) => p.brand === b);

  const sliced = [
    ["system/generated/snapshot.json", sliceSnapshot(readJson("system/generated/snapshot.json"), b, own)],
    ["system/generated/lint-report.json", sliceLint(readJson("system/generated/lint-report.json"), b, own)],
    ["system/generated/tokens.json", sliceTokens(readJson("system/generated/tokens.json"), b)],
  ].filter(([, d]) => d);
  const productFiles = own.flatMap((p) => ["product.json", "rules.json", "src/Page.tsx"].map((f) => `apps/${p.dir}/${f}`)).filter(exists);
  const agent = [
    file("CLAUDE.md"), file("README.md"),
    ...walk("system/core").map(file),
    ...walk(`system/brands/${b}`).filter((p) => !p.endsWith(".png")).map(file),
    ...sliced.map(([p, d]) => json(p, d)),
    ...[...new Set([...productFiles, ...patternExamples])].sort().map(file),
  ];
  fs.writeFileSync(path.join(dir, "agent-context.zip"), zip(agent, `${b}-agent-context`));

  for (const f of ["tokens.css", "tokens.dtcg.json"]) {
    const src = path.join(ROOT, "system/generated/brands", b, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, f));
  }

  const writing = [
    ...walk(`system/brands/${b}`).filter((p) => p.endsWith(".md")).map(file),
    [`system/brands/${b}/strings.json`, Buffer.from(JSON.stringify(brand.strings ?? {}, null, 2) + "\n")],
  ];
  fs.writeFileSync(path.join(dir, "writing.zip"), zip(writing, `${b}-writing`));
  console.log(`Пакеты бренда ${brand.name}: агенту ${agent.length} файлов, токены, тексты → apps/docs/public/packages/${b}/`);
}

// общий спрайт иконок
const icons = [...fs.readFileSync(path.join(ROOT, "packages/ui/src/icons/icons.tsx"), "utf8").matchAll(/^\s+"?([a-z-]+)"?:\s*"(M[^"]+)"/gm)];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${icons.map(([, n, d]) => `  <symbol id="${n}" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></symbol>`).join("\n")}\n</svg>\n`;
fs.writeFileSync(path.join(OUT, "icons.svg"), svg);
console.log(`Иконки: ${icons.length} → apps/docs/public/packages/icons.svg`);
