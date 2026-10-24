import type { MouseEventHandler } from "react";
import { Icon, type IconName } from "../../icons/icons";
import "./navigation-item.css";

export type NavigationItemProps = {
  /** Название раздела: «Клиенты». */
  label: string;
  href: string;
  icon?: IconName;
  /** Текущий раздел. */
  active?: boolean;
  /** Счётчик непрочитанного или требующего внимания. */
  count?: number;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function NavigationItem({ label, href, icon, active = false, count, onClick }: NavigationItemProps) {
  return (
    <a href={href} onClick={onClick} aria-current={active ? "page" : undefined}
      className={`ds-navigation-item ds-focusable${active ? " ds-navigation-item--active" : ""}`} data-component="NavigationItem">
      {icon ? <Icon name={icon} size={16} /> : null}
      <span>{label}</span>
      {count ? <span className="ds-navigation-item__count">{count}</span> : null}
    </a>
  );
}
