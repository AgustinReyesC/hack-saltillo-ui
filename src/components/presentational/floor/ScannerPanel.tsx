import { useState, type FormEvent, type RefObject } from 'react'

/** Cámara + captura manual. `onManual` también sirve para SIMULAR el escáner en escritorio (teclea U-101 o un SKU). */
interface Props { videoRef: RefObject<HTMLVideoElement | null>; active: boolean; supported: boolean; error: string | null; onStart: () => void; onStop: () => void; onManual: (code: string) => void }
export function ScannerPanel({ videoRef, active, supported, error, onStart, onStop, onManual }: Props) {
  const [code, setCode] = useState('') // useState local: texto de la captura manual
  const submit = (e: FormEvent) => { e.preventDefault(); onManual(code); setCode('') }
  return (
    <section className="panel pad">
      {active && <video ref={videoRef} className="scan-video" playsInline muted />}
      {supported
        ? <button className="big" onClick={active ? onStop : onStart}>{active ? '⏹ Detener cámara' : '📷 Escanear código (Code 128)'}</button>
        : <p className="muted">Este navegador no lee códigos con la cámara: usa la captura manual.</p>}
      {error && <p className="error">⚠ {error}</p>}
      <form onSubmit={submit} className="manual">
        <input className="field-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Simular lectura: U-101 o SKU" autoCapitalize="characters" />
        <button disabled={!code.trim()}>OK</button>
      </form>
    </section>
  )
}
