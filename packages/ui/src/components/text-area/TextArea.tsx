import { Label } from "../label";
import { ErrorMessage } from "../error-message";
import "./text-area.css";

export type TextAreaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Высота в строках до начала прокрутки. */
  rows?: number;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
};

export function TextArea({ id, label, value, onChange, rows = 4, placeholder, required = false, hint, error, disabled = false }: TextAreaProps) {
  const errId = error ? `${id}-error` : undefined;
  return (
    <div className="ds-field" data-component="TextArea">
      <Label htmlFor={id} required={required} hint={hint}>{label}</Label>
      <div className={`ds-text-area${error ? " ds-text-area--invalid" : ""}`}>
        <textarea id={id} rows={rows} value={value} placeholder={placeholder} required={required} disabled={disabled}
          aria-invalid={error ? true : undefined} aria-describedby={errId}
          onChange={(e) => onChange(e.target.value)} />
      </div>
      {error ? <ErrorMessage id={errId}>{error}</ErrorMessage> : null}
    </div>
  );
}
