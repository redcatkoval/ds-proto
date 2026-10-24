import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import "@fontsource-variable/inter";
import "@fontsource-variable/inter-tight";
import "@ds/ui/styles.css";
import { DSProvider } from "@ds/ui";
import product from "../product.json";

// Бренд — тот, что указан в product.json: его токены, формулировки и иллюстрации
type Brand = { id: string; name: string; strings?: Record<string, string> };
const brands = import.meta.glob("../../../system/brands/*/brand.json", { eager: true, import: "default" }) as Record<string, Brand>;
const brandDir = `../../../system/brands/${product.brand}/`;
const brand = brands[`${brandDir}brand.json`];
if (!brand) throw new Error(`Бренда «${product.brand}» из product.json нет: system/brands/${product.brand}/brand.json не найден`);

// Иллюстрации бренда: файл = место (empty-orders.png → "empty-orders")
const pictures = import.meta.glob("../../../system/brands/*/illustrations/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const illustrations = Object.fromEntries(Object.entries(pictures).filter(([p]) => p.startsWith(`${brandDir}illustrations/`)).map(([p, url]) => [p.split("/").pop()!.replace(".png", ""), url]));
import "./app.css";
import { OrdersScreen } from "./screens/OrdersScreen";
import { OrderScreen } from "./screens/OrderScreen";
import { ProductsScreen } from "./screens/ProductsScreen";
import { ProductScreen } from "./screens/ProductScreen";
import { CustomersScreen } from "./screens/CustomersScreen";
import { InventoryScreen } from "./screens/InventoryScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { PreviewBar } from "./preview/PreviewBar";

// Продукт живёт под одним брендом: токены бренда и его формулировки в компонентах.
document.documentElement.dataset.brand = brand.id;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DSProvider strings={brand.strings} illustrations={illustrations}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/orders" replace />} />
          <Route path="/orders" element={<OrdersScreen />} />
          <Route path="/orders/:id" element={<OrderScreen />} />
          <Route path="/products" element={<ProductsScreen />} />
          <Route path="/products/:handle" element={<ProductScreen />} />
          <Route path="/customers" element={<CustomersScreen />} />
          <Route path="/inventory" element={<InventoryScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/orders" replace />} />
        </Routes>
        <PreviewBar brand={brand.name} />
      </HashRouter>
    </DSProvider>
  </StrictMode>,
);
