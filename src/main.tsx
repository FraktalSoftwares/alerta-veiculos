import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Remove service workers "fantasmas" de versões antigas que ficaram registrados
// no navegador e interceptavam/cacheavam requisições (servindo bundle velho e
// quebrando o carregamento de modelos 3D/Mapbox). Limpa também os caches.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
  if (typeof caches !== "undefined") {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
  }
}

createRoot(document.getElementById("root")!).render(<App />);
