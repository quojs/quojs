import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import banner from "vite-plugin-banner";
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';

import pkg from "./package.json" assert { type: "json" };

const year = new Date().getFullYear();
const licenseText = `/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${year} ${pkg.author.name}
 * License: ${pkg.license}
 * Homepage: ${pkg.homepage || ""}
 */`;

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: "./tsconfig.build.json",
      insertTypesEntry: true,
      outDir: "dist/types",
      include: ["src"],
      logLevel: "silent"
    }),
    tsconfigPaths(),
    banner(licenseText),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "quojs-react",
      formats: ["es", "cjs", "umd"],
      fileName: (format) =>
        format === "cjs"
          ? "quojs-react.cjs.js"
          : format === "es"
            ? "quojs-react.esm.js"
            : "quojs-react.umd.js",
    },
    outDir: "dist",
    sourcemap: true,
    target: "es2019",
    minify: true,
    emptyOutDir: true,
    rollupOptions: {
      external: ["react", "react-dom", "tslib"],
      output: {
        compact: true,
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          tslib: "tslib",
        },
      },
      treeshake: true,
    }
  },
  resolve: {
    dedupe: ["tslib"],
    alias: {
      tslib: "tslib/tslib.es6.js",
      "@quojs/core": path.resolve(__dirname, "../core/src/index.ts")
    }
  },

  optimizeDeps: {
    include: [],
    exclude: ["tslib"]
  }
});
