/** Sin acentos ni mayúsculas: "Batería" ≈ "bateria". */
export const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
/** ¿Aparecen TODAS las palabras de `query` en algún campo? ("ssd 256" encuentra "SSD 256GB"). Query vacío = todo. */
export const matches = (query: string, ...fields: (string | undefined)[]) => {
  const hay = norm(fields.join(' '))
  return norm(query).split(/\s+/).filter(Boolean).every((w) => hay.includes(w))
}
export const fmtDate = (iso: string) => new Date(iso).toLocaleString()
