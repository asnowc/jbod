import path from "node:path";
const version = "0.0.3";
const resp = await fetch(`https://esm.sh/jbod@${version}/dist/mod.js?raw`);
const jbodJs = await resp.text();
const filename = "./benchmark/dist/before.js";
await Deno.mkdir(path.resolve(filename, ".."), { recursive: true });
await Deno.writeTextFile(filename, jbodJs, { create: true });
console.log("write to" + filename);
