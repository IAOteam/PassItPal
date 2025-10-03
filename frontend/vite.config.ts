// frontend/vite.config.ts

import path from "path"
//  No longer importing tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  //The tailwindcss() call is no longer needed here.
  // Vite will automatically use your postcss.config.js file.
  plugins: [react(), svgr()], 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
})
