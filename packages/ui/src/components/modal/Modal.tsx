import { useStrings } from "../../strings";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { IconButton } from "../icon-button";
import { Button } from "../button";
import "./modal.css";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Основное действие подвала. Отмена ставится сама. */
  action?: { label: string; onClick: () => void; variant?: "primary" | "danger" };
};

export function Modal({ open, onClose, title, children, action }: ModalProps) {
  const s = useStrings();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="ds-modal" onClose={onClose} aria-labelledby={titleId} data-component="Modal">
      <header className="ds-modal__header">
        <h2 id={titleId} className="ds-modal__title">{title}</h2>
        <IconButton icon="x" label={s["modal.close"]} onClick={onClose} />
      </header>
      <div className="ds-modal__body">{children}</div>
      <footer className="ds-modal__footer">
        <Button variant="secondary" onClick={onClose}>{s["modal.cancel"]}</Button>
        {action ? <Button variant={action.variant ?? "primary"} onClick={action.onClick}>{action.label}</Button> : null}
      </footer>
    </dialog>
  );
}
