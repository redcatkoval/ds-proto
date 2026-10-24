import { useEffect, useId, useRef, useState } from "react";
import { Icon, type IconName } from "../../icons/icons";
import { IconButton } from "../icon-button";
import "./dropdown-menu.css";

export type DropdownMenuItem = {
  label: string;
  onSelect: () => void;
  icon?: IconName;
  /** Необратимое действие: красное, идёт последним. */
  destructive?: boolean;
  disabled?: boolean;
};

export type DropdownMenuProps = {
  /** Подпись кнопки-троеточия для диктора: «Действия с клиентом». */
  label: string;
  /** Два действия и больше. Одно действие — это Button, а не меню. */
  items: DropdownMenuItem[];
};

export function DropdownMenu({ label, items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();
  // Закрыть и вернуть фокус на кнопку-троеточие: иначе после Escape или выбора фокус падает в body.
  const close = () => { setOpen(false); root.current?.querySelector<HTMLButtonElement>("button")?.focus(); };
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    root.current?.querySelector<HTMLButtonElement>("[role=menuitem]:not(:disabled)")?.focus();
    return () => { document.removeEventListener("mousedown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const list = [...(root.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not(:disabled)") ?? [])];
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    list[(i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length]?.focus();
  };
  return (
    <div className="ds-dropdown-menu" ref={root} data-component="DropdownMenu">
      <IconButton icon="more" label={label} expanded={open} onClick={() => setOpen((v) => !v)} />
      {open ? (
        <div className="ds-dropdown-menu__content" role="menu" id={menuId} aria-label={label} onKeyDown={onKey}
          onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false); }}>
          {items.map((it, i) => (
            <div key={it.label} className="ds-dropdown-menu__row">
              {i > 0 ? <div className="ds-dropdown-menu__separator" role="separator" /> : null}
              <button type="button" role="menuitem" disabled={it.disabled}
                className={`ds-dropdown-menu__item${it.destructive ? " ds-dropdown-menu__item--destructive" : ""}`}
                onClick={() => { close(); it.onSelect(); }}>
                {it.icon ? <Icon name={it.icon} size={16} /> : null}
                <span>{it.label}</span>
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
