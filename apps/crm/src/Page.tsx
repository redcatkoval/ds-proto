import type { ReactNode } from "react";
import { Breadcrumbs, SideNavigation } from "@ds/ui";
import { orders } from "./data";

type Section = "orders" | "products" | "inventory" | "customers" | "settings";

const toShip = orders.filter((o) => o.fulfilment[0] === "Not fulfilled").length;

// Каркас экрана: боковая навигация, путь, заголовок, действия страницы.
export function Page({ section, title, crumbs, meta, actions, children }: {
  section: Section;
  title: string;
  crumbs?: { label: string; href?: string }[];
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="ds-root app">
      <div className="app-side">
        <SideNavigation
          workspace="Northfield Supply"
          user="Ana Ferreira"
          items={[
            { label: "Orders", href: "#/orders", icon: "receipt", count: toShip, active: section === "orders" },
            { label: "Products", href: "#/products", icon: "package", active: section === "products" },
            { label: "Inventory", href: "#/inventory", icon: "layers", active: section === "inventory" },
            { label: "Customers", href: "#/customers", icon: "users", active: section === "customers" },
          ]}
          footerItems={[{ label: "Settings", href: "#/settings", icon: "settings", active: section === "settings" }]}
        />
      </div>
      <main className="app-main">
        {crumbs ? <div className="app-crumbs"><Breadcrumbs items={crumbs} /></div> : null}
        <header className="app-head">
          <div className="app-head__title">
            <h1>{title}</h1>
            {meta ? <div className="app-head__meta">{meta}</div> : null}
          </div>
          {actions ? <div className="app-head__actions">{actions}</div> : null}
        </header>
        {children}
      </main>
    </div>
  );
}
