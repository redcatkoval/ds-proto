import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { groups, plural, snapshot } from "./data";
import { useScope } from "./scope";

const TOP = [
  ["/", "Обзор", (p: string) => p === "/" || p.startsWith("/overview")],
  ["/foundations/layers", "Фундамент", (p: string) => p.startsWith("/foundations")],
  ["/components", "Компоненты", (p: string) => p.startsWith("/components")],
  ["/brands", "Бренды", (p: string) => p.startsWith("/brands")],
  ["/products", "Продукты", (p: string) => p.startsWith("/products")],
  ["/audits", "Проверки", (p: string) => p.startsWith("/audits")],
  ["/changes", "Изменения", (p: string) => p.startsWith("/changes")],
] as const;

export function Layout() {
  const { theme, setTheme } = useScope();
  const loc = useLocation();
  const [menu, setMenu] = useState(false);
  useEffect(() => { setMenu(false); if (!loc.hash) window.scrollTo(0, 0); }, [loc.pathname]);

  return (
    <div className="ds-root d-app">
      <header className="d-top">
        <Link to="/" className="d-logo"><span className="d-logo__mark" aria-hidden />ds-proto</Link>
        <nav className="d-top__nav" aria-label="Разделы">
          {TOP.map(([to, label, on]) => <Link key={to} to={to} className={on(loc.pathname) ? "d-top__item d-top__item--on" : "d-top__item"} aria-current={on(loc.pathname) ? "page" : undefined}>{label}</Link>)}
        </nav>
        <div className="d-seg d-seg--small d-top__theme" role="radiogroup" aria-label="Тема">
          {[["system", "Авто"], ["light", "Светлая"], ["dark", "Тёмная"]].map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={theme === v} onClick={() => setTheme(v)}>{l}</button>)}
        </div>
        <button type="button" className="d-menu-btn" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>{menu ? "Закрыть" : "Меню"}</button>
      </header>
      <div className="d-body">
        <aside className={`d-side${menu ? " d-side--open" : ""}`}>
          <nav className="d-mobile-top" aria-label="Разделы">{TOP.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}</nav>
          <Sidebar path={loc.pathname} />
        </aside>
        <main className="d-main" id="main">
          <Outlet />
          <footer className="d-foot">Снимок {snapshot.generated} · {snapshot.totals.components} {plural(snapshot.totals.components, "компонент", "компонента", "компонентов")} · {snapshot.brands.length} {plural(snapshot.brands.length, "бренд", "бренда", "брендов")} · {snapshot.products.length} {plural(snapshot.products.length, "продукт", "продукта", "продуктов")}</footer>
        </main>
      </div>
    </div>
  );
}

function Item({ to, children, end }: { to: string; children: React.ReactNode; end?: boolean }) {
  return <NavLink to={to} end={end} className={({ isActive }) => (isActive ? "d-side__item d-side__item--on" : "d-side__item")}>{children}</NavLink>;
}

function Sidebar({ path }: { path: string }) {
  const { brand, setBrand } = useScope();
  const [q, setQ] = useState("");
  if (path.startsWith("/foundations")) return (
    <>
      <label className="d-side__brand">
        <span>Бренд</span>
        <select className="d-input" value={brand} onChange={(e) => setBrand(e.target.value)}>
          {snapshot.brands.map((b) => <option key={b.id} value={b.id} disabled={b.status !== "active"}>{b.name}</option>)}
          <option disabled>Следующий бренд — ещё не заведён</option>
        </select>
      </label>
      <div className="d-side__group">
        <Item to="/foundations/layers">Слои и бренд</Item>
        <Item to="/foundations/primitives-global">Примитивы — общие</Item>
        <Item to="/foundations/primitives-colour">Примитивы — цвет</Item>
        <Item to="/foundations/semantic">Семантика</Item>
        <Item to="/foundations/typography">Типографика</Item>
        <Item to="/foundations/effects">Тени и скругления</Item>
        <Item to="/foundations/icons">Иконки</Item>
        <Item to="/foundations/illustrations">Иллюстрации</Item>
      </div>
    </>
  );
  if (path.startsWith("/components")) {
    const s = q.trim().toLowerCase();
    const list = snapshot.components.filter((c) => !s || c.name.toLowerCase().includes(s) || c.description.toLowerCase().includes(s));
    return (
      <>
        <input className="d-input d-side__search" placeholder="Найти компонент" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Найти компонент" />
        <div className="d-side__group">
          <Item to="/components" end>Все компоненты</Item>
          <Item to="/components/patterns">Шаблоны экранов<span className="d-side__count">{snapshot.patterns.length}</span></Item>
          <Item to="/components/candidates">Кандидаты{snapshot.candidates.length ? <span className="d-side__count">{snapshot.candidates.length}</span> : null}</Item>
        </div>
        {groups.map((g) => {
          const items = list.filter((c) => c.group === g);
          return items.length ? (
            <div key={g} className="d-side__group">
              <div className="d-side__title">{g} <span>{items.length}</span></div>
              {items.map((c) => <Item key={c.slug} to={`/components/${c.slug}`}><span className={`d-dot d-dot--${c.maturity.level}`} aria-hidden />{c.name}</Item>)}
            </div>
          ) : null;
        })}
        {s && !list.length ? <p className="d-side__empty">Такого компонента нет. Нужен — заявите кандидата.</p> : null}
      </>
    );
  }
  if (path.startsWith("/brands")) return (
    <div className="d-side__group">
      <div className="d-side__title">Бренды</div>
      {snapshot.brands.map((b) => <Item key={b.id} to={`/brands/${b.id}`}><span className="d-brand-chip" aria-hidden>{b.name[0]}</span>{b.name}</Item>)}
      <span className="d-side__item d-side__item--off" title="Новый бренд — папка в system/brands/ с brand.json"><span className="d-brand-chip d-brand-chip--off" aria-hidden>+</span>Следующий бренд</span>
      <p className="d-side__hint">Бренд — это тон голоса, изображения и формулировки поверх общей системы. Правила компонентов общие.</p>
    </div>
  );
  if (path.startsWith("/products")) return (
    <>
      <div className="d-side__group"><Item to="/products" end>Все продукты</Item></div>
      {snapshot.brands.map((b) => (
        <div key={b.id} className="d-side__group">
          <div className="d-side__title">{b.name}</div>
          {snapshot.products.filter((p) => p.brand === b.id).map((p) => <Item key={p.id} to={`/products/${p.id}`}>{p.name}</Item>)}
        </div>
      ))}
      <div className="d-side__group"><div className="d-side__title d-side__title--off">Следующий бренд</div><span className="d-side__item d-side__item--off">Продуктов нет</span></div>
    </>
  );
  if (path.startsWith("/audits")) return (
    <div className="d-side__group">
      <a className="d-side__item" href="#/audits">Что делать</a>
      <a className="d-side__item" href="#/audits?view=unchecked">Не проверено</a>
      <a className="d-side__item" href="#/audits?view=rules">Правила: общие, бренда, продукта</a>
    </div>
  );
  if (path.startsWith("/changes")) return (
    <div className="d-side__group">
      <Item to="/changes" end>Система</Item>
      <Item to="/changes/products">Продукты</Item>
    </div>
  );
  return (
    <div className="d-side__group">
      <Item to="/" end>Обзор</Item>
      <Item to="/overview/levels">Уровни компонентов</Item>
      <Item to="/overview/agent">Готовность для агента</Item>
      <Item to="/overview/roles">Кому что</Item>
    </div>
  );
}
