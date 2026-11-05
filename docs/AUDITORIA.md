# Registro de auditorías

Última auditoría: **2026-11-05**, commit revisado `3a6bfdd` (rama `main`).
Informe completo: documento "Auditoría Piezas Accord" en Claude.
Correcciones: rama `correcciones-2026-11-05`, detalle en `docs/CAMBIOS-2026-11-05.md`. "Corregido en rama" = probado, falta publicar (reglas primero).

## Pendientes

| ID | Nivel | Hallazgo | Estado | Prueba |
|---|---|---|---|---|
| C1 | Crítico | Se cobran piezas sin existencia o más de las que hay (`checkout`) | Corregido en rama | `pruebas/auditoria.js` doble-venta, sobreventa |
| C2 | Crítico | Un lote ya subido reaparece en otro teléfono y revive piezas vendidas | Corregido en rama | `pruebas/lote.js` |
| C3 | Crítico | El vendedor cambia el precio por línea y salta el tope de 10 % | Corregido en rama | `pruebas/auditoria.js` vendedor-precio |
| C4 | Crítico | PIN de 4 dígitos; vendedor puede leer clientes y cambiar el WhatsApp de la tienda | Corregido en rama | Revisión de reglas |
| I1 | Importante | Respaldo limitado a 2,000 ventas y 60 cortes | Corregido en rama | Código `backup()` |
| I2 | Importante | Cancelar venta la borra sin rastro | Corregido en rama | Código `delSale()` |
| I3 | Importante | La tienda puede publicarse con datos viejos de la caché | Corregido en rama | Código `pubSync()` |
| I4 | Importante | "Todo en el carro" publica todo el catálogo como disponible | Corregido en rama | `pruebas/auditoria.js` publico-def-esta |
| I5 | Importante | Todas las fotos se descargan al abrir la app (lecturas de Firestore) | Pendiente | Código listeners |
| I6 | Importante | Diagramas `p/` y `d/` nunca se actualizan en teléfonos | Corregido en rama | `fuente/sw.js` |
| I7 | Importante | Clientes pueden editar sus puntos | Corregido en rama | Reglas `clientes` |
| I8 | Importante | Accord 2021–2022 se trata como 2020 | Corregido en rama | `pruebas/auditoria.js` accord-2021 |
| M1–M7 | Mejora | Historial, cantidad, solicitudes, restaurar, tienda sin señal, limpieza, pruebas | Corregido en rama (M1–M7) | Ver CAMBIOS |
| N1 | Innovación | Apartar pieza | Hecho en rama | `pruebas/auditoria.js` apartar |
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
