# Base de datos (Cloud Firestore)

Todo está en Firestore, una colección por tipo de dato. Las reglas completas están en `fuente/firestore.rules`.

## Roles

| Rol | Cómo se obtiene | Qué puede hacer |
|---|---|---|
| **Dueño principal** | Es el correo puesto en `ownerEmail` | Todo |
| **Creador** (`role: 'dueño'`) | El dueño lo nombra desde la app. Máximo 4, según `config/negocio.maxDuenos` | Igual que el dueño |
| **Vendedor** (`role: 'empleado'`) | Se registra solo y queda **pendiente** hasta que un creador lo activa | Inventario, fotos, carrito y sus propias ventas. Descuento máximo de 10 % |
| **Cliente** | Se registra en la tienda (colección `clientes`) | Ver y editar sus datos, ver sus solicitudes y sus puntos |
| **Visitante** | Sin cuenta | Leer la tienda (`publico`) y las fotos de las piezas |

Las cuentas son de Firebase Authentication. El usuario se convierte en `u<sha256(usuario)[0:32]>@usuarios.piezas-accord.app` y el PIN en la contraseña `pin-<PIN>-pz`.

## Colecciones

| Colección / documento | Campos | Leer | Escribir |
|---|---|---|---|
| `users/{uid}` | `name`, `user`, `email`, `role` (`dueño`/`empleado`), `active`, `pending`, `created` | creador, o uno mismo | creador; uno mismo solo para registrarse inactivo |
| `carros/{id}` | `code` (A1…), `year`, `vin`, `color` (código de pintura Honda), `km`, `llegada`, `notas`, `trim`, `ver` (versión), `def` (estado por defecto de sus piezas), `foto`, `link360`, `n360` | miembros | creador |
| `privado/{carId}` | `costo` (lo que costó el carro) | creador | creador |
| `estado/{carId}` | `m: { <númeroDeParte>: { s, n, u?, prev? } }`. `s` = `esta` (está en el carro), `quitada` (desmontada, a la venta), `vendida`, `mala`, `revisar`, `falta`/`na`; `n` = cantidad; `u` = lugar (T-1…, G-1…) | miembros | miembros (borrar: creador) |
| `precios/{pn}` | `price`, `es` | miembros | creador |
| `alternos/{númeroAlterno}` | `pn` (número de catálogo), `es`, `by`, `date` | miembros | miembros |
| `fotos/{id}` | `pn` (o `X:<idExtra>`), `thumb` (JPEG base64 de 200 px), `cond`, `nota`, `car`, `date`, `by` | cualquiera por id; miembros para listar | miembros (editar/borrar: quien la subió o creador) |
| `fotosfull/{id}` | `pn`, `img` (JPEG base64 de 1100 px) | igual que `fotos` | igual que `fotos` |
| `extras/{id}` | Piezas agregadas fuera del catálogo: `name`, `num`, `cond`, `nota`, `car`, `qty`, `status` (`disponible`/`vendida`), `price`, `sug`, `ubi`, `date`, `by` | miembros | miembros (borrar: creador) |
| `ventas/{id}` | `folio`, `items[] {pn, xid?, es, car, qty, price}`, `sub`, `desc`, `total`, `cliente`, `cliId?`, `puntos?`, `date`, `by`, `byName` | creador; vendedor solo las suyas | crear: miembros (vendedor máx. 10 % de descuento); editar/borrar: creador |
| `clientes/{uid}` | `user`, `name`, `tel`, `email`, `created`, `puntos`, `compras`, `ultimaCompra` | miembros o el propio cliente | el propio cliente; miembros suman puntos |
| `solicitudes/{id}` | `uid`, `user`, `name`, `tel`, `pay`, `coment`, `total`, `date`, `items[] {k, pn, es, qty, price}` | creador o el cliente que la hizo | crear: el cliente (con su propio `uid`) |
| `config/negocio` | `nombre`, `tel`, `wa`, `dir`, `pie`, `maxDuenos` (1–4) | miembros | creador |
| `vista360/{carId}_{i}` | `car`, `i`, `img`: cuadros de la vista 360° | miembros | creador |
| `publico/inventario` | Resumen público para la tienda (ver abajo) | **cualquiera** | miembros. Debe traer la lista de `cars` |

### `publico/inventario` (lo que lee la tienda)

La app de cualquier miembro lo arma y lo guarda solo, unos segundos después de cualquier cambio. Firestore no acepta listas dentro de listas, así que cada renglón va guardado como texto JSON.

```js
{
  v: 3,
  t: "2026-10-28T07:50:01Z",           // cuándo se armó
  nombre, dir, pie, wa,                // datos del negocio
  cars:  [{code, year, ver, color, foto, n}],   // carros donadores (sin la Bodega)
  items: ['["33100-TVA-A01",6800,1,"A1,A4","fotoId1,fotoId2","Usado",1]'],
         //  [número, precio, cantidad, carros, fotos, condición, ¿precio sugerido?]
  xs:    ['["x-id","Nombre","num",precio,cant,"A2","fotoIds","Usado"]'],  // piezas agregadas
  rev:   ["número", …]                 // piezas "por confirmar"
}
```

En la tienda, una pieza que está en `items` sale **Disponible**, una que está en `rev` sale **Por confirmar**, y las demás salen **Sin existencia**.

## Archivos estáticos (no están en Firestore)

- `data.json`: catálogo con la forma `{secs:[{i,cat,es,en}], parts:[{pn,es,en,s,ref,sp,cr?,y?}]}`. `pn` es el número del 2020 Sport 1.5T, `s` la sección, `ref` el número en el diagrama, `sp` el precio sugerido y `y` los números en otras versiones (`{"18":…,"19":…,"20T":…}`).
- `p/<sección>.json`: dibujos por pieza, con clave `pn|ref`.
- `d/<sección>.json`: diagrama grande de la sección.

## Exportar e importar

- **Todo (privado):** en la app, *Menú → Respaldo → Descargar respaldo*. Para restaurar se usa la misma pantalla.
- **Lo público:** `datos/publico_inventario.json` en el paquete compartido. Es lo mismo que ve cualquier visitante de la tienda.
- **Cargar inventario por lotes:** ver [LOTES.md](LOTES.md).
