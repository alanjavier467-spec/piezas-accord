# Piezas Accord · Trío Accord

Sistema del yonke de piezas originales de Honda Accord 2018–2020 Sport (Chihuahua, México). Son dos páginas que usan la misma base de datos:

| Página | Archivo | Para quién |
|---|---|---|
| **Tienda** | `tienda.html` | Clientes. Muestra el catálogo, los carros donadores, "Explorar el Accord", la cotización por WhatsApp, las cuentas con puntos y el aviso de privacidad. |
| **App** | `index.html` | Vendedores y creadores. Sirve para inventario, fotos, carros, precios, carrito, ventas, tickets, lotes, clientes y respaldo. Funciona sin señal. |

Sitio publicado: `https://alanjavier467-spec.github.io/piezas-accord/`. El enlace principal abre la tienda; la app se abre con `index.html?entrar`.

---

## Cómo está hecho

```
Navegador (teléfono / computadora)
 ├─ tienda.html ─┐
 └─ index.html  ─┤  JavaScript (sin frameworks) + SDK web de Firebase 10.12.2
                 │
                 ├─ Firebase Authentication  → cuentas (usuario + PIN de 4 números)
                 └─ Cloud Firestore          → todos los datos + reglas de seguridad
GitHub Pages     → hospeda los archivos (HTML, diagramas, catálogo)
```

- **Frontend:** son páginas HTML de un solo archivo cada una, con su CSS y su JS dentro. Las plantillas están en `fuente/` y el script `build_repo.py` les inserta el CSS, la configuración y el número de versión.
- **Backend:** no hay servidor propio. La "lógica del servidor" son:
  1. **Las reglas de seguridad de Firestore** (`fuente/firestore.rules`). Deciden quién puede leer y escribir cada cosa: dueño, creador, vendedor, cliente o visitante. Por ejemplo, un vendedor no puede dar más de 10 % de descuento.
  2. **Firebase Authentication**. El usuario se convierte en un correo interno (`u<hash>@usuarios.piezas-accord.app`) y el PIN en una contraseña. Firebase guarda las contraseñas cifradas.
  3. **Procesos dentro de la app.** Cada miembro con la app abierta publica el resumen público de la tienda (`publico/inventario`). La app también registra las ventas en lote (venta + existencias + puntos del cliente), funciona sin señal gracias a la caché de Firestore y al service worker, y se actualiza comparando con `version.json`.
- **Sin señal:** `sw.js` guarda la app, el catálogo (`data.json`) y los diagramas (`p/`, `d/`). Firestore guarda los datos en el teléfono y los sube cuando regresa la señal.

## Carpetas y archivos

```
fuente/                  ← AQUÍ se hacen los cambios
  index.tpl.html         plantilla de la app (pantallas, diseño y funcionamiento)
  tienda.tpl.html        plantilla de la tienda
  app.css, extra.css     estilos compartidos de la app
  sw.js                  service worker (sin señal + actualizaciones)
  firestore.rules        reglas de seguridad (plantilla con __OWNER_EMAIL__)
  build_repo.py          arma las páginas finales
  config.example.json    configuración de ejemplo (sin claves)
  config.json            tu configuración real (no se comparte)
  manifest.webmanifest   datos de la app instalable
  build.py               script viejo, ya no se usa
data.json                catálogo: 144 secciones y miles de piezas (número de parte, nombre en español e inglés, años)
p/0.json … p/143.json    dibujos del despiece por sección (para tarjetas y detalle)
d/0.json … d/143.json    diagramas grandes con números (Explorar el Accord)
logo-trio.png, logo-trio-sm.png, mini-accord.png, icon-192.png, icon-512.png   imágenes e íconos
lote.json, import.json   ejemplos de lotes de carga de inventario (formato en docs/LOTES.md)
docs/                    base de datos, permisos y lotes
pruebas/                 prueba automática sin internet (Firebase simulado)
index.html, tienda.html, sw.js, firestore.rules, version.json   ← SE GENERAN, no se editan a mano
```

## Instalar y ejecutar

**Requisitos:** Python 3 (para armar las páginas y servirlas). Opcional: Node 18+ para las pruebas.

1. **Crea un proyecto de Firebase** (o usa el existente) en https://console.firebase.google.com:
   - *Authentication → Método de acceso →* activa **Correo electrónico/contraseña**.
   - *Firestore Database →* crea la base de datos en modo producción.
   - *Configuración del proyecto → Tus apps →* agrega una **App web** y copia sus datos.
   - *Authentication → Configuración → Dominios autorizados →* agrega `localhost` y tu dominio de GitHub Pages.
2. **Configura:**
   ```bash
   cp fuente/config.example.json fuente/config.json
   # edita fuente/config.json: pega los datos de la App web y el correo del dueño principal
   ```
3. **Arma las páginas:**
   ```bash
   python3 fuente/build_repo.py
   ```
4. **Publica las reglas:** copia el contenido del `firestore.rules` generado en *Firestore → Reglas → Publicar*. También puedes usar `firebase deploy --only firestore:rules` si tienes la herramienta de Firebase.
5. **Ejecútalo en tu computadora:**
   ```bash
   python3 -m http.server 8767
   # tienda: http://localhost:8767/tienda.html
   # app:    http://localhost:8767/index.html?entrar
   ```
6. **Primer acceso:** crea una cuenta con el correo puesto en `ownerEmail` (en Authentication o desde la app). Ese es el dueño principal y puede activar vendedores y nombrar hasta 4 creadores.

## Publicar (GitHub Pages)

1. Sube la carpeta a un repositorio de GitHub.
2. *Settings → Pages → Deploy from a branch → `main` / raíz.*
3. Cada vez que cambies algo en `fuente/`: corre `python3 fuente/build_repo.py`, haz commit y push. La nueva `version.json` hace que la app y la tienda se actualicen solas.

> **Sobre la configuración de Firebase:** los datos de la App web (apiKey, projectId…) **no son una contraseña**. Google los diseñó para ir dentro de la página, y por eso aparecen en el `index.html` publicado. Lo que protege los datos son las **reglas de seguridad**. Aun así, la copia para compartir no los trae: se llenan en `config.json`.

## Pruebas

```bash
npm install            # instala Playwright (ver package.json)
npx playwright install chromium
python3 fuente/build_repo.py
python3 -m http.server 8767 &
node pruebas/prueba.js # abre la app y la tienda con Firebase simulado y toma capturas
```

## Respaldo de los datos

En la app: *Menú → Respaldo* (solo el dueño). Descarga un `.json` con todas las colecciones, incluidas las fotos y los clientes, y desde ahí mismo se puede restaurar. Ese respaldo **sí trae datos privados** (costos, clientes, ventas): guárdalo en un lugar seguro y no lo compartas.

La estructura de cada colección y quién puede usarla está en **[docs/BASE-DE-DATOS.md](docs/BASE-DE-DATOS.md)**.
