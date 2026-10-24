#!/usr/bin/env node
// PreToolUse: замок. Правка долга, ядра системы, компонентов и собранных файлов — запрещена,
// даже если человек в чате попросил и даже в режиме без подтверждений.
import { protectedWhy, readInput, rel, rootOf } from "./lib.mjs";

const input = readInput();
const root = rootOf(input);
const t = input.tool_input || {};
const deny = (reason) => {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
  process.exit(0);
};

if (input.tool_name === "Bash") {
  const cmd = String(t.command || "");
  if (/--update-baseline/.test(cmd)) deny("Заморозить нарушения как долг может только человек. Исправь код экрана или скажи человеку, что не получается.");
  const LOCKED = ["system/core/baseline.json", "system/core/contracts", "system/core/rules", "system/core/code-rules.json", "system/core/patterns", "system/core/tokens", "packages/ui/", "system/generated/"];
  // перенаправление вывода считается записью, только если ведёт в закрытый путь (2>/dev/null — нет)
  const redirect = LOCKED.find((p) => new RegExp(`>>?\\s*["']?(\\./)?${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(cmd));
  const writer = /(\btee\b|\bsed\s+(-\w*\s+)*-i|\bperl\s+-\w*i|\bmv\b|\bcp\b|\brm\b|\btruncate\b|writeFile|write_text|open\([^)]*['"][wa]['"]|\bgit\s+(checkout|restore)\b)/.test(cmd);
  const hit = redirect || (writer && LOCKED.find((p) => cmd.includes(p)));
  if (hit) deny(`Команда меняет ${hit}: ${protectedWhy(hit.replace(/\/$/, "/x")) || "это меняет человек"}. Если без этого нельзя — остановись и скажи человеку.`);
  process.exit(0);
}

const file = rel(root, t.file_path || t.notebook_path);
const why = file && !file.startsWith("..") ? protectedWhy(file) : null;
if (why) deny(`Файл ${file} агенту менять нельзя: ${why}. Собери экран из того, что есть; чего не хватает — заведи кандидата в system/core/candidates/ или скажи человеку.`);
process.exit(0);
