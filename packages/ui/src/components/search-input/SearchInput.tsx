import { useStrings } from "../../strings";
import { Icon } from "../../icons/icons";
import { IconButton } from "../icon-button";
import "./search-input.css";

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  /** Что ищем: «Поиск по клиентам». Подпись для диктора — на экране её заменяет иконка. */
  label: string;
  placeholder?: string;
};

export function SearchInput({ value, onChange, label, placeholder }: SearchInputProps) {
  const s = useStrings();
  return (
    <div className="ds-search-input" role="search" data-component="SearchInput">
      <span className="ds-search-input__icon"><Icon name="search" size={16} /></span>
      <input type="search" aria-label={label} value={value} placeholder={placeholder ?? label}
        onChange={(e) => onChange(e.target.value)} />
      {value ? <IconButton icon="x" label={s["search.clear"]} onClick={() => onChange("")} /> : null}
    </div>
  );
}
