import { useMemo, useState } from 'react'
import type { PartSummary } from '../../types'
import { useInventory } from '../../hooks/useInventory'
import { isDefective } from '../../utils/classify'
import { SearchBar } from '../presentational/SearchBar'
import { StatsRow } from '../presentational/StatsRow'
import { FilterTabs } from '../presentational/FilterTabs'
import { PartsTable } from '../presentational/PartsTable'
import { mainColumns, repairColumns } from '../presentational/partColumns'
import { PartDetailContainer } from './PartDetailContainer'

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/**
 * Cada área = una regla (test) + un juego de columnas. Una sola lista `parts` alimenta ambas;
 * agregar una tercera área (p. ej. "Servicios") es agregar un objeto aquí, sin tocar nada más.
 */
const AREAS = {
  main: { label: 'Inventario principal', test: (p: PartSummary) => !isDefective(p), columns: mainColumns },
  repair: { label: 'Reparación / Defectuosos', test: isDefective, columns: repairColumns },
} as const
type AreaId = keyof typeof AREAS

export function InventoryContainer() {
  const { parts, shortages, reorders, loading, error } = useInventory()
  const [area, setArea] = useState<AreaId>('main')                  // pestaña activa
  const [query, setQuery] = useState('')                            // buscador (compartido por ambas áreas)
  const [selectedId, setSelectedId] = useState<number | null>(null) // pieza abierta en el panel de detalle

  const inArea = useMemo(() => parts.filter(AREAS[area].test), [parts, area])  // 1) separa por área
  const filtered = useMemo(() => {                                              // 2) aplica el buscador
    const words = norm(query).split(/\s+/).filter(Boolean)
    return inArea.filter((p) => words.every((w) => norm(`${p.sku} ${p.name} ${p.group_name ?? ''} ${p.status_note ?? ''}`).includes(w)))
  }, [inArea, query])

  const normal = parts.filter(AREAS.main.test)
  const selected = parts.find((p) => p.part_id === selectedId) ?? null
  const changeArea = (id: string) => { setArea(id as AreaId); setSelectedId(null) } // al cambiar de pestaña, cierra el detalle

  return (
    <>
      <div className="page-head"><h1>Inventario</h1>
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar por SKU, pieza, grupo o problema…" /></div>
      <StatsRow stats={[
        { label: 'Piezas normales', value: normal.length, tone: 'neutral' },
        { label: 'Disponibles', value: normal.filter((p) => p.available > 0).length, tone: 'ok' },
        { label: 'En reparación / defectuosas', value: parts.length - normal.length, tone: 'warn' },
        { label: 'Faltantes abiertos', value: shortages.length, tone: 'warn' },
        { label: 'Por reordenar', value: reorders.length, tone: 'warn' }]} />
      <section className="panel">
        <FilterTabs active={area} onChange={changeArea}
          tabs={(Object.keys(AREAS) as AreaId[]).map((id) => ({ id, label: AREAS[id].label, count: parts.filter(AREAS[id].test).length }))} />
        {error && <p className="error pad">⚠ {error}</p>}
        {loading ? <p className="muted pad">Cargando…</p>
          : <PartsTable parts={filtered} columns={AREAS[area].columns} selectedId={selectedId} onSelect={setSelectedId} />}
      </section>
      {selected && <PartDetailContainer part={selected} onClose={() => setSelectedId(null)} />}
    </>
  )
}
