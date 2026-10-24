// Тема и бренд витрины. Бренд один активный, но выбор уже есть — витрина общая для всех брендов.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DSProvider } from "@ds/ui";
import { illustrationsOf, snapshot } from "./data";

function store(key: string, value?: string) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch { /* без хранилища — без запоминания */ }
  return null;
}

type Scope = { theme: string; setTheme: (t: string) => void; brand: string; setBrand: (b: string) => void; resolvedTheme: "light" | "dark" };
const Ctx = createContext<Scope | null>(null);
const activeBrands = snapshot.brands.filter((b) => b.status === "active");

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(() => store("docs.theme") ?? "dark");
  const [brand, setBrand] = useState(() => {
    const saved = store("docs.brand");
    return activeBrands.some((b) => b.id === saved) ? saved! : activeBrands[0]?.id ?? "";
  });
  const [sys, setSys] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSys(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "system") el.removeAttribute("data-theme"); else el.dataset.theme = theme;
    store("docs.theme", theme);
  }, [theme]);
  useEffect(() => { document.documentElement.dataset.brand = brand; store("docs.brand", brand); }, [brand]);
  const strings = snapshot.brands.find((b) => b.id === brand)?.strings.reduce<Record<string, string>>((a, s) => ({ ...a, [s.key]: s.value }), {}) ?? {};
  const resolvedTheme = theme === "system" ? (sys ? "dark" : "light") : (theme as "light" | "dark");
  return (
    <Ctx.Provider value={{ theme, setTheme, brand, setBrand, resolvedTheme }}>
      <DSProvider strings={strings} illustrations={illustrationsOf(brand)}>{children}</DSProvider>
    </Ctx.Provider>
  );
}
export function useScope(): Scope {
  const v = useContext(Ctx);
  if (!v) throw new Error("ScopeProvider missing");
  return v;
}
