import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  // Relative asset paths so the build works at https://<user>.github.io/<repo>/
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    // Allow any ngrok tunnel subdomain (the random part changes each time ngrok restarts)
    allowedHosts: [".ngrok-free.app", ".ngrok.app", ".ngrok.io"],
  },
})
