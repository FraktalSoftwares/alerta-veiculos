import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    // Evita o navegador servir módulos antigos em cache durante o dev
    // (causava misturar bundle velho com novo e quebrar o 3D/Mapbox).
    headers: {
      "Cache-Control": "no-store",
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
