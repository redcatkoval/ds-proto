import { Icon } from "../../icons/icons";
import { Label } from "../label";
import { ErrorMessage } from "../error-message";
import "./select.css";

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  /** id поля — связывает подпись, поле и ошибку. */
  id: string;
  /** Подпись над полем. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Варианты. До пятнадцати; больше — нужен поиск, это другой компонент. */
  options: SelectOption[];
  /** Текст пустого значения: «Choose a region». Задан — можно ничего не выбирать. */
  placeholder?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
};

export function Select({ id, label, value, onChange, options, placeholder, required = false, hint, error, disabled = false }: SelectProps) {
  const errId = error ? `${id}-error` : undefined;
  return (
    <div className="ds-field" data-component="Select">
      <Label htmlFor={id} required={required} hint={hint}>{label}</Label>
      <div className={`ds-select${error ? " ds-select--invalid" : ""}`}>
        <select id={id} value={value} required={required} disabled={disabled} aria-invalid={error ? true : undefined} aria-describedby={errId}
          onChange={(e) => onChange(e.target.value)}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="ds-select__chevron" aria-hidden="true"><Icon name="chevron-up-down" size={16} /></span>
      </div>
      {error ? <ErrorMessage id={errId}>{error}</ErrorMessage> : null}
    </div>
  );
}
