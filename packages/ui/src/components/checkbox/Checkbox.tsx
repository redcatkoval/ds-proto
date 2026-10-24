import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Icon } from "../../icons/icons";
import "./checkbox.css";

export type CheckboxProps = {
  /** Подпись справа. Нажатие по ней тоже переключает. */
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Выбрана часть: например, в заголовке столбца, когда отмечены не все строки. */
  indeterminate?: boolean;
  disabled?: boolean;
  /** Подпись только для диктора — когда видимая подпись не нужна (строка таблицы). */
  hideLabel?: boolean;
};

export function Checkbox({ label, checked, onChange, indeterminate = false, disabled = false, hideLabel = false }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  const on = checked || indeterminate;
  return (
    <label className={`ds-checkbox${disabled ? " ds-checkbox--disabled" : ""}`} data-component="Checkbox">
      <input ref={ref} type="checkbox" className="ds-visually-hidden" checked={checked} disabled={disabled}
        onChange={(e) => onChange(e.target.checked)} />
      <span className={`ds-checkbox__box${on ? " ds-checkbox__box--on" : ""}`} aria-hidden="true">
        {indeterminate ? <Icon name="minus" size={14} /> : checked ? <Icon name="check" size={14} /> : null}
      </span>
      <span className={hideLabel ? "ds-visually-hidden" : "ds-checkbox__label"}>{label}</span>
    </label>
  );
}
