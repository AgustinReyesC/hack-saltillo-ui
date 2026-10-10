import type { Location, PartSummary, UnmatchedReceipt } from '../../types'
import { SearchBar } from './SearchBar'
import { DataTable } from './DataTable'
import { catalogColumns } from './columns'

/** Relacionar una recepción huérfana con una pieza del catálogo. Solo diseño: todo llega por props. */
interface Props {
  receipt: UnmatchedReceipt; query: string; onQuery: (v: string) => void; results: PartSummary[]
  partId: number | null; onPart: (id: number) => void; locations: Location[]; locationId: number; onLocation: (id: number) => void
  busy: boolean; onConfirm: () => void; onCancel: () => void
}
export function ResolvePanel({ receipt, query, onQuery, results, partId, onPart, locations, locationId, onLocation, busy, onConfirm, onCancel }: Props) {
  return (
    <section className="panel tone-ok pad">
      <h2>Relacionar: {receipt.part_number} <span className="muted">· {receipt.quantity} pzas · {receipt.description}</span></h2>
      <h3>1. Busca la pieza en el catálogo</h3>
      <SearchBar value={query} onChange={onQuery} placeholder="SKU, nombre o grupo…" />
      <DataTable rows={results} columns={catalogColumns} rowKey={(p) => p.part_id} onRowClick={(p) => onPart(p.part_id)} selectedKey={partId} empty="Sin coincidencias: prueba otra palabra." />
      <h3>2. Ubicación de entrada</h3>
      <select className="search" value={locationId} onChange={(e) => onLocation(Number(e.target.value))}>
        {locations.map((l) => <option key={l.location_id} value={l.location_id}>{l.code} · {l.name}</option>)}
      </select>
      <div className="row actions"><button disabled={partId === null || busy} onClick={onConfirm}>{busy ? 'Relacionando…' : 'Relacionar y dar entrada'}</button>
        <button className="ghost" onClick={onCancel}>Cancelar</button></div>
    </section>
  )
}
