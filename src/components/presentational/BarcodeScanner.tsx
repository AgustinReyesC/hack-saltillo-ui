import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

/**
 * Lector de códigos de barras con la cámara trasera. Encapsula la librería (html5-qrcode) y el ciclo de vida:
 *  - al MONTAR enciende la cámara; al DESMONTAR la apaga (stop + clear), así no queda prendida ni se fuga memoria.
 *  - SOLO lee Code 128, y entrega el texto CRUDO (espacios, puntos, comas y "/" intactos; no hace trim ni encode).
 * Props: solo `onScan`. Quien lo use decide qué hacer con el string.
 */
interface Props {
  onScan: (data: string) => void
  /** Pitido + vibración al leer. Por defecto true. */
  beep?: boolean
}

const REPEAT_MS = 1500 // la librería dispara el callback en cada cuadro mientras el código sigue a la vista

/** Pitido corto con Web Audio (sin archivos de audio). Puede fallar en silencio si el navegador bloquea el audio. */
function playBeep() {
  try {
    const Ctx = window.AudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'; osc.frequency.value = 1800; gain.gain.value = 0.15
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + 0.12)
    osc.onended = () => { void ctx.close() }
    navigator.vibrate?.(80)
  } catch { /* sin sonido, no pasa nada */ }
}

export function BarcodeScanner({ onScan, beep = true }: Props) {
  // id único y válido para el <div> donde la librería pinta el video (useId trae ":" y lo limpiamos)
  const regionId = `scanner-${useId().replace(/:/g, '')}`
  const onScanRef = useRef(onScan); onScanRef.current = onScan // siempre la versión más nueva, sin reiniciar la cámara
  const beepRef = useRef(beep); beepRef.current = beep
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let last = { code: '', at: 0 }
    const scanner = new Html5Qrcode(regionId, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128], // EXCLUSIVAMENTE Code 128
      useBarCodeDetectorIfSupported: true,                       // usa el detector nativo si el navegador lo trae
    })

    const started = scanner
      .start(
        { facingMode: 'environment' },                           // cámara trasera (en PC cae a la webcam)
        {
          fps: 10,
          // Recuadro ancho y bajo: los códigos de barras son horizontales (no cuadrados como un QR)
          qrbox: (w, h) => ({ width: Math.floor(w * 0.9), height: Math.floor(Math.min(h, w) * 0.4) }),
        },
        (decodedText) => {
          const now = Date.now()
          if (decodedText === last.code && now - last.at < REPEAT_MS) return // ignora la misma lectura repetida
          last = { code: decodedText, at: now }
          if (beepRef.current) playBeep()
          onScanRef.current(decodedText)                          // string CRUDO, tal cual lo leyó la cámara
        },
        undefined,                                                // errores "no hay código en este cuadro": se ignoran
      )
      .then(() => true, () => {
        if (!cancelled) setError('No se pudo abrir la cámara (permiso denegado, sin cámara o sin HTTPS).')
        return false
      })

    // CLEANUP: esperamos a que start() termine (si no, stop() falla) y entonces apagamos la cámara y limpiamos el DOM.
    return () => {
      cancelled = true
      void started
        .then((ok) => (ok ? scanner.stop() : undefined))
        .catch(() => undefined)
        .then(() => { try { scanner.clear() } catch { /* ya estaba limpio */ } })
    }
  }, [regionId])

  return (
    <div className="barcode-scanner">
      <div id={regionId} className="barcode-view" />
      {error && <p className="error">⚠ {error}</p>}
    </div>
  )
}