import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, DataTable, EmptyState, FilterChip, Panel, SearchInput, StatusBadge, Tag } from "@ds/ui";
import { Page } from "../Page";
import { money, products, type Product } from "../data";

const tone = { Published: "success", Draft: "neutral", Archived: "warning" } as const;

export function ProductsScreen() {
  const go = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Product["status"] | "all">("all");
  const count = (s: Product["status"]) => products.filter((p) => p.status === s).length;
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => (status === "all" || p.status === status) && (!q || `${p.title} ${p.collection}`.toLowerCase().includes(q)));
  }, [query, status]);
  const pick = (s: Product["status"]) => (on: boolean) => setStatus(on ? s : "all");

  return (
    <Page section="products" title="Products"
      actions={<><Button icon="upload">Import</Button><Button variant="primary" icon="plus" href="#/products/linen-apron">Add product</Button></>}>
      <Panel flush>
        <div className="app-toolbar">
          <div className="app-toolbar__grow">
            <SearchInput label="Search products" placeholder="Title or collection" value={query} onChange={setQuery} />
          </div>
          <div className="app-chips">
            <FilterChip selected={status === "all"} onToggle={() => setStatus("all")} count={products.length}>All</FilterChip>
            <FilterChip selected={status === "Published"} onToggle={pick("Published")} count={count("Published")}>Published</FilterChip>
            <FilterChip selected={status === "Draft"} onToggle={pick("Draft")} count={count("Draft")}>Draft</FilterChip>
            <FilterChip selected={status === "Archived"} onToggle={pick("Archived")} count={count("Archived")}>Archived</FilterChip>
          </div>
        </div>
        {rows.length ? <DataTable
          label="Products"
          onRowClick={(id) => go(`/products/${products.find((p) => p.id === id)?.handle}`)}
          columns={[
            { key: "title", header: "Product" },
            { key: "collection", header: "Collection" },
            { key: "channels", header: "Sales channels" },
            { key: "variants", header: "Variants", align: "end" },
            { key: "status", header: "Status" },
            { key: "price", header: "Price", align: "end" },
          ]}
          rows={rows.map((p) => ({
            id: p.id,
            cells: {
              title: <span className="app-strong">{p.title}</span>,
              collection: <Tag>{p.collection}</Tag>,
              channels: <span className="app-muted">{p.channels.length ? p.channels.join(", ") : "Not on sale"}</span>,
              variants: p.variants,
              status: <StatusBadge tone={tone[p.status]}>{p.status}</StatusBadge>,
              price: money(p.price),
            },
          }))}
        /> : (
          <EmptyState illustration="no-results" icon="search" title="No products match"
            description="Check the spelling or clear the filters."
            action={{ label: "Clear filters", onClick: () => { setQuery(""); setStatus("all"); } }} />
        )}
      </Panel>
    </Page>
  );
}
