const src = await Deno.open("dist/mod.js");

const target = await Deno.open("benchmark/dist/before.js", { write: true, truncate: true, create: true });
await src.readable.pipeTo(target.writable);
console.log("ok");
