/**
 * Interfaces = espejo de API_README.md (nombres snake_case tal cual; importes como TEXTO; fechas ISO con Z;
 * listas { items }; errores { detail }). Campo con "?" o nota "SUPUESTO" = la doc no lo fija: confírmalo.
 * Las piezas a reparar son del CLIENTE: no son inventario, por eso ya no existen estados "defectuoso" en la UI.
 */
export type PartCondition = 'new' | 'functional' | 'defective' | 'under_repair' | 'scrapped'

/** Fila de GET /parts (v_part_agent_summary). Totales de la pieza en todo el almacén. */
export interface PartSummary {
  part_id: number; sku: string; name: string
  on_hand: number; reserved: number; available: number // available = on_hand - reserved (≥ 0, regla 5)
  condition_code: PartCondition | null; repair_tools_count: number
  group_name?: string
}

/** Catálogo de ubicaciones (tabla location). SUPUESTO: se expone con GET /locations (ruta de extensión). */
export interface Location { location_id: number; code: string; name: string; is_workbench?: boolean; is_receiving?: boolean }

/** GET /parts/{id}/availability. Por ubicación reserved = 0 (§6.7). */
export interface LocationAvailability { location_id: number; code: string; on_hand: number; reserved: number; available: number }
export interface Availability { part_id: number; on_hand: number; reserved: number; available: number; locations: LocationAvailability[] }

/** Fila ya "aplanada" para la tabla de existencias por pieza y ubicación (la arma la UI desde Availability). */
export interface StockRow { part_id: number; sku: string; name: string; location_id: number; location_code: string; on_hand: number; available: number }

/** Movimiento del libro mayor. Signo de quantity: receipt +, issue −, transfer_out −, transfer_in +, adjustment = delta. */
export type MovementType = 'receipt' | 'issue' | 'transfer_out' | 'transfer_in' | 'adjustment'
export interface Movement {
  movement_id: number; type: MovementType; part_id: number; location_id: number
  quantity: number; occurred_at: string; reference: string | null
  transfer_in_movement_id?: number // solo en la respuesta de POST /transfers
}
/** Kardex: GET /parts/{id}/ledger → más reciente primero; balance = saldo total de la pieza tras el movimiento. */
export interface LedgerEntry extends Movement { balance: number }
export interface Ledger { part_id: number; entries: LedgerEntry[] }

/** GET /shortages (v_open_shortages). part_id y missing_quantity pueden ser null. */
export interface OpenShortage {
  work_order_id: number; work_order_code: string; part_id: number | null; name: string
  missing_quantity: number | null; inspection_item_id: number; opened_at: string
}
export interface ReorderSuggestion { part_id: number; sku: string; name: string; suggested_quantity: number; work_order_ids: number[] }
export interface UnmatchedReceipt {
  id: number | string; purchase_line_id: number; part_number: string; description: string; quantity: number; unit_price: string
}

/** GET /work-orders/{code}/materials. Una línea por bom_line_id. SUPUESTO: la envoltura es { work_order_code, items }. */
export interface MaterialLine {
  inspection_item_id: number; bom_line_id: number; part_id: number | null; name: string
  required: number | null; reserved: number; issued: number; missing: number | null // missing = max(required − reserved − issued, 0)
}
export interface WorkOrderMaterials { work_order_code: string; items: MaterialLine[] }

/** Cuerpos de los comandos HTTP (§7). */
export interface IssueRequest { work_order_code: string; part_id: number; location_id: number; quantity: number; issued_by: string | number }
export interface TransferRequest { part_id: number; from_location_id: number; to_location_id: number; quantity: number }
export interface CountRequest { location_id: number; reason: string; lines: { part_id: number; counted_quantity: number }[] }
export interface CountResponse { adjustments: { part_id: number; delta: number }[] }
export interface ResolveRequest { part_id: number; location_id?: number } // location_id por defecto = 100 (U-100)

export interface ListResponse<T> { items: T[] }
export interface EventEnvelope {
  event_id: string; event_type: string; event_version: number; occurred_at: string; source: string; key: string; data: Record<string, unknown>
}

/** ---- Solo de UI ---- */
/** Alerta DERIVADA del estado del servidor (faltantes + recepciones sin relacionar). No se descarta: se resuelve sola. */
export interface AppAlert {
  id: string; kind: 'shortage' | 'unmatched'; level: 'warning' | 'info'
  title: string; detail: string; at: string
  fields: [label: string, value: string][] // para la ventana de detalle
  to: string; actionLabel: string          // ruta a la que lleva el botón de la ventana
}
export type FloorAction = 'issue' | 'transfer' | 'count'
export interface FloorForm { quantity: string; order: string; toLocationId: string; reason: string }
export interface ChatMessage { id: string; role: 'user' | 'bot'; text: string }
