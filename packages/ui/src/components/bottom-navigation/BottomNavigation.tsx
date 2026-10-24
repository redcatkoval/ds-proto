import { useStrings } from "../../strings";
import { NavigationItem, type NavigationItemProps } from "../navigation-item";
import "./bottom-navigation.css";

export type BottomNavigationProps = {
  items: NavigationItemProps[];
};

export function BottomNavigation({ items }: BottomNavigationProps) {
  const s = useStrings();
  return (
    <nav className="ds-bottom-navigation" aria-label={s["nav.sections"]} data-component="BottomNavigation">
      {items.map((it) => <NavigationItem key={it.label} {...it} />)}
    </nav>
  );
}
