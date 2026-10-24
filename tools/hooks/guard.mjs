#!/usr/bin/env node
// PreToolUse: замок. Что закрыто, зависит от роли, с которой человек запустил Claude Code (см. roles.mjs).
// Просьба в чате и режим без подтверждений роль не меняют.
import { readInput, rel, rootOf } from "./lib.mjs";
import { lockOf, refusal, roleOf, spotRe, spots } from "./roles.mjs";

const input = readInput();
const root = rootOf(input);
const role = roleOf(root);
const t = input.tool_input || {};
const deny = (reason) => {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
  process.exit(0);
};

if (input.tool_name === "Bash") {
  const cmd = String(t.command || "");
  if (/--update-baseline/.test(cmd)) deny(`Заморозить нарушения как долг может только человек: флаг --update-baseline закрыт для всех ролей. Текущая роль: ${role.title}. Исправь код или скажи человеку, что не получается.`);
  const probe = (p) => (p.endsWith("/") ? `${p}x` : p);
  const LOCKED = spots(root).filter((p) => lockOf(root, probe(p), role));
  // перенаправление вывода считается записью, только если ведёт в закрытый путь (2>/dev/null — нет)
  const redirect = LOCKED.find((p) => new RegExp(`>>?\\s*["']?(\\./)?${spotRe(p).source}`).test(cmd));
  const writer = /(\btee\b|\bsed\s+(-\w*\s+)*-i|\bperl\s+-\w*i|\bmv\b|\bcp\b|\brm\b|\btruncate\b|writeFile|write_text|open\([^)]*['"][wa]['"]|\bgit\s+(checkout|restore)\b)/.test(cmd);
  const hit = redirect || (writer && LOCKED.find((p) => spotRe(p).test(cmd)));
  if (hit) deny(refusal(`Команда меняет ${hit}`, lockOf(root, probe(hit), role), role));
  process.exit(0);
}

const file = rel(root, t.file_path || t.notebook_path);
const lock = file && !file.startsWith("..") ? lockOf(root, file, role) : null;
if (lock) deny(refusal(`Файл ${file} агенту менять нельзя`, lock, role));
process.exit(0);
