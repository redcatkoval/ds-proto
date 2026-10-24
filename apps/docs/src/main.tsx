import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import "@fontsource-variable/inter";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import "@ds/ui/styles.css";
import "./docs.css";
import { ScopeProvider } from "./scope";
import { Layout } from "./Layout";
import { OverviewPage, LevelsPage, AgentPage, RolesPage } from "./pages/Overview";
import { FoundationPage } from "./pages/Foundations";
import { ComponentsPage, CandidatesPage } from "./pages/Components";
import { PatternsPage } from "./pages/Patterns";
import { ComponentPage } from "./pages/Component";
import { BrandPage } from "./pages/Brands";
import { ProductsPage, ProductPage } from "./pages/Products";
import { AuditsPage } from "./pages/Audits";
import { ChangesPage, ProductChangesPage } from "./pages/Changes";
import { snapshot } from "./data";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ScopeProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<OverviewPage />} />
            <Route path="overview/levels" element={<LevelsPage />} />
            <Route path="overview/agent" element={<AgentPage />} />
            <Route path="overview/roles" element={<RolesPage />} />
            <Route path="foundations" element={<Navigate to="/foundations/layers" replace />} />
            <Route path="foundations/:page" element={<FoundationPage />} />
            <Route path="components" element={<ComponentsPage />} />
            <Route path="components/candidates" element={<CandidatesPage />} />
            <Route path="components/patterns" element={<PatternsPage />} />
            <Route path="components/:slug" element={<ComponentPage />} />
            <Route path="brands" element={<Navigate to={`/brands/${snapshot.brands[0]?.id ?? ""}`} replace />} />
            <Route path="brands/:id" element={<BrandPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductPage />} />
            <Route path="audits" element={<AuditsPage />} />
            <Route path="changes" element={<ChangesPage />} />
            <Route path="changes/products" element={<ProductChangesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ScopeProvider>
  </StrictMode>,
);
