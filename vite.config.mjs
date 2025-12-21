import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";

// https://vitejs.dev/config/
export default defineConfig({
  // Build configuration
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 2000,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  // ✅ Supabase / ESM interop fix (dev)
  optimizeDeps: {
    include: ["@supabase/supabase-js"],
  },

  // ✅ Supabase / ESM interop fix (build / SSR)
  ssr: {
    noExternal: ["@supabase/supabase-js"],
  },

  resolve: {
    dedupe: ["@supabase/supabase-js"],
  },

  plugins: [tsconfigPaths(), react(), tagger()],

  server: {
    port: "4028",
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: [".amazonaws.com", ".builtwithrocket.new"],
  },
});
