import type { ReactNode } from "react";
import { Icon } from "../../icons/icons";
import "./filter-chip.css";

export type FilterChipProps = {
  /** Значение фильтра: «Новые», «Мои». */
  children: ReactNode;
  selected: boolean;
  onToggle: (selected: boolean) => void;
  /** Сколько записей подходит — показывается справа. */
  count?: number;
};

export function FilterChip({ children, selected, onToggle, count }: FilterChipProps) {
  return (
    <button type="button" aria-pressed={selected} onClick={() => onToggle(!selected)}
      className={`ds-filter-chip ds-focusable${selected ? " ds-filter-chip--on" : ""}`} data-component="FilterChip">
      {selected ? <Icon name="check" size={14} /> : null}
      <span>{children}</span>
      {count !== undefined ? <span className="ds-filter-chip__count">{count}</span> : null}
    </button>
  );
}
