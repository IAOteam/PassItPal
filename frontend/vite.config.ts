// frontend/vite.config.ts

import path from "path"
// REMOVED: No longer importing tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  // REMOVED: The tailwindcss() call is no longer needed here.
  // Vite will automatically use your postcss.config.js file.
  plugins: [react(), svgr()], 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@passitpal/types": path.resolve(__dirname, "../packages/types/index.ts"),
      // "@passitpal/utils": path.resolve(__dirname, "../packages/utils/index.ts"),
      // "@passitpal/hooks": path.resolve(__dirname, "../packages/hooks/index.ts"),
      // "@passitpal/components": path.resolve(__dirname, "../packages/components/index.ts"),
      // "@passitpal/config": path.resolve(__dirname, "../packages/config/index.ts"),
      // "@passitpal/constants": path.resolve(__dirname, "../packages/constants/index.ts"),
      // "@passitpal/services": path.resolve(__dirname, "../packages/services/index.ts"),
      // "@passitpal/styles": path.resolve(__dirname, "../packages/styles/index.ts"),
    },
  },
})
