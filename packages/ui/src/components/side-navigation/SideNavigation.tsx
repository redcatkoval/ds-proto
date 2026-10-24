import { Avatar } from "../avatar";
import { NavigationItem, type NavigationItemProps } from "../navigation-item";
import { useStrings } from "../../strings";
import "./side-navigation.css";

export type SideNavigationProps = {
  /** Название магазина или рабочего пространства — вверху. */
  workspace: string;
  /** Основные разделы. Не больше восьми. */
  items: NavigationItemProps[];
  /** Служебные разделы внизу: настройки, помощь. Не больше трёх. */
  footerItems?: NavigationItemProps[];
  /** Имя вошедшего сотрудника — внизу, с аватаром. */
  user: string;
};

export function SideNavigation({ workspace, items, footerItems = [], user }: SideNavigationProps) {
  const s = useStrings();
  return (
    <aside className="ds-side-navigation" data-component="SideNavigation">
      <div className="ds-side-navigation__workspace">
        <Avatar name={workspace} size="sm" />
        <span>{workspace}</span>
      </div>
      <nav aria-label={s["sidebar.label"]} className="ds-side-navigation__items">
        {items.map((it) => <NavigationItem key={it.label} {...it} />)}
      </nav>
      {footerItems.length ? (
        <div className="ds-side-navigation__footer">
          {footerItems.map((it) => <NavigationItem key={it.label} {...it} />)}
        </div>
      ) : null}
      <div className="ds-side-navigation__user">
        <Avatar name={user} size="sm" />
        <span>{user}</span>
      </div>
    </aside>
  );
}
