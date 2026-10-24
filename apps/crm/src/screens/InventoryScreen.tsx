import { useState } from "react";
import { Button, DataTable, EmptyState, MiniCard, Panel, Select, StatusBadge } from "@ds/ui";
import { Page } from "../Page";
import { locations, stock } from "../data";

export function InventoryScreen() {
  const [location, setLocation] = useState("lisbon");
  const rows = stock.filter((s) => s.location === location);
  const low = rows.filter((s) => s.inStock > 0 && s.inStock < 10).length;
  const out = rows.filter((s) => s.inStock === 0).length;
  return (
    <Page section="inventory" title="Inventory" actions={<Button icon="refresh">Sync stock</Button>}>
      <div className="app-metrics app-metrics--three">
        <MiniCard title="Products tracked" value={String(rows.length)} caption={locations.find((l) => l.value === location)?.label} />
        <MiniCard title="Low stock" value={String(low)} caption="fewer than 10 left" tag={low ? { label: "Reorder", color: "amber" } : undefined} />
        <MiniCard title="Out of stock" value={String(out)} caption="hidden from the web store" />
      </div>
      <Panel title="Stock levels" flush actions={
        <Select id="location" label="Location" value={location} onChange={setLocation} options={locations} />
      }>
        {rows.length ? <DataTable
          label="Stock levels"
          columns={[
            { key: "sku", header: "SKU" },
            { key: "product", header: "Product" },
            { key: "state", header: "Availability" },
            { key: "reserved", header: "Reserved", align: "end" },
            { key: "stock", header: "In stock", align: "end" },
          ]}
          rows={rows.map((s) => ({
            id: s.sku,
            cells: {
              sku: <span className="app-muted">{s.sku}</span>,
              product: s.product,
              state: s.inStock === 0 ? <StatusBadge tone="danger">Out of stock</StatusBadge> : s.inStock < 10 ? <StatusBadge tone="warning">Low stock</StatusBadge> : <StatusBadge tone="success">In stock</StatusBadge>,
              reserved: s.reserved,
              stock: s.inStock,
            },
          }))}
        /> : (
          <EmptyState illustration="empty-stock" icon="layers" title="Nothing stocked here yet"
            description="Move stock to this location from another one, or receive a delivery here." action={{ label: "Move stock", icon: "refresh", onClick: () => setLocation("lisbon") }} />
        )}
      </Panel>
    </Page>
  );
}
