import type { Availability, LedgerEntry, Location, Movement, MovementType, OpenShortage, PartSummary, ReorderSuggestion, UnmatchedReceipt } from '../../types'
import { toStockRows } from '../../utils/stock'
import { pushMockEvent } from '../events'
import type { InventoryService } from './types'

/**
 * Mock CON ESTADO en memoria: retirar, transferir, contar o resolver una recepción cambia los datos y emite
 * eventos reales (stock.*), así toda la UI (alertas, tablas, kardex) reacciona igual que con la API real.
 */
const iso = (minsAgo = 0) => new Date(Date.now() - minsAgo * 60_000).toISOString().replace(/\.\d+Z$/, 'Z')
const wait = <T,>(fn: () => T) => new Promise<T>((ok, no) => setTimeout(() => { try { ok(structuredClone(fn())) } catch (e) { no(e) } }, 250)) // simula red; throw ⇒ rechazo
const must = <T,>(v: T | undefined, msg: string): T => { if (v === undefined) throw new Error(msg); return v }

const locations: Location[] = [
  { location_id: 100, code: 'U-100', name: 'Recepción', is_receiving: true }, { location_id: 101, code: 'U-101', name: 'Estante A' },
  { location_id: 102, code: 'U-102', name: 'Estante B' }, { location_id: 103, code: 'U-103', name: 'Banco de trabajo', is_workbench: true },
]
// [part_id, sku, nombre, grupo, en U-100, en U-101, en U-102]
const base = [
  [301, 'SEL-3552', 'Sello de labio 35x52', 'Husillos', 0, 12, 8], [302, 'CAR-1210', 'Carbón de motor 12x10', 'Motores', 0, 20, 16],
  [303, 'DRV-24V', 'Tarjeta driver DC 24V', 'Electrónica', 0, 3, 0], [304, 'CAP-470', 'Capacitor 470µF 25V', 'Electrónica', 0, 150, 90],
  [305, 'ROD-7205B', 'Rodamiento 7205 B', 'Husillos', 0, 4, 0], [306, 'BAN-HS', 'Banda de husillo HS', 'Husillos', 0, 0, 0],
  [307, 'GRA-EP2', 'Grasa EP2 (cartucho)', 'Consumibles', 0, 30, 18], [308, 'FLT-HID', 'Filtro hidráulico', 'Hidráulica', 6, 0, 0],
] as const
const catalog = base.map(([part_id, sku, name, group_name]) => ({ part_id, sku, name, group_name }))

const stock: { part_id: number; location_id: number; on_hand: number }[] = []
const movements: Movement[] = []
let seq = 1
const addStock = (part_id: number, location_id: number, d: number) => {
  const r = stock.find((s) => s.part_id === part_id && s.location_id === location_id)
  if (r) r.on_hand += d; else stock.push({ part_id, location_id, on_hand: d })
}
const mv = (type: MovementType, part_id: number, location_id: number, quantity: number, reference: string | null, minsAgo = 0): Movement => {
  const m: Movement = { movement_id: seq++, type, part_id, location_id, quantity, occurred_at: iso(minsAgo), reference }
  movements.push(m); return m
}
base.forEach(([id, , , , q100, q101, q102], i) => { // historia inicial: entra a U-100 y se acomoda
  const age = 60 * 24 * (12 - i)
  if (q100 > 0) { mv('receipt', id, 100, q100, `PO-${5500 + i}`, age); addStock(id, 100, q100) }
  ;([[101, q101], [102, q102]] as const).forEach(([loc, q], k) => {
    if (q <= 0) return
    mv('receipt', id, 100, q, `PO-${5500 + i}`, age); mv('transfer_out', id, 100, -q, `TR-${id}-${loc}`, age - 60 - k); mv('transfer_in', id, loc, q, `TR-${id}-${loc}`, age - 60 - k)
    addStock(id, loc, q)
  })
})

// Órdenes de trabajo con su necesidad vigente (último item `buy` aprobado)
interface SeedLine { inspection_item_id: number; bom_line_id: number; part_id: number; name: string; required: number; reserved: number }
const orders: Record<string, { work_order_id: number; opened_at: string; lines: SeedLine[] }> = {
  R061026012: { work_order_id: 12, opened_at: '2026-10-06T16:42:11Z', lines: [
    { inspection_item_id: 901, bom_line_id: 41, part_id: 305, name: 'Rodamiento 7205 B', required: 7, reserved: 4 },
    { inspection_item_id: 904, bom_line_id: 42, part_id: 301, name: 'Sello de labio 35x52', required: 4, reserved: 4 },
    { inspection_item_id: 906, bom_line_id: 45, part_id: 302, name: 'Carbón de motor 12x10', required: 4, reserved: 4 },
    { inspection_item_id: 907, bom_line_id: 46, part_id: 306, name: 'Banda de husillo HS', required: 1, reserved: 0 }] },
  R061026014: { work_order_id: 14, opened_at: '2026-10-07T09:10:00Z', lines: [
    { inspection_item_id: 902, bom_line_id: 43, part_id: 303, name: 'Tarjeta driver DC 24V', required: 5, reserved: 3 },
    { inspection_item_id: 905, bom_line_id: 44, part_id: 307, name: 'Grasa EP2 (cartucho)', required: 2, reserved: 2 },
    { inspection_item_id: 908, bom_line_id: 47, part_id: 304, name: 'Capacitor 470µF 25V', required: 10, reserved: 10 },
    { inspection_item_id: 909, bom_line_id: 48, part_id: 308, name: 'Filtro hidráulico', required: 2, reserved: 2 }] },
}
// Entregas ya hechas contra las órdenes (salidas con reference = código), así "Entregadas" no arranca vacía
;([['R061026012', 302, 2], ['R061026014', 307, 2], ['R061026014', 304, 4]] as const).forEach(([code, id, q], k) => {
  mv('issue', id, 101, -q, code, 180 - 30 * k); addStock(id, 101, -q)
})
const issuedFor = (code: string, pid: number) => -movements.filter((m) => m.type === 'issue' && m.reference === code && m.part_id === pid).reduce((s, m) => s + m.quantity, 0)
const lineState = (code: string, l: SeedLine) => { // misma fórmula del README: missing = max(required − reserved − issued, 0)
  const issued = issuedFor(code, l.part_id); const reserved = Math.max(0, l.reserved - issued)
  return { issued, reserved, missing: Math.max(l.required - reserved - issued, 0) }
}
const allLines = () => Object.entries(orders).flatMap(([code, o]) => o.lines.map((l) => ({ code, o, l, ...lineState(code, l) })))
const onHandAt = (pid: number, lid: number) => stock.find((s) => s.part_id === pid && s.location_id === lid)?.on_hand ?? 0
const onHandOf = (pid: number) => stock.filter((s) => s.part_id === pid).reduce((a, s) => a + s.on_hand, 0)
const reservedOf = (pid: number) => allLines().filter((x) => x.l.part_id === pid).reduce((a, x) => a + x.reserved, 0)
const part = (id: number): PartSummary => {
  const c = must(catalog.find((p) => p.part_id === id), 'Pieza no encontrada'); const on_hand = onHandOf(id); const reserved = reservedOf(id)
  return { ...c, on_hand, reserved, available: Math.max(0, on_hand - reserved), condition_code: 'new', repair_tools_count: 0 }
}
const loc = (id: number) => must(locations.find((l) => l.location_id === id), 'Ubicación no encontrada')
const availability = (id: number): Availability => {
  const p = part(id)
  return { part_id: id, on_hand: p.on_hand, reserved: p.reserved, available: p.available, // por ubicación: reserved = 0 (§6.7)
    locations: stock.filter((s) => s.part_id === id && s.on_hand > 0).map((s) => ({ location_id: s.location_id, code: loc(s.location_id).code, on_hand: s.on_hand, reserved: 0, available: s.on_hand })) }
}

/** Entrada de material (al resolver una recepción): suma stock y SURTE faltantes (README §6.5). */
function receive(pid: number, qty: number, locId: number, ref: string): Movement {
  addStock(pid, locId, qty); const m = mv('receipt', pid, locId, qty, ref)
  pushMockEvent('stock.received', `part:${pid}`, { part_id: pid, location_id: locId, quantity: qty, unit_cost: '0.00', currency: 'MXN', purchase_line_id: 0 })
  allLines().filter((x) => x.l.part_id === pid && x.missing > 0).forEach((x) => {
    const fill = Math.min(x.missing, Math.max(0, onHandOf(pid) - reservedOf(pid))); if (fill <= 0) return
    x.l.reserved += fill
    pushMockEvent('stock.reserved', x.code, { work_order_id: x.o.work_order_id, part_id: pid, quantity: fill })
    if (fill === x.missing) pushMockEvent('stock.shortage_resolved', x.code, { work_order_id: x.o.work_order_id, part_id: pid, quantity: fill })
  })
  return m
}

const unmatched: UnmatchedReceipt[] = [
  { id: 1, purchase_line_id: 5507, part_number: 'ROD 7205', description: 'Rodamiento 7205 genérico', quantity: 6, unit_price: '185.00' },
  { id: 2, purchase_line_id: 5512, part_number: 'DRV24', description: 'Driver 24 V', quantity: 5, unit_price: '420.00' },
]
const resolved = new Set<number | string>()

export const mockInventoryService: InventoryService = {
  listParts: () => wait(() => catalog.map((c) => part(c.part_id))),
  findPartBySku: (sku) => wait(() => { const k = sku.replace(/\s+/g, '').toLowerCase(); const c = catalog.find((p) => p.sku.toLowerCase() === k); return c ? part(c.part_id) : null }),
  getAvailability: (id) => wait(() => availability(id)),
  getLedger: (id) => wait(() => {
    part(id); let bal = 0 // el saldo corre del más antiguo al más nuevo; las transferencias suman 0
    const asc = movements.filter((m) => m.part_id === id).sort((a, b) => a.occurred_at.localeCompare(b.occurred_at) || a.movement_id - b.movement_id)
    const entries: LedgerEntry[] = asc.map((m) => { if (!m.type.startsWith('transfer')) bal += m.quantity; return { ...m, balance: bal } })
    return { part_id: id, entries: entries.reverse() } // más reciente primero
  }),
  listLocations: () => wait(() => locations),
  listStock: () => wait(() => catalog.flatMap((c) => toStockRows(part(c.part_id), availability(c.part_id)))),
  listShortages: () => wait((): OpenShortage[] => allLines().filter((x) => x.missing > 0).map((x) => ({
    work_order_id: x.o.work_order_id, work_order_code: x.code, part_id: x.l.part_id, name: x.l.name, missing_quantity: x.missing, inspection_item_id: x.l.inspection_item_id, opened_at: x.o.opened_at }))),
  listReorders: () => wait((): ReorderSuggestion[] => {
    const by = new Map<number, ReorderSuggestion>()
    allLines().filter((x) => x.missing > 0).forEach((x) => {
      const r = by.get(x.l.part_id) ?? { part_id: x.l.part_id, sku: part(x.l.part_id).sku, name: x.l.name, suggested_quantity: 0, work_order_ids: [] }
      r.suggested_quantity += x.missing; r.work_order_ids.push(x.o.work_order_id); by.set(x.l.part_id, r)
    })
    return [...by.values()]
  }),
  listUnmatched: () => wait(() => unmatched.filter((r) => !resolved.has(r.id))),
  getWorkOrderMaterials: (code) => wait(() => {
    const o = must(orders[code], 'Orden no encontrada')
    return { work_order_id: o.work_order_id, code, deleted: false, lines: o.lines.map((l) => ({ inspection_item_id: l.inspection_item_id, bom_line_id: l.bom_line_id, part_id: l.part_id, name: l.name, required: l.required, ...lineState(code, l) })) }
  }),
  issue: (r) => wait(() => {
    const o = must(orders[r.work_order_code], 'Orden no encontrada'); part(r.part_id); loc(r.location_id)
    if (r.quantity > onHandAt(r.part_id, r.location_id)) throw new Error('Existencia insuficiente en la ubicación') // 409
    addStock(r.part_id, r.location_id, -r.quantity); const m = mv('issue', r.part_id, r.location_id, -r.quantity, r.work_order_code)
    pushMockEvent('stock.issued', r.work_order_code, { work_order_id: o.work_order_id, part_id: r.part_id, location_id: r.location_id, quantity: r.quantity, issued_by: r.issued_by })
    return m
  }),
  transfer: (r) => wait(() => {
    part(r.part_id); loc(r.from_location_id); loc(r.to_location_id)
    if (r.from_location_id === r.to_location_id) throw new Error('Origen y destino no pueden ser iguales') // 422
    if (r.quantity > onHandAt(r.part_id, r.from_location_id)) throw new Error('Existencia insuficiente en el origen') // 409
    const ref = `TR-${seq}`; addStock(r.part_id, r.from_location_id, -r.quantity); addStock(r.part_id, r.to_location_id, r.quantity)
    const out = mv('transfer_out', r.part_id, r.from_location_id, -r.quantity, ref); const inn = mv('transfer_in', r.part_id, r.to_location_id, r.quantity, ref)
    pushMockEvent('stock.transferred', `part:${r.part_id}`, { part_id: r.part_id, from_location_id: r.from_location_id, to_location_id: r.to_location_id, quantity: r.quantity })
    return { ...out, transfer_in_movement_id: inn.movement_id }
  }),
  count: (r) => wait(() => {
    if (!r.reason.trim()) throw new Error('El motivo es obligatorio') // 422
    loc(r.location_id); const adjustments: { part_id: number; delta: number }[] = []
    r.lines.forEach((l) => {
      part(l.part_id); const delta = l.counted_quantity - onHandAt(l.part_id, r.location_id); if (delta === 0) return
      addStock(l.part_id, r.location_id, delta); mv('adjustment', l.part_id, r.location_id, delta, r.reason)
      pushMockEvent('stock.adjusted', `part:${l.part_id}`, { part_id: l.part_id, location_id: r.location_id, delta, reason: r.reason }); adjustments.push({ part_id: l.part_id, delta })
    })
    return { adjustments }
  }),
  resolveReceipt: (id, r) => wait(() => {
    if (resolved.has(id)) throw new Error('La recepción ya estaba resuelta') // 409
    const rec = must(unmatched.find((u) => u.id === id), 'Recepción no encontrada'); part(r.part_id); const lid = r.location_id ?? 100; loc(lid)
    resolved.add(id); return receive(r.part_id, rec.quantity, lid, `PO-${rec.purchase_line_id}`)
  }),
}
