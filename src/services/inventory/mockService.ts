import type { Availability, OpenShortage, PartSummary, ReorderSuggestion, UnmatchedReceipt } from '../../types'
import type { InventoryService } from './types'

/** Fabrica una pieza respetando available = on_hand - reserved (regla 5 del README). */
const mk = (part_id: number, sku: string, name: string, family: string, group_name: string,
  on_hand: number, reserved: number, condition_code: PartSummary['condition_code'] = 'new', repair_tools_count = 0, status_note: string | null = null): PartSummary =>
  ({ part_id, sku, name, family, group_name, on_hand, reserved, available: Math.max(0, on_hand - reserved),
     condition_code, repair_tools_count, is_service: family === 'SERVICIO', active: true, image_url: null, status_note })

const parts: PartSummary[] = [
  mk(301, 'SEL-3552', 'Sello de labio 35x52', 'REFACCION', 'Husillos', 20, 4),
  mk(302, 'CAR-1210', 'Carbón de motor 12x10', 'REFACCION', 'Motores', 36, 6, 'functional'),
  mk(303, 'DRV-24V', 'Tarjeta driver DC 24V', 'REFACCION', 'Electrónica', 3, 3),
  mk(304, 'CAP-470', 'Capacitor 470µF 25V', 'REFACCION', 'Electrónica', 240, 40),
  mk(305, 'ROD-7205B', 'Rodamiento 7205 B', 'REFACCION', 'Husillos', 4, 4),
  mk(306, 'BAN-HS', 'Banda de husillo HS', 'REFACCION', 'Husillos', 0, 0),
  mk(307, 'TRQ-CEL50', 'Celda de torque 50 Nm', 'REFACCION', 'Torque', 2, 0, 'defective', 2, 'Deriva de lectura de +8 % fuera de tolerancia'),
  mk(308, 'MOT-ARM3', 'Armadura rotor 3 kW', 'REFACCION', 'Motores', 1, 0, 'under_repair', 1, 'Devanado en corto en fase B'),
  mk(309, 'GRA-EP2', 'Grasa EP2 (cartucho)', 'CONSUMIBLE', 'Husillos', 48, 2),
  mk(310, 'SRV-BAL', 'Balanceo dinámico', 'SERVICIO', 'Servicios', 0, 0, null),
  mk(311, 'ROD-7205B-D', 'Rodamiento 7205 B', 'REFACCION', 'Husillos', 2, 0, 'defective', 1, 'Juego radial excesivo tras prueba de giro'),
  mk(312, 'TRQ-CEL50-D', 'Celda de torque 50 Nm', 'REFACCION', 'Torque', 1, 0, 'under_repair', 2, 'Cable de señal cortado; en banco de soldadura'),
  mk(313, 'CAR-1210-D', 'Carbón de motor 12x10', 'REFACCION', 'Motores', 5, 0, 'scrapped', 0, 'Desgaste total por sobrecarga; no reparable'),
]
const shortages: OpenShortage[] = [
  { work_order_id: 12, work_order_code: 'R061026012', part_id: 305, name: 'Rodamiento 7205 B', missing_quantity: 3, inspection_item_id: 901, opened_at: '2026-10-06T16:42:11Z' },
  { work_order_id: 14, work_order_code: 'R061026014', part_id: 303, name: 'Tarjeta driver DC 24V', missing_quantity: 2, inspection_item_id: 902, opened_at: '2026-10-07T09:10:00Z' },
  { work_order_id: 15, work_order_code: 'R061026015', part_id: null, name: 'Pieza sin identificar', missing_quantity: null, inspection_item_id: 903, opened_at: '2026-10-08T11:00:00Z' },
]
const reorders: ReorderSuggestion[] = [
  { part_id: 305, sku: 'ROD-7205B', name: 'Rodamiento 7205 B', suggested_quantity: 10, work_order_ids: [12] },
  { part_id: 303, sku: 'DRV-24V', name: 'Tarjeta driver DC 24V', suggested_quantity: 5, work_order_ids: [12, 14] },
]
const unmatched: UnmatchedReceipt[] = [
  { id: 1, purchase_line_id: 5507, part_number: 'ROD 7205', description: 'Rodamiento 7205 genérico', quantity: 6, unit_price: '185.00' },
]

const wait = <T,>(v: T) => new Promise<T>((ok) => setTimeout(() => ok(structuredClone(v)), 300)) // simula red

/** Implementación FALSA: misma interfaz y mismas formas que la real. */
export const mockInventoryService: InventoryService = {
  listParts: () => wait(parts),
  listShortages: () => wait(shortages),
  listReorders: () => wait(reorders),
  listUnmatched: () => wait(unmatched),
  getAvailability: (id) => {
    const p = parts.find((x) => x.part_id === id)
    if (!p) return Promise.reject(new Error('Pieza no encontrada'))
    const a = Math.ceil(p.on_hand / 2) // reparte la existencia entre U-100 (recepción) y U-101
    const locs = p.on_hand === 0 ? [] : [
      { location_id: 100, code: 'U-100', on_hand: a, reserved: 0, available: a },        // por ubicación reserved=0 (§6.7)
      { location_id: 101, code: 'U-101', on_hand: p.on_hand - a, reserved: 0, available: p.on_hand - a },
    ]
    const res: Availability = { part_id: id, on_hand: p.on_hand, reserved: p.reserved, available: p.available, locations: locs }
    return wait(res)
  },
}
