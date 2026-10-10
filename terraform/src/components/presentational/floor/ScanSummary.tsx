import type { Location, PartSummary } from '../../../types'
/** Dos tarjetas grandes: ubicación y pieza ya escaneadas, con "Cambiar". */
interface Props { location: Location | null; part: PartSummary | null; onHere: number | null; onClearLocation: () => void; onClearPart: () => void }
export function ScanSummary({ location, part, onHere, onClearLocation, onClearPart }: Props) {
  return (
    <div className="scan-cards">
      <div className={`scan-card ${location ? 'done' : ''}`}><small>1 · Ubicación</small><b className="mono">{location ? location.code : '— escanea —'}</b>
        {location && <><span>{location.name}</span><button className="small ghost" onClick={onClearLocation}>Cambiar</button></>}</div>
      <div className={`scan-card ${part ? 'done' : ''}`}><small>2 · Pieza</small><b>{part ? part.name : '— escanea —'}</b>
        {part && <><span className="mono">{part.sku} · aquí hay {onHere ?? '…'}</span><button className="small ghost" onClick={onClearPart}>Cambiar</button></>}</div>
    </div>
  )
}
