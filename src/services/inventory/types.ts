import type { Availability, OpenShortage, PartSummary, ReorderSuggestion, UnmatchedReceipt } from '../../types'

/**
 * CONTRATO que la UI conoce. Los hooks SOLO hablan con esta interfaz; no saben si detrás hay
 * datos falsos o la API real. Cambiar de mock a real = cambiar qué clase se entrega (index.ts).
 */
export interface InventoryService {
  listParts(): Promise<PartSummary[]>                    // GET /parts
  getAvailability(partId: number): Promise<Availability> // GET /parts/{id}/availability
  listShortages(): Promise<OpenShortage[]>               // GET /shortages
  listReorders(): Promise<ReorderSuggestion[]>           // GET /reorder-suggestions
  listUnmatched(): Promise<UnmatchedReceipt[]>           // GET /unmatched-receipts
}
