import { useEffect, useRef, useState } from 'react'

interface Detector { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> }
type DetectorCtor = new (o: { formats: string[] }) => Detector

/**
 * Lector Code 128 con la cámara. Usa la API nativa `BarcodeDetector` (Chrome/Edge/Android).
 * Si el navegador no la tiene (p. ej. Safari/iPhone) `supported` = false y la pantalla ofrece captura manual;
 * ahí se puede enchufar @zxing/browser SIN tocar nada más (solo este hook).
 * La cámara exige HTTPS (o localhost).
 */
export function useBarcodeScanner(onCode: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onCodeRef = useRef(onCode); onCodeRef.current = onCode // siempre la versión más nueva, sin reiniciar la cámara
  const [active, setActive] = useState(false)                 // ¿cámara encendida?
  const [error, setError] = useState<string | null>(null)
  const Ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector
  const supported = !!Ctor && !!navigator.mediaDevices?.getUserMedia

  useEffect(() => {
    if (!active || !Ctor) return
    let stream: MediaStream | undefined; let timer: number | undefined; let stopped = false
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }) // cámara trasera
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return }
        const v = videoRef.current!; v.srcObject = stream; await v.play()
        const detector = new Ctor({ formats: ['code_128'] })
        timer = window.setInterval(async () => {
          const found = await detector.detect(v).catch(() => [])
          if (found[0]?.rawValue) { onCodeRef.current(found[0].rawValue); setActive(false) } // una lectura y se apaga (ahorra batería)
        }, 300)
      } catch { setError('No se pudo abrir la cámara (permiso denegado, sin cámara o sin HTTPS).'); setActive(false) }
    })()
    return () => { stopped = true; window.clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()) } // cleanup: apaga la cámara
  }, [active, Ctor])

  return { videoRef, active, supported, error, start: () => { setError(null); setActive(true) }, stop: () => setActive(false) }
}
