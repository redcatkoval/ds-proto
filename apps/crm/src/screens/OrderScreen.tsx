import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Button, DropdownMenu, IconButton, ListItem, Modal, Panel, StatusBadge, Tag, TextArea } from "@ds/ui";
import { Page } from "../Page";
import { archivedOrders, findCustomer, findOrder, money } from "../data";

export function OrderScreen() {
  const { id } = useParams();
  const go = useNavigate();
  const o = findOrder(id);
  const c = findCustomer(o.customer);
  const [note, setNote] = useState("Gift wrap requested. Leave at reception if nobody answers.");
  const [confirm, setConfirm] = useState(false);
  const subtotal = o.items.reduce((a, it) => a + it.qty * it.price, 0);
  const open = o.fulfilment[0] === "Not fulfilled";

  return (
    <Page
      section="orders"
      title={`#${o.number}`}
      crumbs={[{ label: "Orders", href: "#/orders" }, { label: `#${o.number}` }]}
      meta={<><IconButton icon="copy" label={`Copy order number ${o.number}`} onClick={() => navigator.clipboard.writeText(`#${o.number}`)} /><StatusBadge tone={o.payment[1]}>{o.payment[0]}</StatusBadge><StatusBadge tone={o.fulfilment[1]}>{o.fulfilment[0]}</StatusBadge></>}
      actions={
        <>
          <DropdownMenu label="Order actions" items={[
            { label: "Archive order", icon: "archive", onSelect: () => { archivedOrders.add(o.id); go("/orders"); } },
            { label: "Cancel order", icon: "x", destructive: true, onSelect: () => setConfirm(true) },
          ]} />
        </>
      }
    >
      <div className="app-grid">
        <div className="app-col">
          <Panel title="Summary" description={`Placed on ${o.date} via ${o.channel}`} flush>
            {o.items.map((it) => (
              <ListItem key={it.title} title={it.title} description={`${it.variant} · ${it.qty} × ${money(it.price)}`} avatar={it.title}
                trailing={<span className="app-num">{money(it.qty * it.price)}</span>} />
            ))}
            <dl className="app-totals">
              <dt>Subtotal</dt><dd>{money(subtotal)}</dd>
              <dt>Shipping</dt><dd>{money(4.9)}</dd>
              <dt className="app-totals__sum">Total</dt><dd className="app-totals__sum">{money(o.total)}</dd>
            </dl>
          </Panel>

          <Panel title="Fulfilment" description={open ? "Pack the products and add a tracking number." : "The parcel is on its way."}
            actions={open ? <Button variant="primary" icon="truck">Mark as shipped</Button> : <Button icon="external">Track parcel</Button>}>
            <dl className="app-facts">
              <dt>Ship from</dt><dd>Lisbon warehouse</dd>
              <dt>Method</dt><dd>CTT Expresso, 2–3 days</dd>
            </dl>
          </Panel>

          <Panel title="Payment" actions={<Button>Refund</Button>}>
            <dl className="app-facts">
              <dt>Status</dt><dd><StatusBadge tone={o.payment[1]}>{o.payment[0]}</StatusBadge></dd>
              <dt>Method</dt><dd>Visa ending 4242</dd>
              <dt>Captured</dt><dd>{money(o.payment[0] === "Paid" ? o.total : 0)}</dd>
            </dl>
          </Panel>
        </div>

        <div className="app-col">
          <Panel title="Customer">
            <div className="app-who"><Avatar name={c.name} size="md" /><span className="app-strong">{c.name}</span><Tag color={c.group === "Retail" ? "grey" : "accent"}>{c.group}</Tag></div>
            <dl className="app-facts">
              <dt>Email</dt><dd>{c.email}</dd>
              <dt>Address</dt><dd>Rua das Flores 28, {c.city}, {c.country}</dd>
              <dt>Orders</dt><dd>{c.orders}</dd>
            </dl>
          </Panel>
          <Panel title="Note">
            <TextArea id="order-note" label="Internal note" hint="only your team sees it" rows={3} value={note} onChange={setNote} />
          </Panel>
          <Panel title="Activity">
            <ul className="app-timeline">
              <li><span><b>Order placed</b>{o.date}, 09:14</span></li>
              <li><span><b>Payment captured</b>{o.date}, 09:15</span></li>
              <li><span><b>Confirmation email sent</b>to {c.email}</span></li>
            </ul>
          </Panel>
        </div>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={`Cancel order #${o.number}?`}
        action={{ label: "Cancel order", variant: "danger", onClick: () => setConfirm(false) }}>
        The customer gets a full refund of {money(o.total)} and an email. You can't undo this.
      </Modal>
    </Page>
  );
}
