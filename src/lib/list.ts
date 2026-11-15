/** Memindahkan elemen dari indeks `from` ke posisi `to` (dipakai drag-and-drop). */
export function reorder<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Memindahkan elemen satu langkah ke atas (-1) atau bawah (+1). */
export const move = <T,>(list: T[], index: number, delta: -1 | 1): T[] => reorder(list, index, index + delta);
