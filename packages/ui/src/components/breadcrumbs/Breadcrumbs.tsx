import { Icon } from "../../icons/icons";
import { useStrings } from "../../strings";
import "./breadcrumbs.css";

export type BreadcrumbsItem = { label: string; href?: string };

export type BreadcrumbsProps = {
  /** Путь от раздела к текущей странице. Последний пункт — текущая страница, без ссылки. */
  items: BreadcrumbsItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const s = useStrings();
  return (
    <nav className="ds-breadcrumbs" aria-label={s["breadcrumbs.label"]} data-component="Breadcrumbs">
      <ol>
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${it.label}-${i}`}>
              {last || !it.href
                ? <span aria-current={last ? "page" : undefined}>{it.label}</span>
                : <a className="ds-focusable" href={it.href}>{it.label}</a>}
              {last ? null : <Icon name="chevron-right" size={14} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
