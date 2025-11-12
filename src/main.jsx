import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.desktop.css";
import "./styles.mobile.css"
import App from "./App.jsx";
import "./sw-registration";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
