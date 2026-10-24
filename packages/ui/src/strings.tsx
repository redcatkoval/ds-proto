// Что бренд вкладывает в общие компоненты: слова и иллюстрации.
// Правило у компонента общее, а формулировка и картинка — бренда:
// слова — system/brands/<id>/brand.json → strings, картинки — system/brands/<id>/illustrations/.
// Базовые формулировки — нейтральный английский; базовых картинок нет — компонент покажет иконку.

import { createContext, useContext, type ReactNode } from "react";
import type { IllustrationName } from "./illustrations";

export const baseStrings = {
  "spinner.label": "Loading",
  "button.loading": "Working",
  "label.required": "Required",
  "modal.close": "Close",
  "modal.cancel": "Cancel",
  "search.clear": "Clear search",
  "nav.sections": "Sections",
  "table.empty": "No results",
  "table.previous": "Previous page",
  "table.next": "Next page",
  "table.range": "{from}–{to} of {total}",
  "table.selectAll": "Select all rows",
  "table.selectRow": "Select row",
  "breadcrumbs.label": "Breadcrumb",
  "sidebar.label": "Main",
} as const;

export type StringKey = keyof typeof baseStrings;
export type Strings = Record<StringKey, string>;

type Brand = { strings: Strings; illustrations: Partial<Record<IllustrationName, string>> };
const BrandContext = createContext<Brand>({ strings: baseStrings, illustrations: {} });

/** Подключает бренд: формулировки (чего бренд не задал — базовое) и адреса иллюстраций. */
export function DSProvider({ strings, illustrations, children }: {
  strings?: Partial<Record<string, string>>;
  illustrations?: Partial<Record<string, string>>;
  children: ReactNode;
}) {
  const merged = { ...baseStrings } as Strings;
  for (const [k, v] of Object.entries(strings ?? {})) if (k in baseStrings && v) merged[k as StringKey] = v;
  return <BrandContext.Provider value={{ strings: merged, illustrations: (illustrations ?? {}) as Brand["illustrations"] }}>{children}</BrandContext.Provider>;
}

export function useStrings(): Strings {
  return useContext(BrandContext).strings;
}

/** Адрес иллюстрации бренда для места или null, если бренд её не дал. */
export function useIllustration(name: IllustrationName | undefined): string | null {
  const all = useContext(BrandContext).illustrations;
  return name ? all[name] ?? null : null;
}

export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}
