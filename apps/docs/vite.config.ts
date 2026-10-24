import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Витрина читает system/ напрямую — снимок, токены, контракты.
// После `npm run check` страница обновляется сама.
export default defineConfig({
  plugins: [react()],
  server: { port: 4321, strictPort: true, fs: { allow: ["../.."] } },
});
