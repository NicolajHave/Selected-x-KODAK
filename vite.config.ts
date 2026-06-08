import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Relative base so the built app can be hosted under any subpath or embedded
// in an iframe without absolute "/" asset paths breaking.
// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
