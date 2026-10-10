import { useState, type FormEvent } from 'react'
import { useWarehouse } from '../context/WarehouseContext'
import { useFloorFlow } from '../hooks/useFloorFlow'
import { BarcodeScanner } from '../components/presentational/BarcodeScanner'
import { ScanSummary } from '../components/presentational/floor/ScanSummary'
import { ActionPicker } from '../components/presentational/floor/ActionPicker'
import { ActionForm } from '../components/presentational/floor/ActionForm'

/** Pantalla de piso (mobile-first). Contenedor: une escáner + máquina de estados + componentes grandes. */
export function FloorView() {
  const { locations, reload } = useWarehouse()
  const f = useFloorFlow(locations, reload) // lógica del flujo
  const [draft, setDraft] = useState('')    // solo para simular escaneos en desarrollo
  const simulate = (e: FormEvent) => { e.preventDefault(); if (draft) f.handleScan(draft); setDraft('') }

  return (
    <div className="floor">
      <h1>Piso</h1>
      <ScanSummary location={f.location} part={f.part} onHere={f.onHandHere} onClearLocation={f.clearLocation} onClearPart={f.clearPart} />

      <BarcodeScanner onScan={f.handleScan} />

      {import.meta.env.DEV && (
        <form onSubmit={simulate} className="manual">
          <input className="field-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="DEV · simular lectura: U-101 o SKU" />
          <button disabled={!draft}>OK</button>
        </form>
      )}

      {f.location && f.part && !f.action && <ActionPicker onPick={f.pick} />}
      {f.location && f.part && f.action && <ActionForm action={f.action} form={f.form} locations={locations} currentLocationId={f.location.location_id}
        onChange={f.setField} canSubmit={f.canSubmit} busy={f.busy} onSubmit={f.submit} onCancel={f.cancel} />}
      {f.feedback && <p className={`feedback ${f.feedback.ok ? 'ok' : 'bad'}`}>{f.feedback.text}</p>}
    </div>
  )
}