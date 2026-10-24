import { useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Checkbox, DataTable, MiniCard, StatusBadge, Tabs, Tag, TextInput, Toggle } from "@ds/ui";
import { brandById, brandDoc, plural, productById, resolved, snapshot } from "../data";
import { useScope } from "../scope";
import { ProductCard } from "../ProductCard";
import { Badge, CompLink, Markdown, PageHead, Section } from "../ui";

const TABS: [string, string][] = [
  ["about", "Суть"], ["voice", "Тон голоса"], ["glossary", "Словарь"], ["imagery", "Изображения"],
  ["visual", "Визуальный слой"], ["wording", "Формулировки"], ["products", "Продукты"], ["package", "Что отдаём команде"],
];

export function BrandPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const b = id ? brandById[id] : undefined;
  if (!b) return <Navigate to="/brands" replace />;
  const tab = params.get("tab") ?? "about";
  return (
    <article className="d-page">
      <PageHead crumb={<><Link to="/brands">Бренды</Link></>} title={b.name} lead={<p>{b.tagline}</p>}>
        <dl className="d-meta">
          <div><dt>Состояние</dt><dd><Badge tone="good">активный</Badge></dd></div>
          <div><dt>Язык продуктов</dt><dd>{b.language}</dd></div>
          <div><dt>Продукты</dt><dd>{b.products.map((p) => productById[p]?.name).join(", ")}</dd></div>
          <div><dt>Папка</dt><dd><code>system/brands/{b.id}/</code></dd></div>
        </dl>
        {b.problems.length ? <div className="d-callout d-callout--bad">{b.problems.join("; ")}</div> : null}
      </PageHead>
      <div className="d-tabs" role="tablist" aria-label="Разделы бренда">
        {TABS.map(([t, label]) => <button key={t} type="button" role="tab" aria-selected={tab === t} className="d-tab" onClick={() => setParams(t === "about" ? {} : { tab: t }, { replace: true })}>{label}</button>)}
      </div>
      {tab === "about" ? <About id={b.id} /> : null}
      {tab === "voice" ? <Doc id={b.id} file="voice.md" note="Как бренд говорит. Для автора текстов, дизайнера и агента — всё, что пишется в продуктах бренда." /> : null}
      {tab === "glossary" ? <Doc id={b.id} file="glossary.md" note="Одно понятие — одно слово во всех продуктах бренда." /> : null}
      {tab === "imagery" ? <Imagery id={b.id} /> : null}
      {tab === "visual" ? <Visual id={b.id} /> : null}
      {tab === "wording" ? <Wording id={b.id} /> : null}
      {tab === "products" ? <Products id={b.id} /> : null}
      {tab === "package" ? <Package id={b.id} /> : null}
    </article>
  );
}

function About({ id }: { id: string }) {
  const b = brandById[id];
  return (
    <>
      <Section title="Кто мы для пользователя">
        <p className="d-prose">{b.about}</p>
        <p className="d-prose"><b>Аудитория.</b> {b.audience}.</p>
      </Section>
      <Section title="Из чего состоит бренд" note="Бренд — слой поверх общей системы. Компоненты и их правила общие, бренд добавляет своё.">
        <div className="d-brandparts">
          {[
            ["Тон голоса", "как говорим", "voice"], ["Словарь", "какими словами", "glossary"], ["Изображения", "фото, иконки, аватары", "imagery"],
            ["Визуальный слой", `${b.tokenOverrides.length} ${plural(b.tokenOverrides.length, "токен", "токена", "токенов")} бренда, меняют вид ${b.affected.length} ${plural(b.affected.length, "компонента", "компонентов", "компонентов")}`, "visual"],
            ["Формулировки", `${b.strings.length} ${plural(b.strings.length, "слово", "слова", "слов")} внутри общих компонентов`, "wording"],
            ["Продукты", b.products.map((p) => productById[p]?.name).join(", "), "products"],
          ].map(([t, d, tab]) => <Link key={t} to={`/brands/${id}?tab=${tab}`} className="d-card d-card--link"><div className="d-card__label">{t}</div><div className="d-card__note">{d}</div></Link>)}
        </div>
      </Section>
      <Section title="Файлы бренда">
        <ul className="d-list">{b.docs.map((d) => <li key={d.file}><code>{d.file}</code> — {d.title}</li>)}<li><code>system/brands/{id}/brand.json</code> — токены и формулировки</li></ul>
      </Section>
    </>
  );
}

function Doc({ id, file, note }: { id: string; file: string; note: string }) {
  const src = brandDoc(id, file);
  return (
    <Section title={(src && /^#\s+(.+)$/m.exec(src)?.[1]) || file} note={<>{note} Источник: <code>system/brands/{id}/{file}</code></>}>
      {src ? <Markdown src={src} /> : <p className="d-prose d-muted">Файла нет.</p>}
    </Section>
  );
}

function Visual({ id }: { id: string }) {
  const b = brandById[id];
  const { resolvedTheme } = useScope();
  const accent = resolved.brands[id]?.accent;
  const ramp = accent ? resolved.primitives.ramps[accent] : null;
  const [tab, setTab] = useState("details");
  const [view, setView] = useState("week");
  const [on, setOn] = useState(true);
  const [email, setEmail] = useState("ana.ferreira@mail.pt");
  const what: Record<string, string> = { accent: "Акцентный ряд", "font.display": "Шрифт заголовков", "radius.control": "Скругление кнопок и полей", "radius.surface": "Скругление панелей" };
  return (
    <>
      <Section title="Что бренд меняет" note="Ровно четыре токена. Остальные роли — общие для всех брендов.">
        <div className="d-tablewrap"><table className="d-table">
          <thead><tr><th>Что</th><th>Значение</th><th aria-label="Образец" /></tr></thead>
          <tbody>{b.tokenOverrides.map((o) => (
            <tr key={o.key}>
              <td>{what[o.key] ?? o.key}</td><td><code>{o.value.replace(/[{}]/g, "")}</code></td>
              <td>
                {o.key === "accent" && ramp ? <span className="d-mini-ramp">{ramp[resolvedTheme].map((h, i) => <span key={i} style={{ background: h }} />)}</span> : null}
                {o.key === "font.display" ? <span className="ds-root" data-brand={id} style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>Northfield Supply</span> : null}
                {o.key.startsWith("radius") ? <span className="ds-root d-radius" data-brand={id} style={{ borderRadius: `var(--radius-${o.key.split(".")[1]})` }} /> : null}
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      </Section>
      <Section title="Как это выглядит" note="Общие компоненты в бренде — тот же код, что в продуктах.">
        <div className="d-brand-sample ds-root" data-brand={id} data-theme={resolvedTheme}>
          <div className="d-brand-sample__row"><Button variant="primary">Save product</Button><Button>Cancel</Button><StatusBadge tone="success">Paid</StatusBadge><Tag color="accent">Wholesale</Tag></div>
          <Tabs label="Product sections" value={tab} onChange={setTab} items={[{ id: "details", label: "Details" }, { id: "variants", label: "Variants", count: 3 }, { id: "media", label: "Media" }]} />
          <div className="d-brand-sample__grid">
            <TextInput id={`bs-email-${id}`} label="Email" type="email" value={email} onChange={setEmail} />
            <Toggle label="Period" value={view} onChange={setView} options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }]} />
          </div>
          <Checkbox label="Email me about new orders" checked={on} onChange={setOn} />
          <div className="d-brand-sample__grid"><MiniCard title="Revenue" value="€12,480.00" caption="last 30 days" tag={{ label: "+8%", color: "green" }} /><MiniCard title="To fulfil" value="2" caption="paid, not shipped" /></div>
        </div>
      </Section>
      <Section title={`Компоненты, у которых бренд меняет вид: ${b.affected.length}`} note="Они берут акцент, шрифт заголовков или скругление бренда. Остальные выглядят одинаково во всех брендах.">
        <div className="d-chips">{b.affected.map((n) => <CompLink key={n} name={n} />)}</div>
      </Section>
    </>
  );
}

function Wording({ id }: { id: string }) {
  const b = brandById[id];
  const keys = Object.keys(snapshot.baseStrings);
  return (
    <>
      <Section title="Слова внутри общих компонентов" note="Компонент один на все бренды, а его встроенные слова — у каждого бренда свои. Бренд переписывает только то, что звучит не по-его. Источник: brand.json → strings.">
        <div className="d-tablewrap"><table className="d-table">
          <thead><tr><th>Где</th><th>Базовое</th><th>У бренда {b.name}</th><th>Компоненты</th></tr></thead>
          <tbody>{keys.map((k) => {
            const own = b.strings.find((s) => s.key === k);
            const comps = snapshot.components.filter((c) => c.strings.includes(k)).map((c) => c.name);
            return (
              <tr key={k}>
                <td><code>{k}</code></td>
                <td className={own ? "d-muted" : undefined}>{snapshot.baseStrings[k]}</td>
                <td>{own ? <b>{own.value}</b> : <span className="d-muted">как в базе</span>}</td>
                <td>{comps.map((n) => <CompLink key={n} name={n} />)}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      </Section>
      <Section title="Вживую" note="Пустая таблица говорит словами бренда.">
        <div className="d-brand-sample ds-root" data-brand={id}>
          <DataTable label="Orders" columns={[{ key: "order", header: "Order" }, { key: "customer", header: "Customer" }, { key: "total", header: "Total", align: "end" }]} rows={[]} />
        </div>
      </Section>
    </>
  );
}

function Products({ id }: { id: string }) {
  return (
    <Section title="Продукты бренда" note="Продукт живёт под одним брендом: берёт его токены, слова, картинки и тон голоса.">
      <div className="d-pcards">{snapshot.products.filter((p) => p.brand === id).map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </Section>
  );
}

function Package({ id }: { id: string }) {
  const b = brandById[id];
  const base = `./packages/${id}`;
  return (
    <>
      <p className="d-prose">Каждая роль в команде бренда получает своё — и только по своему бренду. Пакеты собираются при каждом <code>npm run check</code>.</p>
      <div className="d-packages">
        <section className="d-package">
          <h3>Агенту</h3>
          <p>Всё, чтобы собирать экраны продуктов {b.name}: правила работы, общая система, тексты бренда и описание продуктов.</p>
          <ul className="d-list"><li><code>CLAUDE.md</code></li><li><code>system/core/</code> — контракты, правила, токены</li><li><code>system/brands/{id}/</code></li><li><code>system/generated/</code> — снимок и отчёт линтера</li><li>product.json продуктов бренда</li></ul>
          <a className="d-download" href={`${base}/agent-context.zip`} download>Скачать архив для агента</a>
        </section>
        <section className="d-package">
          <h3>Разработчику</h3>
          <p>Пакет компонентов общий. От бренда — токены и формулировки.</p>
          <pre className="d-code">{`import "@ds/ui/styles.css";
import { DSProvider } from "@ds/ui";
import brand from "system/brands/${id}/brand.json";

<html data-brand="${id}">
<DSProvider strings={brand.strings}>…</DSProvider>`}</pre>
          <a className="d-download" href={`${base}/tokens.css`} download>Скачать tokens.css бренда</a>
        </section>
        <section className="d-package">
          <h3>Дизайнеру</h3>
          <p>Токены бренда в формате DTCG — их принимают плагины импорта переменных в Figma. Иконки — общие, одним спрайтом.</p>
          <a className="d-download" href={`${base}/tokens.dtcg.json`} download>Скачать токены для Figma</a>
          <a className="d-download" href="./packages/icons.svg" download>Скачать иконки (SVG)</a>
        </section>
        <section className="d-package">
          <h3>Автору текстов</h3>
          <p>Тон голоса, словарь и слова внутри компонентов. Позже здесь же — глоссарий и правила для исследований.</p>
          <a className="d-download" href={`${base}/writing.zip`} download>Скачать тексты бренда</a>
        </section>
      </div>
    </>
  );
}

// Правила изображений по местам, где картинка живёт: продукт, промо, письма, соцсети
function Imagery({ id }: { id: string }) {
  const src = brandDoc(id, "imagery.md") ?? "";
  const intro = src.split(/\n## /)[0].replace(/^#.*\n/, "").trim();
  const channels = src.split(/\n## /).slice(1).map((chunk) => {
    const [title, ...rest] = chunk.split("\n");
    const body = rest.join("\n").trim();
    return { title: title.trim(), body, empty: /^Пока не заведено\.?$/.test(body) };
  });
  return (
    <>
      <Section title="Изображения" note={<>Сами картинки интерфейса — в <Link to="/foundations/illustrations">Фундамент → Иллюстрации</Link>. Источник правил: <code>system/brands/{id}/imagery.md</code></>}>
        {intro ? <Markdown src={intro} /> : null}
        <div className="d-channels">
          {channels.map((c) => (
            <a key={c.title} href={`#ch-${c.title}`} onClick={(e) => { e.preventDefault(); document.getElementById(`ch-${c.title}`)?.scrollIntoView({ behavior: "smooth" }); }} className={`d-channel${c.empty ? " d-channel--empty" : ""}`}>
              <b>{c.title}</b><span>{c.empty ? "пока не заведено" : "правила есть"}</span>
            </a>
          ))}
        </div>
      </Section>
      {channels.map((c) => (
        <section key={c.title} id={`ch-${c.title}`} className={`d-section d-chblock${c.empty ? " d-chblock--empty" : ""}`}>
          <h2 className="d-section__title">{c.title}</h2>
          {c.empty ? <p className="d-prose d-muted">Пока не заведено. Правила появятся здесь, когда бренд начнёт делать картинки для этого места.</p> : <Markdown src={c.body} skipTitle={false} />}
        </section>
      ))}
    </>
  );
}
