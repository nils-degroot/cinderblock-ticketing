import tailwind from "bun-plugin-tailwind";

const result = await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "./dist",
  target: "browser",
  minify: true,
  splitting: true,
  plugins: [tailwind],
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log(`Build complete: ${result.outputs.length} files written to ./dist`);
