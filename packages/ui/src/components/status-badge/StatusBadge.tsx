import type { ReactNode } from "react";
import "./status-badge.css";

export type StatusBadgeProps = {
  /** Состояние словами: «Paid», «Awaiting shipment». */
  children: ReactNode;
  /** Тон состояния: success — завершено хорошо, warning — ждёт действия, danger — проблема, info — в процессе, neutral — нейтральное. */
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`ds-status-badge ds-status-badge--${tone}`} data-component="StatusBadge">
      <span className="ds-status-badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}
