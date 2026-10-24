import type { ReactNode } from "react";
import "./tag.css";

export type TagProps = {
  /** Короткое значение: статус, категория. Одно-два слова. */
  children: ReactNode;
  /** Цвет несёт смысл: green — успех, amber — ждёт внимания, red — проблема, blue — в работе, grey — нейтральное. */
  color?: "grey" | "blue" | "green" | "amber" | "red" | "accent";
};

export function Tag({ children, color = "grey" }: TagProps) {
  return <span className={`ds-tag ds-tag--${color}`} data-component="Tag">{children}</span>;
}
