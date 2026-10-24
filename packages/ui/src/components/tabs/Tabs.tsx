import { useRef, type KeyboardEvent } from "react";
import "./tabs.css";

export type TabsItem = { id: string; label: string; count?: number };

export type TabsProps = {
  /** Что переключаем — для диктора: «Order sections». */
  label: string;
  /** Две–шесть вкладок. */
  items: TabsItem[];
  /** id открытой вкладки. */
  value: string;
  onChange: (id: string) => void;
};

export function Tabs({ label, items, value, onChange }: TabsProps) {
  const list = useRef<HTMLDivElement>(null);
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = items.findIndex((t) => t.id === value);
    const next = items[(i + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length];
    onChange(next.id);
    list.current?.querySelector<HTMLButtonElement>(`[data-id="${next.id}"]`)?.focus();
  };
  return (
    <div className="ds-tabs" role="tablist" aria-label={label} ref={list} onKeyDown={onKey} data-component="Tabs">
      {items.map((t) => (
        <button key={t.id} type="button" role="tab" data-id={t.id} aria-selected={t.id === value} tabIndex={t.id === value ? 0 : -1}
          className="ds-tabs__tab ds-focusable" onClick={() => onChange(t.id)}>
          {t.label}
          {t.count !== undefined ? <span className="ds-tabs__count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
