import type { FloorAction, FloorForm, Location } from '../../../types'
/** Formulario de la acción elegida (mismos campos base, extras según acción). Valida visualmente; la lógica está en useFloorFlow. */
interface Props { action: FloorAction; form: FloorForm; locations: Location[]; currentLocationId: number; onChange: (f: keyof FloorForm, v: string) => void
  canSubmit: boolean; busy: boolean; onSubmit: () => void; onCancel: () => void }
const TITLES: Record<FloorAction, string> = { issue: 'Retirar (salida a orden)', transfer: 'Transferir a otra ubicación', count: 'Conteo cíclico (ajuste)' }
export function ActionForm({ action, form, locations, currentLocationId, onChange, canSubmit, busy, onSubmit, onCancel }: Props) {
  return (
    <section className="panel pad floor-form">
      <h2>{TITLES[action]}</h2>
      {action === 'issue' && <label className="field">Código de orden<input value={form.order} onChange={(e) => onChange('order', e.target.value.toUpperCase())} placeholder="R061026012" autoCapitalize="characters" /></label>}
      {action === 'transfer' && <label className="field">Ubicación destino
        <select value={form.toLocationId} onChange={(e) => onChange('toLocationId', e.target.value)}><option value="">Selecciona…</option>
          {locations.filter((l) => l.location_id !== currentLocationId).map((l) => <option key={l.location_id} value={l.location_id}>{l.code} · {l.name}</option>)}</select></label>}
      {action === 'count' && <label className="field">Motivo<input value={form.reason} onChange={(e) => onChange('reason', e.target.value)} /></label>}
      <label className="field">{action === 'count' ? 'Cantidad contada' : 'Cantidad'}
        <input type="number" inputMode="numeric" min={action === 'count' ? 0 : 1} value={form.quantity} onChange={(e) => onChange('quantity', e.target.value)} /></label>
      <button className="big" disabled={!canSubmit || busy} onClick={onSubmit}>{busy ? 'Enviando…' : 'Confirmar'}</button>
      <button className="big ghost" onClick={onCancel}>Cancelar</button>
    </section>
  )
}
