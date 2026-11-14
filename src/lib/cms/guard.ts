import { getViewer, isStaff } from "./session";

/**
 * Pemeriksaan akses di setiap halaman CMS (layout saja tidak cukup: layout dan
 * halaman dirender paralel). Mengembalikan null bila tidak berhak — layout
 * sudah menampilkan pesan / mengarahkan ke login.
 */
export async function requireStaff() {
  const s = await getViewer();
  return s && isStaff(s.viewer.role) ? s : null;
}

export async function requireSuperAdmin() {
  const s = await getViewer();
  return s?.viewer.role === "super_admin" ? s : null;
}
