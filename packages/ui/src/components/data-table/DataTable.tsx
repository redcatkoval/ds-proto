import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { Checkbox } from "../checkbox";
import { IconButton } from "../icon-button";
import { format, useStrings } from "../../strings";
import "./data-table.css";

export type DataTableColumn = {
  key: string;
  /** Заголовок столбца: «Order», «Total». */
  header: string;
  /** end — для денег и чисел: так их легче сравнивать. */
  align?: "start" | "end";
};

export type DataTableRow = {
  id: string;
  /** Ячейки по ключам столбцов. */
  cells: Record<string, ReactNode>;
};

export type DataTableProps = {
  /** Что в таблице — для диктора: «Orders». */
  label: string;
  /** Столбцы. Не больше семи — остальное в карточку записи. */
  columns: DataTableColumn[];
  rows: DataTableRow[];
  /** Открыть запись: строка становится нажимаемой и доступна с клавиатуры. */
  onRowClick?: (id: string) => void;
  /** Флажки для выбора строк. */
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Строк на странице. */
  pageSize?: number;
};

export function DataTable({ label, columns, rows, onRowClick, selectable = false, selected = [], onSelectedChange, pageSize = 10 }: DataTableProps) {
  const s = useStrings();
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  useEffect(() => { if (page > pages - 1) setPage(0); }, [page, pages]);
  const shown = rows.slice(page * pageSize, page * pageSize + pageSize);
  const allOn = shown.length > 0 && shown.every((r) => selected.includes(r.id));
  const someOn = !allOn && shown.some((r) => selected.includes(r.id));
  const toggleAll = (on: boolean) => onSelectedChange?.(on ? [...new Set([...selected, ...shown.map((r) => r.id)])] : selected.filter((id) => !shown.some((r) => r.id === id)));
  const toggle = (id: string) => (on: boolean) => onSelectedChange?.(on ? [...selected, id] : selected.filter((x) => x !== id));
  const onKey = (id: string) => (e: KeyboardEvent) => { if (e.key === "Enter") onRowClick?.(id); };

  return (
    <div className="ds-data-table" data-component="DataTable">
      <div className="ds-data-table__scroll">
        <table aria-label={label}>
          <thead>
            <tr>
              {selectable ? <th className="ds-data-table__check"><Checkbox label={s["table.selectAll"]} hideLabel checked={allOn} indeterminate={someOn} onChange={toggleAll} /></th> : null}
              {columns.map((c) => <th key={c.key} className={c.align === "end" ? "ds-data-table__end" : undefined}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.length ? shown.map((r) => (
              <tr key={r.id} className={onRowClick ? "ds-data-table__row--link" : undefined}
                tabIndex={onRowClick ? 0 : undefined} onClick={onRowClick ? () => onRowClick(r.id) : undefined} onKeyDown={onRowClick ? onKey(r.id) : undefined}
                aria-selected={selectable ? selected.includes(r.id) : undefined}>
                {selectable ? (
                  <td className="ds-data-table__check" onClick={(e) => e.stopPropagation()}>
                    <Checkbox label={s["table.selectRow"]} hideLabel checked={selected.includes(r.id)} onChange={toggle(r.id)} />
                  </td>
                ) : null}
                {columns.map((c) => <td key={c.key} className={c.align === "end" ? "ds-data-table__end" : undefined}>{r.cells[c.key]}</td>)}
              </tr>
            )) : (
              <tr><td className="ds-data-table__empty" colSpan={columns.length + (selectable ? 1 : 0)}>{s["table.empty"]}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > pageSize ? (
        <div className="ds-data-table__footer">
          <span>{format(s["table.range"], { from: page * pageSize + 1, to: Math.min(rows.length, (page + 1) * pageSize), total: rows.length })}</span>
          <div className="ds-data-table__pager">
            <IconButton icon="chevron-left" label={s["table.previous"]} disabled={page === 0} onClick={() => setPage(page - 1)} />
            <IconButton icon="chevron-right" label={s["table.next"]} disabled={page >= pages - 1} onClick={() => setPage(page + 1)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
