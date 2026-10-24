// Demo data for Merrow Admin. Fictional shop, people and addresses.

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const money = (n: number) => `€${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export type Customer = { id: string; name: string; email: string; city: string; country: string; orders: number; spent: number; group: "Retail" | "Wholesale" | "VIP" };
export const customers: Customer[] = [
  { id: "c1", name: "Ana Ferreira", email: "ana.ferreira@mail.pt", city: "Lisbon", country: "Portugal", orders: 12, spent: 1184.5, group: "VIP" },
  { id: "c2", name: "Jonas Weber", email: "jonas.weber@post.de", city: "Berlin", country: "Germany", orders: 4, spent: 312, group: "Retail" },
  { id: "c3", name: "Ioana Popescu", email: "ioana.popescu@mail.ro", city: "Bucharest", country: "Romania", orders: 7, spent: 640.2, group: "Retail" },
  { id: "c4", name: "Lucas Martin", email: "lucas.martin@mail.fr", city: "Lyon", country: "France", orders: 2, spent: 96, group: "Retail" },
  { id: "c5", name: "Northfield Café", email: "orders@northfieldcafe.ie", city: "Dublin", country: "Ireland", orders: 21, spent: 4820, group: "Wholesale" },
  { id: "c6", name: "Sofia Rossi", email: "sofia.rossi@mail.it", city: "Turin", country: "Italy", orders: 5, spent: 455.9, group: "Retail" },
  { id: "c7", name: "Mateo García", email: "mateo.garcia@mail.es", city: "Valencia", country: "Spain", orders: 1, spent: 42, group: "Retail" },
  { id: "c8", name: "Emma de Vries", email: "emma.devries@mail.nl", city: "Utrecht", country: "Netherlands", orders: 9, spent: 870, group: "VIP" },
  { id: "c9", name: "Hotel Alvor", email: "compras@hotelalvor.pt", city: "Portimão", country: "Portugal", orders: 14, spent: 3260, group: "Wholesale" },
  { id: "c10", name: "Katarzyna Nowak", email: "k.nowak@mail.pl", city: "Kraków", country: "Poland", orders: 3, spent: 188, group: "Retail" },
  { id: "c11", name: "Oliver Hughes", email: "oliver.hughes@mail.co.uk", city: "Bristol", country: "United Kingdom", orders: 6, spent: 512.4, group: "Retail" },
  { id: "c12", name: "Elena Dumitru", email: "elena.dumitru@mail.ro", city: "Cluj-Napoca", country: "Romania", orders: 2, spent: 128, group: "Retail" },
];

export type Product = { id: string; handle: string; title: string; collection: string; status: "Published" | "Draft" | "Archived"; variants: number; stock: number; price: number; channels: string[] };
export const products: Product[] = [
  { id: "p1", handle: "linen-apron", title: "Linen apron", collection: "Kitchen", status: "Published", variants: 3, stock: 46, price: 38, channels: ["Web store", "Marketplace"] },
  { id: "p2", handle: "stoneware-mug", title: "Stoneware mug", collection: "Kitchen", status: "Published", variants: 4, stock: 8, price: 18, channels: ["Web store"] },
  { id: "p3", handle: "oak-board", title: "Oak cutting board", collection: "Kitchen", status: "Published", variants: 2, stock: 21, price: 54, channels: ["Web store", "Point of sale"] },
  { id: "p4", handle: "wool-throw", title: "Wool throw", collection: "Home", status: "Published", variants: 3, stock: 0, price: 120, channels: ["Web store"] },
  { id: "p5", handle: "beeswax-candle", title: "Beeswax candle", collection: "Home", status: "Draft", variants: 2, stock: 64, price: 16, channels: [] },
  { id: "p6", handle: "cotton-napkins", title: "Cotton napkins, set of 4", collection: "Table", status: "Published", variants: 5, stock: 33, price: 24, channels: ["Web store", "Marketplace"] },
  { id: "p7", handle: "ceramic-vase", title: "Ceramic vase", collection: "Home", status: "Archived", variants: 1, stock: 2, price: 68, channels: [] },
  { id: "p8", handle: "tea-towel", title: "Striped tea towel", collection: "Kitchen", status: "Published", variants: 3, stock: 112, price: 12, channels: ["Web store", "Point of sale"] },
  { id: "p9", handle: "olive-oil-can", title: "Olive oil can", collection: "Kitchen", status: "Published", variants: 1, stock: 5, price: 29, channels: ["Web store"] },
  { id: "p10", handle: "rattan-basket", title: "Rattan basket", collection: "Home", status: "Draft", variants: 2, stock: 17, price: 45, channels: [] },
  { id: "p11", handle: "linen-tablecloth", title: "Linen tablecloth", collection: "Table", status: "Published", variants: 4, stock: 14, price: 89, channels: ["Web store"] },
];

export type Order = { id: string; number: number; date: string; customer: string; channel: string; payment: [string, Tone]; fulfilment: [string, Tone]; total: number; items: { title: string; variant: string; qty: number; price: number }[] };
const pay = { paid: ["Paid", "success"], awaiting: ["Awaiting payment", "warning"], refunded: ["Refunded", "neutral"], failed: ["Payment failed", "danger"] } as const;
const ful = { not: ["Not fulfilled", "warning"], shipped: ["Shipped", "info"], delivered: ["Delivered", "success"], cancelled: ["Cancelled", "neutral"] } as const;
const seed: [number, string, string, string, keyof typeof pay, keyof typeof ful, [string, string, number, number][]][] = [
  [1042, "24 Oct 2026", "Ana Ferreira", "Web store", "paid", "not", [["Linen apron", "Sand / M", 1, 38], ["Stoneware mug", "Clay", 2, 18]]],
  [1041, "24 Oct 2026", "Northfield Café", "Web store", "paid", "not", [["Striped tea towel", "Blue", 12, 12], ["Cotton napkins, set of 4", "Natural", 6, 24]]],
  [1040, "23 Oct 2026", "Jonas Weber", "Marketplace", "awaiting", "not", [["Oak cutting board", "Large", 1, 54]]],
  [1039, "23 Oct 2026", "Ioana Popescu", "Web store", "paid", "shipped", [["Wool throw", "Moss", 1, 120]]],
  [1038, "22 Oct 2026", "Hotel Alvor", "Web store", "paid", "shipped", [["Linen tablecloth", "White / 240 cm", 8, 89]]],
  [1037, "22 Oct 2026", "Emma de Vries", "Point of sale", "paid", "delivered", [["Beeswax candle", "Tall", 3, 16]]],
  [1036, "21 Oct 2026", "Lucas Martin", "Web store", "failed", "not", [["Ceramic vase", "Ochre", 1, 68]]],
  [1035, "21 Oct 2026", "Sofia Rossi", "Marketplace", "paid", "delivered", [["Stoneware mug", "Ash", 4, 18]]],
  [1034, "20 Oct 2026", "Oliver Hughes", "Web store", "refunded", "cancelled", [["Olive oil can", "500 ml", 2, 29]]],
  [1033, "20 Oct 2026", "Katarzyna Nowak", "Web store", "paid", "delivered", [["Linen apron", "Rust / S", 2, 38]]],
  [1032, "19 Oct 2026", "Mateo García", "Marketplace", "paid", "delivered", [["Striped tea towel", "Red", 2, 12]]],
  [1031, "19 Oct 2026", "Northfield Café", "Web store", "paid", "delivered", [["Stoneware mug", "Clay", 24, 18]]],
  [1030, "18 Oct 2026", "Elena Dumitru", "Web store", "paid", "delivered", [["Rattan basket", "Medium", 1, 45]]],
  [1029, "18 Oct 2026", "Ana Ferreira", "Point of sale", "paid", "delivered", [["Oak cutting board", "Small", 1, 54]]],
  [1028, "17 Oct 2026", "Hotel Alvor", "Web store", "paid", "delivered", [["Cotton napkins, set of 4", "Grey", 20, 24]]],
  [1027, "17 Oct 2026", "Jonas Weber", "Web store", "refunded", "cancelled", [["Wool throw", "Oat", 1, 120]]],
];
export const orders: Order[] = seed.map(([number, date, customer, channel, p, f, items]) => ({
  id: String(number), number, date, customer, channel, payment: [...pay[p]] as [string, Tone], fulfilment: [...ful[f]] as [string, Tone],
  items: items.map(([title, variant, qty, price]) => ({ title, variant, qty, price })),
  total: items.reduce((a, [, , q, pr]) => a + q * pr, 0) + 4.9,
}));
export const findOrder = (id?: string) => orders.find((o) => o.id === id) ?? orders[0];
export const findCustomer = (name: string) => customers.find((c) => c.name === name) ?? customers[0];
export const findProduct = (handle?: string) => products.find((p) => p.handle === handle) ?? products[0];

export const locations = [{ value: "lisbon", label: "Lisbon warehouse" }, { value: "bucharest", label: "Bucharest hub" }, { value: "porto", label: "Porto pop-up store" }];
export type StockRow = { sku: string; product: string; variant: string; location: string; reserved: number; inStock: number };
export const stock: StockRow[] = products.flatMap((p, i) => [
  { sku: `MRW-${String(101 + i * 2)}`, product: p.title, variant: "Default", location: "lisbon", reserved: i % 3, inStock: p.stock },
  { sku: `MRW-${String(102 + i * 2)}`, product: p.title, variant: "Default", location: "bucharest", reserved: (i + 1) % 2, inStock: Math.max(0, Math.round(p.stock / 3) - 2) },
]);
