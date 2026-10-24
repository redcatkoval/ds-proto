import { useEffect, useRef } from "react";
import "./toast.css";

/** Сколько сообщение видно на экране, мс. Не настраивается. */
const VISIBLE_MS = 4000;

export type ToastProps = {
  /** Что сделано: «Order number copied». null — ничего не показано, область для диктора остаётся на странице. */
  message: string | null;
  /** Сообщение исчезло само. Здесь продукт обнуляет message. */
  onHide: () => void;
};

export function Toast({ message, onHide }: ToastProps) {
  const hide = useRef(onHide);
  hide.current = onHide;

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => hide.current(), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="ds-toast" role="status" aria-live="polite" data-component="Toast">
      {message ? <p className="ds-toast__message">{message}</p> : null}
    </div>
  );
}
