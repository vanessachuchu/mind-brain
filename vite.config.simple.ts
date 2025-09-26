import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// 簡化的 Vite 配置，避免可能的兼容性問題
export default defineConfig({
  base: "./",
  server: {
    host: "localhost",
    port: 3000,
    open: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // 優化配置以避免 Bus error
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  build: {
    target: "es2015",
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});