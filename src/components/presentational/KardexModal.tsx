import type { LedgerEntry } from '../../types'
import { DataTable } from './DataTable'
import { ledgerColumns } from './columns'
/** Kardex: movimientos de la pieza, del más reciente al más antiguo, con saldo corrido. */
interface Props { title: string; subtitle: string; entries: LedgerEntry[]; codeOf: (id: number) => string; loading: boolean; error: string | null; onClose: () => void }
export function KardexModal({ title, subtitle, entries, codeOf, loading, error, onClose }: Props) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><div><small className="mono">{subtitle}</small><h2>Kardex · {title}</h2></div><button className="x" onClick={onClose} aria-label="Cerrar">✕</button></div>
        {loading && <p className="muted">Cargando…</p>}{error && <p className="error">⚠ {error}</p>}
        {!loading && !error && <DataTable rows={entries} columns={ledgerColumns(codeOf)} rowKey={(e) => e.movement_id} empty="Sin movimientos." />}
      </div>
    </div>
  )
}
