import snapshotJson from "../../../system/generated/snapshot.json";
import resolvedJson from "../../../system/generated/tokens.json";
import lintJson from "../../../system/generated/lint-report.json";
import typecheckJson from "../../../system/generated/typecheck.json";
import type { Component, LintReport, Resolved, Snapshot, TypeCheck } from "./types";

export const snapshot = snapshotJson as unknown as Snapshot;
export const resolved = resolvedJson as unknown as Resolved;
export const lint = lintJson as unknown as LintReport;
export const typecheck = typecheckJson as unknown as TypeCheck;

// Картинки: обложки продуктов и иллюстрации брендов — прямо из репозитория
const covers = import.meta.glob("../../../apps/*/cover.*", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
export const coverOf = (path: string | null) => (path ? Object.entries(covers).find(([p]) => p.endsWith(path.replace(/^apps\//, "/")))?.[1] ?? null : null);
const pictures = import.meta.glob("../../../system/brands/*/illustrations/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
export function illustrationsOf(brand: string): Record<string, string> {
  return Object.fromEntries(Object.entries(pictures).filter(([p]) => p.includes(`/brands/${brand}/`)).map(([p, url]) => [p.split("/").pop()!.replace(".png", ""), url]));
}
export const patternBySlug = Object.fromEntries(snapshot.patterns.map((p) => [p.slug, p]));
export const ruleTitle = (id: string) => lint.codeRules.find((r) => r.id === id)?.title ?? id;
export const levelOfRule: Record<string, string> = { core: "общее", brand: "бренда", product: "продукта" };

export const byName: Record<string, Component> = Object.fromEntries(snapshot.components.map((c) => [c.name, c]));
export const bySlug: Record<string, Component> = Object.fromEntries(snapshot.components.map((c) => [c.slug, c]));
export const screenByKey = Object.fromEntries(snapshot.screens.map((s) => [s.key, s]));
export const productById = Object.fromEntries(snapshot.products.map((p) => [p.id, p]));
export const brandById = Object.fromEntries(snapshot.brands.map((b) => [b.id, b]));
export const groups = [...new Set(snapshot.components.map((c) => c.group))];
// закрытые кандидаты — сделан и отклонён; состояние — первое слово поля «Состояние»
export const candidateClosed = (state: string) => /^(сделан|отклонён)/i.test(state.trim());
export const openCandidates = snapshot.candidates.filter((c) => !candidateClosed(c.state));
export const closedCandidates = snapshot.candidates.filter((c) => candidateClosed(c.state));

// Тексты бренда — как есть, чтобы показать на витрине
const brandFiles = import.meta.glob("../../../system/brands/*/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
export function brandDoc(brand: string, file: string): string | null {
  return Object.entries(brandFiles).find(([p]) => p.endsWith(`/brands/${brand}/${file}`))?.[1] ?? null;
}

export const CRM = (import.meta.env.VITE_CRM_URL as string | undefined) ?? "http://localhost:5173";
export const screenUrl = (key: string, extra = "") => {
  const s = screenByKey[key];
  const p = s ? productById[s.product] : undefined;
  return `${p?.url ?? CRM}/?${extra}${s?.route ?? ""}`;
};
// Экран продукта, в котором лежит файл: для ссылок «посмотреть в продукте»
export function screenForFile(file: string): string | null {
  const s = snapshot.screens.find((x) => x.files.some((f) => file.endsWith(f)) && file.includes(`/${x.files[0].split("/")[0]}/`))
    ?? snapshot.screens.find((x) => x.files.some((f) => file.endsWith(f)));
  return s?.key ?? null;
}
export const levelLabel = { draft: "черновик", ready: "готов", stable: "стабилен" } as const;
export const levelMeaning = {
  stable: "можно брать в продукт без оглядки",
  ready: "можно брать, правила ещё не сверены человеком",
  draft: "в работе, в продукт без решения не брать",
} as const;
export const whoLabel: Record<string, { short: string; long: string }> = {
  "машина": { short: "Машина", long: "проверяется при каждом npm run check" },
  "компонент": { short: "Компонент", long: "заложено в сам компонент, нарушить нельзя" },
  "человек": { short: "Человек", long: "смотрит на ревью" },
  "совет": { short: "Совет", long: "не обязательно, но так лучше" },
  "не указано": { short: "Не указано", long: "в контракте не сказано, кто следит" },
};
export const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};
export const lastChange = (name: string) => snapshot.history.find((h) => h.changes.some((x) => x.component === name))?.date ?? null;
export function copy(text: string) {
  try { void navigator.clipboard?.writeText(text); } catch { /* буфер недоступен */ }
}
