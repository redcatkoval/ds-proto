import type { ReactNode } from "react";
import "./panel.css";

export type PanelProps = {
  /** Заголовок панели: «Customer», «Summary». Не задан — панель без шапки. */
  title?: string;
  /** Пояснение под заголовком, одна строка. */
  description?: string;
  /** Действия панели справа в шапке: одна кнопка или меню. */
  actions?: ReactNode;
  /** Содержимое без внутренних отступов — для таблицы и списка во всю ширину. */
  flush?: boolean;
  children: ReactNode;
};

export function Panel({ title, description, actions, flush = false, children }: PanelProps) {
  return (
    <section className="ds-panel" data-component="Panel">
      {title || actions ? (
        <header className="ds-panel__header">
          <div className="ds-panel__heading">
            {title ? <h2 className="ds-panel__title">{title}</h2> : null}
            {description ? <p className="ds-panel__description">{description}</p> : null}
          </div>
          {actions ? <div className="ds-panel__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={flush ? "ds-panel__body ds-panel__body--flush" : "ds-panel__body"}>{children}</div>
    </section>
  );
}
