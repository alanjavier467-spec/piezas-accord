# Piezas Accord — notas para Claude

- Los cambios se hacen en `fuente/` y se arman con `python3 fuente/build_repo.py`. `index.html`, `tienda.html`, `sw.js`, `firestore.rules` y `version.json` se generan; no se editan a mano.
- Nunca escribir en el Firebase real durante pruebas: usar `pruebas/mock/` y una config falsa.
- Correcciones en una rama nueva; Alan aprueba antes de unir a `main` y publicar.
- "AUDITA PIEZAS ACCORD" → skill `audita-piezas-accord`; el registro de pendientes está en `docs/AUDITORIA.md`.
- Respuestas para Alan en español sencillo, sin tecnicismos innecesarios.
