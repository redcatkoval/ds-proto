import { Link, useSearchParams } from "react-router-dom";
import { brandById, byName, levelOfRule, lint, productById, ruleTitle, screenByKey, screenForFile, screenUrl, snapshot, typecheck } from "../data";
import { Card, CompLink, ExtLink, PageHead, Section } from "../ui";
import type { Finding } from "../types";

// «Посмотреть в продукте»: экран, где лежит файл, с подсветкой компонента
function See({ file, component }: { file: string; component?: string | null }) {
  const key = screenForFile(file);
  if (!key) return <span className="d-muted">—</span>;
  return <ExtLink href={screenUrl(key, `overlay=1${component ? `&focus=${component}` : ""}&`)}>{screenByKey[key]?.name}</ExtLink>;
}

const what = (x: Finding) => (x.component ? <CompLink name={x.component} /> : <span className="d-chip d-chip--rule">{ruleTitle(x.rule)}</span>);

export function AuditsPage() {
  const [params, setParams] = useSearchParams();
  const only = params.get("component");
  const product = params.get("product");
  const view = params.get("view") ?? "queue";
  const keep = <T extends { component: string | null; product?: string | null }>(x: T) => (!only || x.component === only) && (!product || x.product === product);
  const fresh = lint.findings.filter((x) => x.state === "fresh").filter(keep);
  const debt = lint.findings.filter((x) => x.state === "frozen").filter(keep);
  const unknown = lint.notChecked.filter(keep);
  const own = product ? [] : snapshot.components.filter((c) => !only || c.name === only).flatMap((c) => [
    ...c.tokens.violations.map((v) => ({ c: c.name, where: `${v.file}:${v.line}`, text: `цвет числом ${v.text} вместо токена` })),
    ...c.api.open.map((p) => ({ c: c.name, where: c.files.component, text: `открытое свойство ${p}: вид можно поменять в обход системы` })),
    ...c.api.inlineStyles.map((s) => ({ c: c.name, where: `${c.files.component}:${s.line}`, text: "инлайн-стиль в разметке компонента" })),
  ]);
  const typeErrors = typecheck.projects.filter((p) => !product || p.project === productById[product]?.dir).flatMap((p) => p.errors);
  const set = (k: string, v: string | null) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n, { replace: true }); };

  return (
    <article className="d-page">
      <PageHead title="Проверки" lead={<p>Что нашла машина при последнем <code>npm run check</code> ({lint.date}): в коде продуктов и в самих компонентах. Каждый прогон перечитывает всё заново.</p>} />
      <div className="d-filterbar">
        <div className="d-seg" role="radiogroup" aria-label="Что показать">
          {[["queue", "Что делать"], ["unchecked", "Не проверено"], ["rules", "Правила"]].map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => set("view", v === "queue" ? null : v)}>{l}</button>)}
        </div>
        <div className="d-seg" role="radiogroup" aria-label="Продукт">
          <button type="button" role="radio" aria-checked={!product} onClick={() => set("product", null)}>Все продукты</button>
          {snapshot.products.map((p) => <button key={p.id} type="button" role="radio" aria-checked={product === p.id} onClick={() => set("product", p.id)}>{p.name}</button>)}
        </div>
        {only ? <span className="d-muted">Только <CompLink name={only} /> · <button type="button" className="d-linkbtn" onClick={() => set("component", null)}>показать всё</button></span> : null}
      </div>

      {view === "queue" ? (
        <>
          <div className="d-cards">
            <Card label="Надо исправить: в продуктах и в компонентах" value={fresh.length + own.length + typeErrors.length} tone={fresh.length + own.length + typeErrors.length ? "attention" : "good"} />
            <Card label="Отложено в долг" value={debt.length} tone={debt.length ? "attention" : "good"} />
            <Card label="Машина не смогла проверить" value={unknown.length} tone="pending" to="/audits?view=unchecked" />
            <Card label="Ошибки типов" value={typeErrors.length} tone={typeErrors.length ? "attention" : "good"} />
          </div>
          <Section title="1. Исправить" note="Чинится кодом, без обсуждения.">
            {fresh.length || own.length || typeErrors.length ? (
              <div className="d-tablewrap"><table className="d-table">
                <thead><tr><th>О чём</th><th>Что не так</th><th>Где в коде</th><th>Посмотреть в продукте</th></tr></thead>
                <tbody>
                  {fresh.map((x) => <tr key={x.file + x.line + x.rule}><td>{what(x)}</td><td>{x.message}</td><td><code>{x.file}:{x.line}</code></td><td><See file={x.file} component={x.component} /></td></tr>)}
                  {own.map((x, i) => <tr key={i}><td><CompLink name={x.c} /></td><td>{x.text}</td><td><code>{x.where}</code></td><td><span className="d-muted">внутри компонента</span></td></tr>)}
                  {typeErrors.map((e, i) => <tr key={`t${i}`}><td><span className="d-chip d-chip--rule">Типы</span></td><td colSpan={3}><code>{e}</code></td></tr>)}
                </tbody>
              </table></div>
            ) : <p className="d-prose d-muted">Нечего исправлять.</p>}
          </Section>
          <Section title="2. Отложено в долг" note="Нарушения, которые решили пока не чинить. Попадают сюда только решением человека.">
            {debt.length ? (
              <div className="d-tablewrap"><table className="d-table">
                <thead><tr><th>О чём</th><th>Что не так</th><th>Где в коде</th><th>Посмотреть в продукте</th></tr></thead>
                <tbody>{debt.map((x) => <tr key={x.file + x.line}><td>{what(x)}</td><td>{x.message}</td><td><code>{x.file}:{x.line}</code></td><td><See file={x.file} component={x.component} /><div className="d-muted">{x.product ? productById[x.product]?.name : ""}</div></td></tr>)}</tbody>
              </table></div>
            ) : <p className="d-prose d-muted">Долга нет.</p>}
          </Section>
          <Section title="3. Решить человеку" note="Правило проверки и текст контракта разошлись — машина такие правила не запускает, пока человек не решит, кто прав.">
            {lint.anchorsBroken.length ? <ul className="d-list">{lint.anchorsBroken.map((b) => <li key={b.rule}>{b.component ? <CompLink name={b.component} /> : b.rule} — {b.why}</li>)}</ul> : <p className="d-prose d-muted">Всё сходится.</p>}
          </Section>
        </>
      ) : null}

      {view === "unchecked" ? (
        <Section title="Машина не смогла проверить" note="Это не «чисто», а «неизвестно»: значение в переменной, список из .map(), подпись собрана из данных. Такие места смотрит человек.">
          {unknown.length ? (
            <div className="d-tablewrap"><table className="d-table">
              <thead><tr><th>Компонент</th><th>Почему не проверить</th><th>Где в коде</th><th>Посмотреть в продукте</th></tr></thead>
              <tbody>{unknown.map((x) => <tr key={x.file + x.line + x.rule}><td><CompLink name={x.component} /></td><td>{x.why}</td><td><code>{x.file}:{x.line}</code></td><td><See file={x.file} component={x.component} /></td></tr>)}</tbody>
            </table></div>
          ) : <p className="d-prose d-muted">Всё проверено.</p>}
        </Section>
      ) : null}

      {view === "rules" ? <RulesRegistry /> : null}
    </article>
  );
}

function RulesRegistry() {
  const groups: ["core" | "brand" | "product", string, string][] = [
    ["core", "Общие правила кода", "Для всех продуктов всех брендов. Меняет владелец системы: system/core/code-rules.json."],
    ["brand", "Правила бренда", "Для всех продуктов одного бренда. Меняет автор текстов или владелец бренда: system/brands/<бренд>/rules.json."],
    ["product", "Правила продукта", "Только для одного продукта. Добавляет команда продукта сама: apps/<продукт>/rules.json."],
  ];
  const byComponent = Object.entries(lint.rules.reduce<Record<string, number>>((a, r) => ({ ...a, [r.component]: (a[r.component] ?? 0) + 1 }), {}));
  return (
    <>
      <p className="d-prose">Правила живут в трёх местах — по тому, на кого действуют. Каждое правило видно здесь, на странице своего продукта или бренда, и его читает агент, когда работает в продукте.</p>
      {groups.map(([level, title, note]) => {
        const list = lint.codeRules.filter((r) => r.level === level);
        return (
          <Section key={level} title={title} note={note}>
            {list.length ? (
              <div className="d-tablewrap"><table className="d-table">
                <thead><tr><th>Правило</th><th>Зачем</th><th>Где действует</th><th>Кто добавил</th></tr></thead>
                <tbody>{list.map((r) => (
                  <tr key={r.id}>
                    <td><b>{r.title}</b><div className="d-muted"><code>{r.file}</code></div></td>
                    <td>{r.why}</td>
                    <td>{level === "core" ? "все продукты" : level === "brand" ? `продукты бренда ${brandById[r.file.split("/")[2]]?.name ?? ""}` : r.scope}</td>
                    <td>{r.addedBy}<div className="d-muted">{r.since}</div></td>
                  </tr>
                ))}</tbody>
              </table></div>
            ) : <p className="d-prose d-muted">Пока нет.</p>}
          </Section>
        );
      })}
      <Section title="Правила компонентов" note="Из контрактов: то, что машина может проверить в вызовах компонентов. У каждого — якорь в текст контракта.">
        <div className="d-chips">{byComponent.map(([n, k]) => <Link key={n} className="d-chip" to={`/components/${byName[n]?.slug}#rules`}>{n} · {k}</Link>)}</div>
      </Section>
      <p className="d-prose d-muted">Уровни: {Object.values(levelOfRule).join(" · ")}. Чего машина не проверяет: смысл текстов, удачна ли раскладка, доступность в работе — это правила «Помни сам» в контрактах.</p>
    </>
  );
}
