import { ErrorText } from '../components/presentational/ErrorText'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWarehouse } from '../context/WarehouseContext'
import { useStock } from '../hooks/useStock'
import { matches } from '../utils/text'
import { SearchBar } from '../components/presentational/SearchBar'
import { StatsRow } from '../components/presentational/StatsRow'
import { Section } from '../components/presentational/Section'
import { DataTable } from '../components/presentational/DataTable'
import { reorderColumns, shortageColumns, stockColumns } from '../components/presentational/columns'
import { KardexContainer } from '../components/containers/KardexContainer'

type KardexPart = { part_id: number; sku: string; name: string }

/** Vista principal: existencias por pieza/ubicación + tableros de faltantes y sugerencias de compra + kardex. */
export function DashboardView() {
  const { parts, shortages, reorders, unmatched, error } = useWarehouse()
  const { rows, loading, error: stockError } = useStock()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')                          // buscador de la tabla
  const [kardex, setKardex] = useState<KardexPart | null>(null)   // pieza cuyo kardex está abierto (null = cerrado)
  const filtered = useMemo(() => rows.filter((r) => matches(query, r.sku, r.name, r.location_code)), [rows, query])
  return (
    <>
      <div className="page-head"><h1>Dashboard de almacén</h1><SearchBar value={query} onChange={setQuery} placeholder="Buscar por SKU, pieza o ubicación…" /></div>
      <StatsRow stats={[
        { label: 'Piezas en catálogo', value: parts.length, tone: 'neutral' }, { label: 'Con existencia', value: parts.filter((p) => p.on_hand > 0).length, tone: 'ok' },
        { label: 'Sin existencia', value: parts.filter((p) => p.on_hand === 0).length, tone: 'warn' }, { label: 'Faltantes abiertos', value: shortages.length, tone: 'warn' },
        { label: 'Sin relacionar', value: unmatched.length, tone: 'warn' }]} />
      {(error || stockError) && <ErrorText>{error ?? stockError}</ErrorText>}
      <Section title="Existencias por pieza y ubicación" count={filtered.length}>
        {loading ? <p className="muted pad">Cargando…</p>
          : <DataTable rows={filtered} columns={stockColumns} rowKey={(r) => `${r.part_id}-${r.location_id}`} onRowClick={setKardex} empty="Sin resultados." />}
      </Section>
      <div className="grid2">
        <Section title="Faltantes abiertos" tone="warn" count={shortages.length}>
          <DataTable rows={shortages} columns={shortageColumns} rowKey={(s) => `${s.work_order_id}-${s.inspection_item_id}`} onRowClick={(s) => navigate(`/ordenes/${s.work_order_code}`)} empty="Sin faltantes" />
        </Section>
        <Section title="Sugerencias de compra" tone="warn" count={reorders.length}>
          <DataTable rows={reorders} columns={reorderColumns(shortages)}rowKey={(r) => r.part_id} onRowClick={setKardex} empty="Nada por comprar" />
        </Section>
      </div>
      {kardex && <KardexContainer part={kardex} onClose={() => setKardex(null)} />}
    </>
  )
}
