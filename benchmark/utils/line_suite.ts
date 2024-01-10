import { describe } from "vitest";
export function lineSuite<T>(name: string, data: T[], suite: (item: T) => any, group?: (item: T) => string): void {
  describe(preFix + name, function () {
    let suites = suite;
    if (group) {
      suites = function (item: T) {
        describe(group(item), function () {
          return suite(item);
        });
      };
    }
    return Promise.all(data.map(suites)) as any;
  });
}
const preFix = "\0line\0-";
