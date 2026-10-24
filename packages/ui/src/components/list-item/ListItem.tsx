import type { ReactNode, MouseEventHandler } from "react";
import { Avatar } from "../avatar";
import "./list-item.css";

export type ListItemProps = {
  /** Главное: имя клиента, название сделки. */
  title: string;
  /** Вторая строка: компания, город, последний контакт. */
  description?: string;
  /** Имя для аватара. Не задано — строка без аватара. */
  avatar?: string;
  /** Правая часть: тег статуса, сумма, меню действий. */
  trailing?: ReactNode;
  /** Строка ведёт на страницу записи. */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
};

export function ListItem({ title, description, avatar, trailing, href, onClick }: ListItemProps) {
  const body = (
    <>
      {avatar ? <Avatar name={avatar} size="md" /> : null}
      <span className="ds-list-item__text">
        <span className="ds-list-item__title">{title}</span>
        {description ? <span className="ds-list-item__description">{description}</span> : null}
      </span>
    </>
  );
  return (
    <div className="ds-list-item" data-component="ListItem">
      {href || onClick
        ? <a className="ds-list-item__main ds-focusable" href={href ?? "#"} onClick={onClick}>{body}</a>
        : <span className="ds-list-item__main">{body}</span>}
      {trailing ? <span className="ds-list-item__trailing">{trailing}</span> : null}
    </div>
  );
}
