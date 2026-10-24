// Роли агента: что можно править. Роль задаёт человек при запуске Claude Code —
// переменными окружения, агент её не выбирает и не меняет:
//   claude                                — команда продукта
//   DS_ROLE=brand DS_BRAND=<id> claude    — владелец бренда <id>
//   DS_ROLE=owner claude                  — владелец системы
import fs from "node:fs";
import path from "node:path";

const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const brandsOf = (root) => { try { return fs.readdirSync(path.join(root, "system/brands")).filter((b) => isDir(path.join(root, "system/brands", b))); } catch { return []; } };

const OWNER = { who: "владелец системы", run: "DS_ROLE=owner claude" };
const BRAND = (id) => ({ who: `владелец бренда ${id}`, run: `DS_ROLE=brand DS_BRAND=${id} claude` });

// Роль из окружения. Не включилась — остаёмся командой продукта и говорим почему.
export const roleOf = (root, env = process.env) => {
  const want = (env.DS_ROLE || "").trim();
  const product = (why) => ({ id: "product", title: `команда продукта (${why})` });
  if (!want) return product("DS_ROLE не задан");
  if (want === "owner") return { id: "owner", title: "владелец системы (DS_ROLE=owner)" };
  if (want !== "brand") return product(`роль DS_ROLE=${want} не включилась: такой роли нет, бывают brand и owner`);
  const id = (env.DS_BRAND || "").trim();
  if (!id) return product("роль DS_ROLE=brand не включилась: не задан DS_BRAND — запускай DS_ROLE=brand DS_BRAND=<id бренда> claude");
  if (!/^[\w-]+$/.test(id) || !isDir(path.join(root, "system/brands", id))) {
    return product(`роль DS_ROLE=brand не включилась: бренда «${id}» нет — нет папки system/brands/${id}/; есть: ${brandsOf(root).join(", ") || "ни одного"}`);
  }
  return { id: "brand", brand: id, title: `владелец бренда ${id} (DS_ROLE=brand DS_BRAND=${id})` };
};

// Закрыт ли путь (относительно корня) для роли. null — можно; иначе { why, who?, run? }.
// Без run — правку не делает ни одна роль агента.
export const lockOf = (root, r, role) => {
  if (r === "system/core/baseline.json") return { why: "разрешённый долг записывает только человек, руками" };
  if (r.startsWith("system/generated/")) return { why: "эти файлы собирает npm run check, руками их не правят" };
  if (role.id === "owner") return null;
  if (r.startsWith("system/core/candidates/")) return null;
  if (r.startsWith("system/core/")) return { why: "ядро системы (контракты, правила, шаблоны, токены) меняет владелец системы", ...OWNER };
  if (r.startsWith("packages/ui/")) return { why: "компоненты меняются отдельным решением владельца системы", ...OWNER };
  if (r.startsWith("tools/hooks/") || r === ".claude/settings.json") return { why: "хуки и их настройку меняет владелец системы", ...OWNER };
  if (r.startsWith("system/brands/")) {
    const id = r.split("/")[2];
    if (!id || !isDir(path.join(root, "system/brands", id))) return { why: "новый бренд и общие файлы брендов заводит владелец системы", ...OWNER };
    if (role.id === "brand" && role.brand === id) return null;
    return { why: `бренд ${id} (токены, тексты, иллюстрации) меняет его владелец`, ...BRAND(id) };
  }
  return null;
};

// Пути, которые замок ищет в командах терминала. Каталоги — с «/» на конце.
export const spots = (root) => [
  "system/core/baseline.json", "system/core/contracts/", "system/core/rules/", "system/core/code-rules.json",
  "system/core/patterns/", "system/core/tokens/", "packages/ui/", "system/generated/", "tools/hooks/", ".claude/settings.json",
  ...brandsOf(root).map((b) => `system/brands/${b}/`),
];

export const refusal = (head, lock, role) => [
  `${head}: ${lock.why}.`,
  `Текущая роль: ${role.title}.`,
  lock.run ? `Это правит ${lock.who}: ${lock.run}.` : "Это не правит ни одна роль агента.",
  "Отказ замка — не повод искать обход: собери из того, что есть, заведи кандидата в system/core/candidates/ или скажи человеку.",
].join(" ");
