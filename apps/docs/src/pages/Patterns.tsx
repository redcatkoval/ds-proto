import { Link } from "react-router-dom";
import { productById, screenByKey, screenUrl, snapshot } from "../data";
import { CompLink, ExtLink, PageHead, Section } from "../ui";

// Схема раскладки — условные блоки, чтобы шаблон узнавался с одного взгляда
const SKETCH: Record<string, string[][]> = {
  list: [["head"], ["card", "card", "card", "card"], ["toolbar"], ["table"]],
  record: [["crumbs"], ["head"], ["panel-wide", "panel-side"], ["panel-wide", "panel-side"]],
  form: [["crumbs"], ["head"], ["tabs"], ["panel"], ["panel"], ["footer"]],
  settings: [["head"], ["panel"], ["panel"], ["panel"]],
};

export function PatternsPage() {
  return (
    <article className="d-page">
      <PageHead title="Шаблоны экранов" lead={<p>Готовые раскладки, с которых начинается любой новый экран — у человека и у агента. Шаблон говорит, из каких компонентов и в каком порядке собран экран, и показывает живой пример. Экран в продукте указывает свой шаблон, и проверка следит, чтобы шаблон был.</p>} />
      {snapshot.patternProblems.length ? <div className="d-callout d-callout--bad">{snapshot.patternProblems.join("; ")}</div> : null}
      {snapshot.patterns.map((p) => (
        <Section key={p.slug} id={p.slug} title={p.title} note={p.when ? p.when[0].toUpperCase() + p.when.slice(1) : undefined}>
          <div className="d-pattern">
            <div className="d-sketch" aria-hidden>
              {(SKETCH[p.slug] ?? [["panel"]]).map((row, i) => (
                <div key={i} className="d-sketch__row">{row.map((b, j) => <span key={j} className={`d-sketch__b d-sketch__b--${b}`} />)}</div>
              ))}
            </div>
            <div className="d-pattern__body">
              <ol className="d-steps">{p.steps.map((x) => <li key={x}>{x}</li>)}</ol>
              {p.dont.length ? <><h3 className="d-h3">Не делай</h3><ul className="d-list">{p.dont.map((x) => <li key={x}>{x}</li>)}</ul></> : null}
            </div>
          </div>
          <div className="d-pattern__foot">
            <div><span className="d-muted">Компоненты:</span> <span className="d-chips">{p.components.map((n) => <CompLink key={n} name={n} />)}</span></div>
            <div><span className="d-muted">Экраны по этому шаблону:</span> {p.screens.map((k, i) => {
              const s = screenByKey[k];
              return <span key={k}>{i ? ", " : " "}<Link to={`/products/${s.product}?screen=${encodeURIComponent(k)}`}>{s.name}</Link> <span className="d-muted">({productById[s.product]?.name})</span></span>;
            })}{p.screens[0] ? <> · <ExtLink href={screenUrl(p.screens[0], "overlay=1&")}>открыть пример</ExtLink></> : null}</div>
            <div className="d-muted"><code>{p.file}</code></div>
          </div>
        </Section>
      ))}
    </article>
  );
}
