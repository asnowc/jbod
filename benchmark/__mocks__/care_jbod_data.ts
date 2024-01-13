export function createMap(branch: number, value: any, deep: number = 1, obj: Record<string, any> = {}) {
  if (deep <= 0) return obj;
  for (let i = 0; i < branch; i++) {
    obj["key" + i] = deep - 1 === 0 ? value : createMap(branch, value, deep - 1);
  }
  return obj;
}
export function createList(branch: number, value: any, deep: number = 1, obj: any = []) {
  if (deep <= 0) return obj;
  for (let i = 0; i < branch; i++) {
    obj[i] = deep - 1 === 0 ? value : createList(branch, value, deep - 1);
  }
  return obj;
}

export function linerList(length: number, distance: number, start = 0) {
  let arr: number[] = [];
  for (let i = 0; i < length; i++) {
    arr[i] = start;
    start += distance;
  }
  return arr;
}
