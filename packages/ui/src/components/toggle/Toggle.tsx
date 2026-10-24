import "./toggle.css";

export type ToggleOption = { value: string; label: string };

export type ToggleProps = {
  /** Что переключаем — для диктора: «Вид списка». */
  label: string;
  /** Два–четыре взаимоисключающих варианта. */
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
};

export function Toggle({ label, options, value, onChange }: ToggleProps) {
  return (
    <div className="ds-toggle" role="radiogroup" aria-label={label} data-component="Toggle">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value}
          className={`ds-toggle__option ds-focusable${o.value === value ? " ds-toggle__option--on" : ""}`}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
