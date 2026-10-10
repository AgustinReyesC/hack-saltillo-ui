import { ErrorText } from '../components/presentational/ErrorText'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWorkOrder } from '../hooks/useWorkOrder'
import { OrderSearchForm } from '../components/presentational/OrderSearchForm'
import { WorkOrderTables } from '../components/presentational/WorkOrderTables'

/** Rutas: /ordenes (vacía) y /ordenes/:code. El código vive en la URL ⇒ se puede compartir o abrir desde una alerta. */
export function WorkOrderView() {
  const { code } = useParams()                 // lee :code de la URL
  const navigate = useNavigate()
  const [text, setText] = useState(code ?? '') // lo que se escribe en el buscador
  useEffect(() => setText(code ?? ''), [code]) // si la URL cambia (clic en una alerta), el input se sincroniza
  const { data, loading, error } = useWorkOrder(code)
  return (
    <>
      <div className="page-head"><h1>Orden de trabajo</h1>
        <OrderSearchForm value={text} onChange={setText} onSearch={() => navigate(`/ordenes/${text.trim()}`)} /></div>
      {!code && <p className="muted">Escribe un código de orden para ver sus materiales.</p>}
      {loading && <p className="muted">Buscando…</p>}
      {error && <ErrorText>{error}</ErrorText>}
      {data && <><h2 className="mono order-title">{data.work_order_code}</h2><WorkOrderTables data={data} /></>}
    </>
  )
}
