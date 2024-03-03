import JBOB, { ArrayWriter, createEncMaps, createCalcContext, createEncContext } from "../dist/mod.js";

const res = createEncMaps();
const calc = createCalcContext(res.calcMap);
const enco = createEncContext(res.encMap);
function toTypeCode(data: any) {
  return 20;
}
const arrayType = 11;
function enc(data: any[]) {
  return calc[arrayType](data);
}

const data: any[] = [];
for (let i = 0; i < 999; i++) {
  data[i] = 1;
}

const encRes = enc(data);
let buf = new Uint8Array(encRes.byteLength);
Deno.bench("mmc", function () {
  new ArrayWriter(data, toTypeCode).encodeTo(buf, 0);
});

Deno.bench("enc", function () {
  let encRes = calc[arrayType](data);
  enco[arrayType](encRes.pretreatment, buf, 0);
});
