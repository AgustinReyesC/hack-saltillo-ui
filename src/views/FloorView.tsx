import { Feedback } from '../components/presentational/Feedback'
import { useWarehouse } from '../context/WarehouseContext'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { useFloorFlow } from '../hooks/useFloorFlow'
import { ScannerPanel } from '../components/presentational/floor/ScannerPanel'
import { ScanSummary } from '../components/presentational/floor/ScanSummary'
import { ActionPicker } from '../components/presentational/floor/ActionPicker'
import { ActionForm } from '../components/presentational/floor/ActionForm'

/** Pantalla de piso (mobile-first). Contenedor: une escáner + máquina de estados + componentes grandes. */
export function FloorView() {
  const { locations, reload } = useWarehouse()
  const f = useFloorFlow(locations, reload)           // lógica del flujo
  const scanner = useBarcodeScanner(f.handleScan)     // la cámara solo entrega códigos al flujo
  return (
    <div className="floor">
      <h1>Piso</h1>
      <ScanSummary location={f.location} part={f.part} onHere={f.onHandHere} onClearLocation={f.clearLocation} onClearPart={f.clearPart} />
      <ScannerPanel videoRef={scanner.videoRef} active={scanner.active} supported={scanner.supported} error={scanner.error}
        onStart={scanner.start} onStop={scanner.stop} onManual={f.handleScan} />
      {f.location && f.part && !f.action && <ActionPicker onPick={f.pick} />}
      {f.location && f.part && f.action && <ActionForm action={f.action} form={f.form} locations={locations} currentLocationId={f.location.location_id}
        onChange={f.setField} canSubmit={f.canSubmit} busy={f.busy} onSubmit={f.submit} onCancel={f.cancel} />}
      {f.feedback && <Feedback ok={f.feedback.ok} text={f.feedback.text} />}
    </div>
  )
}
