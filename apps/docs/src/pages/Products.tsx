import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { brandById, coverOf, lint, patternBySlug, plural, productById, screenByKey, screenUrl, snapshot, typecheck } from "../data";
import { useScope } from "../scope";
import { CompLink, ExtIcon, ExtLink, PageHead, Section } from "../ui";
import type { Product } from "../types";

function Cover({ p, size = "large", children }: { p: Product; size?: "large" | "small"; children?: React.ReactNode }) {
  const img = coverOf(p.cover);
  return (
    <div className={`d-cover d-cover--${size}`} data-theme="light">
      {img ? <img src={img} alt="" /> : null}
      <div className="d-cover__text" data-theme="light">
        <span className="d-cover__brand">{brandById[p.brand]?.name}</span>
        <h2 className="d-cover__title">{p.name}</h2>
        {children}
      </div>
    </div>
  );
}

const used = (p: Product) => new Set(p.screens.flatMap((k) => Object.keys(screenByKey[k]?.components ?? {}))).size;
const findingsOf = (p: Product) => lint.findings.filter((f) => f.product === p.id);

export function ProductsPage() {
  return (
    <article className="d-page">
      <PageHead title="Продукты" lead={<p>Продукты, собранные из системы. Каждый живёт под одним брендом — берёт его токены, слова, картинки и тон голоса. Разные бренды — разные продукты на одной общей системе.</p>} />
      {snapshot.brands.map((b) => (
        <Section key={b.id} title={b.name} note={b.tagline} more={<Link to={`/brands/${b.id}`}>Бренд {b.name}</Link>}>
          {snapshot.products.filter((p) => p.brand === b.id).map((p) => {
            const f = findingsOf(p);
            const fresh = f.filter((x) => x.state === "fresh").length;
            const debt = f.filter((x) => x.state === "frozen").length;
            return (
              <article key={p.id} className="d-pblock">
                <Cover p={p}>
                  <p className="d-cover__lead">{p.description}</p>
                  <div className="d-cover__actions">
                    <Link className="d-btn d-btn--dark" to={`/products/${p.id}`}>Экраны и компоненты</Link>
                    {p.screens[0] ? <ExtIcon href={screenUrl(p.screens[0])} label="Открыть продукт в новой вкладке" /> : null}
                  </div>
                </Cover>
                <div className="d-pblock__facts">
                  <div><b>{p.screens.length}</b><span>{plural(p.screens.length, "экран", "экрана", "экранов")}</span></div>
                  <div><b>{used(p)}</b><span>{plural(used(p), "компонент", "компонента", "компонентов")} из {snapshot.components.length}</span></div>
                  <div><b>{lint.codeRules.filter((r) => r.level === "product" && r.file.startsWith(p.dir)).length}</b><span>правила команды</span></div>
                  <div><b className={fresh ? "d-bad" : undefined}>{fresh || "0"}</b><span>{fresh ? `${plural(fresh, "новое нарушение", "новых нарушения", "новых нарушений")}` : "новых нарушений нет"}{debt ? ` · ${debt} в долге` : ""}</span></div>
                </div>
                <div className="d-pblock__screens">
                  {p.screens.map((k) => {
                    const s = screenByKey[k];
                    return (
                      <Link key={k} to={`/products/${p.id}?screen=${encodeURIComponent(k)}`} className="d-screenchip">
                        <b>{s.name}</b><span>{s.pattern ? patternBySlug[s.pattern]?.title : "без шаблона"}</span>
                      </Link>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </Section>
      ))}
      <Section title="Следующий бренд" note="Когда появится второй бренд, его продукты встанут здесь отдельной группой. Продукт сам называет свой бренд в product.json.">
        <div className="d-pblock d-pblock--off"><span>Продуктов нет</span></div>
      </Section>
    </article>
  );
}

export function ProductPage() {
  const { id } = useParams();
  const p = id ? productById[id] : undefined;
  const { resolvedTheme } = useScope();
  const wanted = new URLSearchParams(location.hash.split("?")[1] ?? "").get("screen");
  const [current, setCurrent] = useState(wanted && p?.screens.includes(wanted) ? wanted : p?.screens[0]);
  if (!p) return <Navigate to="/products" replace />;
  const s = current ? screenByKey[current] : undefined;
  const journal = snapshot.productHistory.flatMap((h) => h.changes.filter((x) => (x.product ?? screenByKey[x.screen]?.product) === p.id).map((x) => ({ ...x, date: h.date })));
  const ownRules = lint.codeRules.filter((r) => r.level === "product" && r.file.startsWith(p.dir));
  const brandRules = lint.codeRules.filter((r) => r.level === "brand" && r.file.startsWith(`system/brands/${p.brand}/`));
  const types = typecheck.projects.find((x) => x.project === p.dir);
  const pat = s?.pattern ? patternBySlug[s.pattern] : undefined;
  return (
    <article className="d-page">
      <div className="d-crumb"><Link to="/products">Продукты</Link><span aria-hidden> / </span><Link to={`/brands/${p.brand}`}>{brandById[p.brand]?.name}</Link></div>
      <Cover p={p} size="small"><p className="d-cover__lead">{p.description}</p></Cover>
      <dl className="d-meta">
        <div><dt>Бренд</dt><dd><Link to={`/brands/${p.brand}`}>{brandById[p.brand]?.name}</Link></dd></div>
        <div><dt>Экранов</dt><dd>{p.screens.length}</dd></div>
        <div><dt>Компонентов</dt><dd>{used(p)} из {snapshot.components.length}</dd></div>
        <div><dt>Типы</dt><dd>{types?.ok ? "без ошибок" : `ошибок: ${types?.errors.length ?? "?"}`}</dd></div>
        <div><dt>Код</dt><dd><code>{p.dir}</code></dd></div>
      </dl>

      <Section title="Экраны" note="Слева — экран, справа — сам продукт. В продукте есть кнопка «Показать компоненты»: она подписывает каждый компонент на экране.">
        <div className="d-screens">
          <div className="d-screens__list" role="tablist" aria-label="Экраны">
            {p.screens.map((k) => {
              const x = screenByKey[k];
              return (
                <button key={k} type="button" role="tab" aria-selected={k === current} className="d-screen-tab" onClick={() => setCurrent(k)}>
                  <b>{x.name}</b><span>{x.pattern ? patternBySlug[x.pattern]?.title : "без шаблона"}</span>
                </button>
              );
            })}
          </div>
          {s ? (
            <div className="d-screens__detail">
              <div className="d-frame">
                <div className="d-frame__bar"><code>{s.route}</code><ExtLink href={screenUrl(s.key, `theme=${resolvedTheme}&overlay=1&`)}>Открыть с подсветкой компонентов</ExtLink></div>
                <iframe key={`${s.key}-${resolvedTheme}`} title={s.name} src={screenUrl(s.key, `theme=${resolvedTheme}&embed=1&`)} loading="lazy" />
                <div className="d-frame__hint">Пусто? Продукт не запущен: <code>npm run dev:crm</code></div>
              </div>
              {pat ? <p className="d-prose">Собран по шаблону <Link to={`/components/patterns#${pat.slug}`}>«{pat.title}»</Link>.</p> : null}
              <div className="d-twocol">
                <div>
                  <h3 className="d-h3">Стоят на экране</h3>
                  <div className="d-chips">{Object.entries(s.components).sort((a, b) => b[1] - a[1]).map(([n, k]) => <CompLink key={n} name={n}>{n} ×{k}</CompLink>)}</div>
                </div>
                <div>
                  <h3 className="d-h3">Приходят внутри других</h3>
                  <div className="d-chips">{Object.keys(s.indirect).map((n) => <CompLink key={n} name={n} faded />)}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Section>

      <Section title="Правила этого продукта" note="Сверх общих правил системы и правил бренда. Свои правила команда продукта добавляет сама в rules.json продукта — их проверяет npm run check, и агент этого продукта их читает.">
        <div className="d-tablewrap"><table className="d-table">
          <thead><tr><th>Правило</th><th>Зачем</th><th>Чьё</th><th>Кто добавил</th></tr></thead>
          <tbody>
            {ownRules.map((r) => <tr key={r.id}><td><b>{r.title}</b></td><td>{r.why}</td><td>продукта</td><td>{r.addedBy}, {r.since}</td></tr>)}
            {brandRules.map((r) => <tr key={r.id}><td><b>{r.title}</b></td><td>{r.why}</td><td>бренда {brandById[p.brand]?.name}</td><td>{r.addedBy}, {r.since}</td></tr>)}
          </tbody>
        </table></div>
        <p className="d-prose d-muted">Общие правила кода и правила компонентов — на странице <Link to="/audits?view=rules">Проверки → Правила</Link>.</p>
      </Section>

      <Section title="Журнал продукта" note="Что менялось на экранах. Строки пишет проверка сама — руками журнал не ведётся.">
        {journal.length ? (
          <div className="d-tablewrap"><table className="d-table">
            <thead><tr><th>Когда</th><th>Экран</th><th>Что произошло</th></tr></thead>
            <tbody>{journal.map((x, i) => <tr key={i}><td>{x.date}</td><td>{screenByKey[x.screen]?.name ?? x.screen}</td><td>{x.what}</td></tr>)}</tbody>
          </table></div>
        ) : <p className="d-prose d-muted">Пока пусто.</p>}
      </Section>
    </article>
  );
}
