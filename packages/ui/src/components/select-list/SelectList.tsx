import { Checkbox } from "../checkbox";
import "./select-list.css";

export type SelectListProps = {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
};

export function SelectList({ label, options, value, onChange }: SelectListProps) {
  const toggle = (v: string, on: boolean) => onChange(on ? [...value, v] : value.filter((x) => x !== v));
  return (
    <fieldset className="ds-select-list" data-component="SelectList">
      <legend style={{ fontWeight: 600, marginBottom: 8 }}>{label}</legend>
      {options.map((o) => (
        <Checkbox key={o.value} label={o.label} checked={value.includes(o.value)} onChange={(on) => toggle(o.value, on)} />
      ))}
    </fieldset>
  );
}
