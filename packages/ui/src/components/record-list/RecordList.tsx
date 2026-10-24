import { ListItem, type ListItemProps } from "../list-item";
import "./record-list.css";

export type RecordListProps = {
  /** Заголовок списка. */
  title: string;
  rows: (ListItemProps & { id: string })[];
};

export function RecordList({ title, rows }: RecordListProps) {
  return (
    <section className="ds-record-list" data-component="RecordList">
      <h3 className="ds-record-list__title">{title}</h3>
      <div>{rows.map(({ id, ...r }) => <ListItem key={id} {...r} />)}</div>
    </section>
  );
}
