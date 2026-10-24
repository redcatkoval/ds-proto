import { useStrings } from "../../strings";
import "./spinner.css";

export type SpinnerProps = {
  /** Размер. sm — внутри кнопки и строки, md — в пустой области. */
  size?: "sm" | "md";
  /** Что загружается. Читается экранным диктором, на экране не видно. */
  label?: string;
};

export function Spinner({ size = "md", label }: SpinnerProps) {
  const s = useStrings();
  return (
    <span className={`ds-spinner ds-spinner--${size}`} role="status" data-component="Spinner">
      <span className="ds-visually-hidden">{label ?? s["spinner.label"]}</span>
    </span>
  );
}
