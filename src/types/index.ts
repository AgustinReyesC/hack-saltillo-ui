/**
 * Interfaces = espejo de lo que dice API_README.md. Convenciones del contrato (§0 regla 6-7):
 *  - nombres en snake_case, tal cual salen de la API (NO los renombramos: menos bugs al conectar)
 *  - importes como TEXTO ("1850.00"), cantidades enteras, fechas ISO 8601 UTC terminadas en "Z"
 *  - listas vienen como { items: [...] }, errores como { detail: "..." }
 * Un campo con "?" = la doc no lo detalla del todo (p. ej. columnas de v_part_agent_summary): confírmalo.
 */

/** Estados de pieza (tabla part_condition, §8.2). Solo "new" y "functional" cuentan como disponibles. */
export type PartCondition = 'new' | 'functional' | 'defective' | 'under_repair' | 'scrapped'

/** Fila de GET /parts (sale de v_part_agent_summary + tabla part). */
export interface PartSummary {
  part_id: number
  sku: string
  name: string
  on_hand: number            // físico, suma de ubicaciones
  reserved: number           // apartado para órdenes
  available: number          // on_hand - reserved (≥ 0)
  condition_code: PartCondition | null
  repair_tools_count: number // >0 ⇒ es reparable (§10)
  family?: string            // 'SERVICIO' ⇒ no se inventaría
  group_name?: string
  is_service?: boolean
  active?: boolean
  image_url?: string | null
  status_note?: string | null // part_status.note: descripción del problema (§8.2); null si no hay
}

/** Una ubicación dentro de GET /parts/{id}/availability (por ubicación reserved = 0, §6.7). */
export interface LocationAvailability {
  location_id: number; code: string; on_hand: number; reserved: number; available: number
}
/** GET /parts/{part_id}/availability */
export interface Availability {
  part_id: number; on_hand: number; reserved: number; available: number
  locations: LocationAvailability[]
}

/** Fila de GET /shortages (vista v_open_shortages). part_id y missing_quantity pueden ser null (§6.3). */
export interface OpenShortage {
  work_order_id: number; work_order_code: string
  part_id: number | null; name: string; missing_quantity: number | null
  inspection_item_id: number; opened_at: string
}
/** Fila de GET /reorder-suggestions (v_reorder_suggestions). */
export interface ReorderSuggestion {
  part_id: number; sku: string; name: string; suggested_quantity: number; work_order_ids: number[]
}
/** Fila de GET /unmatched-receipts. id puede ser número o texto (BIGSERIAL, §11). unit_price es TEXTO. */
export interface UnmatchedReceipt {
  id: number | string; purchase_line_id: number; part_number: string
  description: string; quantity: number; unit_price: string
}
/** Toda lista del contrato llega envuelta así. */
export interface ListResponse<T> { items: T[] }

/** Sobre de evento (§3.1 y §5). Los de salida llevan source = "inventory" y event_type "stock.*". */
export interface EventEnvelope {
  event_id: string; event_type: string; event_version: number
  occurred_at: string; source: string; key: string
  data: Record<string, unknown>
}

/** Solo de UI (no vienen de la API): */
export interface AppNotification {
  id: string; title: string; detail: string; level: 'info' | 'warning' | 'success'; at: string
  read: boolean                       // ¿el usuario ya la abrió?
  event_type: string; key: string; data: Record<string, unknown> // para la ventana de detalle
}
export interface ChatMessage { id: string; role: 'user' | 'bot'; text: string }
