import { cases } from "../../__mocks__/compare.cases.ts";
const map = new Map(
  Object.entries({
    disabled: false,
    count: 100837,
    name: "Documentation",
    dataStamp: 4 / 7,
    id: 876,
  })
);

export const casesList: { size: number; value: any; name: string }[] = cases.slice(1);
casesList.unshift({ name: "bigint-100", value: 100n, size: 10000 });
casesList.unshift({ name: "bigint-large", value: 0x1fffffffffffffffn, size: 10000 });
casesList.push({ name: "map", value: map, size: 1000 });
