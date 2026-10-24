import { Link } from "react-router-dom";
import { groups, plural, snapshot } from "../data";
import { LevelPill, PageHead, Section } from "../ui";
import { LiveStatic } from "../live/Live";

export function ComponentsPage() {
  return (
    <article className="d-page">
      <PageHead title="Компоненты" lead={<p>{snapshot.components.length} {plural(snapshot.components.length, "компонент", "компонента", "компонентов")} в {groups.length} {plural(groups.length, "группе", "группах", "группах")}. Все живые — это тот же код, что в продуктах. Черновики тоже здесь: видно, чего им не хватает.</p>} />
      {groups.map((g) => {
        const items = snapshot.components.filter((c) => c.group === g);
        return (
          <Section key={g} title={g} note={`${items.length}`}>
            <div className="d-ccards">
              {items.map((c) => (
                <div key={c.slug} className="d-ccard">
                  <div className="d-ccard__preview" inert>
                    {c.name === "Modal" ? <span className="d-muted">окно поверх страницы</span> : <LiveStatic c={c} />}
                  </div>
                  <div className="d-ccard__body">
                    <div className="d-ccard__name"><Link to={`/components/${c.slug}`}>{c.name}</Link><LevelPill level={c.maturity.level} /></div>
                    <p>{c.description}</p>
                    <div className="d-ccard__meta">{c.usage.direct ? `${c.usage.direct} ${plural(c.usage.direct, "вызов", "вызова", "вызовов")} в коде продуктов` : c.usage.screensIndirect.length ? "внутри других компонентов" : "в продуктах не используется"}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        );
      })}
    </article>
  );
}

const ROUTE: [string, string][] = [
  ["Заявлен", "Кто угодно — дизайнер, разработчик, агент — кладёт файл в system/core/candidates/: где нужен и почему не хватает существующего."],
  ["Разобран", "Владелец системы проверяет: может, хватит существующего компонента или свойства. Тогда кандидат закрывается со ссылкой."],
  ["Принят", "Компонент появляется черновиком: код, описание, короткий контракт. Дальше его поднимают уровни."],
  ["Отклонён", "С причиной. Файл остаётся — чтобы ту же идею не заявляли заново."],
];
export function CandidatesPage() {
  return (
    <article className="d-page">
      <PageHead title="Кандидаты" lead={<p>Чего в системе нет, но где-то уже понадобилось. Агент, собирая экран, не рисует недостающее сам — он заявляет кандидата и собирает экран из того, что есть. Кандидаты общие для всех брендов.</p>} />
      <Section title="Маршрут">
        <ol className="d-route">{ROUTE.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}</ol>
      </Section>
      <Section title={`Заявки: ${snapshot.candidates.length}`}>
        {snapshot.candidates.length ? (
          <div className="d-tablewrap"><table className="d-table">
            <thead><tr><th>Кандидат</th><th>Где нужен</th><th>Чем закрыто сейчас</th><th>Состояние</th></tr></thead>
            <tbody>{snapshot.candidates.map((c) => (
              <tr key={c.id}>
                <td><b>{c.title}</b><div className="d-muted"><code>{c.file}</code></div></td>
                <td>{c.where ?? "—"}</td><td>{c.builtFrom ?? "—"}</td><td>{c.state}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <p className="d-prose d-muted">Пока ни одной.</p>}
      </Section>
    </article>
  );
}
