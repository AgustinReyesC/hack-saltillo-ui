import type { InventoryItem } from '../types'

/**
 * Datos FALSOS pero con la forma del General_Readme: ubicaciones U-100…U-112,
 * existencia (onHand), apartado (reserved) y disponible = onHand - reserved (≥ 0).
 * Helper `p` calcula `available` para no equivocarnos a mano.
 */
const p = (id: number, sku: string, name: string, category: string, location: string,
           onHand: number, reserved: number, minStock: number): InventoryItem =>
  ({ id, sku, name, category, location, onHand, reserved, available: Math.max(0, onHand - reserved), minStock })

export const mockInventory: InventoryItem[] = [
  p(1, 'RC-1001', 'Tarjeta madre modelo A', 'Electrónica', 'U-101', 8, 3, 4),
  p(2, 'RC-1002', 'Fuente de poder 500W', 'Electrónica', 'U-101', 5, 5, 3),
  p(3, 'RC-1003', 'Capacitor 470µF 25V', 'Componentes', 'U-102', 240, 40, 100),
  p(4, 'RC-1004', 'Resistencia 10kΩ (paquete 100)', 'Componentes', 'U-102', 35, 2, 10),
  p(5, 'RC-1005', 'Pantalla LCD 15"', 'Display', 'U-103', 2, 2, 3),
  p(6, 'RC-1006', 'Cable flex de pantalla', 'Cables', 'U-104', 14, 1, 5),
  p(7, 'RC-1007', 'Ventilador 12V', 'Refrigeración', 'U-105', 0, 0, 6),
  p(8, 'RC-1008', 'Pasta térmica 5g', 'Consumibles', 'U-106', 60, 4, 20),
  p(9, 'RC-1009', 'Batería Li-ion 3000mAh', 'Energía', 'U-107', 9, 6, 5),
  p(10, 'RC-1010', 'Conector USB-C hembra', 'Conectores', 'U-108', 120, 18, 40),
  p(11, 'RC-1011', 'Disco SSD 256GB', 'Almacenamiento', 'U-109', 4, 1, 4),
  p(12, 'RC-1012', 'Memoria RAM 8GB DDR4', 'Almacenamiento', 'U-109', 11, 2, 4),
  p(13, 'RC-1013', 'Bocina 3W', 'Audio', 'U-110', 3, 0, 5),
  p(14, 'RC-1014', 'Teclado de reemplazo', 'Periféricos', 'U-111', 7, 3, 3),
  p(15, 'RC-1015', 'Tornillería M2 (caja)', 'Consumibles', 'U-112', 22, 0, 8),
  p(16, 'RC-1016', 'Lote recién recibido (por ubicar)', 'Recepción', 'U-100', 30, 0, 0),
]
