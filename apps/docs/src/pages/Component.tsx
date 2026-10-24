import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { byName, bySlug, lastChange, levelMeaning, lint, plural, productById, screenByKey, screenUrl, snapshot } from "../data";
import { CompLink, ExtLink, GradeBadge, LevelPill, PageHead, ResultMark, Rich, Section, Stamp, Badge } from "../ui";
import { Controls, Live, RuleNodes, initialProps } from "../live/Live";
import { useScope } from "../scope";
import type { Component } from "../types";

const ANCHORS: [string, string][] = [
  ["preview", "Превью"], ["usage", "Применение"], ["rules", "Правила"], ["behaviour", "Поведение"], ["dependencies", "Связи"],
  ["level", "Уровень"], ["props", "Свойства"], ["code", "Для кода и агента"], ["brands", "В брендах"], ["changelog", "Изменения"],
];

export function ComponentPage() {
  const { slug } = useParams();
  const c = slug ? bySlug[slug] : undefined;
  if (!c) return <Navigate to="/components" replace />;
  const fresh = lint.findings.filter((f) => f.component === c.name && f.state === "fresh").length;
  const debt = lint.findings.filter((f) => f.component === c.name && f.state === "frozen").length;
  const unknown = lint.notChecked.filter((u) => u.component === c.name).length;
  const own = c.tokens.violations.length + c.api.open.length + c.api.inlineStyles.length;
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <article className="d-page" key={c.slug}>
      <PageHead crumb={<><Link to="/components">Компоненты</Link><span aria-hidden> / </span>{c.group}</>} title={c.name} lead={<p>{c.description}</p>}>
        <dl className="d-meta">
          <div><dt>Дизайн</dt><dd>{c.design === "finished" ? "готов" : "в работе"}</dd></div>
          <div><dt>Уровень</dt><dd><button type="button" className="d-plain" onClick={() => go("level")}><LevelPill level={c.maturity.level} /></button></dd></div>
          <div><dt>Нарушения в продуктах</dt><dd><Link to={`/audits?component=${c.name}`}>{fresh + own ? `${fresh + own} ${plural(fresh + own, "новое", "новых", "новых")}` : "новых нет"}{debt ? `, ${debt} в долге` : ""}{unknown ? `, ${unknown} не проверено` : ""}</Link></dd></div>
          <div><dt>В коде продуктов</dt><dd>{c.usage.direct ? `${c.usage.direct} ${plural(c.usage.direct, "вызов", "вызова", "вызовов")} на ${c.usage.screens.length} ${plural(c.usage.screens.length, "экране", "экранах", "экранах")}` : c.usage.screensIndirect.length ? "внутри других компонентов" : "не используется"}</dd></div>
          <div><dt>Изменён</dt><dd>{lastChange(c.name) ?? "—"}</dd></div>
        </dl>
        <Stamp />
      </PageHead>

      <nav className="d-onpage" aria-label="На странице">
        {ANCHORS.map(([id, label]) => <button key={id} type="button" onClick={() => go(id)}>{label}</button>)}
      </nav>

      <Preview c={c} />

      <Section id="usage" title="Применение" note={c.guidance ? undefined : "Не написано — одна из причин, почему компонент черновик."}>
        {c.guidance ? (
          <div className="d-dodont">
            <div className="d-dodont__col d-dodont__col--do"><h3>Так</h3><ul>{c.guidance.do.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div className="d-dodont__col d-dodont__col--dont"><h3>Не так</h3><ul>{c.guidance.dont.map((x) => <li key={x}>{x}</li>)}</ul></div>
          </div>
        ) : null}
      </Section>

      <Rules c={c} />

      <Section id="behaviour" title="Поведение и доступность">
        {c.behaviour.length ? <ul className="d-list">{c.behaviour.map((x) => <li key={x}><Rich text={x} /></li>)}</ul> : <p className="d-prose d-muted">Не описано.</p>}
        {c.accessibility ? <p className="d-prose"><b>Доступность.</b> {c.accessibility}</p> : null}
      </Section>

      <Links c={c} />
      <Level c={c} />
      <Props c={c} />

      <Section id="code" title="Для кода и агента" note="Это читает агент перед тем, как собрать экран.">
        <pre className="d-code">{`import { ${c.name} } from "@ds/ui";`}</pre>
        {c.codegen.length ? <ul className="d-list">{c.codegen.map((x) => <li key={x}><Rich text={x} /></li>)}</ul> : <p className="d-prose d-muted">Заметок для генерации кода нет.</p>}
        <div className="d-files">
          <code>{c.files.component}</code>{c.files.styles ? <code>{c.files.styles}</code> : null}<code>{c.files.meta}</code>{c.contract ? <code>{c.contract.path}</code> : null}
        </div>
      </Section>

      <InBrands c={c} />
      <Changelog c={c} />
    </article>
  );
}

// ---------- превью ----------
function Preview({ c }: { c: Component }) {
  const { brand, resolvedTheme } = useScope();
  const [example, setExample] = useState(0);
  const [props, setProps] = useState(() => initialProps(c, 0));
  const [theme, setTheme] = useState<"light" | "dark">(resolvedTheme);
  const [event, setEvent] = useState<{ name: string; n: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => { setProps(initialProps(c, example)); }, [c, example]);
  useEffect(() => { setTheme(resolvedTheme); }, [resolvedTheme]);
  const onEvent = (name: string) => {
    setEvent((e) => ({ name, n: (e?.name === name ? e.n : 0) + 1 }));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setEvent(null), 2400);
  };
  return (
    <Section id="preview" title="Превью" note="Компонент живой: нажимайте, вводите, переключайте. Справа — его свойства.">
      <div className="d-playground">
        <div className="d-canvas">
          <div className="d-canvas__bar">
            <div className="d-canvas__examples">
              {c.examples.map((ex, i) => <button key={ex.title} type="button" className="d-chipbtn" aria-pressed={i === example} onClick={() => setExample(i)}>{ex.title}</button>)}
              {!c.examples.length ? <span className="d-muted">Примеров нет — собран из значений по умолчанию</span> : null}
            </div>
            <div className="d-canvas__tools">
              <span className="d-muted">бренд {snapshot.brands.find((b) => b.id === brand)?.name}</span>
              <div className="d-seg d-seg--small" role="radiogroup" aria-label="Тема холста">
                {[["light", "Светлая"], ["dark", "Тёмная"]].map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={theme === v} onClick={() => setTheme(v as "light" | "dark")}>{l}</button>)}
              </div>
            </div>
          </div>
          <div className="d-canvas__stage ds-root" data-theme={theme} data-brand={brand}>
            <Live c={c} props={props} onProps={setProps} onEvent={onEvent} />
          </div>
          <div className="d-canvas__log" aria-live="polite">{event ? <><code>{event.name}</code> сработал{event.n > 1 ? ` · ${event.n} раза` : ""}</> : "Здесь видно, какие события отдаёт компонент."}</div>
        </div>
        <div className="d-props-panel">
          <div className="d-props-panel__head"><span>Свойства</span><button type="button" className="d-linkbtn" onClick={() => setProps(initialProps(c, example))}>Сбросить</button></div>
          <Controls c={c} props={props} onProps={setProps} />
        </div>
      </div>
    </Section>
  );
}

// ---------- правила ----------
// Два списка: «Помни сам» — что держит в голове человек (и агент), «Подстраховано» — что
// соблюдается само: ловит проверка или заложено в компонент.
function Rules({ c }: { c: Component }) {
  const { brand, resolvedTheme } = useScope();
  if (!c.contract) return (
    <Section id="rules" title="Правила" note="Контракта нет. Пока его нет, компонент остаётся черновиком: правила живут только в голове.">
      <span />
    </Section>
  );
  const findings = lint.findings.filter((f) => f.component === c.name);
  const unknown = lint.notChecked.filter((u) => u.component === c.name);
  const broken = lint.anchorsBroken.filter((b) => b.component === c.name);
  const lookup = (name: string) => byName[name];
  const mind = c.contract.rules.filter((r) => r.checkedBy === "человек" || r.checkedBy === "совет" || r.checkedBy === "не указано");
  const safe = c.contract.rules.filter((r) => r.checkedBy === "машина" || r.checkedBy === "компонент");
  const rule = (r: (typeof c.contract.rules)[number]) => {
    const ex = c.ruleExamples[r.id];
    const hits = findings.filter((f) => lint.rules.find((x) => x.id === f.rule)?.anchor.section === r.id);
    return (
      <li key={r.id} className="d-rule">
        <div className="d-rule__head"><h3>{r.title}</h3>{r.checkedBy === "совет" ? <span className="d-rule__tag">совет</span> : null}</div>
        <p className="d-rule__text">{r.text}</p>
        {r.why ? <p className="d-rule__why"><b>Почему:</b> {r.why}</p> : null}
        {ex ? (
          <div className="d-rule__examples ds-root" data-theme={resolvedTheme} data-brand={brand}>
            {ex.do ? <div className="d-ex d-ex--do"><div className="d-ex__label">Так — {ex.do.caption}</div><RuleNodes nodes={ex.do.nodes} lookup={lookup} /></div> : null}
            {ex.dont ? <div className="d-ex d-ex--dont"><div className="d-ex__label">Не так — {ex.dont.caption}</div><RuleNodes nodes={ex.dont.nodes} lookup={lookup} /></div> : null}
          </div>
        ) : null}
        {r.checkedBy === "машина" || r.checkedBy === "компонент" ? <p className="d-rule__who">{r.checkedBy === "машина" ? "Нарушишь — npm run check покажет, где." : "Нарушить нельзя: так устроен сам компонент."}</p> : null}
        {hits.map((h) => <div key={h.file + h.line} className={`d-hit d-hit--${h.state}`}>{h.state === "frozen" ? "Отложено в долг" : "Нарушено"}: <code>{h.file}:{h.line}</code> — {h.message}</div>)}
      </li>
    );
  };
  return (
    <Section id="rules" title="Правила" note={c.contract.summary ?? undefined}>
      <div className="d-rulegroup">
        <h3 className="d-rulegroup__title">Помни сам <span>{mind.length}</span></h3>
        <p className="d-rulegroup__note">Этого машина не проверит — следит человек. Агент читает эти же правила и в отчёте перечисляет, какие учёл.</p>
        {mind.length ? <ol className="d-rules">{mind.map(rule)}</ol> : <p className="d-prose d-muted">Всё, что важно, соблюдается само.</p>}
      </div>
      {safe.length ? (
        <details className="d-rulegroup d-rulegroup--safe" open={findings.length > 0}>
          <summary><span className="d-rulegroup__title">Подстраховано <span>{safe.length}</span></span><span className="d-muted">Соблюдается само: ловит проверка или заложено в компонент. {findings.length ? `Сейчас нарушено: ${findings.length}.` : "Сейчас нарушений нет."}</span></summary>
          <ol className="d-rules">{safe.map(rule)}</ol>
        </details>
      ) : null}
      {c.contract.blind.length || unknown.length || broken.length ? (
        <div className="d-blind">
          <h3>Чего машина не видит</h3>
          <ul className="d-list">
            {c.contract.blind.map((b) => <li key={b}><Rich text={b} /></li>)}
            {broken.map((b) => <li key={b.rule}><b>Правило и контракт разошлись:</b> {b.why}</li>)}
            {unknown.map((u) => <li key={u.file + u.line}>Сейчас не проверено: <code>{u.file}:{u.line}</code> — {u.why}</li>)}
          </ul>
        </div>
      ) : null}
      <p className="d-muted d-small">Контракт: <code>{c.contract.path}</code> · {c.contract.status}{c.contract.reviewed ? ` · сверен: ${c.contract.reviewed}` : ""}</p>
    </Section>
  );
}

// ---------- связи ----------
function Links({ c }: { c: Component }) {
  return (
    <Section id="dependencies" title="Связи" note="Из чего собран, где стоит и что заденет правка. Сплошная линия — напрямую, пунктир — приходит вместе с зависимостью.">
      <Graph c={c} />
      <div className="d-impact">
        <h3>Что заденет правка</h3>
        {c.impact.components.length || c.impact.screens.length ? (
          <p className="d-prose">
            Поменяешь {c.name} — изменятся {c.impact.components.length ? <>компоненты {c.impact.components.map((n, i) => <span key={n}>{i ? ", " : ""}<CompLink name={n} /></span>)}</> : "только его собственные вызовы"}
            {c.impact.screens.length ? <> и {c.impact.screens.length} {plural(c.impact.screens.length, "экран", "экрана", "экранов")} в продуктах.</> : "."}
          </p>
        ) : <p className="d-prose">Ни один компонент и ни один экран от него не зависят.</p>}
      </div>
      {c.usage.screens.length || c.usage.screensIndirect.length ? (
        <div className="d-tablewrap"><table className="d-table">
          <thead><tr><th>Продукт</th><th>Экран</th><th>Как стоит</th><th aria-label="Открыть" /></tr></thead>
          <tbody>
            {[...c.usage.screens.map((k) => [k, true] as const), ...c.usage.screensIndirect.map((k) => [k, false] as const)].map(([k, direct]) => {
              const s = screenByKey[k];
              return (
                <tr key={k}>
                  <td>{productById[s?.product]?.name}</td>
                  <td>{s?.name}</td>
                  <td>{direct ? `напрямую × ${s?.components[c.name]}` : "внутри других"}</td>
                  <td><ExtLink href={screenUrl(k, `overlay=1&focus=${c.name}&`)}>посмотреть в продукте</ExtLink></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      ) : null}
    </Section>
  );
}

function Graph({ c }: { c: Component }) {
  const left = [...c.builtFrom.map((n) => ({ n, direct: true })), ...c.brings.map((n) => ({ n, direct: false }))];
  const right = c.usedIn.map((n) => ({ n, direct: true }));
  const rows = Math.max(left.length, right.length, 1);
  const H = 40, GAP = 12, W = 720, NW = 170;
  const height = rows * H + (rows - 1) * GAP + 24;
  const yOf = (i: number, count: number) => 12 + (height - 24 - (count * H + (count - 1) * GAP)) / 2 + i * (H + GAP);
  const cy = height / 2, cx = W / 2 - NW / 2;
  const node = (name: string, x: number, y: number, kind: "side" | "center", direct: boolean) => {
    const comp = byName[name];
    const g = (
      <g className={`d-gnode d-gnode--${kind}${direct ? "" : " d-gnode--faded"}`}>
        <rect x={x} y={y} width={NW} height={H} rx={8} />
        <circle cx={x + 16} cy={y + H / 2} r={4} className={`d-gdot d-gdot--${comp?.maturity.level ?? "draft"}`} />
        <text x={x + 30} y={y + H / 2 + 5}>{name}</text>
      </g>
    );
    return kind === "center" || !comp ? <g key={name}>{g}</g> : <Link key={name} to={`/components/${comp.slug}`}>{g}</Link>;
  };
  return (
    <div className="d-graph">
      <div className="d-graph__labels"><span>Собран из</span><span /><span>Стоит внутри</span></div>
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`${c.name}: собран из ${left.map((l) => l.n).join(", ") || "ничего"}; стоит внутри ${right.map((r) => r.n).join(", ") || "ничего"}`}>
        {left.map((l, i) => { const y = yOf(i, left.length) + H / 2; return <path key={l.n} className={`d-gedge${l.direct ? "" : " d-gedge--faded"}`} d={`M ${NW} ${y} C ${NW + 60} ${y}, ${cx - 60} ${cy}, ${cx} ${cy}`} />; })}
        {right.map((r, i) => { const y = yOf(i, right.length) + H / 2; return <path key={r.n} className="d-gedge" d={`M ${cx + NW} ${cy} C ${cx + NW + 60} ${cy}, ${W - NW - 60} ${y}, ${W - NW} ${y}`} />; })}
        {left.map((l, i) => node(l.n, 0, yOf(i, left.length), "side", l.direct))}
        {node(c.name, cx, cy - H / 2, "center", true)}
        {right.map((r, i) => node(r.n, W - NW, yOf(i, right.length), "side", true))}
        {!left.length ? <text className="d-gempty" x={NW / 2} y={cy + 4} textAnchor="middle">основа — ни из чего</text> : null}
        {!right.length ? <text className="d-gempty" x={W - NW / 2} y={cy + 4} textAnchor="middle">ни в одном компоненте</text> : null}
      </svg>
    </div>
  );
}

// ---------- уровень ----------
function Level({ c }: { c: Component }) {
  const steps = ["draft", "ready", "stable"] as const;
  const at = steps.indexOf(c.maturity.level);
  const onlyReview = c.maturity.level === "ready" && c.maturity.missing.length === 1 && c.maturity.missing[0] === "Контракт сверен человеком";
  return (
    <Section id="level" title="Уровень" note="Считается по проверкам при каждом прогоне. Новое нарушение в продукте — и уровень опускается сразу.">
      <div className="d-ladder">
        {steps.map((s, i) => (
          <div key={s} className={`d-ladder__step${i <= at ? " d-ladder__step--done" : ""}${i === at ? " d-ladder__step--here" : ""}`}>
            <LevelPill level={s} /><span>{levelMeaning[s]}</span>
          </div>
        ))}
      </div>
      {(["ready", "stable"] as const).map((lvl) => (
        <div key={lvl}>
          <h3 className="d-h3">{lvl === "ready" ? "Чтобы стать готовым" : "Чтобы стать стабильным"}</h3>
          <div className="d-tablewrap"><table className="d-table">
            <thead><tr><th>Проверка</th><th>Сейчас</th><th>Подробно</th></tr></thead>
            <tbody>{c.maturity.checks.filter((x) => x.level === lvl).map((x) => (
              <tr key={x.id}><td>{x.label}</td><td><ResultMark r={x.result} /></td><td className="d-muted">{x.note ?? ""}</td></tr>
            ))}</tbody>
          </table></div>
        </div>
      ))}
      {onlyReview ? <div className="d-callout">До стабильного — один шаг, и он за человеком: прочитать <code>{c.contract?.path}</code> и вписать в «Сверено человеком» имя и дату. Следующий <code>npm run check</code> поднимет уровень.</div> : null}
    </Section>
  );
}

// ---------- свойства ----------
function Props({ c }: { c: Component }) {
  return (
    <Section id="props" title="Свойства" note={c.api.open.length || c.api.inlineStyles.length ? "Набор открыт — это нарушение, из-за него компонент черновик." : "Набор закрыт: className, style и чужие свойства не принимаются."}>
      <div className="d-tablewrap"><table className="d-table">
        <thead><tr><th>Свойство</th><th>Тип</th><th>По умолчанию</th><th>Что это</th></tr></thead>
        <tbody>{c.props.map((p) => (
          <tr key={p.name}>
            <td><code>{p.name}</code>{p.required ? <span className="d-req" title="обязательное"> *</span> : null}</td>
            <td><code className="d-type">{p.options && p.options.length <= 6 ? p.options.map((o) => `"${o}"`).join(" | ") : p.options ? `IconName — ${p.options.length} иконок` : p.type}</code></td>
            <td>{p.default !== undefined ? <code>{String(p.default)}</code> : <span className="d-muted">—</span>}</td>
            <td>{p.doc || <span className="d-muted">нет описания</span>}</td>
          </tr>
        ))}</tbody>
      </table></div>
      <div className="d-tokens">
        <span className="d-muted">Берёт токены:</span>
        {c.tokens.used.map((t) => <Link key={t} to="/foundations/semantic" className={`d-chip d-chip--mono${snapshot.brandDependentTokens.includes(t) ? " d-chip--brand" : ""}`}>{t}</Link>)}
      </div>
      {c.tokens.violations.length ? <ul className="d-list d-list--bad">{c.tokens.violations.map((v) => <li key={v.line + v.text}><code>{v.file}:{v.line}</code> — <code>{v.text}</code>: {v.why}</li>)}</ul> : null}
    </Section>
  );
}

// ---------- в брендах ----------
function InBrands({ c }: { c: Component }) {
  const brandTokens = c.tokens.used.filter((t) => snapshot.brandDependentTokens.includes(t));
  return (
    <Section id="brands" title="В брендах" note="Правила у компонента одни на все бренды. Бренд может поменять вид (через свои токены) и слова внутри компонента.">
      <div className="d-tablewrap"><table className="d-table">
        <thead><tr><th>Бренд</th><th>Что бренд меняет в виде</th><th>Слова и картинки бренда</th></tr></thead>
        <tbody>
          {snapshot.brands.map((b) => (
            <tr key={b.id}>
              <td><Link to={`/brands/${b.id}`}>{b.name}</Link></td>
              <td>{brandTokens.length ? brandTokens.map((t) => <code key={t} className="d-inline-code">{t}</code>) : <span className="d-muted">ничего — вид общий</span>}</td>
              <td>{c.strings.length ? c.strings.map((k) => {
                const own = b.strings.find((s) => s.key === k);
                return <div key={k}><code>{k}</code>: «{own?.value ?? snapshot.baseStrings[k]}»{own ? <Badge tone="good">бренда</Badge> : <span className="d-muted"> базовое</span>}</div>;
              }) : <span className="d-muted">своих слов нет</span>}
              {c.props.some((p) => p.name === "illustration") ? <div>картинки: {b.illustrations.filter((x) => x.file).length} из {b.illustrations.length} мест <Link to="/foundations/illustrations">смотреть</Link></div> : null}</td>
            </tr>
          ))}
          <tr className="d-row--off"><td>Следующий бренд</td><td colSpan={2}>появится строкой, когда бренд будет заведён</td></tr>
        </tbody>
      </table></div>
    </Section>
  );
}

// ---------- изменения ----------
function Changelog({ c }: { c: Component }) {
  const rows = snapshot.history.flatMap((h) => h.changes.filter((x) => x.component === c.name).map((x) => ({ ...x, date: h.date })));
  return (
    <Section id="changelog" title="Изменения" note="Каждое изменение оценено дважды: что оно сделает с макетами в Figma и с кодом продуктов.">
      {rows.length ? (
        <div className="d-tablewrap"><table className="d-table">
          <thead><tr><th>Когда</th><th>Что изменилось</th><th>Вид</th><th>Для макетов</th><th>Для кода</th></tr></thead>
          <tbody>{rows.map((x, i) => (
            <tr key={i}><td>{x.date}</td><td>{x.what}{x.detail ? <div className="d-muted">{x.detail}</div> : null}</td><td>{x.type}</td><td><GradeBadge g={x.grade.figma} /></td><td><GradeBadge g={x.grade.code} /></td></tr>
          ))}</tbody>
        </table></div>
      ) : <p className="d-prose d-muted">Изменений пока нет.</p>}
    </Section>
  );
}
