import { useCallback, useEffect, useState } from 'react'
import type { FloorAction, FloorForm, Location, PartSummary } from '../types'
import { inventoryService } from '../services/inventory'

const EMPTY: FloorForm = { quantity: '1', order: '', toLocationId: '', reason: 'Conteo cíclico' }
const LOCATION_RE = /^U-/i // las etiquetas de ubicación son U-100, U-101… ; todo lo demás se trata como SKU de pieza

/** Máquina de estados de la pantalla de piso: escanear ubicación + pieza → elegir acción → confirmar. */
export function useFloorFlow(locations: Location[], onChanged: () => void) {
  const [location, setLocation] = useState<Location | null>(null)
  const [part, setPart] = useState<PartSummary | null>(null)
  const [onHandHere, setOnHandHere] = useState<number | null>(null) // existencia de ESA pieza en ESA ubicación
  const [action, setAction] = useState<FloorAction | null>(null)
  const [form, setForm] = useState<FloorForm>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  const refreshHere = useCallback(async (p: PartSummary, l: Location) => {
    const a = await inventoryService.getAvailability(p.part_id)
    setOnHandHere(a.locations.find((x) => x.location_id === l.location_id)?.on_hand ?? 0)
  }, [])
  useEffect(() => { if (location && part) refreshHere(part, location).catch(() => setOnHandHere(null)); else setOnHandHere(null) }, [location, part, refreshHere])

  /** Recibe lo que lea la cámara (o lo tecleado/simulado). El ORDEN de escaneo no importa. */
  const handleScan = async (raw: string) => {
    const code = raw.trim(); if (!code) return
    setFeedback(null)
    if (LOCATION_RE.test(code)) {
      const l = locations.find((x) => x.code.toUpperCase() === code.toUpperCase())
      if (l) setLocation(l); else setFeedback({ ok: false, text: `La ubicación ${code} no existe.` })
      return
    }
    const p = await inventoryService.findPartBySku(code).catch(() => null)
    if (p) { setPart(p); setAction(null) } else setFeedback({ ok: false, text: `No hay ninguna pieza con SKU ${code}.` })
  }
  const pick = (a: FloorAction) => { setAction(a); setFeedback(null); setForm({ ...EMPTY, quantity: a === 'count' ? String(onHandHere ?? 0) : '1' }) }
  const setField = (f: keyof FloorForm, v: string) => setForm((s) => ({ ...s, [f]: v }))

  const qty = Number(form.quantity)
  const canSubmit = !!location && !!part && Number.isInteger(qty) && (
    action === 'issue' ? qty >= 1 && form.order.trim() !== '' : action === 'transfer' ? qty >= 1 && form.toLocationId !== '' : action === 'count' ? qty >= 0 && form.reason.trim() !== '' : false)

  const submit = async () => {
    if (!location || !part || !action) return
    setBusy(true); setFeedback(null)
    try {
      if (action === 'issue') await inventoryService.issue({ work_order_code: form.order.trim().toUpperCase(), part_id: part.part_id, location_id: location.location_id, quantity: qty, issued_by: 'piso' })
      else if (action === 'transfer') await inventoryService.transfer({ part_id: part.part_id, from_location_id: location.location_id, to_location_id: Number(form.toLocationId), quantity: qty })
      else await inventoryService.count({ location_id: location.location_id, reason: form.reason, lines: [{ part_id: part.part_id, counted_quantity: qty }] })
      setFeedback({ ok: true, text: 'Operación registrada ✔' }); setAction(null); setForm(EMPTY)
      await refreshHere(part, location); onChanged() // refresca la existencia mostrada y los datos compartidos
    } catch (e) { setFeedback({ ok: false, text: (e as Error).message }) } // {detail} del servidor: 404 / 409 / 422
    finally { setBusy(false) }
  }
  return { location, part, onHandHere, action, form, busy, feedback, canSubmit, handleScan, pick, setField, submit,
    cancel: () => setAction(null), clearLocation: () => setLocation(null), clearPart: () => { setPart(null); setAction(null) } }
}
