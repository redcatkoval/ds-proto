import { useStrings } from "../../strings";
import type { ReactNode } from "react";
import { NavigationItem, type NavigationItemProps } from "../navigation-item";
import { Avatar } from "../avatar";
import "./top-navigation.css";

export type TopNavigationProps = {
  /** Название продукта слева. */
  product: string;
  /** Разделы. Три–шесть пунктов. */
  items: NavigationItemProps[];
  /** Имя вошедшего пользователя — для аватара справа. */
  user: string;
  /** Правая часть перед аватаром: поиск, уведомления. */
  actions?: ReactNode;
};

export function TopNavigation({ product, items, user, actions }: TopNavigationProps) {
  const s = useStrings();
  return (
    <header className="ds-top-navigation" data-component="TopNavigation">
      <span className="ds-top-navigation__product">{product}</span>
      <nav aria-label={s["nav.sections"]} className="ds-top-navigation__items">
        {items.map((it) => <NavigationItem key={it.label} {...it} />)}
      </nav>
      <div className="ds-top-navigation__end">
        {actions}
        <Avatar name={user} size="sm" />
      </div>
    </header>
  );
}
