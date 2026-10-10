import { useMemo } from 'react'
import { useWarehouse } from '../context/WarehouseContext'
import { buildAlerts } from '../utils/alerts'
/** Alertas de la campana = faltantes abiertos + recepciones sin relacionar (calculadas, sin estado propio). */
export const useAlerts = () => { const { shortages, unmatched } = useWarehouse(); return useMemo(() => buildAlerts(shortages, unmatched), [shortages, unmatched]) }
