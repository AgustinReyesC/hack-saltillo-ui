import { AlertTriangle } from 'lucide-react'

/** Mensaje de error en línea: icono + texto. Reemplaza el texto con símbolo de advertencia. */
export const ErrorText = ({ children }: { children: React.ReactNode }) => (
  <p className="error"><AlertTriangle size={16} aria-hidden="true" /><span>{children}</span></p>
)
