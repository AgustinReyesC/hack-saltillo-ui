import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './theme.css'
// BrowserRouter habilita las rutas (URLs reales: /piso, /ordenes/R061026012…) para toda la app.
createRoot(document.getElementById('root')!).render(<BrowserRouter><App /></BrowserRouter>)
