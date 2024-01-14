import { createServer } from "npm:vite@5";
import { fileURLToPath } from "node:url";
import importsMap from "./bench_ui/import_map.json" assert { type: "json" };
const filename = fileURLToPath(import.meta.url);

const resolver = createImportsMapResolver(importsMap);
const server = await createServer({
  root: "./scripts/bench_ui",
  plugins: [
    {
      name: "configure-server",
      configureServer(server) {},
    },
    {
      name: "ext",
      resolveId(name, importer, info) {
        const id = resolver(name);
        return id;
      },
    },
  ],
});
await server.listen(5173);
server.printUrls();

for await (const change of Deno.watchFs(filename)) {
  server.restart();
}
function createImportsMapResolver(importsMap: { imports: Record<string, string> }) {
  const map = new Map(Object.entries(importsMap.imports));

  return function checkId(id: string) {
    for (const [test, replace] of map) {
      if (test.endsWith("/")) {
        if (id.startsWith(test)) return id.replace(test, replace);
      } else if (id === test) return replace;
    }
  };
}
