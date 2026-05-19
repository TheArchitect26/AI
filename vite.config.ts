import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const aiBrainBaseUrl =
    env.AI_BRAIN_API_URL || env.AI_BRAIN_API || env.VITE_AI_BRAIN_API || "http://172.236.24.95:4000";

  return {
    plugins: [
      tsConfigPaths(),
      tanstackStart({
        server: { entry: "server" },
      }),
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        "/api/chat": {
          target: aiBrainBaseUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
