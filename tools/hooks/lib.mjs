// Общее для хуков Claude Code: чтение входа, корень проекта, состояние сессии.
// Хуки вызывает сам Claude Code (см. .claude/settings.json) — агент их не выбирает и не отключает.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const readInput = () => {
  try { return JSON.parse(fs.readFileSync(0, "utf8") || "{}"); } catch { return {}; }
};

export const rootOf = (input) => path.resolve(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());

export const rel = (root, p) => (p ? path.relative(root, path.resolve(root, p)).split(path.sep).join("/") : "");

// Что агенту трогать нельзя, зависит от роли — см. roles.mjs.

// Состояние сессии — во временной папке, не в проекте.
const stateDir = path.join(os.tmpdir(), "ds-proto-hooks");
export const state = (session) => {
  fs.mkdirSync(stateDir, { recursive: true });
  const file = path.join(stateDir, `${(session || "default").replace(/[^\w-]/g, "")}.json`);
  return {
    read: () => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return {}; } },
    write: (s) => fs.writeFileSync(file, JSON.stringify(s)),
  };
};

// Отпечаток исходников: менял ли агент что-нибудь с прошлой проверки.
const WATCH = ["apps", "packages/ui/src", "system", "tools"];
const SKIP = /(^|\/)(node_modules|dist|\.vite|generated|public\/packages)(\/|$)/;
export const fingerprint = (root) => {
  const h = crypto.createHash("sha1");
  const walk = (dir) => {
    let list = [];
    try { list = fs.readdirSync(path.join(root, dir), { withFileTypes: true }); } catch { return; }
    for (const e of list.sort((a, b) => a.name.localeCompare(b.name))) {
      const r = `${dir}/${e.name}`;
      if (SKIP.test(r)) continue;
      if (e.isDirectory()) walk(r);
      else { const st = fs.statSync(path.join(root, r)); h.update(`${r}:${st.size}:${st.mtimeMs}\n`); }
    }
  };
  for (const d of WATCH) walk(d);
  return h.digest("hex");
};
