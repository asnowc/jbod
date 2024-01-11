const version = "0.0.2";
const resp = await fetch(`https://esm.sh/jbod@${version}/dist/mod.js?raw`);
const jbodJs = await resp.text();
const filename = "benchmark/dist/before.js";
await Deno.writeTextFile(filename, jbodJs);
console.log("write to" + filename);
