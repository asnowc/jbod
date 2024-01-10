import { rollup } from "npm:rollup@4";
import esmTsPlugin from "npm:@rollup/plugin-typescript@11";

const tsPlugin = esmTsPlugin as any as typeof esmTsPlugin.default;
const output = Deno.args[0];

if (!output) throw new Error("请指定输出位置");
const fetchRes = await fetch("https://esm.sh/tslib@2");
console.log("fetch ok");

const tslib = await fetchRes.text();
const { write } = await rollup({
  input: "./src/mod.ts",
  plugins: [tsPlugin({ tslib, include: ["./src/**"], compilerOptions: { target: "ES2022", module: "nodenext" } })],
});

console.log("rollup to " + output);

await write({ file: output });
