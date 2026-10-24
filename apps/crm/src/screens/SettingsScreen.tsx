import { useState, type FormEvent } from "react";
import { Button, DropdownMenu, ListItem, Panel, Select, Switch, Tag, TextInput } from "@ds/ui";
import { Page } from "../Page";

const team = [
  { name: "Ana Ferreira", email: "ana@northfield.shop", role: "Owner" },
  { name: "Tiago Costa", email: "tiago@northfield.shop", role: "Admin" },
  { name: "Mara Ionescu", email: "mara@northfield.shop", role: "Staff" },
];

export function SettingsScreen() {
  const [name, setName] = useState("Northfield Supply");
  const [language, setLanguage] = useState("en");
  const [region, setRegion] = useState("pt");
  const [newOrder, setNewOrder] = useState(true);
  const [lowStock, setLowStock] = useState(true);
  const [digest, setDigest] = useState(false);
  const submit = (e: FormEvent) => e.preventDefault();

  return (
    <Page section="settings" title="Settings">
      <form onSubmit={submit} className="app-col" noValidate>
        <Panel title="Store details" description="Shown on invoices and customer emails">
          <div className="app-form">
            <div className="app-form__wide"><TextInput id="store-name" label="Store name" required value={name} onChange={setName} /></div>
            <Select id="language" label="Invoice language" value={language} onChange={setLanguage}
              options={[{ value: "en", label: "English" }, { value: "pt", label: "Portuguese" }, { value: "ro", label: "Romanian" }, { value: "de", label: "German" }]} />
            <Select id="region" label="Tax region" hint="prices are always in euro" value={region} onChange={setRegion}
              options={[{ value: "pt", label: "Portugal" }, { value: "ro", label: "Romania" }, { value: "de", label: "Germany" }, { value: "es", label: "Spain" }]} />
          </div>
          <div className="app-footer"><Button variant="primary" type="submit">Save store details</Button></div>
        </Panel>
      </form>

      <Panel title="Notifications" description="Changes apply straight away">
        <Switch label="Email me about new orders" checked={newOrder} onChange={setNewOrder} />
        <Switch label="Email me when stock runs low" checked={lowStock} onChange={setLowStock} />
        <Switch label="Send a weekly sales summary" checked={digest} onChange={setDigest} />
      </Panel>

      <Panel title="Team" flush actions={<Button icon="plus">Invite member</Button>}>
        {team.map((m) => (
          <ListItem key={m.email} title={m.name} description={m.email} avatar={m.name}
            trailing={<><Tag color={m.role === "Owner" ? "accent" : "grey"}>{m.role}</Tag>
              <DropdownMenu label={`Actions for ${m.name}`} items={[{ label: "Change role", icon: "user", onSelect: () => {} }, { label: "Revoke access", icon: "trash", destructive: true, onSelect: () => {} }]} /></>} />
        ))}
      </Panel>
    </Page>
  );
}
