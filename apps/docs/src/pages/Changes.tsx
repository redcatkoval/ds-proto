import { plural, productById, screenByKey, snapshot } from "../data";
import { CompLink, GradeBadge, PageHead, Section } from "../ui";

export function ChangesPage() {
  return (
    <article className="d-page">
      <PageHead title="Изменения" lead={<p>Что каждый снимок поменял по сравнению с прошлым, новое сверху. У изменения две оценки: что оно делает с макетами в Figma и что — с кодом продуктов. Они расходятся: новое обязательное свойство в макете — мелочь, а в коде ломает каждый вызов.</p>} />
      <div className="d-gradekey">
        <span><GradeBadge g="patch" /></span>
        <span><GradeBadge g="minor" /></span>
        <span><GradeBadge g="breaking" /> — макеты или вызовы придётся поправить руками</span>
      </div>
      {snapshot.history.map((h, hi) => (
        <Section key={h.date + hi} title={h.date} note={`${h.changes.length} ${plural(h.changes.length, "изменение", "изменения", "изменений")}`}>
          <div className="d-tablewrap"><table className="d-table">
            <thead><tr><th>Что изменилось</th><th>Вид</th><th>Для макетов</th><th>Для кода</th></tr></thead>
            <tbody>{h.changes.map((x, i) => (
              <tr key={i}><td><CompLink name={x.component} /> {x.what}{x.detail ? <div className="d-muted">{x.detail}</div> : null}</td><td>{x.type}</td><td><GradeBadge g={x.grade.figma} /></td><td><GradeBadge g={x.grade.code} /></td></tr>
            ))}</tbody>
          </table></div>
        </Section>
      ))}
    </article>
  );
}

export function ProductChangesPage() {
  return (
    <article className="d-page">
      <PageHead title="Изменения в продуктах" lead={<p>Какие экраны появились и какие компоненты на них добавились или ушли. Строки пишет снимок сам — руками журнал не ведётся.</p>} />
      {snapshot.productHistory.map((h, hi) => (
        <Section key={h.date + hi} title={h.date}>
          <div className="d-tablewrap"><table className="d-table">
            <thead><tr><th>Продукт</th><th>Экран</th><th>Что произошло</th></tr></thead>
            <tbody>{h.changes.map((x, i) => {
              const s = screenByKey[x.screen];
              return <tr key={i}><td>{productById[x.product ?? s?.product ?? ""]?.name}</td><td>{s?.name ?? x.screen}</td><td>{x.what}</td></tr>;
            })}</tbody>
          </table></div>
        </Section>
      ))}
    </article>
  );
}
