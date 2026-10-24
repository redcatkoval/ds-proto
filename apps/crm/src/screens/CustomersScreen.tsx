import { useMemo, useState } from "react";
import { Avatar, Button, DataTable, EmptyState, Panel, SearchInput, Tag } from "@ds/ui";
import { Page } from "../Page";
import { customers, money } from "../data";

export function CustomersScreen() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => !q || `${c.name} ${c.email} ${c.city} ${c.country}`.toLowerCase().includes(q));
  }, [query]);
  return (
    <Page section="customers" title="Customers" actions={<Button variant="primary" icon="plus">Add customer</Button>}>
      <Panel flush>
        <div className="app-toolbar">
          <div className="app-toolbar__grow">
            <SearchInput label="Search customers" placeholder="Name, email or city" value={query} onChange={setQuery} />
          </div>
        </div>
        {rows.length ? <DataTable
          label="Customers"
          columns={[
            { key: "name", header: "Customer" },
            { key: "email", header: "Email" },
            { key: "location", header: "Location" },
            { key: "group", header: "Group" },
            { key: "orders", header: "Orders", align: "end" },
            { key: "spent", header: "Spent", align: "end" },
          ]}
          rows={rows.map((c) => ({
            id: c.id,
            cells: {
              name: <span className="app-who"><Avatar name={c.name} size="sm" /><span className="app-strong">{c.name}</span></span>,
              email: <span className="app-muted">{c.email}</span>,
              location: `${c.city}, ${c.country}`,
              group: <Tag color={c.group === "Retail" ? "grey" : "accent"}>{c.group}</Tag>,
              orders: c.orders,
              spent: money(c.spent),
            },
          }))}
        /> : (
          <EmptyState illustration="no-results" icon="search" title="No customers match"
            description="Search looks at the name, email and city." action={{ label: "Clear search", onClick: () => setQuery("") }} />
        )}
      </Panel>
    </Page>
  );
}
