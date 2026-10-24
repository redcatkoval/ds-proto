import type { ReactNode } from "react";
import { Icon } from "../../icons/icons";
import "./error-message.css";

export type ErrorMessageProps = {
  /** Что не так и как исправить: «Введите почту в виде name@company.ru». */
  children: ReactNode;
  /** id — чтобы поле сослалось на ошибку через aria-describedby. */
  id?: string;
};

export function ErrorMessage({ children, id }: ErrorMessageProps) {
  return (
    <p className="ds-error-message" id={id} role="alert" data-component="ErrorMessage">
      <Icon name="alert" size={16} />
      <span>{children}</span>
    </p>
  );
}
