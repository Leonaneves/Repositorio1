import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./ui/App.js";
import "./ui/styles.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Elemento #root não encontrado.");
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
