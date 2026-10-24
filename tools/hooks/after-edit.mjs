#!/usr/bin/env node
// PostToolUse: после каждой правки файла продукта — линтер. Нарушения в этом файле агент видит сразу.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { readInput, rel, rootOf } from "./lib.mjs";

const input = readInput();
const root = rootOf(input);
const t = input.tool_input || {};
// Правка инструментом Edit/Write — знаем файл. Команда в терминале, которая пишет в продукт
// (cat > …, tee, sed -i, python …) — файл не знаем, показываем все новые нарушения продуктов.
const bash = input.tool_name === "Bash";
const cmd = String(t.command || "");
const file = bash ? "" : rel(root, t.file_path || t.notebook_path);
if (bash) {
  const writes = /(>|\btee\b|\bsed\s+(-\w*\s+)*-i|\bperl\s+-\w*i|\bmv\b|\bcp\b|writeFile|write_text|open\([^)]*['"]w)/.test(cmd);
  if (!writes || !/apps\/|src\/|product\.json/.test(cmd + " " + (input.cwd || ""))) process.exit(0);
} else if (!file.startsWith("apps/") || file.startsWith("apps/docs/") || !/\.(tsx?|css|json)$/.test(file)) process.exit(0);

const r = spawnSync(process.execPath, [path.join(root, "tools/lint/lint.mjs")], { cwd: root, encoding: "utf8" });
if (r.status === 3) { process.stderr.write(`Линтер упал (код 3) — это не ошибка в твоём коде. Скажи человеку.\n${(r.stdout + r.stderr).slice(-1500)}`); process.exit(2); }

let report;
try { report = JSON.parse(fs.readFileSync(path.join(root, "system/generated/lint-report.json"), "utf8")); } catch { process.exit(0); }
// product.json и маршруты сверяются целиком по продукту — показываем и их
const product = file.split("/").slice(0, 2).join("/");
const mine = report.findings.filter((x) => x.state === "fresh" && x.file.startsWith("apps/") && (bash || x.file === file || (/product\.json$|main\.tsx$|screens-registered/.test(x.file + x.rule) && x.file.startsWith(product))));
if (!mine.length) process.exit(0);
process.stderr.write([
  `Проверка нашла ${mine.length} нарушени${mine.length === 1 ? "е" : "я"} после правки ${file || "через терминал"}:`,
  ...mine.map((x) => `  ${x.file}:${x.line}  ${x.message}  [${x.rule}]`),
  "Исправь сейчас. Не добавляй это в baseline.json и не правь правила — если правило мешает сделать то, что просил человек, скажи ему.",
].join("\n"));
process.exit(2);
