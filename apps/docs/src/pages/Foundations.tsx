import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Icon, iconGroups, iconNames, type IconName } from "@ds/ui";
import { brandById, byName, copy, illustrationsOf, resolved, snapshot } from "../data";
import { Link } from "react-router-dom";
import { useScope } from "../scope";
import { CompLink, PageHead, Section } from "../ui";

export function FoundationPage() {
  const { page } = useParams();
  switch (page) {
    case "layers": return <Layers />;
    case "primitives-global": return <PrimitivesGlobal />;
    case "primitives-colour": return <PrimitivesColour />;
    case "semantic": return <Semantic />;
    case "typography": return <Typography />;
    case "effects": return <Effects />;
    case "icons": return <Icons />;
    case "illustrations": return <Illustrations />;
    default: return <Navigate to="/foundations/layers" replace />;
  }
}

function Code({ v }: { v: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="d-copy" title="Скопировать" onClick={() => { copy(v); setDone(true); setTimeout(() => setDone(false), 1200); }}>
      <code>{v}</code>{done ? <span className="d-copy__ok">скопировано</span> : null}
    </button>
  );
}

const brandName = (id: string) => brandById[id]?.name ?? id;
const isBrandRole = (cssVar: string) => snapshot.brandDependentTokens.includes(cssVar);

// ---------- слои ----------
function Layers() {
  const { brand } = useScope();
  const b = brandById[brand];
  const example = resolved.semantic.find((s) => s.cssVar === "--color-control-primary-rest");
  const chain = example?.values[brand]?.light.chain ?? [];
  return (
    <article className="d-page">
      <PageHead title="Слои и бренд" lead={<p>Токены устроены в три слоя. Компоненты знают только роли — поэтому бренд меняет вид, не трогая компоненты.</p>} />
      <div className="d-layers">
        <div className="d-layer">
          <span className="d-layer__n">1</span>
          <h3>Примитивы</h3>
          <p>Цветовые ряды по 12 ступеней, отступы, скругления, шрифты. Общие для всех брендов, ни на что не ссылаются.</p>
          <p className="d-muted">{Object.keys(resolved.primitives.ramps).length} цветовых рядов · {Object.keys(resolved.primitives.space).length} отступов</p>
        </div>
        <div className="d-layer d-layer--brand">
          <span className="d-layer__n">2</span>
          <h3>Бренд {b?.name}</h3>
          <p>Берёт из примитивов четыре вещи. Больше бренду менять нельзя — так все бренды остаются одной системой.</p>
          <table className="d-table d-table--compact"><tbody>
            {b?.tokenOverrides.map((o) => <tr key={o.key}><td>{({ accent: "акцентный ряд", "font.display": "шрифт заголовков", "radius.control": "скругление кнопок и полей", "radius.surface": "скругление панелей" } as Record<string, string>)[o.key] ?? o.key}</td><td><code>{o.value.replace(/[{}]/g, "")}</code></td></tr>)}
          </tbody></table>
        </div>
        <div className="d-layer">
          <span className="d-layer__n">3</span>
          <h3>Роли</h3>
          <p>«Фон», «текст слабый», «кнопка основная». {resolved.semantic.length} ролей, из них {snapshot.brandDependentTokens.length} зависят от бренда, остальные общие.</p>
        </div>
      </div>
      <Section title="Как читается цепочка" note="Пример: основная кнопка в светлой теме.">
        <div className="d-chainbig">
          <code>--color-control-primary-rest</code>
          {chain.map((step, i) => <span key={i}><span aria-hidden>→</span><code className={step.startsWith("accent") ? "d-chain__brand" : undefined}>{step}</code></span>)}
          <span className="d-swatch" style={{ background: chain[chain.length - 1] }} />
        </div>
        <p className="d-prose">Роль ссылается на акцент бренда, акцент бренда — на ряд примитивов. Другой бренд возьмёт другой ряд — кнопка перекрасится во всех продуктах этого бренда сама.</p>
      </Section>
      <Section title="Как добавить бренд">
        <ol className="d-steps">
          <li>Папка <code>system/brands/&lt;id&gt;/</code> с <code>brand.json</code>: название, четыре токена бренда, формулировки компонентов.</li>
          <li>Тексты бренда рядом: тон голоса, словарь, изображения.</li>
          <li><code>npm run check</code> — бренд появится здесь в выборе, на странице «Бренды» и в пакетах для команды.</li>
        </ol>
      </Section>
    </article>
  );
}

// ---------- примитивы: общие ----------
function PrimitivesGlobal() {
  const p = resolved.primitives;
  return (
    <article className="d-page">
      <PageHead title="Примитивы — общие" lead={<p>{Object.keys(p.space).length + Object.keys(p.radius).length + Object.keys(p.font.size).length + Object.keys(p.font.weight).length + Object.keys(p.font.family).length} значений. Компоненты берут отсюда только отступы и размеры шрифта — остальное через роли. Нажмите на код, чтобы скопировать.</p>} />
      <Section title="Отступы">
        <div className="d-tablewrap"><table className="d-table">
          <thead><tr><th>Имя</th><th>Код</th><th>Значение</th><th aria-label="Образец" /></tr></thead>
          <tbody>{Object.entries(p.space).map(([k, v]) => <tr key={k}><td>space/{k}</td><td><Code v={`--space-${k}`} /></td><td>{v}px</td><td><span className="d-bar" style={{ width: v }} /></td></tr>)}</tbody>
        </table></div>
      </Section>
      <Section title="Скругления" note="Компоненты берут скругления через роли: бренд выбирает, какое из этих.">
        <div className="d-tablewrap"><table className="d-table">
          <thead><tr><th>Имя</th><th>Значение</th><th aria-label="Образец" /></tr></thead>
          <tbody>{Object.entries(p.radius).map(([k, v]) => <tr key={k}><td>radius/{k}</td><td>{v === 999 ? "полное" : `${v}px`}</td><td><span className="d-radius" style={{ borderRadius: Math.min(v, 24) }} /></td></tr>)}</tbody>
        </table></div>
      </Section>
      <Section title="Шрифт: размер">
        <div className="d-tablewrap"><table className="d-table">
          <thead><tr><th>Имя</th><th>Код</th><th>Значение</th><th aria-label="Образец" /></tr></thead>
          <tbody>{Object.entries(p.font.size).map(([k, v]) => <tr key={k}><td>font/size/{k}</td><td><Code v={`--font-size-${k}`} /></td><td>{v}px</td><td><span style={{ fontSize: v, lineHeight: 1.2 }}>Order #1042</span></td></tr>)}</tbody>
        </table></div>
      </Section>
      <Section title="Шрифт: насыщенность и семейства">
        <div className="d-tablewrap"><table className="d-table">
          <tbody>
            {Object.entries(p.font.weight).map(([k, v]) => <tr key={k}><td>font/weight/{k}</td><td><Code v={`--font-weight-${k}`} /></td><td>{v}</td><td><span style={{ fontWeight: v }}>Mark as shipped</span></td></tr>)}
            {Object.entries(p.font.family).map(([k, v]) => <tr key={k}><td>font/family/{k}</td><td className="d-muted">через роль</td><td><code>{v.split(",")[0]}</code></td><td><span style={{ fontFamily: v }}>Northfield Supply</span></td></tr>)}
          </tbody>
        </table></div>
      </Section>
    </article>
  );
}

// ---------- примитивы: цвет ----------
function PrimitivesColour() {
  const [view, setView] = useState<"swatches" | "table">("swatches");
  const ramps = resolved.primitives.ramps;
  const used = new Set(Object.values(resolved.brands).map((b) => b.accent));
  return (
    <article className="d-page">
      <PageHead title="Примитивы — цвет" lead={<p>{Object.keys(ramps).length} рядов по 12 ступеней, в светлой и тёмной теме. 1–2 — фоны, 3–5 — подложки, 6–8 — обводки, 9–10 — сплошной цвет, 11–12 — текст. Акцент бренда — целый ряд.</p>} />
      <div className="d-filterbar">
        <div className="d-seg" role="radiogroup" aria-label="Вид">
          {[["swatches", "Образцы"], ["table", "Таблица"]].map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v as "swatches" | "table")}>{l}</button>)}
        </div>
      </div>
      {Object.entries(ramps).map(([name, r]) => (
        <Section key={name} title={name} note={used.has(name) ? `Акцент бренда ${Object.entries(resolved.brands).filter(([, b]) => b.accent === name).map(([id]) => brandName(id)).join(", ")}` : undefined}>
          {view === "swatches" ? (
            <div className="d-ramp2">
              {(["light", "dark"] as const).map((t) => (
                <div key={t} className="d-ramp2__row">
                  <span className="d-ramp2__label">{t === "light" ? "Светлая" : "Тёмная"}</span>
                  {r[t].map((hex, i) => (
                    <button key={i} type="button" className="d-ramp2__cell" style={{ background: hex }} title={`${name}.${i + 1} ${hex} — скопировать`} onClick={() => copy(hex)}>
                      <span style={{ color: i < 8 ? r[t][11] : r[t][0] }}>{i + 1}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="d-tablewrap"><table className="d-table">
              <thead><tr><th>Ступень</th><th>Светлая</th><th>Тёмная</th></tr></thead>
              <tbody>{r.light.map((hex, i) => (
                <tr key={i}><td>{name}/{i + 1}</td><td><span className="d-swatch d-swatch--sm" style={{ background: hex }} /> <Code v={hex} /></td><td><span className="d-swatch d-swatch--sm" style={{ background: r.dark[i] }} /> <Code v={r.dark[i]} /></td></tr>
              ))}</tbody>
            </table></div>
          )}
        </Section>
      ))}
    </article>
  );
}

// ---------- семантика ----------
const sub: Record<string, string> = { background: "Фон", surface: "Поверхность", text: "Текст", stroke: "Обводка", control: "Элементы управления", accent: "Акцент", feedback: "Обратная связь", tag: "Метки" };
function Semantic() {
  const { brand } = useScope();
  const [mode, setMode] = useState<"both" | "light" | "dark">("both");
  const [open, setOpen] = useState<string | null>(null);
  const color = resolved.semantic.filter((s) => s.group === "color");
  const subgroups = [...new Set(color.map((s) => s.name.split(".")[1]))];
  const themes = mode === "both" ? (["light", "dark"] as const) : ([mode] as const);
  const cell = (s: (typeof color)[number], t: "light" | "dark") => {
    const v = s.values[brand]?.[t];
    if (!v) return null;
    const ref = v.chain.length > 2 ? v.chain[v.chain.length - 2] : v.chain[0];
    return <span className="d-semval"><span className="d-swatch d-swatch--sm" style={{ background: v.value }} /><span>{v.chain[0] !== v.value ? <span className={v.chain[0].startsWith("accent") ? "d-chain__brand" : undefined}>{v.chain[0]}</span> : null}{ref !== v.chain[0] && ref !== v.value ? <span className="d-muted"> → {ref}</span> : null} <code>{v.value}</code></span></span>;
  };
  return (
    <article className="d-page">
      <PageHead title="Семантика" lead={<p>{resolved.semantic.length} ролей. Компоненты берут цвет, скругление, шрифт и тень только отсюда. Значение показано для бренда {brandName(brand)}: ссылка на примитив и итоговый цвет. Роли с отметкой «бренд» меняются вместе с брендом.</p>} />
      <div className="d-filterbar">
        <div className="d-seg" role="radiogroup" aria-label="Тема">
          {[["both", "Обе темы"], ["light", "Светлая"], ["dark", "Тёмная"]].map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={mode === v} onClick={() => setMode(v as "both" | "light" | "dark")}>{l}</button>)}
        </div>
      </div>
      {subgroups.map((g) => (
        <Section key={g} title={sub[g] ?? g}>
          <div className="d-tablewrap"><table className="d-table d-table--tokens">
            <thead><tr><th>Роль</th><th>Код</th>{themes.map((t) => <th key={t}>{t === "light" ? "Светлая" : "Тёмная"}</th>)}<th>Кто берёт</th></tr></thead>
            <tbody>{color.filter((s) => s.name.split(".")[1] === g).map((s) => {
              const users = snapshot.tokenUse[s.cssVar] ?? [];
              return (
                <tr key={s.name}>
                  <td>{s.name.split(".").slice(2).join(".")}{isBrandRole(s.cssVar) ? <span className="d-tagmini">бренд</span> : null}</td>
                  <td><Code v={s.cssVar} /></td>
                  {themes.map((t) => <td key={t}>{cell(s, t)}</td>)}
                  <td>
                    {users.length ? <button type="button" className="d-linkbtn" aria-expanded={open === s.name} onClick={() => setOpen(open === s.name ? null : s.name)}>{users.length}</button> : <span className="d-muted">никто</span>}
                    {open === s.name ? <div className="d-chips d-chips--spaced">{users.map((u) => <CompLink key={u} name={u} />)}</div> : null}
                  </td>
                </tr>
              );
            })}</tbody>
          </table></div>
        </Section>
      ))}
    </article>
  );
}

// ---------- типографика ----------
const STYLES: [string, string, number, string, string][] = [
  ["Заголовок страницы", "--font-display", 24, "semibold", "Orders"],
  ["Заголовок панели", "--font-display", 16, "semibold", "Summary"],
  ["Число в карточке", "--font-display", 32, "semibold", "€12,480.00"],
  ["Основной текст", "--font-text", 14, "regular", "Pack the items and add a tracking number."],
  ["Текст в таблице", "--font-text", 13, "regular", "Ana Ferreira · Lisbon, Portugal"],
  ["Подпись", "--font-text", 12, "medium", "Last 7 days"],
  ["Код", "--font-mono", 13, "regular", "MRW-101"],
];
function Typography() {
  const { brand } = useScope();
  const fonts = resolved.semantic.filter((s) => s.group === "font");
  return (
    <article className="d-page">
      <PageHead title="Типографика" lead={<p>Три роли шрифта. Шрифт заголовков выбирает бренд, текст и код — общие. Ниже — как роли складываются в стили продукта бренда {brandName(brand)}.</p>} />
      <Section title="Роли шрифта">
        <div className="d-tablewrap"><table className="d-table">
          <thead><tr><th>Роль</th><th>Код</th><th>Шрифт</th><th aria-label="Образец" /></tr></thead>
          <tbody>{fonts.map((f) => (
            <tr key={f.name}>
              <td>{f.name}{isBrandRole(f.cssVar) ? <span className="d-tagmini">бренд</span> : null}</td>
              <td><Code v={f.cssVar} /></td>
              <td><code>{String(f.values[brand]?.light.value ?? "").split(",")[0]}</code></td>
              <td><span style={{ fontFamily: `var(${f.cssVar})`, fontSize: 18 }}>Northfield Supply</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      </Section>
      <Section title="Стили в продукте" note="Сочетания роли, размера и насыщенности, которые встречаются в компонентах и экранах.">
        <div className="d-specimens">
          {STYLES.map(([name, role, size, weight, sample]) => (
            <div key={name} className="d-specimen">
              <div className="d-specimen__meta"><b>{name}</b><span><code>{role}</code> · {size}px · {weight}</span></div>
              <div style={{ fontFamily: `var(${role})`, fontSize: size, fontWeight: `var(--font-weight-${weight})` as unknown as number, lineHeight: 1.3 }}>{sample}</div>
            </div>
          ))}
        </div>
      </Section>
    </article>
  );
}

// ---------- тени и скругления ----------
function Effects() {
  const { brand } = useScope();
  const shadows = resolved.semantic.filter((s) => s.group === "shadow");
  const radii = resolved.semantic.filter((s) => s.group === "radius");
  return (
    <article className="d-page">
      <PageHead title="Тени и скругления" lead={<p>Две тени — для поверхностей и для того, что поверх. Скругления — четыре роли, два из них выбирает бренд.</p>} />
      <Section title="Тени">
        <div className="d-effects">
          {shadows.map((s) => (
            <div key={s.name} className="d-effect">
              <div className="d-effect__box" style={{ boxShadow: `var(${s.cssVar})` }} />
              <b>{s.name.split(".")[1]}</b><Code v={s.cssVar} />
              <span className="d-muted">{s.name.endsWith("raised") ? "панели, карточки, кнопки secondary" : "меню, окна поверх страницы"}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Скругления">
        <div className="d-effects">
          {radii.map((s) => (
            <div key={s.name} className="d-effect">
              <div className="d-effect__box d-effect__box--radius" style={{ borderRadius: `var(${s.cssVar})` }} />
              <b>{s.name.split(".")[1]}{isBrandRole(s.cssVar) ? <span className="d-tagmini">бренд</span> : null}</b><Code v={s.cssVar} />
              <span className="d-muted">{s.values[brand]?.light.value}</span>
            </div>
          ))}
        </div>
      </Section>
    </article>
  );
}

// ---------- иконки ----------
function Icons() {
  const [size, setSize] = useState(20);
  const [done, setDone] = useState<string | null>(null);
  const pick = (n: IconName) => { copy(n); setDone(n); setTimeout(() => setDone(null), 1200); };
  return (
    <article className="d-page">
      <PageHead title="Иконки" lead={<p>{iconNames.length} иконок, общие для всех брендов. Сетка 20×20, линия 1.5, цвет — от текста. Бренд своих иконок не рисует: нужна новая — заявляется кандидатом в общую систему. Нажмите, чтобы скопировать имя.</p>} />
      <div className="d-filterbar">
        <div className="d-seg" role="radiogroup" aria-label="Размер">
          {[16, 20, 24].map((s) => <button key={s} type="button" role="radio" aria-checked={size === s} onClick={() => setSize(s)}>{s}px</button>)}
        </div>
        <span className="d-muted">В коде: <code>{`<Icon name="receipt" />`}</code> — или свойство icon у кнопок и пунктов меню</span>
      </div>
      {iconGroups.map((g) => (
        <Section key={g.title} title={g.title} note={`${g.icons.length}`}>
          <div className="d-icons">
            {g.icons.map((n) => (
              <button key={n} type="button" className="d-icon" onClick={() => pick(n)} title={`Скопировать «${n}»`}>
                <Icon name={n} size={size} />
                <span>{done === n ? "скопировано" : n}</span>
              </button>
            ))}
          </div>
        </Section>
      ))}
    </article>
  );
}

// ---------- иллюстрации ----------
function Illustrations() {
  const { brand } = useScope();
  const b = brandById[brand];
  const urls = illustrationsOf(brand);
  const users = snapshot.components.filter((c) => c.props.some((p) => p.name === "illustration"));
  const ready = b?.illustrations.filter((x) => x.file).length ?? 0;
  const screenName = (file: string) => snapshot.screens.find((s) => s.files.some((sf) => file.endsWith(sf)))?.name ?? file.split("/").pop();
  return (
    <article className="d-page">
      <PageHead title="Иллюстрации" lead={<p>Места для картинок задаёт система — они общие для всех брендов, как иконки. Картинку в каждое место кладёт бренд. Сейчас показан бренд {b?.name}: {ready} из {b?.illustrations.length ?? 0} мест заполнены. Как и когда картинки ставить — в <Link to={`/brands/${brand}?tab=imagery`}>правилах изображений бренда</Link>.</p>} />
      <Section title="Как это работает">
        <ol className="d-steps">
          <li>Компонент знает место, а не файл: <code>{`<EmptyState illustration="no-results" />`}</code>.</li>
          <li>Продукт подключает картинки своего бренда — и компонент показывает их.</li>
          <li>У бренда нет картинки для места — компонент показывает иконку. Это нормальное состояние, не ошибка.</li>
        </ol>
        <p className="d-prose">Картинки показывают: {users.map((c, i) => <span key={c.name}>{i ? ", " : ""}<CompLink name={c.name} /></span>)}. Файлы — <code>system/brands/{brand}/illustrations/</code>.</p>
      </Section>
      <Section title="Места" note={`${snapshot.illustrationSlots ? Object.keys(snapshot.illustrationSlots).length : 0} мест в системе`}>
        <div className="d-gallery">
          {(b?.illustrations ?? []).map((x) => (
            <figure key={x.slot} className={`d-gallery__item${x.file ? "" : " d-gallery__item--missing"}`}>
              <div className="d-gallery__img">{urls[x.slot] ? <img src={urls[x.slot]} alt="" /> : <span>у бренда нет картинки — будет иконка</span>}</div>
              <figcaption>
                <b>{snapshot.illustrationSlots[x.slot]}</b>
                <code>{x.slot}</code>
                <span className="d-muted">{x.usedIn.length ? `на экранах: ${x.usedIn.map(screenName).join(", ")}` : "в продуктах пока не используется"}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>
      {byName["Modal"]?.maturity.level === "draft" ? <p className="d-prose d-muted">Места «Первый вход», «Настройка завершена» и «Данные не загрузились» ждут компонента окна: Modal пока черновик.</p> : null}
    </article>
  );
}
