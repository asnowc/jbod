export function createList<T>(size: number, item: T): T[] {
  const arr: T[] = [];
  for (let i = 0; i < size; i++) {
    arr[i] = item;
  }
  return arr;
}

export function createMap<T>(size: number, value: T): Record<string, T> {
  const map: Record<string, T> = {};
  for (let i = 0; i < size; i++) {
    map[i] = value;
  }
  return map;
}
export function createMapTree(deep: number, branch: number) {}
