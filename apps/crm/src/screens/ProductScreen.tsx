import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Button, Checkbox, DataTable, EmptyState, Panel, Select, StatusBadge, Tabs, TextArea, TextInput } from "@ds/ui";
import { Page } from "../Page";
import { findProduct, money } from "../data";

export function ProductScreen() {
  const { handle } = useParams();
  const p = findProduct(handle);
  const [tab, setTab] = useState("details");
  const [title, setTitle] = useState(p.title);
  const [slug, setSlug] = useState(p.handle);
  const [description, setDescription] = useState("Washed linen, cut generously and finished with cotton ties. Gets softer with every wash.");
  const [collection, setCollection] = useState(p.collection.toLowerCase());
  const [status, setStatus] = useState(p.status.toLowerCase());
  const [web, setWeb] = useState(p.channels.includes("Web store"));
  const [market, setMarket] = useState(p.channels.includes("Marketplace"));
  const [touched, setTouched] = useState(false);
  const titleError = touched && !title.trim() ? "Add a title — customers see it first" : undefined;
  const submit = (e: FormEvent) => { e.preventDefault(); setTouched(true); };

  return (
    <Page section="products" title={p.title}
      crumbs={[{ label: "Products", href: "#/products" }, { label: p.title }]}
      meta={<StatusBadge tone={p.status === "Published" ? "success" : "neutral"}>{p.status}</StatusBadge>}>
      <Tabs label="Product sections" value={tab} onChange={setTab}
        items={[{ id: "details", label: "Details" }, { id: "variants", label: "Variants", count: p.variants }, { id: "media", label: "Media" }]} />

      {tab === "details" ? (
        <form className="app-col" onSubmit={submit} noValidate>
          <Panel title="General">
            <div className="app-form">
              <TextInput id="title" label="Title" required value={title} onChange={setTitle} error={titleError} />
              <TextInput id="handle" label="Handle" hint="used in the web address" value={slug} onChange={setSlug} />
              <div className="app-form__wide">
                <TextArea id="description" label="Description" rows={4} value={description} onChange={setDescription} />
              </div>
              <Select id="collection" label="Collection" value={collection} onChange={setCollection}
                options={[{ value: "kitchen", label: "Kitchen" }, { value: "home", label: "Home" }, { value: "table", label: "Table" }]} />
              <Select id="status" label="Status" value={status} onChange={setStatus}
                options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }]} />
            </div>
          </Panel>
          <Panel title="Sales channels" description="Where customers can buy this product">
            <Checkbox label="Web store" checked={web} onChange={setWeb} />
            <Checkbox label="Marketplace" checked={market} onChange={setMarket} />
          </Panel>
          <div className="app-footer">
            <Button href="#/products">Cancel</Button>
            <Button variant="primary" type="submit">Save product</Button>
          </div>
        </form>
      ) : null}

      {tab === "variants" ? (
        <Panel title="Variants" flush actions={<Button icon="plus">Add variant</Button>}>
          <DataTable label="Variants"
            columns={[{ key: "name", header: "Variant" }, { key: "sku", header: "SKU" }, { key: "stock", header: "In stock", align: "end" }, { key: "price", header: "Price", align: "end" }]}
            rows={Array.from({ length: p.variants }, (_, i) => ({
              id: String(i),
              cells: { name: ["Sand / S", "Sand / M", "Rust / M", "Moss / L", "Ink / L"][i] ?? `Variant ${i + 1}`, sku: `MRW-${p.id.slice(1)}${i + 1}0`, stock: Math.max(0, Math.round(p.stock / p.variants) - i), price: money(p.price) },
            }))} />
        </Panel>
      ) : null}

      {tab === "media" ? (
        <Panel title="Media">
          <EmptyState illustration="no-images" icon="image" title="No images yet" description="Add at least one photo: products with images sell more often." action={{ label: "Upload images", icon: "upload", onClick: () => {} }} />
        </Panel>
      ) : null}
    </Page>
  );
}
