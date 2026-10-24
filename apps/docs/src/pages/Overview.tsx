import { useState } from "react";
import { Link } from "react-router-dom";
import { brandById, levelLabel, levelMeaning, lint, plural, productById, screenByKey, snapshot, typecheck } from "../data";
import { Badge, CompLink, LevelPill, PageHead, Section, Stamp } from "../ui";
import { BrandProducts } from "../ProductCard";
import type { Level } from "../types";

const C = snapshot.components;
const N = C.length;
const order = { stable: 0, ready: 1, draft: 2 } as const;

export function OverviewPage() {
  const t = snapshot.totals;
  const awaiting = C.filter((c) => c.maturity.missing.length === 1 && c.maturity.missing[0] === "Контракт сверен человеком");
  const awaitingMore = C.filter((c) => c.maturity.missing.includes("Контракт сверен человеком") && c.maturity.missing.length > 1);
  const drafts = C.filter((c) => c.maturity.level === "draft");
  const ownProblems = C.filter((c) => c.tokens.violations.length || c.api.open.length || c.api.inlineStyles.length);
  const latest = snapshot.history[0];
  const breakFigma = latest?.changes.filter((x) => x.grade.figma === "breaking").length ?? 0;
  const breakCode = latest?.changes.filter((x) => x.grade.code === "breaking").length ?? 0;
  const typesOk = typecheck.projects.every((p) => p.ok);

  return (
    <article className="d-page">
      <PageHead title="ds-proto" lead={<p>Общая база знаний дизайн-системы. Компоненты и их правила — одни на все бренды. Бренд добавляет тон голоса, изображения, свои токены и слова. Каждый продукт живёт под одним брендом.</p>}>
        <Stamp />
      </PageHead>

      <Section title="Найди своё" note="Бренд — с чем работает команда бренда. Продукт — с чем работает команда продукта.">
        {snapshot.brands.map((b) => <BrandProducts key={b.id} brand={b.id} name={b.name} tagline={b.tagline} products={snapshot.products.filter((p) => p.brand === b.id)} />)}
        <p className="d-bprod__off">Следующий бренд появится здесь со своими продуктами.</p>
      </Section>

      <Section title="Дела продуктов" note="У каждой команды — своё. Сюда смотрит команда продукта перед тем, как сдавать работу.">
        <div className="d-todo-grid">
          {snapshot.products.map((p) => {
            const fresh = lint.findings.filter((f) => f.product === p.id && f.state === "fresh");
            const debt = lint.findings.filter((f) => f.product === p.id && f.state === "frozen");
            const unknown = lint.notChecked.filter((u) => u.product === p.id);
            const types = typecheck.projects.find((x) => x.project === p.dir);
            const noPattern = p.screens.filter((k) => !screenByKey[k]?.pattern);
            const items: [string, string, "bad" | "warn" | "ok"][] = [];
            if (fresh.length) items.push([`${fresh.length} ${plural(fresh.length, "нарушение надо", "нарушения надо", "нарушений надо")} исправить`, `/audits?product=${p.id}`, "bad"]);
            for (const d of debt) items.push([`Отложено в долг: ${d.message.replace(/\s*\(.*\)$/, "").toLowerCase()} — ${screenByFile(d.file)}`, `/audits?product=${p.id}`, "warn"]);
            if (unknown.length) items.push([`${unknown.length} ${plural(unknown.length, "место", "места", "мест")} машина не смогла проверить`, `/audits?product=${p.id}&view=unchecked`, "warn"]);
            if (types && !types.ok) items.push([`Ошибки типов: ${types.errors.length}`, `/audits?product=${p.id}`, "bad"]);
            if (noPattern.length) items.push([`${noPattern.length} ${plural(noPattern.length, "экран", "экрана", "экранов")} без шаблона`, `/products/${p.id}`, "warn"]);
            return (
              <section key={p.id} className="d-todo">
                <header><Link to={`/products/${p.id}`}><b>{p.name}</b></Link><span className="d-muted">{brandById[p.brand]?.name}</span></header>
                <ul>
                  {items.map(([text, to, tone], i) => <li key={i} className={`d-todo__item d-todo__item--${tone}`}><Link to={to}>{text}</Link></li>)}
                  {!items.length ? <li className="d-todo__item d-todo__item--ok">Всё чисто: нарушений нет, всё проверено</li> : null}
                  {items.length && items.every(([, , tone]) => tone !== "bad") ? <li className="d-todo__item d-todo__item--ok">Новых нарушений нет{types?.ok ? ", типы в порядке" : ""}</li> : null}
                </ul>
              </section>
            );
          })}
        </div>
      </Section>

      <Section title="Дела системы" note="Для владельца системы: что держит компоненты внизу лестницы и что изменилось.">
        <ul className="d-todo d-todo--wide">
          {awaiting.length ? <li className="d-todo__item d-todo__item--warn"><Link to="/overview/levels">{awaiting.length} {plural(awaiting.length, "компонент станет стабильным", "компонента станут стабильными", "компонентов станут стабильными")}, как только ты сверишь {awaiting.length === 1 ? "его контракт" : "их контракты"}{awaitingMore.length ? `; ещё ${awaitingMore.length} ${plural(awaitingMore.length, "ждёт", "ждут", "ждут")} сверки и других проверок` : ""}</Link></li> : null}
          {drafts.length ? <li className="d-todo__item d-todo__item--warn"><Link to="/overview/levels?level=draft">{drafts.length} {plural(drafts.length, "черновик", "черновика", "черновиков")}: {drafts.map((c) => c.name).join(", ")}</Link></li> : null}
          {ownProblems.length ? <li className="d-todo__item d-todo__item--bad"><Link to="/audits">{ownProblems.length} {plural(ownProblems.length, "компонент нарушает", "компонента нарушают", "компонентов нарушают")} правила системы внутри себя: {ownProblems.map((c) => c.name).join(", ")}</Link></li> : null}
          {snapshot.candidates.filter((c) => c.state.startsWith("заявлен")).length ? <li className="d-todo__item d-todo__item--warn"><Link to="/components/candidates">Кандидаты ждут разбора</Link></li> : null}
          {snapshot.patternProblems.map((x) => <li key={x} className="d-todo__item d-todo__item--bad"><Link to="/components/patterns">{x}</Link></li>)}
          {latest ? <li className="d-todo__item"><Link to="/changes">Последний снимок {latest.date}: {latest.changes.length} {plural(latest.changes.length, "изменение", "изменения", "изменений")}{breakFigma || breakCode ? `, ломает макеты: ${breakFigma}, код: ${breakCode}` : ", ничего не ломает"}</Link></li> : null}
          {typesOk ? null : <li className="d-todo__item d-todo__item--bad"><Link to="/audits">Ошибки типов в пакете компонентов</Link></li>}
        </ul>
      </Section>

      <Section title="Компоненты" note="Уровень считает машина по проверкам, руками его не поставить." more={<Link to="/overview/levels">Уровни компонентов</Link>}>
        <div className="d-levels">
          {(["stable", "ready", "draft"] as Level[]).map((l) => (
            <Link key={l} to={`/overview/levels?level=${l}`} className="d-levels__item">
              <LevelPill level={l} /><b>{t.levels[l]}</b><span>{levelMeaning[l]}</span>
            </Link>
          ))}
        </div>
      </Section>
    </article>
  );
}

const screenByFile = (file: string) => {
  const s = snapshot.screens.find((x) => x.files.some((f) => file.endsWith(f)));
  return s ? `экран ${s.name}` : file.split("/").pop();
};

// ---------- уровни ----------
const CHECKS: [string, string, string][] = [
  ["Есть в коде", "готов", "компонент существует в packages/ui и собирается"],
  ["Есть описание", "готов", "одна-две фразы: что это и когда нужно"],
  ["Написано, когда применять и когда нет", "готов", "списки «так» и «не так», у «не так» — чем заменить"],
  ["Есть контракт", "готов", "правила применения человеческим языком, у каждого — кто следит"],
  ["Только семантические токены", "готов", "ни одного цвета числом: бренд меняет вид без правки компонента"],
  ["Закрытый набор свойств", "готов", "className и style не принимаются: вид меняется только свойствами"],
  ["Есть заметки для генерации кода", "стабилен", "агент знает, как собрать с компонентом код"],
  ["Хотя бы одно правило держит машина или сам компонент", "стабилен", "контракт не только на честном слове"],
  ["Нет нарушений в продукте", "стабилен", "ни новых нарушений, ни долга по правилам компонента"],
  ["Контракт сверен человеком", "стабилен", "владелец прочитал контракт и вписал имя и дату"],
];

export function LevelsPage() {
  const params = new URLSearchParams(location.hash.split("?")[1] ?? "");
  const [level, setLevel] = useState<Level | "all">((params.get("level") as Level) ?? "all");
  const blockers = new Map<string, number>();
  for (const c of C) for (const m of c.maturity.missing) blockers.set(m, (blockers.get(m) ?? 0) + 1);
  const list = C.filter((c) => level === "all" || c.maturity.level === level).sort((a, b) => order[a.maturity.level] - order[b.maturity.level] || a.name.localeCompare(b.name));
  return (
    <article className="d-page">
      <PageHead title="Уровни компонентов" lead={<p>Черновик → готов → стабилен. Уровень считается по проверкам при каждом <code>npm run check</code>. Компонент поднимается, только когда проходят все проверки следующего уровня, и опускается в тот же прогон, если что-то сломалось.</p>}>
        <Stamp />
      </PageHead>

      <Section title="Что мешает подняться" note="Сколько компонентов упирается в каждую проверку.">
        <div className="d-blockers">
          {[...blockers.entries()].sort((a, b) => b[1] - a[1]).map(([label, k]) => (
            <div key={label} className="d-blockers__item"><b>{k}</b><span>{label}</span></div>
          ))}
        </div>
      </Section>

      <Section title="По компонентам">
        <div className="d-filterbar" role="radiogroup" aria-label="Уровень">
          {(["all", "stable", "ready", "draft"] as const).map((l) => (
            <button key={l} type="button" role="radio" aria-checked={level === l} className="d-chipbtn" onClick={() => setLevel(l)}>
              {l === "all" ? `Все ${N}` : <>{levelLabel[l]} {snapshot.totals.levels[l]}</>}
            </button>
          ))}
        </div>
        <div className="d-tablewrap">
          <table className="d-table">
            <thead><tr><th>Компонент</th><th>Уровень</th><th>Чего не хватает до следующего</th></tr></thead>
            <tbody>{list.map((c) => (
              <tr key={c.name}>
                <td><CompLink name={c.name} /></td>
                <td><LevelPill level={c.maturity.level} /></td>
                <td>{c.maturity.missing.length ? c.maturity.missing.join(" · ") : <span className="d-muted">ничего — верхний уровень</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      <Section title="Что значит каждая проверка" note="Уровни идут по порядку: чтобы стать стабильным, компонент сначала проходит все проверки готового.">
        {([["готов", "Чтобы стать готовым"], ["стабилен", "Чтобы стать стабильным"]] as const).map(([lvl, title]) => (
          <div key={lvl}>
            <h3 className="d-h3">{title}</h3>
            <div className="d-tablewrap">
              <table className="d-table">
                <thead><tr><th>Проверка</th><th>Что значит</th></tr></thead>
                <tbody>{CHECKS.filter(([, b]) => b === lvl).map(([a, , c]) => <tr key={a}><td>{a}</td><td>{c}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        ))}
      </Section>
    </article>
  );
}

// ---------- готовность для агента ----------
export function AgentPage() {
  const mark = (ok: boolean) => (ok ? <Badge tone="good">есть</Badge> : <Badge tone="attention">нет</Badge>);
  return (
    <article className="d-page">
      <PageHead title="Готовность для агента" lead={<p>Что агент может узнать из системы и не выдумать. Агент читает те же файлы, что показывает витрина: снимок, контракты, тексты бренда. Сам сгенерированный код здесь не оценивается — его проверяет линтер в продукте.</p>} />

      <Section title="Что получает агент" note="Пакет собирается отдельно на каждый бренд: команде одного бренда чужие бренды не нужны.">
        <div className="d-rows">
          {snapshot.brands.map((b) => (
            <div key={b.id} className="d-row">
              <span className="d-brand-chip" aria-hidden>{b.name[0]}</span>
              <div className="d-row__main"><b>Пакет бренда {b.name}</b><span className="d-muted">CLAUDE.md, общая система, тексты {b.name}, продукты: {b.products.map((p) => productById[p]?.name).join(", ")}</span></div>
              <Link to={`/brands/${b.id}?tab=package`}>Что внутри</Link>
              <a className="d-download" href={`./packages/${b.id}/agent-context.zip`} download>Скачать</a>
            </div>
          ))}
        </div>
        <ul className="d-list">
          <li><code>CLAUDE.md</code> — правила работы: собирать только из системы, чего нет — заявлять кандидата, перед «готово» — <code>npm run check</code></li>
          <li><code>system/generated/snapshot.json</code> — компоненты, свойства, уровни, где что используется</li>
          <li><code>system/core/contracts/</code> — правила применения: что помнить самому и что подстраховано</li>
          <li><code>system/core/patterns/</code> — шаблоны экранов: с них начинается любой новый экран</li>
          <li><code>system/core/code-rules.json</code>, <code>rules.json</code> бренда и продукта — правила кода, которые ловит проверка</li>
          <li><code>system/brands/&lt;id&gt;/</code> — тон голоса, словарь, правила изображений, слова и картинки для компонентов</li>
        </ul>
      </Section>

      <Section title="Что описано у компонентов">
        <div className="d-tablewrap">
          <table className="d-table">
            <thead><tr><th>Компонент</th><th>Описание</th><th>Когда применять</th><th>Правила</th><th>Заметки для кода</th><th>Примеры</th></tr></thead>
            <tbody>{C.map((c) => (
              <tr key={c.name}>
                <td><CompLink name={c.name} /></td>
                <td>{mark(c.description.length > 40)}</td>
                <td>{mark(!!c.guidance)}</td>
                <td>{c.contract ? `${c.contract.rules.length}` : mark(false)}</td>
                <td>{mark(c.codegen.length > 0)}</td>
                <td>{c.examples.length || mark(false)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>
    </article>
  );
}

// ---------- кому что ----------
const ROLES: [string, string[]][] = [
  ["Дизайнеру", ["Компоненты: потрогай компонент на холсте, прочитай «когда применять» и правила с примерами «так / не так».", "Нужного нет — заведи кандидата, не рисуй своё.", "Бренд: тон голоса, словарь и правила изображений — для макетов и текстов в них.", "Изменения: столбец «Для макетов» говорит, что изменение делает с твоими макетами."]],
  ["Разработчику", ["Свойства, «для кода и агента», зависимости и «что заденет правка».", "Перед слиянием — npm run check: токены, линтер, снимок.", "Изменения: столбец «Для кода» говорит, какие вызовы придётся править."]],
  ["Агенту", ["Пакет своего бренда со страницы бренда или вся папка system/ и CLAUDE.md в репозитории.", "Собирает экраны только из готовых и стабильных компонентов, чего нет — заявляет кандидата."]],
  ["Автору текстов", ["Бренд → тон голоса и словарь.", "Бренд → формулировки компонентов: какие слова бренд вписывает в общие компоненты."]],
  ["Владельцу системы", ["Проверки: новые нарушения, долг, что машина не может проверить.", "Уровни: какие контракты ждут сверки — вписать имя и дату в «Сверено человеком».", "Кандидаты: разобрать заявки."]],
];
export function RolesPage() {
  return (
    <article className="d-page">
      <PageHead title="Кому что" lead={<p>Одна витрина, разные вопросы. Здесь — с чего начать каждому.</p>} />
      <div className="d-roles">
        {ROLES.map(([role, items]) => (
          <section key={role} className="d-role">
            <h2>{role}</h2>
            <ul className="d-list">{items.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
        ))}
      </div>
      <p className="d-prose d-muted">Брендов сейчас {snapshot.brands.length}: {snapshot.brands.map((b) => brandById[b.id]?.name).join(", ")}.</p>
    </article>
  );
}
