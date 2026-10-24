import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, DataTable, EmptyState, FilterChip, MiniCard, Panel, SearchInput, StatusBadge, Toast } from "@ds/ui";
import { Page } from "../Page";
import { archivedOrders, money, orders } from "../data";

type Filter = "all" | "unfulfilled" | "unpaid" | "refunded";

export function OrdersScreen() {
  const go = useNavigate();
  const { state } = useLocation();
  // Archive order на Order detail возвращает сюда с сообщением в state
  const [toast, setToast] = useState<string | null>(() => (state as { toast?: string } | null)?.toast ?? null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [archived, setArchived] = useState<string[]>(() => [...archivedOrders]);
  const listed = useMemo(() => orders.filter((o) => !archived.includes(o.id)), [archived]);

  const match = (f: Filter) => (o: (typeof orders)[number]) =>
    f === "all" ? true : f === "unfulfilled" ? o.fulfilment[0] === "Not fulfilled" : f === "unpaid" ? o.payment[1] === "warning" || o.payment[1] === "danger" : o.payment[0] === "Refunded";
  const count = (f: Filter) => listed.filter(match(f)).length;
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listed.filter(match(filter)).filter((o) => !q || `#${o.number} ${o.customer} ${o.channel}`.toLowerCase().includes(q));
  }, [listed, query, filter]);
  const archive = () => { selected.forEach((id) => archivedOrders.add(id)); setArchived([...archivedOrders]); setSelected([]); };
  const pick = (f: Filter) => (on: boolean) => setFilter(on ? f : "all");
  const revenue = orders.filter((o) => o.payment[0] === "Paid").reduce((a, o) => a + o.total, 0);

  return (
    <Page
      section="orders"
      title="Orders"
      actions={
        <>
          <Button icon="download">Export</Button>
          <Button variant="primary" icon="plus">Create draft order</Button>
        </>
      }
    >
      <div className="app-metrics">
        <MiniCard title="Orders" value={String(orders.length)} caption="last 7 days" tag={{ label: "+6", color: "green" }} />
        <MiniCard title="To fulfil" value={String(count("unfulfilled"))} caption="paid or awaiting, not shipped" />
        <MiniCard title="Revenue" value={money(revenue)} caption="paid, last 7 days" />
        <MiniCard title="Refunds" value={String(count("refunded"))} caption="last 7 days" />
      </div>

      <Panel flush>
        <div className="app-toolbar">
          <div className="app-toolbar__grow">
            <SearchInput label="Search orders" placeholder="Order number, customer or channel" value={query} onChange={setQuery} />
          </div>
          <div className="app-chips">
            <FilterChip selected={filter === "all"} onToggle={() => setFilter("all")} count={listed.length}>All</FilterChip>
            <FilterChip selected={filter === "unfulfilled"} onToggle={pick("unfulfilled")} count={count("unfulfilled")}>Not fulfilled</FilterChip>
            <FilterChip selected={filter === "unpaid"} onToggle={pick("unpaid")} count={count("unpaid")}>Unpaid</FilterChip>
            <FilterChip selected={filter === "refunded"} onToggle={pick("refunded")} count={count("refunded")}>Refunded</FilterChip>
          </div>
          {selected.length > 0 && <Button icon="archive" onClick={archive}>{`Archive orders (${selected.length})`}</Button>}
        </div>
        {rows.length ? <DataTable
          label="Orders"
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          onRowClick={(id) => go(`/orders/${id}`)}
          columns={[
            { key: "order", header: "Order" },
            { key: "date", header: "Date" },
            { key: "customer", header: "Customer" },
            { key: "channel", header: "Sales channel" },
            { key: "payment", header: "Payment" },
            { key: "fulfilment", header: "Fulfilment" },
            { key: "total", header: "Total", align: "end" },
          ]}
          rows={rows.map((o) => ({
            id: o.id,
            cells: {
              order: <span className="app-strong">#{o.number}</span>,
              date: <span className="app-muted">{o.date}</span>,
              customer: o.customer,
              channel: <span className="app-muted">{o.channel}</span>,
              payment: <StatusBadge tone={o.payment[1]}>{o.payment[0]}</StatusBadge>,
              fulfilment: <StatusBadge tone={o.fulfilment[1]}>{o.fulfilment[0]}</StatusBadge>,
              total: money(o.total),
            },
          }))}
        /> : (
          <EmptyState illustration="no-results" icon="search" title="No orders match"
            description="Check the order number or clear the filters — search looks at the number, customer and channel."
            action={{ label: "Clear filters", onClick: () => { setQuery(""); setFilter("all"); } }} />
        )}
      </Panel>
      <Toast message={toast} onHide={() => { setToast(null); go("/orders", { replace: true }); }} />
    </Page>
  );
}
