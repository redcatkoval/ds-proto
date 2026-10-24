// Отпечаток входов линтера: всё, что он читает, плюс сам линтер.
// Линтер пишет его в отчёт, снимок сверяет: не совпало — отчёт устарел (линтер упал
// или после него поменяли код), и снимок его не берёт.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, f);
    if (f === "node_modules") continue;
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (!/\.(png|jpe?g|webp|gif)$/i.test(f)) out.push(p);
  }
  return out;
}

export function lintInputs(ROOT) {
  const apps = fs.readdirSync(path.join(ROOT, "apps")).sort().filter((d) => fs.existsSync(path.join(ROOT, "apps", d, "product.json")));
  const files = [
    ...walk(path.join(ROOT, "tools/lint")), ...walk(path.join(ROOT, "tools/lib")),
    ...walk(path.join(ROOT, "system/core")), ...walk(path.join(ROOT, "system/brands")),
    path.join(ROOT, "system/generated/tokens.json"),
    ...walk(path.join(ROOT, "packages/ui/src/components")),
    ...apps.flatMap((d) => [path.join(ROOT, "apps", d, "product.json"), path.join(ROOT, "apps", d, "rules.json"), ...walk(path.join(ROOT, "apps", d, "src"))]),
  ];
  const h = crypto.createHash("sha1");
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    h.update(path.relative(ROOT, f).split(path.sep).join("/") + "\0");
    h.update(fs.readFileSync(f));
    h.update("\0");
  }
  return h.digest("hex").slice(0, 16);
}
