import type { Availability, PartSummary, StockRow } from '../types'
/** Aplana una pieza + su Availability en una fila por ubicación (tabla de existencias). */
export const toStockRows = (p: PartSummary, a: Availability): StockRow[] =>
  a.locations.map((l) => ({ part_id: p.part_id, sku: p.sku, name: p.name, location_id: l.location_id, location_code: l.code, on_hand: l.on_hand, available: l.available }))
