import { Tag, type TagProps } from "../tag";
import "./mini-card.css";

export type MiniCardProps = {
  /** Что считаем: «Сделки в работе». */
  title: string;
  /** Число или сумма — главное на карточке. */
  value: string;
  /** Пояснение под числом: за какой период, с чем сравниваем. */
  caption?: string;
  /** Изменение или статус: «+12% к сентябрю». */
  tag?: { label: string; color: TagProps["color"] };
};

export function MiniCard({ title, value, caption, tag }: MiniCardProps) {
  return (
    <section className="ds-mini-card" data-component="MiniCard">
      <h3 className="ds-mini-card__title">{title}</h3>
      <p className="ds-mini-card__value">{value}</p>
      <div className="ds-mini-card__footer">
        {tag ? <Tag color={tag.color}>{tag.label}</Tag> : null}
        {caption ? <span className="ds-mini-card__caption">{caption}</span> : null}
      </div>
    </section>
  );
}
