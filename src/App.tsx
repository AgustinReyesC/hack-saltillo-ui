import { Navigate, Route, Routes } from 'react-router-dom'
import { EventsProvider } from './context/EventsContext'
import { WarehouseProvider } from './context/WarehouseContext'
import { AppLayout } from './layouts/AppLayout'
import { DashboardView } from './views/DashboardView'
//import { PisoView } from './views/PisoView'
import { WorkOrderView } from './views/WorkOrderView'
import { ResolutionView } from './views/ResolutionView'
import { FloorView } from './views/FloorView'

/** Providers (datos compartidos) → tabla de rutas. Cada <Route> dentro de AppLayout se pinta en su <Outlet/>. */
export default function App() {
  return (
    <EventsProvider><WarehouseProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardView />} />
          <Route path="piso" element={<FloorView />} />
          <Route path="ordenes" element={<WorkOrderView />} />
          <Route path="ordenes/:code" element={<WorkOrderView />} />
          <Route path="resolucion" element={<ResolutionView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </WarehouseProvider></EventsProvider>
  )
}