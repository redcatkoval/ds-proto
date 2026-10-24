#!/usr/bin/env node
// Сборщик снимка: код → system/generated/snapshot.json
//
// Снимок — единственный источник для витрины и агента. Всё в нём измерено
// по коду при сборке; руками в снимок не пишется ничего.
//
//   компоненты  — packages/ui/src/components/*/ : свойства из типов, описание из meta.json
//   зависимости — по импортам между компонентами, прямые и через вложенность
//   продукты    — apps/*/product.json: бренд, экраны; разбор кода экранов
//   использование — вызовы <Компонент> в коде продуктов; что разбор не видит — названо числом
//   бренды      — system/brands/*/: токены бренда, формулировки, тексты для команды
//   токены      — какие семантические токены берёт компонент и нет ли литералов
//   ступень     — вычисляется по лестнице; руками не выставляется
//   контракт    — шапка и правила из system/core/contracts/<slug>.md
//   линтер      — результаты последнего прогона system/generated/lint-report.json, если он есть

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { colorLiterals, varRefs } from "../lib/css.mjs";
import { lintInputs } from "../lib/inputs.mjs";

// Упал — код 3: это сбой инструмента, а не нарушение в коде
process.on("uncaughtException", (e) => { console.error(`Снимок не собран — инструмент упал:\n${e?.stack ?? e}`); process.exit(3); });

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const read = (p) => fs.readFileSync(p, "utf8");
const exists = (p) => fs.existsSync(p);
const today = new Date().toISOString().slice(0, 10);

const UI = path.join(ROOT, "packages/ui/src");
const COMP_DIR = path.join(UI, "components");
const APPS = path.join(ROOT, "apps");
const CONTRACTS = path.join(ROOT, "system/core/contracts");
const GEN = path.join(ROOT, "system/generated");
const patternTitle = (slug) => { const f = path.join(ROOT, "system/core/patterns", `${slug}.md`); return exists(f) ? (/^#\s+(.+)$/m.exec(read(f)) ?? [])[1] ?? slug : slug; };
const productDirs = fs.readdirSync(APPS).filter((d) => exists(path.join(APPS, d, "product.json"))).sort();
const products = productDirs.map((d) => ({ dir: d, ...JSON.parse(read(path.join(APPS, d, "product.json"))) }));

const illustrationNames = [...read(path.join(UI, "illustrations.ts")).matchAll(/^\s+"([a-z-]+)":\s*"/gm)].map((m) => m[1]);
const iconNames = [...read(path.join(UI, "icons/icons.tsx")).matchAll(/^\s+"?([a-z-]+)"?:\s*"M/gm)].map((m) => m[1]);

// ---------- гашение комментариев с сохранением длины (строки не съезжают) ----------
// Код (.ts/.tsx): строки, шаблоны, регулярные выражения и текст JSX находит разбор TypeScript —
// апостроф в «Don't» не открывает строку, а «//» в тексте не становится комментарием.
// CSS: только /* */, кавычки уважаются.
function blankRanges(src, opaque, lineComments) {
  let out = "", i = 0, k = 0;
  while (i < src.length) {
    while (k < opaque.length && opaque[k][1] <= i) k++;
    if (k < opaque.length && opaque[k][0] <= i) { out += src.slice(i, opaque[k][1]); i = opaque[k][1]; continue; }
    const c = src[i], n = src[i + 1];
    if (c === "/" && n === "*") {
      const j = src.indexOf("*/", i + 2); const end = j === -1 ? src.length : j + 2;
      out += src.slice(i, end).replace(/[^\n]/g, " "); i = end; continue;
    }
    if (lineComments && c === "/" && n === "/") {
      const j = src.indexOf("\n", i); const end = j === -1 ? src.length : j;
      out += " ".repeat(end - i); i = end; continue;
    }
    out += c; i++;
  }
  return out;
}
function blankComments(src, file = "x.tsx") {
  if (file.endsWith(".css")) {
    const quoted = [...src.matchAll(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g)].map((m) => [m.index, m.index + m[0].length]);
    return blankRanges(src, quoted, false); // в CSS нет «//»-комментариев
  }
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.TSX);
  const opaque = [];
  const OPAQUE = new Set([ts.SyntaxKind.StringLiteral, ts.SyntaxKind.NoSubstitutionTemplateLiteral, ts.SyntaxKind.TemplateHead, ts.SyntaxKind.TemplateMiddle, ts.SyntaxKind.TemplateTail, ts.SyntaxKind.RegularExpressionLiteral, ts.SyntaxKind.JsxText]);
  const visit = (node) => {
    if (OPAQUE.has(node.kind)) opaque.push([node.kind === ts.SyntaxKind.JsxText ? node.pos : node.getStart(sf), node.end]);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  opaque.sort((a, b) => a[0] - b[0]);
  return blankRanges(src, opaque, true);
}
const lineOf = (src, idx) => src.slice(0, idx).split("\n").length;

// ---------- свойства из типов ----------
function classify(typeNode, text) {
  if (!typeNode) return { kind: "unknown" };
  if (ts.isUnionTypeNode(typeNode)) {
    const lits = typeNode.types.filter((t) => ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal)).map((t) => t.literal.text);
    if (lits.length === typeNode.types.length) return { kind: "enum", options: lits };
  }
  if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) return { kind: "boolean" };
  if (typeNode.kind === ts.SyntaxKind.StringKeyword) return { kind: "string" };
  if (typeNode.kind === ts.SyntaxKind.NumberKeyword) return { kind: "number" };
  if (ts.isFunctionTypeNode(typeNode) || /Handler<|=>/.test(text)) return { kind: "function" };
  if (/^IconName$/.test(text)) return { kind: "enum", options: iconNames };
  if (/^IllustrationName$/.test(text)) return { kind: "enum", options: illustrationNames };
  if (/^ReactNode$/.test(text)) return { kind: "node" };
  if (ts.isArrayTypeNode(typeNode) || /\[\]$/.test(text)) return { kind: "array" };
  return { kind: "object" };
}

function parseComponent(file, name) {
  const src = read(file);
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const props = [];
  const defaults = {};
  let propsShape = "missing";
  const openApi = [];
  ts.forEachChild(sf, (node) => {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === `${name}Props`) {
      if (ts.isTypeLiteralNode(node.type)) {
        propsShape = "closed";
        for (const m of node.type.members) {
          if (!ts.isPropertySignature(m) || !m.name) continue;
          const pname = m.name.getText(sf);
          const typeText = m.type ? m.type.getText(sf).replace(/\s+/g, " ") : "";
          const doc = (m.jsDoc ?? []).map((d) => (typeof d.comment === "string" ? d.comment : "")).join(" ").trim();
          if (pname === "className" || pname === "style") openApi.push(pname);
          props.push({ name: pname, type: typeText, required: !m.questionToken, doc, ...classify(m.type, typeText) });
        }
      } else propsShape = "not-literal";
    }
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
      const p = node.parameters[0];
      if (p && ts.isObjectBindingPattern(p.name)) {
        for (const el of p.name.elements) {
          if (el.initializer) { const t = el.initializer.getText(sf); defaults[el.name.getText(sf)] = t === "true" ? true : t === "false" ? false : /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : t.replace(/^"|"$/g, ""); }
        }
      }
    }
  });
  for (const p of props) if (p.name in defaults) p.default = defaults[p.name];
  const clean = blankComments(src, file);
  const inlineStyles = [...clean.matchAll(/\sstyle=\{\{/g)].map((m) => ({ line: lineOf(clean, m.index) }));
  const imports = [...clean.matchAll(/from\s+"\.\.\/([a-z-]+)"/g)].map((m) => m[1]);
  return { props, propsShape, openApi, inlineStyles, imports };
}

// ---------- токены в CSS ----------
const ALLOWED_VAR = /^--(color|radius|font|shadow|space|font-size|font-weight)-/;
function scanCss(file) {
  const src = blankComments(read(file), file);
  const used = new Set();
  const violations = [];
  for (const m of varRefs(src)) {
    used.add(m.name);
    if (!ALLOWED_VAR.test(m.name)) violations.push({ line: lineOf(src, m.index), kind: "слой", text: m.name, why: "ссылка мимо семантики: компонентам можно только --color-*, --radius-*, --font-*, --shadow-* и шкалы" });
  }
  for (const m of colorLiterals(src)) {
    violations.push({ line: lineOf(src, m.index), kind: "литерал", text: m.text, why: "цвет числом или именем, а не токеном" });
  }
  return { used: [...used].sort(), violations };
}

// ---------- контракт ----------
// Формат: шапка из полей **Поле:** значение; правила — «### N. Название», текст,
// «**Почему:**», «**Кто следит:** машина | компонент | человек | совет».
const WHO = ["машина", "компонент", "человек", "совет"];
function parseContract(slug) {
  const file = path.join(CONTRACTS, `${slug}.md`);
  if (!exists(file)) return null;
  const src = read(file);
  const field = (k) => (new RegExp(`^\\*\\*${k}:\\*\\*\\s*(.+)$`, "m").exec(src) ?? [])[1]?.trim() ?? null;
  const section = (h) => { const m = new RegExp(`^## ${h}\\s*\\n([\\s\\S]*?)(?=\\n## |(?![\\s\\S]))`, "m").exec(src); return m ? m[1].trim() : null; };
  const rules = [...src.matchAll(/^###\s+(\d+)\.\s+(.+)$/gm)].map((m) => {
    const start = m.index + m[0].length; const next = src.slice(start).search(/\n##/); const body = src.slice(start, next === -1 ? undefined : start + next).trim();
    const who = /\*\*Кто следит:\*\*\s*([а-яё]+)/.exec(body)?.[1] ?? "не указано";
    const why = /\*\*Почему:\*\*\s*([^\n]+)/.exec(body)?.[1]?.trim() ?? null;
    const text = body.split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
    return { id: m[1], title: m[2].trim(), text, why, checkedBy: WHO.includes(who) ? who : "не указано" };
  });
  // сверено — только с датой сверки и не «нет»
  const reviewedRaw = field("Сверено человеком");
  const reviewed = reviewedRaw && /\d{4}-\d{2}-\d{2}/.test(reviewedRaw) && !/^\s*нет(?![\p{L}])/iu.test(reviewedRaw) ? reviewedRaw : null;
  return {
    path: rel(file),
    status: field("Состояние") ?? "черновик",
    depth: field("Полнота") ?? "короткий",
    reviewed,
    reviewedRaw: reviewedRaw && reviewedRaw !== "—" ? reviewedRaw : null,
    summary: section("Коротко"),
    blind: (section("Чего машина не видит") ?? "").split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim()),
    rules,
  };
}

// ---------- обход компонентов ----------
const components = [];
for (const slug of fs.readdirSync(COMP_DIR).sort()) {
  const dir = path.join(COMP_DIR, slug);
  if (!fs.statSync(dir).isDirectory()) continue;
  const meta = JSON.parse(read(path.join(dir, "meta.json")));
  const name = meta.name;
  const tsx = path.join(dir, `${name}.tsx`);
  const css = path.join(dir, `${slug}.css`);
  const parsed = parseComponent(tsx, name);
  const tokens = exists(css) ? scanCss(css) : { used: [], violations: [] };
  components.push({
    name, slug, group: meta.group, description: meta.description ?? "", design: meta.design ?? "in-progress",
    guidance: meta.usage ?? null, behaviour: meta.behaviour ?? [], accessibility: meta.accessibility ?? null, codegen: meta.codegen ?? [], examples: meta.examples ?? [], ruleExamples: meta.ruleExamples ?? {},
    strings: [...read(tsx).matchAll(/s\["([a-zA-Z.]+)"\]/g)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i),
    files: { component: rel(tsx), styles: exists(css) ? rel(css) : null, meta: rel(path.join(dir, "meta.json")) },
    props: parsed.props, api: { shape: parsed.propsShape, open: parsed.openApi, inlineStyles: parsed.inlineStyles },
    tokens: { used: tokens.used, violations: tokens.violations.map((v) => ({ ...v, file: rel(css) })) },
    _imports: parsed.imports,
  });
}
const bySlug = Object.fromEntries(components.map((c) => [c.slug, c]));
const byName = Object.fromEntries(components.map((c) => [c.name, c]));

// зависимости: прямые и транзитивные
for (const c of components) c.builtFrom = [...new Set(c._imports.filter((s) => bySlug[s]).map((s) => bySlug[s].name))];
function closure(name, seen = new Set()) {
  for (const d of byName[name].builtFrom) if (!seen.has(d)) { seen.add(d); closure(d, seen); }
  return seen;
}
for (const c of components) {
  const all = closure(c.name);
  c.brings = [...all].filter((n) => !c.builtFrom.includes(n));
  c.usedIn = components.filter((o) => o.builtFrom.includes(c.name)).map((o) => o.name);
}

// ---------- продукты, экраны и использование ----------
const usageScan = { roots: products.map((p) => `apps/${p.dir}/src`), files: 0, blind: { spread: [], alias: [], commented: [], dynamic: [] } };
const usageByFile = {}; // file → { Name: count }
const usageSources = {}; // file → текст без комментариев

function walkFiles(dir, out = []) {
  if (!exists(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walkFiles(p, out);
    else if (/\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}
for (const file of products.flatMap((p) => walkFiles(path.join(APPS, p.dir, "src")))) {
  usageScan.files++;
  const raw = read(file);
  const src = blankComments(raw, file);
  usageSources[rel(file)] = src;
  const imp = /import\s*\{([^}]*)\}\s*from\s*"@ds\/ui"/g.exec(src);
  if (!imp) continue;
  const local = {};
  for (const spec of imp[1].split(",").map((x) => x.trim()).filter(Boolean)) {
    const [orig, alias] = spec.replace(/^type\s+/, "").split(/\s+as\s+/);
    if (!byName[orig]) continue;
    local[alias ?? orig] = orig;
    if (alias) usageScan.blind.alias.push({ file: rel(file), line: lineOf(src, imp.index), text: `${orig} as ${alias}` });
  }
  const counts = {};
  for (const [loc, orig] of Object.entries(local)) {
    for (const m of src.matchAll(new RegExp(`<${loc}(?=[\\s/>])`, "g"))) {
      counts[orig] = (counts[orig] ?? 0) + 1;
      const tagEnd = src.indexOf(">", m.index);
      if (/\{\s*\.\.\./.test(src.slice(m.index, tagEnd))) usageScan.blind.spread.push({ file: rel(file), line: lineOf(src, m.index), component: orig });
    }
    const rawCount = [...raw.matchAll(new RegExp(`<${loc}(?=[\\s/>])`, "g"))].length;
    const liveCount = [...src.matchAll(new RegExp(`<${loc}(?=[\\s/>])`, "g"))].length;
    if (rawCount > liveCount) usageScan.blind.commented.push({ file: rel(file), component: orig, count: rawCount - liveCount });
  }
  if (/createElement\(|lazy\(/.test(src)) usageScan.blind.dynamic.push({ file: rel(file) });
  usageByFile[rel(file)] = counts;
}

// экран = его файл и всё, что он импортирует из src/ (на один уровень)
const screenOut = products.flatMap((prod) => (prod.screens ?? []).map((sc) => {
  const base = path.join(APPS, prod.dir);
  const files = [sc.file];
  const main = path.join(base, sc.file);
  if (exists(main)) {
    for (const m of read(main).matchAll(/from\s+"(\.{1,2}\/[^"]+)"/g)) {
      const b = path.resolve(path.dirname(main), m[1]);
      for (const cand of [b + ".tsx", b + ".ts", path.join(b, "index.tsx")]) if (exists(cand)) { files.push(path.relative(base, cand).split(path.sep).join("/")); break; }
    }
  }
  const direct = {};
  for (const f of files) for (const [nm, k] of Object.entries(usageByFile[`apps/${prod.dir}/${f}`] ?? {})) direct[nm] = (direct[nm] ?? 0) + k;
  const indirect = {};
  for (const nm of Object.keys(direct)) for (const d of closure(nm)) if (!direct[d]) indirect[d] = (indirect[d] ?? 0) + 1;
  return { ...sc, key: `${prod.id}/${sc.slug}`, product: prod.id, brand: prod.brand, files, components: direct, indirect };
}));

for (const c of components) {
  const files = Object.entries(usageByFile).filter(([, cs]) => cs[c.name]).map(([f, cs]) => ({ file: f, count: cs[c.name] }));
  const direct = files.reduce((a, f) => a + f.count, 0);
  const onScreens = screenOut.filter((x) => x.components[c.name]).map((x) => x.key);
  const viaScreens = screenOut.filter((x) => !x.components[c.name] && x.indirect[c.name]).map((x) => x.key);
  c.usage = { direct, files, screens: onScreens, screensIndirect: viaScreens };
  // охват правки: сам компонент + все, кто стоит на нём, + экраны, где живёт любой из них
  const dependents = new Set([c.name]);
  let grew = true;
  while (grew) { grew = false; for (const o of components) if (!dependents.has(o.name) && o.builtFrom.some((d) => dependents.has(d))) { dependents.add(o.name); grew = true; } }
  dependents.delete(c.name);
  const hit = screenOut.filter((x) => Object.keys(x.components).some((nm) => nm === c.name || dependents.has(nm)));
  c.impact = { components: [...dependents], screens: hit.map((x) => x.key) };
}

// ---------- линтер (если прогонялся) ----------
// Отчёт берётся, только если он про этот код: отпечаток входов совпал. Линтер упал или код поменяли
// после него — отчёт устарел, и ступень «Нет нарушений» ждёт нового прогона, а не засчитывается по старому.
const lintFile = path.join(GEN, "lint-report.json");
const lintRaw = exists(lintFile) ? JSON.parse(read(lintFile)) : null;
const lintStale = !!lintRaw && lintRaw.inputs !== lintInputs(ROOT);
const lint = lintRaw && !lintStale ? lintRaw : null;

// ---------- лестница зрелости ----------
// Каждая проверка: pass | fail | pending (не проверялось — не «чисто»)
for (const c of components) {
  c.contract = parseContract(c.slug);
  const lintC = lint?.components?.[c.name] ?? null;
  const debtNote = !lintC ? (lintStale ? "отчёт линтера устарел — запустите npm run check" : "линтер ещё не прогонялся")
    : `новых ${lintC.fresh}, в долге ${lintC.frozen}${lintC.broken ? `, правил не запущено ${lintC.broken}` : ""}${lintC.unknown ? `, не проверено ${lintC.unknown}` : ""}`;
  const ownViolations = c.tokens.violations.length + c.api.open.length + c.api.inlineStyles.length;
  const R = (id, label, level, result, note) => ({ id, label, level, result, note: note ?? null });
  const checks = [
    R("in-code", "Есть в коде", "ready", "pass"),
    R("description", "Есть описание", "ready", c.description.length > 40 ? "pass" : "fail"),
    R("usage", "Написано, когда применять и когда нет", "ready", c.guidance?.do?.length && c.guidance?.dont?.length ? "pass" : "fail"),
    R("contract", "Есть контракт", "ready", c.contract ? "pass" : "fail"),
    R("tokens", "Только семантические токены", "ready", c.tokens.violations.length ? "fail" : "pass",
      c.tokens.violations.length ? `${c.tokens.violations.length}: ${c.tokens.violations.map((v) => v.text).join(", ")}` : null),
    R("closed-api", "Закрытый набор свойств, без className и style", "ready", c.api.shape === "closed" && !c.api.open.length && !c.api.inlineStyles.length ? "pass" : "fail",
      c.api.shape === "missing" ? `нет типа ${c.name}Props` : c.api.shape !== "closed" ? `${c.name}Props — не литерал типа: набор свойств не виден, закрытым не считается`
        : c.api.open.length ? `открыто: ${c.api.open.join(", ")}` : c.api.inlineStyles.length ? `инлайн-стиль, строка ${c.api.inlineStyles.map((s) => s.line).join(", ")}` : null),
    R("codegen", "Есть заметки для генерации кода", "stable", c.codegen.length ? "pass" : "fail"),
    R("enforced", "Хотя бы одно правило держит машина или сам компонент", "stable",
      !c.contract ? "fail" : c.contract.rules.some((r) => r.checkedBy === "машина" || r.checkedBy === "компонент") ? "pass" : "fail",
      !c.contract ? null : `машина: ${c.contract.rules.filter((r) => r.checkedBy === "машина").length}, компонент: ${c.contract.rules.filter((r) => r.checkedBy === "компонент").length}`),
    // правило не запустилось или часть мест не проверена — это не «чисто»
    R("no-debt", "Нет нарушений в продукте", "stable",
      lintC ? (lintC.fresh + lintC.frozen + (lintC.broken ?? 0) + (lintC.unknown ?? 0) === 0 ? "pass" : "fail") : "pending", debtNote),
    R("reviewed", "Контракт сверен человеком", "stable",
      c.contract?.reviewed ? "pass" : "pending", c.contract?.reviewed ?? (c.contract?.reviewedRaw ? `«${c.contract.reviewedRaw}» — нужна дата сверки (ГГГГ-ММ-ДД)` : "ждёт сверки")),
  ];
  const ok = (lvl) => checks.filter((x) => x.level === lvl).every((x) => x.result === "pass");
  const level = ok("ready") ? (ok("stable") ? "stable" : "ready") : "draft";
  const next = level === "stable" ? null : checks.filter((x) => x.level === (level === "draft" ? "ready" : "stable") && x.result !== "pass");
  c.maturity = { level, checks, missing: next?.map((x) => x.label) ?? [] };
  void ownViolations;
  delete c._imports;
}

// ---------- журнал: разница с прошлым снимком ----------
const snapFile = path.join(GEN, "snapshot.json");
const prev = exists(snapFile) ? JSON.parse(read(snapFile)) : null;
const LV = { draft: "черновик", ready: "готов", stable: "стабилен" };
function diff(prevC, c) {
  const out = [];
  const add = (what, type, figma, code, detail) => out.push({ component: c.name, what, type, grade: { figma, code }, detail });
  if (!prevC) { add("Появился в системе", "Новый", "minor", "minor"); return out; }
  const pp = Object.fromEntries(prevC.props.map((p) => [p.name, p]));
  const np = Object.fromEntries(c.props.map((p) => [p.name, p]));
  for (const n of Object.keys(np)) if (!pp[n]) add(`Новое свойство ${n}`, "Новое свойство", "minor", np[n].required ? "breaking" : "minor", np[n].required ? "Свойство обязательное: каждый вызов без него перестанет собираться" : null);
  for (const n of Object.keys(pp)) if (!np[n]) add(`Убрано свойство ${n}`, "Убрано", "breaking", "breaking", "Каждый вызов, который его передаёт, перестанет собираться");
  for (const n of Object.keys(np)) if (pp[n] && pp[n].type !== np[n].type) {
    const removed = (pp[n].options ?? []).filter((o) => !(np[n].options ?? []).includes(o));
    add(`У свойства ${n} другие значения`, "Изменено", removed.length ? "breaking" : "minor", removed.length ? "breaking" : "minor",
      removed.length ? `Убраны значения: ${removed.join(", ")} — вызовы с ними сломаются` : `${pp[n].type} → ${np[n].type}`);
  }
  if (JSON.stringify(prevC.tokens.used) !== JSON.stringify(c.tokens.used)) add("Берёт другие токены — может выглядеть иначе", "Вид", "minor", "minor", null);
  if (prevC.description !== c.description || JSON.stringify(prevC.guidance) !== JSON.stringify(c.guidance)) add("Поменялось описание или правила применения", "Описание", "patch", "patch", null);
  if (prevC.maturity.level !== c.maturity.level) add(`Уровень: ${LV[prevC.maturity.level]} → ${LV[c.maturity.level]}`, "Уровень", "patch", "patch", null);
  return out;
}
const prevByName = Object.fromEntries((prev?.components ?? []).map((c) => [c.name, c]));
const changes = components.flatMap((c) => diff(prevByName[c.name], c));
for (const n of Object.keys(prevByName)) if (!byName[n]) changes.push({ component: n, what: "Убран из системы", type: "Убрано", grade: { figma: "breaking", code: "breaking" }, detail: "Все вызовы перестанут собираться" });
const history = prev?.history ?? [];
// несколько прогонов за день — одна запись дня
if (changes.length) { if (history[0]?.date === today) history[0].changes.push(...changes); else history.unshift({ date: today, changes }); }

// журнал продукта: экраны
const prevScreens = Object.fromEntries((prev?.screens ?? []).map((x) => [x.key, x]));
const productChanges = [];
for (const s of screenOut) {
  const p = prevScreens[s.key];
  if (!p) { productChanges.push({ screen: s.key, product: s.product, what: `Появился экран — собран из ${Object.keys(s.components).length} компонентов${s.pattern ? ` по шаблону «${patternTitle(s.pattern)}»` : ""}`, components: Object.keys(s.components) }); continue; }
  const added = Object.keys(s.components).filter((n) => !p.components[n]);
  const removed = Object.keys(p.components).filter((n) => !s.components[n]);
  if (added.length || removed.length) productChanges.push({ screen: s.key, product: s.product, what: [added.length ? `на экране появились ${added.join(", ")}` : "", removed.length ? `с экрана ушли ${removed.join(", ")}` : ""].filter(Boolean).join("; "), components: [...added, ...removed] });
}
const productHistory = prev?.productHistory ?? [];
if (productChanges.length) { if (productHistory[0]?.date === today) productHistory[0].changes.push(...productChanges); else productHistory.unshift({ date: today, changes: productChanges }); }

// ---------- токены: сводка ----------
const resolved = JSON.parse(read(path.join(GEN, "tokens.json")));
const tokenUse = {};
for (const c of components) for (const v of c.tokens.used) (tokenUse[v] ??= []).push(c.name);

// ---------- кандидаты ----------
const candDir = path.join(ROOT, "system/core/candidates");
const candidates = exists(candDir) ? fs.readdirSync(candDir).filter((f) => /^C-\d+.*\.md$/.test(f)).map((f) => {
  const src = read(path.join(candDir, f));
  const field = (k) => (new RegExp(`^\\*\\*${k}:\\*\\*\\s*(.+)$`, "m").exec(src) ?? [])[1]?.trim() ?? null;
  return { id: f.split("-").slice(0, 2).join("-"), file: rel(path.join(candDir, f)), title: (/^#\s+(.+)$/m.exec(src) ?? [])[1] ?? f, state: field("Состояние") ?? "заявлен", where: field("Где нужен"), builtFrom: field("Из чего собирается") };
}) : [];

// ---------- бренды ----------
const stringsSrc = read(path.join(UI, "strings.tsx"));
const baseStrings = Object.fromEntries([...stringsSrc.matchAll(/^\s+"([a-zA-Z.]+)":\s*"([^"]*)"/gm)].map((m) => [m[1], m[2]]));
const brandDependent = resolved.semantic
  .filter((t) => Object.values(t.values).some((b) => ["light", "dark"].some((th) => b[th].chain.some((x) => x.startsWith("accent") || x.startsWith("brand")))))
  .map((t) => t.cssVar);
const BR = path.join(ROOT, "system/brands");
const brands = fs.readdirSync(BR).filter((d) => exists(path.join(BR, d, "brand.json"))).sort().map((d) => {
  const b = JSON.parse(read(path.join(BR, d, "brand.json")));
  const docs = fs.readdirSync(path.join(BR, d)).filter((f) => f.endsWith(".md")).sort().map((f) => ({ file: rel(path.join(BR, d, f)), title: (/^#\s+(.+)$/m.exec(read(path.join(BR, d, f))) ?? [])[1] ?? f }));
  const strings = Object.entries(b.strings ?? {}).map(([k, v]) => ({ key: k, value: v, base: baseStrings[k] ?? null, valid: k in baseStrings, components: components.filter((c) => c.strings.includes(k)).map((c) => c.name) }));
  const illDir = path.join(BR, d, "illustrations");
  const illustrations = illustrationNames.map((slot) => {
    const file = exists(path.join(illDir, `${slot}.png`)) ? rel(path.join(illDir, `${slot}.png`)) : null;
    const usedIn = Object.keys(usageSources).filter((f) => new RegExp(`illustration="${slot}"`).test(usageSources[f]));
    return { slot, file, usedIn };
  });
  return {
    id: d, name: b.name, illustrations, status: b.status ?? "active", tagline: b.tagline ?? "", about: b.about ?? "", audience: b.audience ?? "", language: b.language ?? "",
    products: products.filter((p) => p.brand === d).map((p) => p.id),
    docs, strings,
    tokenOverrides: Object.entries(b.tokens ?? {}).map(([k, v]) => ({ key: k, value: v })),
    affected: components.filter((c) => c.tokens.used.some((t) => brandDependent.includes(t))).map((c) => c.name),
    problems: strings.filter((x) => !x.valid).map((x) => `формулировка ${x.key} — такого ключа в компонентах нет`),
  };
});
// ---------- шаблоны экранов ----------
const PAT = path.join(ROOT, "system/core/patterns");
const PAT_ORDER = ["list", "record", "form", "settings"];
const patterns = exists(PAT) ? fs.readdirSync(PAT).filter((f) => f.endsWith(".md") && f !== "README.md").sort((a, b) => ((PAT_ORDER.indexOf(a.replace(".md", "")) + 99) % 99) - ((PAT_ORDER.indexOf(b.replace(".md", "")) + 99) % 99) || a.localeCompare(b)).map((f) => {
  const src = read(path.join(PAT, f));
  const field = (k) => (new RegExp(`^\\*\\*${k}:\\*\\*\\s*(.+)$`, "m").exec(src) ?? [])[1]?.trim() ?? null;
  const section = (h) => { const m = new RegExp(`^## ${h}\\s*\\n([\\s\\S]*?)(?=\\n## |(?![\\s\\S]))`, "m").exec(src); return m ? m[1].trim() : ""; };
  const slug = f.replace(/\.md$/, "");
  return {
    slug, file: rel(path.join(PAT, f)), title: (/^#\s+(.+)$/m.exec(src) ?? [])[1] ?? slug,
    when: field("Когда"), example: field("Пример"),
    components: (field("Компоненты") ?? "").split(",").map((x) => x.trim()).filter(Boolean),
    steps: section("Как устроен").split("\n").filter((l) => /^\d+\./.test(l)).map((l) => l.replace(/^\d+\.\s*/, "")),
    dont: section("Не делай").split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2)),
    screens: screenOut.filter((x) => x.pattern === slug).map((x) => x.key),
  };
}) : [];
// Проблемы продукта (код 1 — правится в продукте) и системы (код 2 — правит владелец системы, агент останавливается)
const productSideProblems = [
  ...screenOut.filter((x) => !x.pattern).map((x) => `экран ${x.key}: не указан шаблон`),
  ...screenOut.filter((x) => x.pattern && !patterns.some((p) => p.slug === x.pattern)).map((x) => `экран ${x.key}: шаблона «${x.pattern}» нет`),
];
const systemSideProblems = [
  ...patterns.flatMap((p) => p.components.filter((n) => !byName[n]).map((n) => `шаблон ${p.slug}: компонента ${n} нет в системе`)),
  ...products.filter((p) => !brands.some((b) => b.id === p.brand)).map((p) => `продукт ${p.id}: бренда «${p.brand ?? ""}» нет в system/brands/`),
];
const patternProblems = [...productSideProblems, ...systemSideProblems];

const productsOut = products.map((p) => ({ id: p.id, name: p.name, brand: p.brand, url: p.url ?? null, description: p.description ?? "", dir: `apps/${p.dir}`, cover: p.cover ? `apps/${p.dir}/${p.cover}` : null, screens: screenOut.filter((x) => x.product === p.id).map((x) => x.key) }));

// ---------- запись ----------
const levels = { stable: 0, ready: 0, draft: 0 };
for (const c of components) levels[c.maturity.level]++;
const snapshot = {
  generated: today,
  about: "Снимок системы. Собран tools/snapshot/build.mjs из кода; руками не правится. Источник для витрины и для агента.",
  totals: {
    components: components.length, levels,
    contracts: components.filter((c) => c.contract).length,
    screens: screenOut.length,
    semanticTokens: resolved.semantic.length,
    brands: Object.keys(resolved.brands).length,
    tokenViolations: components.reduce((a, c) => a + c.tokens.violations.length, 0),
    openApi: components.filter((c) => c.api.shape !== "closed" || c.api.open.length || c.api.inlineStyles.length).map((c) => c.name),
  },
  lint: lint ? { date: lint.date, fresh: lint.fresh, frozen: lint.frozen, excepted: lint.excepted ?? 0, unknown: lint.unknown ?? 0 } : null,
  usageScan,
  components,
  brandDependentTokens: brandDependent,
  baseStrings,
  illustrationSlots: Object.fromEntries([...read(path.join(UI, "illustrations.ts")).matchAll(/^\s+"([a-z-]+)":\s*"([^"]+)"/gm)].map((m) => [m[1], m[2]])),
  brands,
  patterns,
  patternProblems,
  products: productsOut,
  screens: screenOut,
  tokenUse,
  candidates,
  history: history.slice(0, 50),
  productHistory: productHistory.slice(0, 50),
};
fs.writeFileSync(snapFile, JSON.stringify(snapshot, null, 2) + "\n");

const blind = usageScan.blind;
console.log(`Снимок ${today}: ${components.length} компонентов — стабильных ${levels.stable}, готовых ${levels.ready}, черновиков ${levels.draft}.`);
console.log(`Брендов ${brands.length}, продуктов ${productsOut.length}, экранов ${screenOut.length}; файлов продуктов разобрано ${usageScan.files}.`);
for (const b of brands) for (const pr of b.problems) console.log(`  ! бренд ${b.name}: ${pr}`);
console.log(`Шаблонов экранов ${patterns.length}.`);
for (const pr of patternProblems) console.log(`  ! ${pr}`);
console.log(`Не видно разбору: спред ${blind.spread.length}, псевдонимы ${blind.alias.length}, в комментариях ${blind.commented.length}, динамика ${blind.dynamic.length}.`);
console.log(`Нарушений токенов ${snapshot.totals.tokenViolations}; открытый API: ${snapshot.totals.openApi.join(", ") || "нет"}.`);
console.log(`Изменений с прошлого снимка: ${changes.length}.`);
if (lintStale) console.log(`  ! отчёт линтера устарел (линтер упал или код поменялся после него) — снимок его не взял: ступень «Нет нарушений» ждёт прогона.`);
process.exitCode = systemSideProblems.length ? 2 : productSideProblems.length || brands.some((b) => b.problems.length) ? 1 : 0;
