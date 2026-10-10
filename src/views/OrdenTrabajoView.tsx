import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AlertTriangle, Archive, ClipboardList, LoaderCircle, PackageSearch, Search } from 'lucide-react'

/* =====================================================================
   OrdenTrabajoView: refacciones de una orden de trabajo.

   Cómo fluye la información:
   1. El técnico teclea el código      → se guarda en `searchCode` (input controlado).
   2. Presiona "Buscar" (o Enter)      → `handleSearch` limpia lo anterior y prende `isLoading`.
   3. `fetchOrderMaterials` decide     → mock (setTimeout de 1 s) o API real (fetch).
   4. Llega la respuesta               → se guarda en `order`; si falla, el mensaje va a `error`.
   5. `toMaterialRows` arma las filas  → la tabla pinta una fila por pieza y estado.
   ===================================================================== */

// ---------- Tipos (espejo de GET /work-orders/:code/materials) ----------

/** Estado de una pieza dentro de la orden. Una misma pieza puede salir en varias filas (p. ej. 4 reservadas y 2 faltantes). */
export type MaterialStatus = 'reservado' | 'entregado' | 'pendiente'

/** Una línea tal como la devuelve la API: una por renglón de BOM (`bom_line_id`) que la orden necesita. */
export interface MaterialItem {
  inspection_item_id: number
  bom_line_id: number
  part_id: number | null  // null = la necesidad todavía no está ligada a una pieza del catálogo
  name: string
  required: number | null // cantidad que pidió la inspección; null = sin definir
  reserved: number        // apartado en almacén para esta orden
  issued: number          // ya entregado al técnico
  missing: number | null  // max(required − reserved − issued, 0); null cuando `required` es null
}

/** Respuesta completa del endpoint. */
export interface OrderMaterialsResponse {
  work_order_id: number
  code: string
  deleted: boolean // orden dada de baja ⇒ la API ya reporta missing = 0
  lines: MaterialItem[]
}

/** Fila lista para la tabla: una por combinación (pieza, estado). Solo existe en la UI. */
interface MaterialRow {
  key: string
  name: string
  partId: number | null
  required: number | null
  quantity: number | null // null solo en faltantes sin cantidad definida
  status: MaterialStatus
}

// ---------- Configuración ----------

/** 'true' ⇒ datos de prueba locales; cualquier otro valor ⇒ API real. Se cambia en .env y se reinicia `npm run dev`. */
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

/** Base de la API de inventario, p. ej. http://localhost:8000 */
const API_URL = import.meta.env.VITE_API_URL as string | undefined

// ---------- Datos de prueba (mismo formato que la API real) ----------

/** Órdenes simuladas, indexadas por código. Cubren los tres estados y los casos con valores null. */
const MOCK_ORDERS: Record<string, OrderMaterialsResponse> = {
  R061026012: {
    work_order_id: 12,
    code: 'R061026012',
    deleted: false,
    lines: [
      { inspection_item_id: 1201, bom_line_id: 501, part_id: 301, name: 'Sello de labio 35x52', required: 2, reserved: 2, issued: 0, missing: 0 },
      { inspection_item_id: 1202, bom_line_id: 502, part_id: 302, name: 'Carbón de motor 12x10', required: 4, reserved: 0, issued: 4, missing: 0 },
      { inspection_item_id: 1203, bom_line_id: 503, part_id: 303, name: 'Tarjeta driver DC 24V', required: 1, reserved: 0, issued: 0, missing: 1 },
      { inspection_item_id: 1204, bom_line_id: 504, part_id: 305, name: 'Rodamiento 7205 B', required: 6, reserved: 4, issued: 0, missing: 2 },
      { inspection_item_id: 1205, bom_line_id: 505, part_id: null, name: 'Ventilador de gabinete 120 mm', required: null, reserved: 0, issued: 0, missing: null },
    ],
  },
  R061026014: {
    work_order_id: 14,
    code: 'R061026014',
    deleted: false,
    lines: [
      { inspection_item_id: 1401, bom_line_id: 510, part_id: 307, name: 'Grasa EP2 (cartucho)', required: 2, reserved: 0, issued: 2, missing: 0 },
      { inspection_item_id: 1402, bom_line_id: 511, part_id: 304, name: 'Capacitor 470µF 25V', required: 10, reserved: 6, issued: 4, missing: 0 },
      { inspection_item_id: 1403, bom_line_id: 512, part_id: 306, name: 'Banda de husillo HS', required: 1, reserved: 0, issued: 0, missing: 1 },
    ],
  },
}

const notFoundMessage = (code: string) => `No se encontró la orden ${code}. Revisa el código e intenta de nuevo.`

// ---------- Acceso a datos ----------

/** Modo mock: tarda 1 s como una red real y responde con MOCK_ORDERS. Si se cancela, se rechaza sin esperar. */
function fetchMaterialsMock(code: string, signal: AbortSignal): Promise<OrderMaterialsResponse> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const found = MOCK_ORDERS[code]
      if (found) resolve(structuredClone(found)) // copia: la UI nunca modifica los datos de prueba
      else reject(new Error(notFoundMessage(code)))
    }, 1000)
    signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason) }, { once: true })
  })
}

/** Modo real: GET {VITE_API_URL}/work-orders/{code}/materials. La API responde los errores como { detail }. */
async function fetchMaterialsApi(code: string, signal: AbortSignal): Promise<OrderMaterialsResponse> {
  if (!API_URL) throw new Error('Falta configurar VITE_API_URL en el archivo .env.')

  const res = await fetch(`${API_URL}/work-orders/${encodeURIComponent(code)}/materials`, { signal })
  if (res.status === 404) throw new Error(notFoundMessage(code))
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) // el cuerpo de error puede no ser JSON
    throw new Error(body.detail ?? `El servidor respondió con un error (HTTP ${res.status}).`)
  }
  return res.json() as Promise<OrderMaterialsResponse>
}

/** Único punto de entrada para obtener los materiales: elige mock o API según VITE_USE_MOCKS. */
function fetchOrderMaterials(code: string, signal: AbortSignal): Promise<OrderMaterialsResponse> {
  return USE_MOCKS ? fetchMaterialsMock(code, signal) : fetchMaterialsApi(code, signal)
}

/** Convierte cualquier falla en un texto entendible para el técnico. */
function toErrorMessage(err: unknown): string {
  if (err instanceof TypeError) return 'No se pudo conectar con el servidor. Verifica tu conexión o que la API esté encendida.' // así falla fetch sin red
  if (err instanceof Error) return err.message
  return 'Ocurrió un error inesperado al consultar la orden.'
}

// ---------- Transformación para la tabla ----------

/**
 * La API da cantidades por línea (reservado, entregado, faltante); la tabla necesita una fila por estado.
 * Ej.: { required: 6, reserved: 4, missing: 2 } ⇒ fila "Reservada × 4" + fila "Faltante × 2".
 * `missing` null significa que la necesidad no tiene cantidad definida: se muestra como faltante "Sin definir".
 */
function toMaterialRows(lines: MaterialItem[]): MaterialRow[] {
  return lines.flatMap((line) => {
    const base = { name: line.name, partId: line.part_id, required: line.required }
    const rows: MaterialRow[] = []
    if (line.reserved > 0) rows.push({ ...base, key: `${line.bom_line_id}-reservado`, quantity: line.reserved, status: 'reservado' })
    if (line.issued > 0) rows.push({ ...base, key: `${line.bom_line_id}-entregado`, quantity: line.issued, status: 'entregado' })
    if (line.missing === null || line.missing > 0) rows.push({ ...base, key: `${line.bom_line_id}-pendiente`, quantity: line.missing, status: 'pendiente' })
    return rows
  })
}

/** Cuántas filas hay de cada estado (para el resumen junto al título de la orden). */
function countByStatus(rows: MaterialRow[]): Record<MaterialStatus, number> {
  const counts: Record<MaterialStatus, number> = { reservado: 0, entregado: 0, pendiente: 0 }
  for (const row of rows) counts[row.status]++
  return counts
}

// ---------- Badges de estado ----------

/** Etiqueta y colores de cada estado. El orden de las llaves es el orden del resumen. */
const STATUS_BADGE: Record<MaterialStatus, { label: string; plural: string; className: string }> = {
  reservado: { label: 'Reservada', plural: 'reservadas', className: 'bg-green-100 text-green-800' },
  entregado: { label: 'Entregada', plural: 'entregadas', className: 'bg-slate-100 text-slate-700' },
  pendiente: { label: 'Faltante', plural: 'faltantes', className: 'bg-yellow-100 text-yellow-800' },
}

/** Badge de estado. Con `count` se usa como resumen ("3 faltantes"); sin él, como celda de la tabla. */
function StatusBadge({ status, count }: { status: MaterialStatus; count?: number }) {
  const { label, plural, className } = STATUS_BADGE[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {count === undefined ? label : `${count} ${plural}`}
    </span>
  )
}

/** Clases comunes de las celdas: tabla compacta con separador sutil entre filas. */
const TH = 'border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500'
const TD = 'border-b border-slate-100 px-5 py-2.5'

// ---------- Vista ----------

export function OrdenTrabajoView() {
  /** Lo que el técnico teclea. Se guarda en mayúsculas porque así vienen los códigos (R061026012). */
  const [searchCode, setSearchCode] = useState('')
  /** true mientras se espera la respuesta (mock o API). Muestra "Buscando…" y bloquea el botón. */
  const [isLoading, setIsLoading] = useState(false)
  /** Mensaje listo para mostrar cuando la búsqueda falla o la orden no existe. */
  const [error, setError] = useState<string | null>(null)
  /** Última orden encontrada. null = aún no se busca nada, o la última búsqueda falló. */
  const [order, setOrder] = useState<OrderMaterialsResponse | null>(null)
  /** Búsqueda en curso. Al lanzar otra se cancela la anterior para que una respuesta lenta no pise a la nueva. */
  const requestRef = useRef<AbortController | null>(null)

  // Al salir de la pantalla se cancela cualquier búsqueda pendiente.
  useEffect(() => () => requestRef.current?.abort(), [])

  /** Paso 2 a 4 del flujo: valida el código, pide los materiales y guarda el resultado o el error. */
  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault() // el <form> no debe recargar la página
    const code = searchCode.trim()
    if (!code) return

    requestRef.current?.abort()
    const request = new AbortController()
    requestRef.current = request

    setIsLoading(true)
    setError(null)
    setOrder(null)

    try {
      const data = await fetchOrderMaterials(code, request.signal)
      if (!request.signal.aborted) setOrder(data)
    } catch (err) {
      if (!request.signal.aborted) setError(toErrorMessage(err)) // cancelada = la reemplazó otra búsqueda: no es error
    } finally {
      if (!request.signal.aborted) setIsLoading(false) // si se canceló, la búsqueda nueva controla el spinner
    }
  }

  // Paso 5: filas y resumen que se pintan a partir de la respuesta.
  const rows = order ? toMaterialRows(order.lines) : []
  const counts = countByStatus(rows)

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Encabezado */}
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white">
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Órdenes de trabajo</h1>
            <p className="text-sm text-slate-500">Consulta el estado de las refacciones de un equipo en reparación.</p>
          </div>
        </header>

        {/* Buscador: input controlado + botón. Enter también envía porque es un <form>. */}
        <form onSubmit={handleSearch} className="rounded-lg bg-white p-4 shadow-sm">
          <label htmlFor="work-order-code" className="mb-2 block text-sm font-medium text-slate-700">
            Código de la orden
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="work-order-code"
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())} // paso 1
                placeholder="Ej. R061026012"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="h-12 w-full rounded-lg border border-slate-300 bg-white pr-4 pl-11 text-base text-slate-900 shadow-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchCode.trim()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-800 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:border-slate-700 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Buscar
            </button>
          </div>
          {USE_MOCKS && (
            <p className="mt-2 text-xs text-slate-400">Modo de prueba activo: usa R061026012 o R061026014.</p>
          )}
        </form>

        {/* Cargando */}
        {isLoading && (
          <div role="status" className="flex items-center gap-3 rounded-lg bg-white p-6 text-sm text-slate-600 shadow-sm">
            <LoaderCircle className="h-5 w-5 animate-spin text-slate-500" aria-hidden="true" />
            Buscando…
          </div>
        )}

        {/* Error u orden no encontrada */}
        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        {/* Estado inicial: todavía no se busca nada */}
        {!isLoading && !error && !order && (
          <div className="flex flex-col items-center gap-2 rounded-lg bg-white p-10 text-center shadow-sm">
            <PackageSearch className="h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="text-sm text-slate-500">Escribe el código de una orden para ver sus refacciones.</p>
          </div>
        )}

        {/* Resultado */}
        {order && (
          <section className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Orden de trabajo</p>
                <h2 className="font-mono text-lg font-semibold text-slate-900">{order.code}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_BADGE) as MaterialStatus[]).map((status) => (
                  <StatusBadge key={status} status={status} count={counts[status]} />
                ))}
              </div>
            </div>

            {order.deleted && (
              <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-600">
                <Archive className="h-4 w-4 shrink-0" aria-hidden="true" />
                Esta orden fue dada de baja: ya no se le cuentan faltantes.
              </div>
            )}

            {rows.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">Esta orden no tiene refacciones registradas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr>
                      <th className={TH}>Pieza</th>
                      <th className={TH}>ID pieza</th>
                      <th className={`${TH} text-right`}>Requerida</th>
                      <th className={`${TH} text-right`}>Cantidad</th>
                      <th className={TH}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.key} className="hover:bg-slate-50">
                        <td className={`${TD} font-medium text-slate-900`}>{row.name}</td>
                        <td className={`${TD} font-mono text-slate-500`}>{row.partId ?? 'Sin asignar'}</td>
                        <td className={`${TD} text-right text-slate-700 tabular-nums`}>{row.required ?? '—'}</td>
                        <td className={`${TD} text-right font-semibold text-slate-900 tabular-nums`}>{row.quantity ?? 'Sin definir'}</td>
                        <td className={TD}><StatusBadge status={row.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
