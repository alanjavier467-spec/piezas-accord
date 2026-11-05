# Registro de auditorías

Última auditoría: **2026-11-05**, commit revisado `3a6bfdd` (rama `main`).
Informe completo: documento "Auditoría Piezas Accord" en Claude.
Correcciones: rama `correcciones-2026-11-05`, detalle en `docs/CAMBIOS-2026-11-05.md`. Publicado el 2026-11-05 (versión 20261105-0235): reglas de Firestore primero, luego `main`. Respaldo previo descargado en la computadora de Alan.

## Pendientes

| ID | Nivel | Hallazgo | Estado | Prueba |
|---|---|---|---|---|
| C1 | Crítico | Se cobran piezas sin existencia o más de las que hay (`checkout`) | Publicado 2026-11-05 | `pruebas/auditoria.js` doble-venta, sobreventa |
| C2 | Crítico | Un lote ya subido reaparece en otro teléfono y revive piezas vendidas | Publicado 2026-11-05 | `pruebas/lote.js` |
| C3 | Crítico | El vendedor cambia el precio por línea y salta el tope de 10 % | Publicado 2026-11-05 | `pruebas/auditoria.js` vendedor-precio |
| C4 | Crítico | PIN de 4 dígitos; vendedor puede leer clientes y cambiar el WhatsApp de la tienda | Publicado 2026-11-05 | Revisión de reglas |
| I1 | Importante | Respaldo limitado a 2,000 ventas y 60 cortes | Publicado 2026-11-05 | Código `backup()` |
| I2 | Importante | Cancelar venta la borra sin rastro | Publicado 2026-11-05 | Código `delSale()` |
| I3 | Importante | La tienda puede publicarse con datos viejos de la caché | Publicado 2026-11-05 | Código `pubSync()` |
| I4 | Importante | "Todo en el carro" publica todo el catálogo como disponible | Publicado 2026-11-05 | `pruebas/auditoria.js` publico-def-esta |
| I5 | Importante | Todas las fotos se descargan al abrir la app (lecturas de Firestore) | Publicado 2026-11-05 (fotos por pantalla) | `pruebas/auditoria.js` fotos-indice, fotos-nuevas |
| I6 | Importante | Diagramas `p/` y `d/` nunca se actualizan en teléfonos | Publicado 2026-11-05 | `fuente/sw.js` |
| I7 | Importante | Clientes pueden editar sus puntos | Publicado 2026-11-05 | Reglas `clientes` |
| I8 | Importante | Accord 2021–2022 se trata como 2020 | Publicado 2026-11-05 | `pruebas/auditoria.js` accord-2021 |
| M1–M7 | Mejora | Historial, cantidad, solicitudes, restaurar, tienda sin señal, limpieza, pruebas | Publicado 2026-11-05 (M1–M7) | Ver CAMBIOS |
| N1 | Innovación | Apartar pieza | Publicado 2026-11-05 | `pruebas/auditoria.js` apartar |
| N2–N5 | Innovación | Utilidad por carro, QR, precios bajos, buscadas sin existencia | Pendiente | — |
| Cat-1 | Catálogo | 2018/2019 y piezas CVT asumidas iguales en 2.0T sin verificar | Pendiente (requiere catálogo Honda) | — |

## Script de revisión del catálogo

```bash
python3 - <<'E'
import json,collections
D=json.load(open('data.json'));P=D['parts']
c=collections.Counter(p['pn'] for p in P)
print('renglones',len(P),'números',len(c),'repetidos',sum(1 for v in c.values() if v>1))
print('sin inglés',sum(1 for p in P if not p['en']))
E
```
