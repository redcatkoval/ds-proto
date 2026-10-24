#!/usr/bin/env node
// Полная проверка: токены → типы → линтер → снимок → пакеты брендов.
// Снимок собирается всегда, даже если нашлись нарушения:
// так уровень зрелости падает сразу, а не после починки.
// Код выхода — худший из шагов: 0 — чисто, 1 — есть что исправить, 2 — правило и контракт разошлись
// (или система не сходится сама с собой), 3 — инструмент упал: результатам этого прогона верить нельзя.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// процесс убит сигналом — тоже сбой инструмента
const run = (script, ...args) => spawnSync(process.execPath, [path.join(ROOT, script), ...args], { stdio: "inherit" }).status ?? 3;

const tokens = run("tools/tokens/build.mjs");
if (tokens !== 0) {
  if (tokens === 3) console.log("\nИнструмент упал (код 3): токены не собраны — скажите человеку.");
  process.exit(tokens);
}

// Типы: выдуманное свойство, компонент или иконка — ошибка здесь, а не в браузере.
// Проверяются пакет компонентов и все приложения с tsconfig.json — продукты и витрина.
const TSC = path.join(ROOT, "node_modules/typescript/bin/tsc");
// Витрина читает снимок, поэтому её типы проверяются после снимка: на чистой копии снимка ещё нет.
const apps = fs.readdirSync(path.join(ROOT, "apps")).sort().filter((d) => fs.existsSync(path.join(ROOT, "apps", d, "tsconfig.json"))).map((d) => `apps/${d}`);
const readsSnapshot = (p) => fs.readdirSync(path.join(ROOT, p, "src"), { recursive: true }).some((f) => /\.tsx?$/.test(f) && fs.readFileSync(path.join(ROOT, p, "src", f), "utf8").includes("system/generated/snapshot.json"));
const early = ["packages/ui", ...apps.filter((p) => !readsSnapshot(p))];
const late = apps.filter((p) => !early.includes(p));
const typecheck = { date: new Date().toISOString().slice(0, 10), projects: [] };
const tsc = (list) => {
  for (const p of list) {
    const r = spawnSync(process.execPath, [TSC, "-p", path.join(ROOT, p), "--pretty", "false"], { encoding: "utf8" });
    const errors = (r.stdout + r.stderr).split("\n").filter((l) => /error TS\d+/.test(l)).map((l) => l.replace(ROOT + path.sep, ""));
    typecheck.projects.push({ project: p, ok: r.status === 0, errors });
  }
  fs.mkdirSync(path.join(ROOT, "system/generated"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "system/generated/typecheck.json"), JSON.stringify(typecheck, null, 2) + "\n");
};
tsc(early);

const lint = run("tools/lint/lint.mjs");
const snap = run("tools/snapshot/build.mjs");
const exp = run("tools/export/agent.mjs");
tsc(late);
const typeErrors = typecheck.projects.flatMap((p) => p.errors);
console.log(typeErrors.length ? `Типы: ошибок ${typeErrors.length}` : `Типы: без ошибок (${[...early, ...late].join(", ")}).`);
for (const e of typeErrors.slice(0, 20)) console.log(`  ✗ ${e}`);
const steps = { линтер: lint, снимок: snap, пакеты: exp };
const crashed = Object.entries(steps).filter(([, c]) => c === 3).map(([n]) => n);
const code = Math.max(lint, snap, exp, typeErrors.length ? 1 : 0);
console.log(code === 0 ? "\nПроверка пройдена."
  : code >= 3 ? `\nИнструмент упал (код 3): ${crashed.join(", ") || "один из шагов"}. Это не ошибка в коде экрана — остановитесь и скажите человеку.`
  : code === 2 ? "\nЧасть правил не проверялась: контракт и правило разошлись или система не сходится (код 2)."
  : "\nЕсть что исправить (код 1).");
process.exit(Math.min(code, 3));
