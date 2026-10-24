// Карточка продукта: обложка сверху, название, экраны, состояние проверок.
// Одна на всю витрину — в обзоре, на странице бренда и везде, где нужен список продуктов.
import { Link } from "react-router-dom";
import { coverOf, lint, plural } from "./data";
import type { Product } from "./types";

export function ProductCard({ p }: { p: Product }) {
  const img = coverOf(p.cover);
  const fresh = lint.findings.filter((f) => f.product === p.id && f.state === "fresh").length;
  const debt = lint.findings.filter((f) => f.product === p.id && f.state === "frozen").length;
  return (
    <Link to={`/products/${p.id}`} className="d-pcard">
      <div className="d-pcard__cover">{img ? <img src={img} alt="" /> : null}</div>
      <div className="d-pcard__body">
        <b className="d-pcard__name">{p.name}</b>
        <span className="d-pcard__meta">{p.screens.length} {plural(p.screens.length, "экран", "экрана", "экранов")}</span>
        <span className={`d-pcard__state${fresh ? " d-pcard__state--bad" : ""}`}>
          {fresh ? `${fresh} надо исправить` : "нарушений нет"}{debt ? ` · ${debt} в долге` : ""}
        </span>
      </div>
    </Link>
  );
}

// Бренд заголовком и его продукты сеткой карточек
export function BrandProducts({ brand, name, tagline, products, more = true }: { brand: string; name: string; tagline: string; products: Product[]; more?: boolean }) {
  return (
    <div className="d-bprod">
      <div className="d-bprod__head">
        <h3 className="d-bprod__name">{name}</h3>
        <span className="d-muted">{tagline}</span>
        {more ? <Link to={`/brands/${brand}`} className="d-bprod__more">Бренд →</Link> : null}
      </div>
      <div className="d-pcards">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </div>
  );
}
