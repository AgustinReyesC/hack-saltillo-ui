import { useMemo, useState } from 'react'
import { useWarehouse } from '../context/WarehouseContext'
import { inventoryService } from '../services/inventory'
import { matches } from '../utils/text'
import { DataTable } from '../components/presentational/DataTable'
import { Section } from '../components/presentational/Section'
import { ResolvePanel } from '../components/presentational/ResolvePanel'
import { unmatchedColumns } from '../components/presentational/columns'

/** Panel de resolución: compras cuyo N° de parte no coincide con el catálogo → POST /unmatched-receipts/{id}/resolve. */
export function ResolutionView() {
  const { unmatched, parts, locations, reload, loading, error } = useWarehouse()
  const [selectedId, setSelectedId] = useState<number | string | null>(null) // recepción elegida
  const [query, setQuery] = useState('')                                      // búsqueda en el catálogo
  const [partId, setPartId] = useState<number | null>(null)                   // pieza elegida
  const [locationId, setLocationId] = useState(100)                           // U-100 = recepción (valor por defecto del contrato)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const receipt = unmatched.find((r) => r.id === selectedId) ?? null
  const results = useMemo(() => parts.filter((p) => matches(query, p.sku, p.name, p.group_name)).slice(0, 8), [parts, query])
  const choose = (id: number | string) => { setSelectedId(id); setPartId(null); setMsg(null); setQuery(unmatched.find((r) => r.id === id)?.part_number ?? '') } // precarga el buscador

  const confirm = async () => {
    if (!receipt || partId === null) return
    setBusy(true)
    try {
      await inventoryService.resolveReceipt(receipt.id, { part_id: partId, location_id: locationId })
      setMsg({ ok: true, text: 'Compra relacionada: la existencia entró y se surtieron los faltantes posibles.' }); setSelectedId(null); await reload()
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }) } // 404 / 409 (ya resuelta) con su {detail}
    finally { setBusy(false) }
  }
  return (
    <>
      <div className="page-head"><h1>Resolución de recepciones</h1></div>
      {msg && <p className={`feedback ${msg.ok ? 'ok' : 'bad'}`}>{msg.text}</p>}
      {error && <p className="error">⚠ {error}</p>}
      <Section title="Recepciones sin relacionar" tone="warn" count={unmatched.length}>
        {loading ? <p className="muted pad">Cargando…</p> : <DataTable rows={unmatched} columns={unmatchedColumns} rowKey={(r) => r.id} onRowClick={(r) => choose(r.id)} selectedKey={selectedId} empty="No hay recepciones pendientes ✔" />}
      </Section>
      {receipt && <ResolvePanel receipt={receipt} query={query} onQuery={setQuery} results={results} partId={partId} onPart={setPartId}
        locations={locations} locationId={locationId} onLocation={setLocationId} busy={busy} onConfirm={confirm} onCancel={() => setSelectedId(null)} />}
    </>
  )
}
