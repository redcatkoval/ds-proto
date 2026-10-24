import "./switch.css";

export type SwitchProps = {
  /** Что включаем: «Уведомления о новых сделках». */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function Switch({ label, checked, onChange, disabled = false }: SwitchProps) {
  return (
    <label className={`ds-switch${disabled ? " ds-switch--disabled" : ""}`} data-component="Switch">
      <input type="checkbox" role="switch" className="ds-visually-hidden" checked={checked} disabled={disabled}
        onChange={(e) => onChange(e.target.checked)} />
      <span className={`ds-switch__track${checked ? " ds-switch__track--on" : ""}`} aria-hidden="true"><span className="ds-switch__thumb" /></span>
      <span className="ds-switch__label">{label}</span>
    </label>
  );
}
