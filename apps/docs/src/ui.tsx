// Общие детали витрины: значки, заголовки, разметка текста.
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@ds/ui";
import { byName, levelLabel, snapshot, whoLabel } from "./data";
import type { Grade, Level, Result } from "./types";

export function LevelPill({ level }: { level: Level }) {
  return <span className={`d-pill d-pill--${level}`}><span className={`d-dot d-dot--${level}`} aria-hidden />{levelLabel[level]}</span>;
}

export function Badge({ tone = "neutral", children }: { tone?: "good" | "attention" | "neutral" | "pending"; children: ReactNode }) {
  return <span className={`d-badge d-badge--${tone}`}>{children}</span>;
}

export function ResultMark({ r }: { r: Result }) {
  const t = { pass: ["Проходит", "good"], fail: ["Пока нет", "attention"], pending: ["Не проверялось", "pending"] }[r] as [string, "good" | "attention" | "pending"];
  return <Badge tone={t[1]}>{t[0]}</Badge>;
}

export function GradeBadge({ g }: { g: Grade }) {
  const t = { patch: "ничего не сломает", minor: "добавлено, старое работает", breaking: "надо поправить" }[g];
  return <span className={`d-grade d-grade--${g}`}>{t}</span>;
}

export function WhoBadge({ who }: { who: string }) {
  const w = whoLabel[who] ?? whoLabel["не указано"];
  return <span className={`d-who d-who--${who.replace(/\s/g, "-")}`} title={w.long}>{w.short}</span>;
}

export function CompLink({ name, faded, children }: { name: string; faded?: boolean; children?: ReactNode }) {
  const c = byName[name];
  if (!c) return <span className="d-chip">{name}</span>;
  return <Link className={`d-chip${faded ? " d-chip--faded" : ""}`} to={`/components/${c.slug}`}><span className={`d-dot d-dot--${c.maturity.level}`} aria-hidden />{children ?? name}</Link>;
}

export function PageHead({ crumb, title, lead, children, aside }: { crumb?: ReactNode; title: string; lead?: ReactNode; children?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="d-head">
      <div className="d-head__main">
        {crumb ? <div className="d-crumb">{crumb}</div> : null}
        <h1 className="d-head__title">{title}</h1>
        {lead ? <div className="d-head__lead">{lead}</div> : null}
        {children}
      </div>
      {aside ? <div className="d-head__aside">{aside}</div> : null}
    </header>
  );
}

export function Section({ id, title, note, more, children }: { id?: string; title: string; note?: ReactNode; more?: ReactNode; children: ReactNode }) {
  return (
    <section className="d-section" id={id}>
      <div className="d-section__head">
        <div>
          <h2 className="d-section__title">{title}</h2>
          {note ? <p className="d-section__note">{note}</p> : null}
        </div>
        {more ? <div className="d-section__more">{more}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Card({ label, value, tone, note, to }: { label: string; value: ReactNode; tone?: "good" | "attention" | "pending"; note?: ReactNode; to?: string }) {
  const body = (
    <>
      <div className="d-card__label">{label}{tone ? <Badge tone={tone}>{tone === "good" ? "Хорошо" : tone === "attention" ? "Внимание" : "Позже"}</Badge> : null}</div>
      <div className="d-card__value">{value}</div>
      {note ? <div className="d-card__note">{note}</div> : null}
    </>
  );
  return to ? <Link className="d-card d-card--link" to={to}>{body}</Link> : <div className="d-card">{body}</div>;
}

export function Stamp() {
  return <p className="d-stamp">Собрано снимком от {snapshot.generated}{snapshot.lint ? `, линтер — ${snapshot.lint.date}` : ""}.</p>;
}

// `код` и **жирный** в строке
export function Rich({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : part.startsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : part)}</>;
}

// Маленький разбор Markdown: заголовки, абзацы, списки, таблицы, курсив, жирный, код.
function inline(text: string, key: string): ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((p, i) => {
    const k = `${key}-${i}`;
    if (p.startsWith("`")) return <code key={k}>{p.slice(1, -1)}</code>;
    if (p.startsWith("**")) return <b key={k}>{p.slice(2, -2)}</b>;
    if (p.startsWith("*") && p.length > 2) return <i key={k}>{p.slice(1, -1)}</i>;
    const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
    if (m) return <span key={k} className="d-md-ref">{m[1]}</span>;
    return p;
  });
}
export function Markdown({ src, skipTitle = true }: { src: string; skipTitle?: boolean }) {
  const lines = src.split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    const h = /^(#{1,4})\s+(.+)$/.exec(l);
    if (h) {
      if (!(skipTitle && h[1].length === 1)) {
        const level = Math.min(h[1].length + 1, 4);
        const Tag = `h${level}` as "h2" | "h3" | "h4";
        out.push(<Tag key={i} className={`d-md-h${level}`}>{inline(h[2], `h${i}`)}</Tag>);
      }
      i++; continue;
    }
    if (l.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!/^\|[\s|:-]+\|$/.test(lines[i].trim())) rows.push(lines[i].trim().slice(1, -1).split("|").map((c) => c.trim()));
        i++;
      }
      const [head, ...body] = rows;
      out.push(
        <div className="d-tablewrap" key={`t${i}`}>
          <table className="d-table">
            <thead><tr>{head.map((c, j) => <th key={j}>{inline(c, `th${i}${j}`)}</th>)}</tr></thead>
            <tbody>{body.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{inline(c, `td${i}${j}${k}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^\s*-\s+/.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\s*-\s+/, ""); i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) { item += " " + lines[i].trim(); i++; }
        items.push(item);
      }
      out.push(<ul key={`u${i}`} className="d-list">{items.map((t, j) => <li key={j}>{inline(t, `li${i}${j}`)}</li>)}</ul>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#|\||\s*-\s)/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push(<p key={`p${i}`} className="d-prose">{inline(para.join(" "), `p${i}`)}</p>);
  }
  return <div className="d-md">{out}</div>;
}

// Ссылка наружу: в продукт, в новую вкладку. Иконка выхода — без плашки.
export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return <a className="d-ext" href={href} target="_blank" rel="noopener">{children}<Icon name="external" size={14} /></a>;
}
export function ExtIcon({ href, label }: { href: string; label: string }) {
  return <a className="d-ext-icon" href={href} target="_blank" rel="noopener" aria-label={label} title={label}><Icon name="external" size={20} /></a>;
}
