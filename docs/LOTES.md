# Lotes de inventario

Un **lote** es un archivo `lote.json` que va en la raíz del sitio. Sirve para cargar de un jalón estados, piezas agregadas y fotos. En la app se sube con *☰ → 📦 Lote de inventario listo → Subir lote a la app* (hay que tocar dos veces para confirmar). Cada lote necesita un `id` nuevo; la app recuerda cuáles ya se subieron.

```json
{"id":"2026-10-26-a","titulo":"Qué trae este lote",
 "carros":{"A1":{"vin":"...","year":"2018"},"BOD":{"crear":true,"code":"BOD","def":"falta"}},
 "estado":[{"car":"A2","pn":"37260-RNA-A01","s":"quitada","n":1,"u":"T-3","alt":["37260-RNA-A02"]}],
 "extras":[{"id":"x-20261026-01","name":"...","num":"","cond":"Usado","car":"","qty":1,"price":250,"sug":true,"ubi":"T-5"}],
 "fotos":[{"id":"f-...","pn":"37260-RNA-A01","car":"","cond":"","nota":"","thumb":"data:image/jpeg;base64,...","full":"data:image/jpeg;base64,..."}],
 "mover":[{"id":"f-...","pn":"NUEVO-PN"}],
 "borrar":{"fotos":["f-..."],"extras":["x-..."]}}
```

- `s`: `esta`, `quitada`, `vendida`, `mala`, `revisar`, `falta`.
- `u` / `ubi`: lugar (`T-1`…`T-8` = rejas en la troca, `G-1`… = piezas grandes).
- `alt`: números grabados distintos al del catálogo; se guardan en `alternos`.
- `fotos`: `full` de 1100 px (JPEG calidad 72) y `thumb` de 200 px (calidad 60). En una pieza agregada, `pn` = `X:<id>`. Si se repite un `id`, la foto se reemplaza.
- `mover`: cambia una foto ya subida a otra pieza. `borrar`: quita fotos o piezas agregadas.
- `carros.BOD`: "Bodega", un carro virtual para piezas que no vienen de ningún carro.
