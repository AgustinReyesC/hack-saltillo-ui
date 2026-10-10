# Reto Rossel

## ¿Qué quiere Rossel?
- Automatizar los procesos que actualmente hace una persona para obtener y refinar los datos provenientes de:
  - Cotizaciones
  - Existencia en inventarios
  - Procesos del negocio
  - Necesidades especiales del momento
- El resultado esperado es información especialmente útil para sus proveedores.

## Idea principal
Un agente con text to speech que permita consultar por voz:
- Inventario y productos en stock.
- Productos defectuosos y si se pueden reparar.
- Piezas en existencia, mostradas como opción.
- Si un producto no está en existencia: proveedores, fechas de entrega y costos (por confirmar).

### Flujo
1. El usuario presiona el agente y le da el contexto.
2. El agente busca en la base de datos e informa.
3. El pedido es otro evento que simula una solicitud.
4. Se envía un correo al proveedor y al usuario que va a comprar.
5. Se debe manejar autenticación.

## Manejo de inventarios
Una página de control de inventarios en tiempo real (posiblemente cada minuto, manejado con eventos):
- Los eventos se generan a partir del simulador.
- La actualización se manda al event reach.
- La API consume el evento para aplicar los cambios.
- Hay una queue: el usuario se guarda en la queue y cada evento se manda como una alerta.

## Reparación de piezas
Una pieza defectuosa llega con un cliente o es detectada por el mismo inventario. El sistema analiza si hay piezas en inventario y revisa su status:

| Situación | Resultado |
|---|---|
| Defectuoso y hay piezas | Se puede reparar |
| Defectuoso y no hay piezas | Se pide lo necesario |
| Faltan piezas parcialmente | Solo se analiza el costo de las que se van a pedir |

## Módulo esperado
- Avisar cuando haya movimientos en el inventario.
- Autorizar un nuevo equipo que requiera una refacción.
- Consultar existencia y, si no hay, indicar por qué no hay.
- Indicar cuánto tiempo tarda en repararse el equipo.
- Dentro de las cotizaciones, el proveedor incluye especificaciones.

## Especificaciones técnicas
-
