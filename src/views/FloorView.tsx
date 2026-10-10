import { useState, type FormEvent } from 'react'
import { useWarehouse } from '../context/WarehouseContext'
import { useFloorFlow } from '../hooks/useFloorFlow'
import { BarcodeScanner } from '../components/presentational/BarcodeScanner'
import { ScanSummary } from '../components/presentational/floor/ScanSummary'
import { ActionPicker } from '../components/presentational/floor/ActionPicker'
import { ActionForm } from '../components/presentational/floor/ActionForm'

/** Contrato: las ubicaciones SIEMPRE empiezan con "U-" (U-100, U-112). Todo lo demás es una pieza. */
const isLocation = (code: string) => code.trim().toUpperCase().startsWith('U-')

/** Pantalla de piso (mobile-first). Contenedor: une escáner + máquina de estados + componentes grandes. */
export function FloorView() {
  const { locations, reload } = useWarehouse()
  const f = useFloorFlow(locations, reload) // validación contra inventario + acciones

  // Lo ÚLTIMO que se escaneó (o simuló), tal cual llegó. Siempre se ve en pantalla.
  const [scannedLocation, setScannedLocation] = useState<string | null>(null)
  const [scannedPart, setScannedPart] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('') // texto del campo "Simular lectura"

  /** ÚNICA puerta de entrada: la cámara y el campo manual llaman a esta misma función. */
  const handleScan = (data: string) => {
    if (!data.trim()) return                        // ignora vacíos
    if (isLocation(data)) setScannedLocation(data)  // empieza con "U-" → ubicación
    else setScannedPart(data)                       // cualquier otro   → pieza
    f.handleScan(data)                              // además valida contra el inventario (puede mostrar error)
  }

  // Simular lectura: el valor del input se pasa tal cual a handleScan, igual que haría la cámara
  const simulate = (e: FormEvent) => {
    e.preventDefault()
    handleScan(manualCode)
    setManualCode('')
  }

  // "Cambiar" en las tarjetas limpia también el dato crudo
  const clearLocation = () => { f.clearLocation(); setScannedLocation(null) }
  const clearPart = () => { f.clearPart(); setScannedPart(null) }

  return (
    <div className="floor">
      <h1>Piso</h1>

      {/* 1. Cámara */}
      <BarcodeScanner onScan={handleScan} />

      {/* 2. Simular lectura (solo con npm run dev) */}
      {import.meta.env.DEV && (
        <form onSubmit={simulate} className="manual">
          <input
            className="field-input"
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Simular lectura: U-101 o SEL-3552"
          />
          <button type="submit" disabled={!manualCode.trim()}>Simular</button>
        </form>
      )}

      {/* 3. Estado actual: lo escaneado + el resultado de la validación */}
      <section className="scan-status">
        <p>📍 Ubicación actual: <b className="mono">{scannedLocation || 'Ninguna'}</b></p>
        <p>⚙️ Pieza escaneada: <b className="mono">{scannedPart || 'Ninguna'}</b></p>
      </section>
      {f.feedback && <p className={`feedback ${f.feedback.ok ? 'ok' : 'bad'}`}>{f.feedback.text}</p>}

      {/* 4. Datos ya validados (nombre, existencia aquí) */}
      <ScanSummary location={f.location} part={f.part} onHere={f.onHandHere} onClearLocation={clearLocation} onClearPart={clearPart} />

      {/* 5. Acciones: solo con ubicación Y pieza válidas */}
      {f.location && f.part && !f.action && <ActionPicker onPick={f.pick} />}
      {f.location && f.part && f.action && <ActionForm action={f.action} form={f.form} locations={locations} currentLocationId={f.location.location_id}
        onChange={f.setField} canSubmit={f.canSubmit} busy={f.busy} onSubmit={f.submit} onCancel={f.cancel} />}
    </div>
  )
}
