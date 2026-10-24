import type { MouseEventHandler } from "react";
import { Icon, type IconName } from "../../icons/icons";
import "./icon-button.css";

export type IconButtonProps = {
  /** Иконка. */
  icon: IconName;
  /** Подпись: читается диктором и всплывает при наведении. Обязательна — иконка без подписи непонятна. */
  label: string;
  /** ghost — внутри строк и шапок, secondary — когда кнопке нужна граница. */
  variant?: "ghost" | "secondary";
  size?: "sm" | "md";
  disabled?: boolean;
  /** Кнопка раскрывает меню — для дикторов. */
  expanded?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function IconButton({ icon, label, variant = "ghost", size = "sm", disabled = false, expanded, onClick }: IconButtonProps) {
  return (
    <button type="button" className={`ds-icon-button ds-icon-button--${variant} ds-icon-button--${size} ds-focusable`}
      aria-label={label} title={label} disabled={disabled} aria-expanded={expanded} onClick={onClick}
      data-component="IconButton">
      <Icon name={icon} size={size === "sm" ? 16 : 20} />
    </button>
  );
}
