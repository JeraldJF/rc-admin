import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadConfig } from "./lib/config";

const root = document.getElementById("root")!;

// Load runtime config from the server before rendering.
// This ensures getConfig() is safe to call anywhere in the app.
loadConfig()
  .then(() => {
    createRoot(root).render(<App />);
  })
  .catch((err) => {
    console.error("Failed to load app configuration:", err);
    root.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;
                  font-family:sans-serif;background:#0f172a;color:#f8fafc;">
        <div style="text-align:center;padding:2rem;max-width:400px;">
          <h2 style="margin-bottom:0.75rem;font-size:1.25rem;">Configuration Error</h2>
          <p style="color:#94a3b8;font-size:0.9rem;">
            Could not load application configuration from the server.
            Please ensure the server is running and try again.
          </p>
        </div>
      </div>
    `;
  });
