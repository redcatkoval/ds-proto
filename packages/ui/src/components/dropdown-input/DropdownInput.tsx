import { Label } from "../label";
import "./dropdown-input.css";

export type DropdownInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  /** Дополнительные классы. */
  className?: string;
};

export function DropdownInput({ id, label, value, onChange, options, placeholder, className }: DropdownInputProps) {
  return (
    <div className={`ds-field ${className ?? ""}`} data-component="DropdownInput">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className="ds-dropdown-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {placeholder ? <option value="" disabled>{placeholder}</option> : null}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
