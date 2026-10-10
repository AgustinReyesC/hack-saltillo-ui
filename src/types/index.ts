/**
 * Una `interface` de TypeScript describe la FORMA de un objeto. No existe en tiempo de
 * ejecución: solo ayuda al editor y al compilador a avisarte si te equivocas de campo.
 */

/** Sobre común de TODO evento (General_Readme, "Event model"). La API de eventos nos lo envía así. */
export interface EventEnvelope {
  event_id: string          // UUID: sirve para descartar duplicados (entrega "at-least-once")
  event_type: string        // p. ej. "stock.shortage_detected"
  event_version: number
  occurred_at: string       // fecha ISO
  source: string
  key: string               // clave de orden, p. ej. código de orden "R061026012"
  data: Record<string, unknown>  // el contenido varía según event_type
}

/** Faltante: material necesario que no alcanzó (GET /shortages). ⚠ Ajusta campos a contract/openapi.yaml */
export interface Shortage {
  work_order_code: string
  part_id: number
  missing_quantity: number
}

/** Sugerencia de reorden (GET /reorder-suggestions). ⚠ Ajusta campos a contract/openapi.yaml */
export interface ReorderSuggestion {
  part_id: number
  suggested_quantity: number
}

/** Notificación ya "traducida" a algo legible para el usuario. */
export interface AppNotification {
  id: string                                  // = event_id
  title: string
  detail: string
  level: 'info' | 'warning' | 'success'       // define el color en la UI
  at: string
}

/** Un mensaje del chat. */
export interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  text: string
}

/** Una fila del inventario (una pieza con su existencia). Es lo que muestra la tabla. */
export interface InventoryItem {
  id: number
  sku: string          // código de catálogo (el README lo compara sin importar mayúsculas/espacios)
  name: string
  category: string
  location: string     // ubicación de almacén: U-100 … U-112 (U-100 = recepción de compras)
  onHand: number       // físicamente en almacén
  reserved: number     // apartado para órdenes de trabajo
  available: number    // onHand - reserved (nunca < 0, regla del README)
  minStock: number     // por debajo → se sugiere reordenar
}
