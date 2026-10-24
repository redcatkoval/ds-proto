import { useStrings } from "../../strings";
import type { ReactNode, MouseEventHandler } from "react";
import { Icon, type IconName } from "../../icons/icons";
import { Spinner } from "../spinner";
import "./button.css";

export type ButtonProps = {
  /** Текст кнопки — глагол, называющий результат: «Сохранить», «Добавить клиента». */
  children: ReactNode;
  /** Роль. primary — одно основное действие области, secondary — остальные, ghost — третьестепенные, danger — необратимое. */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** Размер. sm — в шапках секций, строках и подвалах; md — в формах и пустых состояниях. */
  size?: "sm" | "md";
  /** Иконка перед текстом. Только если она добавляет смысл, а не украшает. */
  icon?: IconName;
  /** Действие выполняется: кнопка недоступна, вместо иконки крутится Spinner. */
  loading?: boolean;
  /** Действие сейчас недоступно. */
  disabled?: boolean;
  /** submit — отправляет форму; только у последней кнопки подвала формы. */
  type?: "button" | "submit";
  /** Ссылка. Если задана, кнопка рисуется как <a> и ведёт по адресу. */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
};

export function Button({
  children, variant = "secondary", size = "sm", icon, loading = false,
  disabled = false, type = "button", href, onClick,
}: ButtonProps) {
  const s = useStrings();
  const cls = `ds-button ds-button--${variant} ds-button--${size} ds-focusable`;
  const inner = (
    <>
      {loading ? <Spinner size="sm" label={s["button.loading"]} /> : icon ? <Icon name={icon} size={16} /> : null}
      <span className="ds-button__label">{children}</span>
    </>
  );
  if (href && !disabled) {
    return <a className={cls} href={href} onClick={onClick} data-component="Button">{inner}</a>;
  }
  return (
    <button className={cls} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
      onClick={onClick} data-component="Button">
      {inner}
    </button>
  );
}
