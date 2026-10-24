import { useStrings } from "../../strings";
import type { ReactNode } from "react";
import "./label.css";

export type LabelProps = {
  /** Название поля — существительное: «Электронная почта», «Компания». */
  children: ReactNode;
  /** id поля, к которому относится подпись. */
  htmlFor: string;
  /** Поле обязательно. Показывается словом, а не звёздочкой. */
  required?: boolean;
  /** Пояснение справа — формат или подсказка. */
  hint?: string;
};

export function Label({ children, htmlFor, required = false, hint }: LabelProps) {
  const s = useStrings();
  return (
    <label className="ds-label" htmlFor={htmlFor} data-component="Label">
      <span className="ds-label__text">{children}</span>
      {required ? <span className="ds-label__required">{s["label.required"]}</span> : null}
      {hint ? <span className="ds-label__hint">{hint}</span> : null}
    </label>
  );
}
