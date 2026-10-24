import { Icon, type IconName } from "../../icons/icons";
import { Button } from "../button";
import { useIllustration } from "../../strings";
import type { IllustrationName } from "../../illustrations";
import "./empty-state.css";

export type EmptyStateProps = {
  /** Что произошло: «Клиентов пока нет», «Ничего не нашлось». */
  title: string;
  /** Как выйти из положения: «Добавьте первого клиента или импортируйте список». */
  description: string;
  /** Иконка-образ пустоты. Показывается, если у бренда нет иллюстрации. */
  icon?: IconName;
  /** Место для иллюстрации бренда: «no-results», «empty-orders». Нет картинки у бренда — будет иконка. */
  illustration?: IllustrationName;
  /** Выход — одна кнопка. Нечего предложить — не задавайте. */
  action?: { label: string; onClick: () => void; icon?: IconName };
};

export function EmptyState({ title, description, icon = "inbox", illustration, action }: EmptyStateProps) {
  const picture = useIllustration(illustration);
  return (
    <div className="ds-empty-state" data-component="EmptyState">
      {picture
        ? <img className="ds-empty-state__illustration" src={picture} alt="" />
        : <span className="ds-empty-state__graphic"><Icon name={icon} size={24} /></span>}
      <h3 className="ds-empty-state__title">{title}</h3>
      <p className="ds-empty-state__description">{description}</p>
      {action ? <Button variant="secondary" size="sm" icon={action.icon} onClick={action.onClick}>{action.label}</Button> : null}
    </div>
  );
}
