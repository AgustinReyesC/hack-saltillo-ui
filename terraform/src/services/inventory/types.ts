import type { Availability, CountRequest, CountResponse, IssueRequest, Ledger, Location, Movement, OpenShortage, PartSummary,
  ReorderSuggestion, ResolveRequest, StockRow, TransferRequest, UnmatchedReceipt, WorkOrderMaterials } from '../../types'

/** CONTRATO que la UI conoce. Hay dos implementaciones (mock / http); index.ts elige una. */
export interface InventoryService {
  // ---- lecturas ----
  listParts(): Promise<PartSummary[]>                          // GET /parts
  findPartBySku(sku: string): Promise<PartSummary | null>      // GET /parts?sku=
  getAvailability(partId: number): Promise<Availability>       // GET /parts/{id}/availability
  getLedger(partId: number): Promise<Ledger>                   // GET /parts/{id}/ledger  (kardex)
  listLocations(): Promise<Location[]>                         // GET /locations (extensión propuesta)
  listStock(): Promise<StockRow[]>                             // existencias por pieza y ubicación
  listShortages(): Promise<OpenShortage[]>                     // GET /shortages
  listReorders(): Promise<ReorderSuggestion[]>                 // GET /reorder-suggestions
  listUnmatched(): Promise<UnmatchedReceipt[]>                 // GET /unmatched-receipts
  getWorkOrderMaterials(code: string): Promise<WorkOrderMaterials> // GET /work-orders/{code}/materials
  // ---- comandos ----
  issue(req: IssueRequest): Promise<Movement>                  // POST /issues
  transfer(req: TransferRequest): Promise<Movement>            // POST /transfers
  count(req: CountRequest): Promise<CountResponse>             // POST /counts
  resolveReceipt(id: number | string, req: ResolveRequest): Promise<Movement> // POST /unmatched-receipts/{id}/resolve
}
