import { useMemo, useState } from 'react'
import { useInventory } from '../../hooks/useInventory'
import { SearchBar } from '../presentational/SearchBar'
import { InventoryTable } from '../presentational/InventoryTable'

/** Quita acentos y pasa a minúsculas: "Batería" y "bateria" coinciden. */
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function InventoryContainer() {
  const { items, loading, error } = useInventory()
  const [query, setQuery] = useState('') // useState: lo que el usuario escribe en el buscador

  // useMemo: recalcula el filtro SOLO si cambian `items` o `query` (no en cada render).
  const filtered = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean) // "ssd 256" → ["ssd","256"]
    return items.filter((i) => {
      const haystack = normalize(`${i.sku} ${i.name} ${i.category} ${i.location}`) // "pajar" de texto
      return words.every((w) => haystack.includes(w)) // TODAS las palabras deben aparecer
    })
  }, [items, query])

  return (
    <section className="card">
      <div className="row">
        <h2>Inventario <span className="count">({filtered.length} de {items.length})</span></h2>
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar por SKU, pieza, categoría o ubicación…" />
      </div>
      {error && <p className="error">⚠ {error}</p>}
      {loading ? <p className="muted">Cargando…</p> : <InventoryTable items={filtered} />}
    </section>
  )
}
