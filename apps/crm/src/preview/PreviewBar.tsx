// Панель предпросмотра. Не часть продукта и не часть системы:
// переключает тему и показывает, где на экране какой компонент.
// Нарочно собрана без компонентов системы — чтобы не попадать в счётчик использований.

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./preview.css";

const DOCS = (import.meta.env.VITE_DOCS_URL as string | undefined) ?? "http://localhost:4321";
const slugOf = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const docsLink = (name: string) => `${DOCS}/#/components/${slugOf(name)}`;

function store(key: string, value?: string) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch { /* хранилище недоступно — живём без него */ }
  return null;
}

type Box = { name: string; chain: string[]; rect: DOMRect };

export function PreviewBar({ brand }: { brand: string }) {
  const params = new URLSearchParams(location.search);
  const [theme, setTheme] = useState(() => params.get("theme") ?? store("admin.theme") ?? "light");
  const [on, setOn] = useState(() => params.get("overlay") === "1");
  const [box, setBox] = useState<Box | null>(null);
  const [onScreen, setOnScreen] = useState<[string, number][]>([]);
  // пришли по ссылке из витрины: этот компонент подсвечен, список свёрнут, чтобы не закрывать экран
  const [target] = useState(() => params.get("focus"));
  const [focus, setFocus] = useState<string | null>(target);
  // список свёрнут всегда при открытии: развёрнутый закрывает кнопки в правом верхнем углу экрана
  const [listOpen, setListOpen] = useState(false);
  const scrolled = useRef(false);
  const loc = useLocation();
  const bar = useRef<HTMLDivElement>(null);
  const embedded = params.get("embed") === "1";

  useEffect(() => { document.documentElement.dataset.theme = theme; store("admin.theme", theme); }, [theme]);
  useEffect(() => { document.documentElement.toggleAttribute("data-pv-on", on); if (!on) setBox(null); }, [on]);

  const recount = useCallback(() => {
    const counts = new Map<string, number>();
    document.querySelectorAll<HTMLElement>("#root [data-component]").forEach((el) => {
      if (bar.current?.contains(el)) return;
      const n = el.dataset.component!;
      counts.set(n, (counts.get(n) ?? 0) + 1);
    });
    setOnScreen([...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
  }, []);
  useEffect(() => {
    recount();
    const mo = new MutationObserver(() => recount());
    mo.observe(document.getElementById("root")!, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [recount, loc.pathname]);

  useEffect(() => {
    if (!on) return;
    const pick = (t: EventTarget | null) => {
      const el = (t as HTMLElement | null)?.closest?.<HTMLElement>("[data-component]");
      if (!el || bar.current?.contains(el)) return null;
      const chain: string[] = [];
      let p = el.parentElement?.closest<HTMLElement>("[data-component]");
      while (p) { chain.push(p.dataset.component!); p = p.parentElement?.closest<HTMLElement>("[data-component]"); }
      return { el, name: el.dataset.component!, chain };
    };
    const move = (e: MouseEvent) => {
      const hit = pick(e.target);
      setBox(hit ? { name: hit.name, chain: hit.chain, rect: hit.el.getBoundingClientRect() } : null);
    };
    const click = (e: MouseEvent) => {
      const hit = pick(e.target);
      if (!hit) return;
      e.preventDefault(); e.stopPropagation();
      window.open(docsLink(hit.name), "_blank", "noopener");
    };
    const hide = () => setBox(null);
    document.addEventListener("mousemove", move, true);
    document.addEventListener("click", click, true);
    window.addEventListener("scroll", hide, true);
    return () => { document.removeEventListener("mousemove", move, true); document.removeEventListener("click", click, true); window.removeEventListener("scroll", hide, true); };
  }, [on]);

  useEffect(() => {
    document.querySelectorAll("[data-pv-focus]").forEach((el) => el.removeAttribute("data-pv-focus"));
    if (focus) document.querySelectorAll(`#root [data-component="${focus}"]`).forEach((el) => el.setAttribute("data-pv-focus", ""));
    // пришли по ссылке «посмотреть в продукте» — один раз доводим до первого места
    if (focus && !scrolled.current) {
      const first = document.querySelector<HTMLElement>("#root [data-pv-focus]");
      if (first) { first.scrollIntoView({ block: "center" }); scrolled.current = true; }
    }
  }, [focus, onScreen]);

  if (embedded) return null;

  return (
    <div ref={bar} className="pv" data-preview>
      {box ? (
        <div className="pv-box" style={{ top: box.rect.top, left: box.rect.left, width: box.rect.width, height: box.rect.height }}>
          <span className={`pv-box__label${box.rect.top < 28 ? " pv-box__label--below" : ""}`}>
            <b>{box.name}</b>{box.chain.length ? <span> в {box.chain.join(" › ")}</span> : null}
          </span>
        </div>
      ) : null}

      {on ? (
        <aside className="pv-panel" aria-label="Компоненты на экране">
          <button type="button" className="pv-panel__head" aria-expanded={listOpen} onClick={() => setListOpen((v) => !v)}>
            На этом экране — {onScreen.length} компонентов <span aria-hidden="true">{listOpen ? "▴" : "▾"}</span>
          </button>
          {target ? (onScreen.some(([n]) => n === target)
            ? <div className="pv-panel__target">Подсвечен <b>{target}</b> — {onScreen.find(([n]) => n === target)?.[1]} на экране</div>
            : <div className="pv-panel__target"><b>{target}</b> сейчас не виден: на этом экране он появляется при условии — загрузка, ошибка, пустой список или открытое окно.</div>) : null}
          {listOpen ? <><ul className="pv-panel__list">
            {onScreen.map(([n, k]) => (
              <li key={n} className={n === target ? "is-target" : undefined} onMouseEnter={() => setFocus(n)} onMouseLeave={() => setFocus(target)}>
                <a href={docsLink(n)} target="_blank" rel="noopener">{n}</a>
                <span>{k}</span>
              </li>
            ))}
          </ul>
          <div className="pv-panel__foot">Нажмите на компонент — откроется его страница на витрине.</div></> : null}
        </aside>
      ) : null}

      <div className="pv-bar">
        <span className="pv-bar__name">Предпросмотр · бренд {brand}</span>
        <div className="pv-seg" role="radiogroup" aria-label="Тема">
          {[["light", "Светлая"], ["dark", "Тёмная"]].map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={theme === v} className="pv-seg__btn" onClick={() => setTheme(v)}>{l}</button>
          ))}
        </div>
        <button type="button" className="pv-toggle" aria-pressed={on} onClick={() => setOn((v) => !v)}>
          {on ? "Скрыть компоненты" : "Показать компоненты"}
        </button>
      </div>
    </div>
  );
}
