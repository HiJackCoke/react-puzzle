import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./style.css";
import DiagramManager from "./contexts/DragContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DiagramManager>
      <App />
    </DiagramManager>
  </StrictMode>
);
