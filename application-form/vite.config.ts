import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
  },

  optimizeDeps: {
    exclude: [
      'pg',
      'nodemailer',
      'fs',
      'path',
      'url',
      'crypto',
      'events',
      'net',
      'tls',
      'stream',
      'util',
      'os',
      'child_process',
      'http',
      'https',
      'zlib',
      'dns'
    ]
  },
  build: {
    sourcemap: true,
    cssCodeSplit: false, // CSSを1つのファイルにまとめる
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    },
    // キャッシュバスティング強化
    manifest: true,
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
