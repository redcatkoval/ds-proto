// Живой компонент: настоящий код из @ds/ui, свойства — из снимка.
// Управляемые пары (value/onChange, checked/onChange, selected/onToggle, open/onClose, message/onHide)
// связаны сами, поэтому компонент можно трогать, как в продукте.

import { Component as ReactComponent, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import * as UI from "@ds/ui";
import type { Component, Prop } from "../types";

const registry = UI as unknown as Record<string, ComponentType<Record<string, unknown>>>;
const noop = () => {};

// В примерах из meta.json нет функций: добавляем пустые обработчики туда, где их ждут
function hydrate(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(hydrate);
  if (v && typeof v === "object") {
    const o = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, hydrate(x)]));
    return "label" in o ? { onSelect: noop, onClick: noop, ...o } : o;
  }
  return v;
}

function fallback(p: Prop, name: string): unknown {
  if (p.default !== undefined) return p.default;
  if (!p.required) return undefined;
  switch (p.kind) {
    case "enum": return p.options?.[0];
    case "boolean": return false;
    case "number": return 0;
    case "array": return [];
    case "node": return p.name === "children" ? name : "Label";
    case "string": return p.name === "id" ? `live-${name.toLowerCase()}` : p.name === "title" ? "Title" : "Text";
    default: return undefined;
  }
}

export function initialProps(c: Component, example = 0): Record<string, unknown> {
  const raw = c.examples[example] as { props?: Record<string, unknown>; children?: unknown } | undefined;
  const ex: Record<string, unknown> = { ...(raw?.children !== undefined ? { children: raw.children } : {}), ...(raw?.props ?? {}) };
  const out: Record<string, unknown> = {};
  for (const p of c.props) {
    if (p.kind === "function") continue;
    const v = p.name in ex ? ex[p.name] : fallback(p, c.name);
    if (v !== undefined) out[p.name] = v;
  }
  if (c.name === "Modal" && out.open === undefined) out.open = false;
  return out;
}

class Boundary extends ReactComponent<{ children: ReactNode; resetKey: string }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  componentDidUpdate(prev: { resetKey: string }) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() { return this.state.error ? <div className="d-live-error">Компонент не отрисовался: {this.state.error}</div> : this.props.children; }
}

export function Live({ c, props, onProps, onEvent }: {
  c: Component;
  props: Record<string, unknown>;
  onProps?: (next: Record<string, unknown>) => void;
  onEvent?: (name: string) => void;
}) {
  const C = registry[c.name];
  const names = new Set(c.props.map((p) => p.name));
  const set = (k: string) => (v: unknown) => onProps?.({ ...props, [k]: v });
  const handlers: Record<string, unknown> = {};
  for (const p of c.props.filter((x) => x.kind === "function")) {
    const report = () => onEvent?.(p.name);
    if (p.name === "onChange" && names.has("value")) handlers.onChange = (v: unknown) => { set("value")(v); report(); };
    else if (p.name === "onChange" && names.has("checked")) handlers.onChange = (v: unknown) => { set("checked")(v); report(); };
    else if (p.name === "onToggle" && names.has("selected")) handlers.onToggle = (v: unknown) => { set("selected")(v); report(); };
    else if (p.name === "onClose" && names.has("open")) handlers.onClose = () => { set("open")(false); report(); };
    else if (p.name === "onHide" && names.has("message")) handlers.onHide = () => { set("message")(null); report(); };
    else handlers[p.name] = (e?: { preventDefault?: () => void }) => { e?.preventDefault?.(); report(); };
  }
  const key = useMemo(() => JSON.stringify(props), [props]);
  if (!C) return <div className="d-live-error">В пакете нет компонента {c.name}</div>;
  return (
    <Boundary resetKey={key}>
      <C {...(hydrate(props) as Record<string, unknown>)} {...handlers} />
    </Boundary>
  );
}

// Свой экземпляр с собственным состоянием — для превью в списках
export function LiveStatic({ c, example = 0 }: { c: Component; example?: number }) {
  const [props, setProps] = useState(() => initialProps(c, example));
  useEffect(() => setProps(initialProps(c, example)), [c, example]);
  return <Live c={c} props={props} onProps={setProps} />;
}

// ---------- панель свойств ----------
export function Controls({ c, props, onProps }: { c: Component; props: Record<string, unknown>; onProps: (p: Record<string, unknown>) => void }) {
  const set = (k: string, v: unknown) => onProps({ ...props, [k]: v });
  return (
    <div className="d-controls">
      {c.props.map((p) => (
        <div key={p.name} className="d-control">
          <div className="d-control__name">
            <code>{p.name}</code>
            {p.required ? <span className="d-control__req">обязательное</span> : null}
          </div>
          <Control p={p} value={props[p.name]} onChange={(v) => set(p.name, v)} />
        </div>
      ))}
    </div>
  );
}

function Control({ p, value, onChange }: { p: Prop; value: unknown; onChange: (v: unknown) => void }) {
  if (p.kind === "function") return <span className="d-control__note">событие — сработает при касании</span>;
  if (p.kind === "enum" && p.options) {
    if (p.options.length <= 4) return (
      <div className="d-seg" role="radiogroup" aria-label={p.name}>
        {!p.required && p.default === undefined ? <button type="button" role="radio" aria-checked={value === undefined} onClick={() => onChange(undefined)}>нет</button> : null}
        {p.options.map((o) => <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}>{o}</button>)}
      </div>
    );
    return (
      <select className="d-input" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value || undefined)} aria-label={p.name}>
        {!p.required ? <option value="">нет</option> : null}
        {p.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (p.kind === "boolean") return (
    <label className="d-check"><input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /> {value ? "да" : "нет"}</label>
  );
  if (p.kind === "number") return <input className="d-input" type="number" value={(value as number) ?? ""} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} aria-label={p.name} />;
  if (p.kind === "string" || p.kind === "node") return <input className="d-input" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value || (p.required ? "" : undefined))} aria-label={p.name} />;
  return <JsonControl value={value} onChange={onChange} name={p.name} />;
}

function JsonControl({ value, onChange, name }: { value: unknown; onChange: (v: unknown) => void; name: string }) {
  const text = value === undefined ? "" : JSON.stringify(value, null, 1);
  const [draft, setDraft] = useState(text);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setDraft(text), [text]);
  return (
    <>
      <textarea className="d-input d-input--code" rows={Math.min(8, draft.split("\n").length + 1)} value={draft} aria-label={name}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (!draft.trim()) { setError(null); onChange(undefined); return; }
          try { onChange(JSON.parse(draft)); setError(null); } catch { setError("Не JSON — значение не применено"); }
        }} />
      {error ? <span className="d-control__error">{error}</span> : null}
    </>
  );
}

// Узлы примера к правилу: { c: "Button", p: {...}, t: "Save" } — рисуются живыми рядом
export type RuleNode = { c: string; p: Record<string, unknown>; t?: string };
function LiveNode({ c, node }: { c: Component; node: RuleNode }) {
  const [props, setProps] = useState<Record<string, unknown>>(() => ({ ...node.p, ...(node.t !== undefined ? { children: node.t } : {}) }));
  return <Live c={c} props={props} onProps={setProps} />;
}
export function RuleNodes({ nodes, lookup }: { nodes: RuleNode[]; lookup: (name: string) => Component | undefined }) {
  return (
    <div className="d-rule-nodes">
      {nodes.map((n, i) => { const c = lookup(n.c); return c ? <LiveNode key={i} c={c} node={n} /> : <span key={i}>{n.c}</span>; })}
    </div>
  );
}
