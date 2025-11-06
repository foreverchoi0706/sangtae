import { defineConfig } from "tsup";

export default defineConfig(({ watch }) => ({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  splitting: false,
  outDir: "dist",
  minify: !watch,
  clean: !watch,
  treeshake: true,
}));
