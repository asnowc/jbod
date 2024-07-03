export function formatSize(
  values: { name: string; size: number }[]
): { name: string; size: number; present?: string }[] {
  const base = values[0].size;
  return values.map((item, index) => {
    if (index === 0) return item;
    return { ...item, present: pasePresent(item.size, base) };
  });
}

function pasePresent(v: number, base: number) {
  return Math.round((v / base) * 100 * 1000) / 1000 + " %";
}
