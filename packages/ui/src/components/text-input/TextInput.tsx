import { Label } from "../label";
import { ErrorMessage } from "../error-message";
import { Icon, type IconName } from "../../icons/icons";
import "./text-input.css";

export type TextInputProps = {
  /** id поля — связывает подпись, поле и ошибку. */
  id: string;
  /** Подпись над полем. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Тип ввода: от него зависит клавиатура на телефоне и проверка браузера. */
  type?: "text" | "email" | "tel" | "number";
  /** Пример значения, а не инструкция: «name@company.ru». */
  placeholder?: string;
  required?: boolean;
  /** Подсказка справа от подписи. */
  hint?: string;
  /** Текст ошибки. Задан — поле подсвечено, под ним сообщение. */
  error?: string;
  disabled?: boolean;
  /** Иконка внутри поля слева. */
  icon?: IconName;
};

export function TextInput({ id, label, value, onChange, type = "text", placeholder, required = false, hint, error, disabled = false, icon }: TextInputProps) {
  const errId = error ? `${id}-error` : undefined;
  return (
    <div className="ds-field" data-component="TextInput">
      <Label htmlFor={id} required={required} hint={hint}>{label}</Label>
      <div className={`ds-text-input${error ? " ds-text-input--invalid" : ""}${icon ? " ds-text-input--with-icon" : ""}`}>
        {icon ? <span className="ds-text-input__icon"><Icon name={icon} size={16} /></span> : null}
        <input id={id} type={type} value={value} placeholder={placeholder} required={required} disabled={disabled}
          aria-invalid={error ? true : undefined} aria-describedby={errId}
          onChange={(e) => onChange(e.target.value)} />
      </div>
      {error ? <ErrorMessage id={errId}>{error}</ErrorMessage> : null}
    </div>
  );
}
