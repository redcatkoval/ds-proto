#!/usr/bin/env node
// Линтер контрактов: проверяет код продуктов (apps/*/src, где есть product.json) по правилам system/core/rules/*.json.
//
// Каждое правило держится за контракт якорем (номер правила + его текст дословно).
// Якорь не найден — правило не запускается, код выхода 2. Так же — если правило
// ссылается на свойство или значение, которого у компонента нет, или бренда продукта нет.
//
// Коды выхода:
//   0 — новых нарушений нет (долг из system/core/baseline.json допустим);
//   1 — есть новые нарушения;
//   2 — правило и контракт разошлись (или правило не с чем сверить), часть проверок не проводилась;
//   3 — линтер упал: отчёт не обновлён, снимок его не возьмёт.
//
// Что машина узнать не может (переменная, .map(), спред) — «не проверено», не «чисто».
//
//   node tools/lint/lint.mjs                    прогон
//   node tools/lint/lint.mjs --update-baseline  заморозить текущие нарушения как долг

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { colorLiterals, varRefs } from "../lib/css.mjs";
import { lintInputs } from "../lib/inputs.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RULES_DIR = path.join(ROOT, "system/core/rules");
const APPS = path.join(ROOT, "apps");
const SRCS = fs.readdirSync(APPS).filter((d) => fs.existsSync(path.join(APPS, d, "product.json"))).map((d) => path.join(APPS, d, "src"));
const BASELINE = path.join(ROOT, "system/core/baseline.json");
const REPORT = path.join(ROOT, "system/generated/lint-report.json");
const COMP_DIR = path.join(ROOT, "packages/ui/src/components");
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const read = (p) => fs.readFileSync(p, "utf8");
const norm = (s) => s.replace(/\s+/g, " ").trim();

// Упал — код 3, а прошлый отчёт помечается устаревшим: по нему нельзя судить о коде
process.on("uncaughtException", (e) => {
  console.error(`Линтер упал — инструмент, а не код экрана:\n${e?.stack ?? e}`);
  try { if (fs.existsSync(REPORT)) fs.writeFileSync(REPORT, JSON.stringify({ ...JSON.parse(read(REPORT)), inputs: null, crashed: true }, null, 2) + "\n"); } catch { /* отчёт не читается — снимок его и так не возьмёт */ }
  process.exit(3);
});

// ---------- имена и свойства компонентов системы ----------
const slugOf = {}; // имя → папка
for (const slug of fs.readdirSync(COMP_DIR)) {
  const m = path.join(COMP_DIR, slug, "meta.json");
  if (fs.existsSync(m)) slugOf[JSON.parse(read(m)).name] = slug;
}
const systemNames = new Set(Object.keys(slugOf));

// Свойства из типа <Имя>Props (литерал типа): { имя → { options | null, bool } }; не литерал — null
const propsCache = {};
function propsOf(name) {
  if (name in propsCache) return propsCache[name];
  const file = path.join(COMP_DIR, slugOf[name], `${name}.tsx`);
  let out = null;
  if (fs.existsSync(file)) {
    const sf = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    for (const st of sf.statements) {
      if (!ts.isTypeAliasDeclaration(st) || st.name.text !== `${name}Props` || !ts.isTypeLiteralNode(st.type)) continue;
      out = {};
      for (const m of st.type.members) {
        if (!ts.isPropertySignature(m) || !m.name) continue;
        const t = m.type;
        const lits = (x) => ts.isLiteralTypeNode(x) && ts.isStringLiteral(x.literal);
        const options = !t ? null : ts.isUnionTypeNode(t) && t.types.every(lits) ? t.types.map((x) => x.literal.text) : lits(t) ? [t.literal.text] : null;
        out[m.name.getText(sf)] = { options, bool: t?.kind === ts.SyntaxKind.BooleanKeyword };
      }
    }
  }
  return (propsCache[name] = out);
}

// Правило ссылается только на то, что у компонента есть: свойство, значение, соседей
function configProblem(component, r) {
  if (!systemNames.has(component)) return `компонента ${component} нет в системе`;
  const needs = [r.prop, ...Object.keys(r.where ?? {})].filter(Boolean);
  const props = needs.length ? propsOf(component) : {};
  if (!props) return `свойства ${component} не читаются (тип ${component}Props — не литерал) — правило не с чем сверить`;
  if (r.prop && !props[r.prop]) return `в правиле свойство ${r.prop}, а у ${component} такого нет`;
  for (const [k, v] of Object.entries(r.where ?? {})) {
    const p = props[k];
    if (!p) return `в условии правила свойство ${k}, а у ${component} такого нет`;
    if (p.options && !p.options.includes(v)) return `в условии правила ${k}=${JSON.stringify(v)}, а у ${component} значения только ${p.options.join(", ")}`;
    if (p.bool && typeof v !== "boolean") return `в условии правила ${k}=${JSON.stringify(v)}, а свойство ${k} — да/нет`;
  }
  for (const s of r.siblings ?? []) if (!systemNames.has(s)) return `в правиле сосед ${s}, а такого компонента нет`;
  return null;
}

// ---------- правила и якоря ----------
const ruleFiles = fs.readdirSync(RULES_DIR).filter((f) => f.endsWith(".json")).sort();
const rules = [];
const broken = [];
for (const f of ruleFiles) {
  const spec = JSON.parse(read(path.join(RULES_DIR, f)));
  const contractPath = path.join(ROOT, spec.contract);
  const contract = fs.existsSync(contractPath) ? read(contractPath) : null;
  for (const r of spec.rules) {
    const rule = { ...r, component: spec.component, contract: spec.contract, ruleFile: `system/core/rules/${f}` };
    let why = null;
    if (!contract) why = `контракта ${spec.contract} нет`;
    else {
      const head = new RegExp(`^###\\s+${r.anchor.section}\\.\\s`, "m").exec(contract);
      if (!head) why = `в контракте нет правила ${r.anchor.section}`;
      else {
        const rest = contract.slice(head.index + 1);
        const next = rest.search(/\n##/);
        const body = norm(next === -1 ? rest : rest.slice(0, next));
        if (!body.includes(norm(r.anchor.quote))) why = `в правиле ${r.anchor.section} нет текста «${r.anchor.quote}»`;
        else if (!/\*\*Кто следит:\*\*\s*машина/.test(body)) why = `у правила ${r.anchor.section} не написано «Кто следит: машина»`;
      }
    }
    why ??= configProblem(spec.component, r);
    if (why) broken.push({ rule: r.id, component: systemNames.has(spec.component) ? spec.component : null, why });
    else rules.push(rule);
  }
}

// ---------- разбор кода продукта ----------
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(f) && !/\.d\.ts$/.test(f)) out.push(p);
  }
  return out;
}

const UNKNOWN = Symbol("unknown");
function literal(expr) {
  if (!expr) return UNKNOWN;
  if (ts.isParenthesizedExpression(expr)) return literal(expr.expression);
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return expr.text;
  if (ts.isNumericLiteral(expr)) return Number(expr.text);
  if (expr.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (expr.kind === ts.SyntaxKind.FalseKeyword) return false;
  return UNKNOWN;
}

// Атрибуты элемента: { name → { value | UNKNOWN, node } }, плюс признак спреда
function attrsOf(opening) {
  const out = {}; let spread = false;
  for (const a of opening.attributes.properties) {
    if (ts.isJsxSpreadAttribute(a)) { spread = true; continue; }
    const name = a.name.getText();
    if (!a.initializer) out[name] = { value: true, node: a };
    else if (ts.isStringLiteral(a.initializer)) out[name] = { value: a.initializer.text, node: a };
    else if (ts.isJsxExpression(a.initializer)) out[name] = { value: literal(a.initializer.expression), expr: a.initializer.expression, node: a };
    else out[name] = { value: UNKNOWN, node: a };
  }
  return { attrs: out, spread };
}

function parseFile(file) {
  const text = read(file);
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const local = {}; // локальное имя → компонент системы
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || st.moduleSpecifier.text !== "@ds/ui") continue;
    const nb = st.importClause?.namedBindings;
    if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) {
      const orig = (el.propertyName ?? el.name).text;
      if (systemNames.has(orig)) local[el.name.text] = orig;
    }
  }
  const elements = []; // { component, node, opening, attrs, spread, parent }
  const visit = (node) => {
    let opening = null;
    if (ts.isJsxElement(node)) opening = node.openingElement;
    else if (ts.isJsxSelfClosingElement(node)) opening = node;
    if (opening) {
      const tag = opening.tagName.getText();
      if (local[tag]) elements.push({ component: local[tag], node, opening, ...attrsOf(opening) });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { file, rel: rel(file), sf, text, elements, local };
}

// Соседи: элементы-дети того же JSX-родителя. Условные `{a && <X/>}` и `{a ? <X/> : <Y/>}` считаются,
// `.map()` и прочие выражения делают состав ряда неизвестным.
function jsxParent(node) {
  let p = node.parent;
  while (p && (ts.isJsxExpression(p) || ts.isParenthesizedExpression(p) || ts.isBinaryExpression(p) || ts.isConditionalExpression(p))) p = p.parent;
  return p && (ts.isJsxElement(p) || ts.isJsxFragment(p)) ? p : null;
}
function rowOf(node, file) {
  const parent = jsxParent(node);
  if (!parent) return null;
  const items = []; let dynamic = false;
  const take = (e) => {
    if (!e) return;
    if (ts.isParenthesizedExpression(e)) return take(e.expression);
    if (ts.isJsxElement(e) || ts.isJsxSelfClosingElement(e)) { items.push(e); return; }
    if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return take(e.right);
    if (ts.isConditionalExpression(e)) { take(e.whenTrue); take(e.whenFalse); return; }
    if (ts.isStringLiteral(e) || literal(e) !== UNKNOWN) return;
    dynamic = true;
  };
  for (const ch of parent.children) {
    if (ts.isJsxText(ch)) continue;
    if (ts.isJsxExpression(ch)) take(ch.expression);
    else take(ch);
  }
  const tagOf = (n) => (ts.isJsxElement(n) ? n.openingElement : n).tagName.getText();
  return { parent, items: items.map((n) => ({ node: n, component: file.local[tagOf(n)] ?? null })), dynamic };
}

function arrayProp(el, prop) {
  const a = el.attrs[prop];
  if (!a) return { missing: true };
  const e = a.expr;
  if (!e || !ts.isArrayLiteralExpression(e)) return { unknown: "массив передан не литералом — число элементов узнаётся при отрисовке" };
  if (e.elements.some((x) => ts.isSpreadElement(x))) return { unknown: "в массиве спред" };
  return { items: e.elements };
}

const matches = (el, where) => !where || Object.entries(where).every(([k, v]) => el.attrs[k]?.value === v);
const whereUnknown = (el, where) => where && (el.spread || Object.keys(where).some((k) => el.attrs[k]?.value === UNKNOWN));

// ---------- проверки ----------
const findings = []; // { rule, component, file, line, message, snippet }
const unknown = [];
const lineOf = (f, node) => f.sf.getLineAndCharacterOfPosition(node.getStart(f.sf)).line + 1;
const snippet = (f, node) => norm(node.getText(f.sf)).slice(0, 160);

const files = SRCS.flatMap((d) => walk(d)).map(parseFile);
for (const f of files) {
  for (const rule of rules) {
    const mine = f.elements.filter((e) => e.component === rule.component);
    if (!mine.length) continue;
    const hit = (node, extra) => findings.push({ rule: rule.id, component: rule.component, file: f.rel, line: lineOf(f, node), message: rule.message + (extra ? ` (${extra})` : ""), snippet: snippet(f, node) });
    const dunno = (node, why) => unknown.push({ rule: rule.id, component: rule.component, file: f.rel, line: lineOf(f, node), why });

    switch (rule.kind) {
      case "max-per-parent": {
        const seen = new Set();
        for (const el of mine) {
          const row = rowOf(el.node, f);
          if (!row || seen.has(row.parent)) continue;
          seen.add(row.parent);
          const same = row.items.filter((i) => i.component === rule.component).map((i) => mine.find((m) => m.node === i.node));
          const n = same.filter((m) => m && matches(m, rule.where)).length;
          const shaky = same.some((m) => m && whereUnknown(m, rule.where));
          if (n > rule.max) hit(row.parent, `${n} при пределе ${rule.max}`);
          else if (row.dynamic || shaky) dunno(row.parent, row.dynamic ? "в ряду есть элементы из выражения (.map() или переменная)" : "значение свойства не литерал или есть спред");
        }
        break;
      }
      case "max-per-file": {
        if (mine.length > rule.max) hit(mine[rule.max].node, `${mine.length} при пределе ${rule.max}`);
        break;
      }
      case "order-last": {
        for (const el of mine.filter((m) => matches(m, rule.where))) {
          const row = rowOf(el.node, f);
          if (!row) continue;
          const same = row.items.filter((i) => i.component === rule.component);
          if (same[same.length - 1]?.node !== el.node) hit(el.node);
          else if (row.dynamic) dunno(el.node, "в ряду есть элементы из выражения");
        }
        break;
      }
      case "forbidden-sibling": {
        for (const el of mine) {
          const row = rowOf(el.node, f);
          if (!row) continue;
          const bad = row.items.filter((i) => rule.siblings.includes(i.component));
          if (bad.length) hit(el.node, `рядом ${[...new Set(bad.map((b) => b.component))].join(", ")}`);
        }
        break;
      }
      case "attr-nonempty": {
        for (const el of mine) {
          const a = el.attrs[rule.prop];
          if (!a) { if (el.spread) dunno(el.node, "свойство может прийти через спред"); else hit(el.node, "свойства нет"); continue; }
          if (a.value === UNKNOWN) { dunno(el.node, "подпись — выражение, её значение узнаётся при отрисовке"); continue; }
          if (typeof a.value !== "string" || !a.value.trim()) hit(el.node);
        }
        break;
      }
      case "min-items":
      case "max-items": {
        for (const el of mine) {
          const r = arrayProp(el, rule.prop);
          if (r.missing) continue;
          if (r.unknown) { dunno(el.node, r.unknown); continue; }
          const n = r.items.length;
          if (rule.kind === "min-items" && n < rule.min) hit(el.node, `${n} при минимуме ${rule.min}`);
          if (rule.kind === "max-items" && n > rule.max) hit(el.node, `${n} при пределе ${rule.max}`);
        }
        break;
      }
      case "destructive-last": {
        for (const el of mine) {
          const r = arrayProp(el, rule.prop);
          if (r.missing) continue;
          if (r.unknown) { dunno(el.node, r.unknown); continue; }
          const flags = r.items.map((x) => {
            if (!ts.isObjectLiteralExpression(x)) return UNKNOWN;
            const p = x.properties.find((pp) => ts.isPropertyAssignment(pp) && pp.name.getText() === "destructive");
            if (x.properties.some((pp) => ts.isSpreadAssignment(pp))) return UNKNOWN;
            return p ? literal(p.initializer) : false;
          });
          if (flags.includes(UNKNOWN)) { dunno(el.node, "признак destructive не литерал"); continue; }
          const firstD = flags.indexOf(true);
          if (firstD !== -1 && flags.slice(firstD).includes(false)) hit(el.node);
        }
        break;
      }
      default:
        broken.push({ rule: rule.id, component: rule.component, why: `неизвестный вид правила ${rule.kind}` });
    }
  }
}

// ---------- правила кода: общие, бренда, продукта ----------
// Не про компоненты, а про код продукта: голые элементы, цвета числом, слова не из словаря.
// Уровни: system/core/code-rules.json — для всех; system/brands/<id>/rules.json — для продуктов бренда;
// apps/<продукт>/rules.json — только для этого продукта. Кто добавил правило — в нём же.
const tokensJson = JSON.parse(read(path.join(ROOT, "system/generated/tokens.json")));
const knownVars = new Set([
  ...tokensJson.semantic.map((t) => t.cssVar),
  ...Object.keys(tokensJson.primitives.space).map((k) => `--space-${k}`),
  ...Object.keys(tokensJson.primitives.font.size).map((k) => `--font-size-${k}`),
  ...Object.keys(tokensJson.primitives.font.weight).map((k) => `--font-weight-${k}`),
]);
const products = fs.readdirSync(APPS).filter((d) => fs.existsSync(path.join(APPS, d, "product.json")))
  .map((d) => ({ dir: d, ...JSON.parse(read(path.join(APPS, d, "product.json"))) }));
const productOf = (relFile) => products.find((p) => relFile.startsWith(`apps/${p.dir}/`))?.id ?? null;
// бренд продукта должен существовать: иначе правила бренда молча не применятся
for (const p of products) {
  if (!p.brand || !fs.existsSync(path.join(ROOT, "system/brands", p.brand, "brand.json")))
    broken.push({ rule: "product.brand", component: null, product: p.id, why: `продукт ${p.name}: бренда «${p.brand ?? ""}» нет (нет system/brands/${p.brand ?? "?"}/brand.json) — правила бренда не проверялись; поправьте поле brand в apps/${p.dir}/product.json` });
}
const loadRules = (file, level, scope) => fs.existsSync(file)
  ? JSON.parse(read(file)).rules.map((r) => ({ ...r, level, scope, file: rel(file) })) : [];
const codeRules = [...loadRules(path.join(ROOT, "system/core/code-rules.json"), "core", "все продукты")];
for (const p of products) {
  codeRules.push(...loadRules(path.join(ROOT, "system/brands", p.brand ?? "", "rules.json"), "brand", `продукты бренда ${p.brand}`).filter((r) => !codeRules.some((x) => x.id === r.id)));
  codeRules.push(...loadRules(path.join(APPS, p.dir, "rules.json"), "product", p.name));
}
const appliesTo = (r, prod) => r.level === "core" || (r.level === "brand" && r.file.startsWith(`system/brands/${prod.brand}/`)) || (r.level === "product" && r.file.startsWith(`apps/${prod.dir}/`));
const ignored = (r, relFile, prod) => (r.ignore ?? []).some((g) => relFile.startsWith(`apps/${prod.dir}/${g}`));

// Тексты, которые видит пользователь: текст в разметке и строки в коде (.tsx и .ts — данные тоже),
// кроме того, что текстом не бывает: пути импорта, типы, ключи, сравнения, служебные свойства
// (className, href, icon…) и строки-идентификаторы без пробелов и заглавных («users», «#/orders»).
// Подстановка ${…} в шаблонной строке читается как «0»: так «$${n}» — это цена.
const NOT_TEXT = new Set(["className", "class", "href", "id", "key", "htmlFor", "type", "src", "srcSet", "role", "to", "path", "rel", "target", "lang", "dir",
  "icon", "illustration", "variant", "color", "size", "align", "tone", "pattern", "slug", "route", "file", "handle", "sku", "email"]);
const CODE_METHODS = new Set(["replace", "replaceAll", "split", "join", "startsWith", "endsWith", "indexOf", "lastIndexOf", "padStart", "padEnd", "toLocaleString", "toLocaleDateString",
  "getItem", "setItem", "removeItem", "get", "set", "has", "getAttribute", "setAttribute", "querySelector", "querySelectorAll", "closest", "matches", "getElementById",
  "addEventListener", "removeEventListener", "matchMedia", "glob"]);
const nameText = (n) => (ts.isIdentifier(n) || ts.isStringLiteral(n) || ts.isPrivateIdentifier(n) ? n.text : n.getText());
function textOwner(node) {
  // поднимаемся через выражения, которые передают строку дальше, до атрибута или свойства объекта
  let n = node, p = node.parent;
  while (p) {
    if (ts.isBinaryExpression(p)) {
      const op = p.operatorToken.kind;
      if ([ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.InKeyword].includes(op)) return { skip: true };
      if (![ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.PlusToken].includes(op)) return {};
    } else if (ts.isConditionalExpression(p)) { if (p.condition === n) return {}; }
    else if (!(ts.isParenthesizedExpression(p) || ts.isJsxExpression(p) || ts.isAsExpression(p) || ts.isSatisfiesExpression(p) || ts.isArrayLiteralExpression(p) || ts.isTemplateSpan(p) || ts.isTemplateExpression(p))) break;
    n = p; p = p.parent;
  }
  if (!p) return {};
  if (ts.isJsxAttribute(p)) return { name: p.name.getText() };
  if (ts.isPropertyAssignment(p) && p.initializer === n) return { name: nameText(p.name) };
  if (ts.isCaseClause(p) && p.expression === n) return { skip: true };
  return {};
}
function isTextLiteralPlace(node) {
  const p = node.parent;
  if (!p) return false;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p) || ts.isLiteralTypeNode(p) || ts.isImportTypeNode?.(p)) return false;
  if (ts.isCallExpression(p) && (p.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(p.expression) && p.expression.text === "require"))) return false;
  // аргументы служебных методов — код, а не текст: шаблон замены "$1-$2", разделитель, ключ, селектор
  if (ts.isCallExpression(p) && ts.isPropertyAccessExpression(p.expression) && CODE_METHODS.has(p.expression.name.text) && p.arguments.includes(node)) return false;
  if ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p) || ts.isPropertyDeclaration(p) || ts.isMethodDeclaration(p) || ts.isEnumMember(p) || ts.isPropertyAccessExpression(p)) && p.name === node) return false;
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return false;
  if (ts.isJsxAttribute(p) && p.name === node) return false;
  return true;
}
const IDENT = /^[a-z0-9_.:/#?=&@*+%-]*$/;
function userTexts(f) {
  const out = [];
  const add = (node, text) => { if (text && text.trim()) out.push({ node, text: text.trim() }); };
  const visit = (node) => {
    if (ts.isJsxText(node)) { add(node, node.text); return; }
    const isStr = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
    if ((isStr || ts.isTemplateExpression(node)) && isTextLiteralPlace(node)) {
      const owner = textOwner(node);
      const name = owner.name ?? "";
      if (!owner.skip && !NOT_TEXT.has(name) && !/^(data-|on[A-Z])/.test(name)) {
        const text = isStr ? node.text : node.head.text + node.templateSpans.map((sp) => "0" + sp.literal.text).join("");
        if (!IDENT.test(text)) add(node, text);
      }
    }
    if (ts.isTypeNode(node) && !ts.isExpressionWithTypeArguments(node)) return; // в типах текстов нет
    ts.forEachChild(node, visit);
  };
  visit(f.sf);
  return out;
}

// Экраны: файл в src/screens/ ⇔ строка в product.json ⇔ маршрут в точке входа
function screenRegistry(r, prod, hit) {
  const base = path.join(APPS, prod.dir);
  const relP = (p) => path.relative(base, p).split(path.sep).join("/");
  const pj = `apps/${prod.dir}/product.json`;
  const pjText = read(path.join(base, "product.json"));
  const pjLine = (needle) => { const i = pjText.indexOf(needle); return i === -1 ? 1 : pjText.slice(0, i).split("\n").length; };
  const listed = prod.screens ?? [];
  const screensDir = path.join(base, r.path);
  const screenFiles = walk(screensDir).map(relP);
  for (const sc of listed) {
    if (!sc.file || !fs.existsSync(path.join(base, sc.file))) hit(r, pj, pjLine(`"slug": "${sc.slug}"`), `${r.message}: экран ${sc.slug} ссылается на ${sc.file ?? "—"}, а такого файла нет`, `missing|${sc.slug}|${sc.file}`);
  }
  for (const f of screenFiles) {
    if (!listed.some((sc) => path.posix.normalize(sc.file ?? "") === f)) hit(r, `apps/${prod.dir}/${f}`, 1, `${r.message}: файла экрана нет в product.json — добавьте строку в screens`, `unlisted|${f}`);
  }
  const entry = path.join(base, r.entry);
  if (!fs.existsSync(entry)) { hit(r, pj, 1, `${r.message}: точки входа ${r.entry} нет`, `no-entry|${r.entry}`); return; }
  const sf = ts.createSourceFile(entry, read(entry), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const fileOf = {}; // локальное имя → файл экрана относительно продукта
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.moduleSpecifier.text.startsWith(".")) continue;
    const b = path.resolve(path.dirname(entry), st.moduleSpecifier.text);
    const target = [b, b + ".tsx", b + ".ts", path.join(b, "index.tsx")].find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
    const nb = st.importClause?.namedBindings;
    const names = [st.importClause?.name?.text, ...(nb && ts.isNamedImports(nb) ? nb.elements.map((e) => e.name.text) : [])].filter(Boolean);
    if (target) for (const n of names) fileOf[n] = relP(target);
  }
  const routes = []; // { path, file }
  const visit = (node) => {
    const op = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
    if (op && op.tagName.getText() === "Route") {
      const attr = (n) => op.attributes.properties.find((a) => ts.isJsxAttribute(a) && a.name.getText() === n);
      const p = attr("path")?.initializer;
      const el = attr("element")?.initializer;
      const e = el && ts.isJsxExpression(el) ? el.expression : null;
      const tag = e && (ts.isJsxSelfClosingElement(e) ? e.tagName.getText() : ts.isJsxElement(e) ? e.openingElement.tagName.getText() : null);
      if (tag && fileOf[tag]) routes.push({ path: p && ts.isStringLiteral(p) ? p.text : null, file: fileOf[tag] });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  const entryRel = `apps/${prod.dir}/${r.entry}`;
  for (const sc of listed) {
    if (!sc.file || !fs.existsSync(path.join(base, sc.file))) continue;
    const mine = routes.filter((x) => x.file === path.posix.normalize(sc.file));
    if (!mine.length) { hit(r, entryRel, 1, `${r.message}: у экрана ${sc.slug} (${sc.file}) нет маршрута в ${r.entry}`, `no-route|${sc.slug}`); continue; }
    if (sc.route) {
      const want = sc.route.replace(/^#/, "");
      const ok = mine.some((x) => x.path && new RegExp(`^${x.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/:[A-Za-z_]+/g, "[^/]+")}$`).test(want));
      if (!ok) hit(r, pj, pjLine(`"slug": "${sc.slug}"`), `${r.message}: адрес ${sc.route} экрана ${sc.slug} не совпадает с маршрутом ${mine.map((x) => x.path).join(", ")} в ${r.entry}`, `route|${sc.slug}`);
    }
  }
}
// словарь бренда: колонка «не пишем» → запрещённое слово, колонка «слово» → чем заменить
function glossary(file) {
  const src = read(path.join(ROOT, file));
  const out = [];
  for (const line of src.split("\n")) {
    if (!line.startsWith("|") || /^\|[\s|:-]+\|$/.test(line.trim())) continue;
    const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());
    if (cells.length < 3 || cells[0] === "слово") continue;
    for (const w of cells[2].split(",").map((x) => x.trim()).filter((x) => x && x !== "—")) out.push({ word: w, use: cells[0] });
  }
  return out;
}
const codeFindings = [];
const walkAll = (dir, ext, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walkAll(p, ext, out); else if (ext.test(f)) out.push(p);
  }
  return out;
};
for (const prod of products) {
  const rulesHere = codeRules.filter((r) => appliesTo(r, prod));
  const tsxFiles = files.filter((f) => f.rel.startsWith(`apps/${prod.dir}/`));
  const cssFiles = walkAll(path.join(APPS, prod.dir, "src"), /\.css$/);
  const hit = (r, relFile, line, message, snip) => codeFindings.push({ rule: r.id, level: r.level, component: null, product: prod.id, file: relFile, line, message, snippet: snip });
  for (const r of rulesHere) {
    if (r.kind === "no-raw-elements") {
      for (const f of tsxFiles) {
        if (ignored(r, f.rel, prod)) continue;
        const visit = (node) => {
          const op = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
          const tag = op?.tagName.getText();
          if (tag && r.elements[tag]) hit(r, f.rel, lineOf(f, node), `${r.message}: <${tag}> — возьмите ${r.elements[tag]}`, snippet(f, op));
          ts.forEachChild(node, visit);
        };
        visit(f.sf);
      }
    } else if (r.kind === "no-inline-style") {
      for (const f of tsxFiles) {
        if (ignored(r, f.rel, prod)) continue;
        const visit = (node) => {
          if (ts.isJsxAttribute(node) && node.name.getText() === "style") hit(r, f.rel, lineOf(f, node), r.message, snippet(f, node));
          ts.forEachChild(node, visit);
        };
        visit(f.sf);
      }
    } else if (r.kind === "max-lines") {
      for (const f of tsxFiles) {
        if (!f.rel.startsWith(`apps/${prod.dir}/${r.path}`)) continue;
        const n = f.text.split("\n").length;
        if (n > r.max) hit(r, f.rel, 1, `${r.message} (${n} строк при пределе ${r.max})`, `lines:${f.rel}`);
      }
    } else if (r.kind === "css-tokens") {
      for (const file of cssFiles) {
        const relFile = rel(file);
        if (ignored(r, relFile, prod)) continue;
        const src = read(file).replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
        const lineAt = (i) => src.slice(0, i).split("\n").length;
        // отпечаток — без номера строки: долг не «оживает», когда выше добавили строку
        for (const m of colorLiterals(src)) hit(r, relFile, lineAt(m.index), `${r.message}: цвет числом или именем ${m.text}`, `color|${m.text}`);
        for (const m of varRefs(src)) if (!knownVars.has(m.name)) hit(r, relFile, lineAt(m.index), `${r.message}: токена ${m.name} нет в системе`, `var|${m.name}`);
      }
    } else if (r.kind === "glossary") {
      const source = r.source.startsWith("system/") ? r.source : `system/brands/${prod.brand}/${r.source}`;
      if (!fs.existsSync(path.join(ROOT, source))) { broken.push({ rule: r.id, component: null, product: prod.id, why: `словаря ${source} нет — слова не проверялись` }); continue; }
      const words = glossary(source);
      for (const f of tsxFiles) {
        if (ignored(r, f.rel, prod)) continue;
        for (const t of userTexts(f)) for (const w of words) {
          if (new RegExp(`(^|[^\\p{L}])${w.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(s|es)?(?![\\p{L}])`, "iu").test(t.text))
            hit(r, f.rel, lineOf(f, t.node), `«${w.word}» не из словаря бренда — пишем «${w.use}»`, `${w.word}|${t.text}`);
        }
      }
    } else if (r.kind === "forbidden-text") {
      const re = new RegExp(r.pattern, "u");
      for (const f of tsxFiles) {
        if (ignored(r, f.rel, prod)) continue;
        for (const t of userTexts(f)) if (re.test(t.text)) hit(r, f.rel, lineOf(f, t.node), r.message, t.text);
      }
    } else if (r.kind === "screen-registry") {
      screenRegistry(r, prod, hit);
    } else broken.push({ rule: r.id, component: null, why: `неизвестный вид правила ${r.kind}` });
  }
}
findings.push(...codeFindings);
for (const x of findings) x.product ??= productOf(x.file);
for (const u of unknown) u.product ??= productOf(u.file);

// ---------- долг ----------
// Отпечаток не зависит от номера строки: правило + файл + текст элемента (+ порядковый номер для одинаковых)
const counter = {};
for (const x of findings) {
  const base = `${x.rule}|${x.file}|${x.snippet}`;
  counter[base] = (counter[base] ?? 0) + 1;
  x.fingerprint = crypto.createHash("sha1").update(`${base}|${counter[base]}`).digest("hex").slice(0, 12);
}
const baseline = fs.existsSync(BASELINE) ? JSON.parse(read(BASELINE)) : { about: "", items: [] };
if (process.argv.includes("--update-baseline")) {
  baseline.about = "Замороженные нарушения: долг, который знают и разрешают. Новое нарушение сюда не попадает само — только через --update-baseline, то есть решением человека.";
  baseline.items = findings.map(({ fingerprint, rule, file, line, message }) => ({ fingerprint, rule, file, line, message, since: new Date().toISOString().slice(0, 10) }));
  fs.writeFileSync(BASELINE, JSON.stringify(baseline, null, 2) + "\n");
}
const frozenSet = new Set(baseline.items.map((i) => i.fingerprint));
for (const x of findings) x.state = frozenSet.has(x.fingerprint) ? "frozen" : "fresh";
const stale = baseline.items.filter((i) => !findings.some((x) => x.fingerprint === i.fingerprint));

// ---------- отчёт ----------
const perComp = {};
for (const n of systemNames) perComp[n] = { rules: 0, fresh: 0, frozen: 0, unknown: 0, broken: 0 };
for (const r of rules) perComp[r.component].rules++;
for (const b of broken) if (perComp[b.component]) perComp[b.component].broken++;
for (const x of findings) if (perComp[x.component]) perComp[x.component][x.state]++;
for (const u of unknown) if (perComp[u.component]) perComp[u.component].unknown++;

const fresh = findings.filter((x) => x.state === "fresh").length;
const frozen = findings.length - fresh;
const report = {
  date: new Date().toISOString().slice(0, 10),
  about: "Отчёт линтера контрактов. Пишется tools/lint/lint.mjs; руками не правится.",
  scope: SRCS.map((d) => path.relative(ROOT, d)),
  files: files.length,
  rulesRun: rules.length,
  fresh, frozen, unknown: unknown.length, excepted: 0,
  anchorsBroken: broken,
  staleBaseline: stale,
  rules: rules.map((r) => ({ id: r.id, component: r.component, kind: r.kind, anchor: r.anchor, contract: r.contract })),
  codeRules: codeRules.map(({ id, level, scope, file, kind, title, why, addedBy, since, message }) => ({ id, level, scope, file, kind, title, why, addedBy, since, message })),
  findings, notChecked: unknown,
  components: perComp,
  // отпечаток входов: снимок сверяет его и не берёт отчёт, если код поменялся после линтера
  inputs: lintInputs(ROOT),
};
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n");

console.log(`Линтер: ${files.length} файлов, правил компонентов ${rules.length}, правил кода ${codeRules.length}. Новых нарушений ${fresh}, в долге ${frozen}, не проверено ${unknown.length}.`);
for (const x of findings.filter((y) => y.state === "fresh")) console.log(`  ✗ ${x.file}:${x.line}  ${x.rule}  ${x.message}`);
for (const x of findings.filter((y) => y.state === "frozen")) console.log(`  · ${x.file}:${x.line}  ${x.rule}  долг: ${x.message}`);
if (stale.length) console.log(`  Долг погашен, но всё ещё в baseline: ${stale.map((s) => s.rule).join(", ")} — уберите через --update-baseline.`);
if (broken.length) {
  console.log("Не проверялось — правило и контракт разошлись или правило не с чем сверить:");
  for (const b of broken) console.log(`  ? ${b.rule}: ${b.why}`);
  process.exit(2);
}
process.exit(fresh ? 1 : 0);
