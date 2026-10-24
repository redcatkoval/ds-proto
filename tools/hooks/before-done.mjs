#!/usr/bin/env node
// Stop: агент хочет закончить. Если он что-то менял — полная проверка.
// Код 1 — «ещё не готово», агент продолжает. Код 2/3 — остановиться и сказать человеку.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fingerprint, readInput, rootOf, state } from "./lib.mjs";

const input = readInput();
const root = rootOf(input);
const s = state(input.session_id);
const st = s.read();
const now = fingerprint(root);
if (st.clean === now) process.exit(0); // ничего не менял — проверять нечего

const out = (o) => { process.stdout.write(JSON.stringify(o)); process.exit(0); };
const r = spawnSync(process.execPath, [path.join(root, "tools/check.mjs")], { cwd: root, encoding: "utf8" });
const code = r.status ?? 3;
const tail = (r.stdout + r.stderr).split("\n").filter((l) => /✗|\?|упал|код|Типы|Линтер|Снимок/.test(l)).slice(-25).join("\n");

if (code === 0) { s.write({ ...st, clean: fingerprint(root), blocks: 0, stopped: false }); out({ systemMessage: "npm run check: проверка пройдена (код 0)." }); }

if (code === 1) {
  const blocks = (st.blocks || 0) + 1;
  s.write({ ...st, blocks });
  if (blocks > 3) out({ systemMessage: `npm run check всё ещё красный (код 1) после трёх попыток агента. Посмотри сам:\n${tail}` });
  out({ decision: "block", reason: `Ещё не готово: npm run check вернул код 1.\n${tail}\nИсправь код экрана. Не трогай baseline.json и правила. Потом снова закончи — проверка запустится сама.` });
}

// 2 или 3: агент не чинит, а объясняет человеку. Один раз — чтобы не крутиться.
if (st.stopped) out({ systemMessage: `npm run check: код ${code}. Нужен человек.\n${tail}` });
s.write({ ...st, stopped: true });
out({ decision: "block", reason: `npm run check вернул код ${code}: ${code === 2 ? "контракт и правило разошлись или система не сходится сама с собой" : "упал инструмент проверки"}. Это не чинится кодом экрана. Ничего не исправляй — коротко напиши человеку, что случилось, и остановись.\n${tail}` });
