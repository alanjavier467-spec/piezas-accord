---
name: audita-piezas-accord
description: Auditoría completa de Piezas Accord. Úsala cuando Alan escriba "AUDITA PIEZAS ACCORD" o pida revisar, auditar o buscar errores en la app, la tienda, el catálogo o las reglas de Firebase.
---

# AUDITA PIEZAS ACCORD

Objetivo: encontrar errores reales (no inventados) y comparar contra la auditoría anterior. Nunca tocar producción.

## Reglas
- No escribir en el Firebase real. Todas las pruebas usan `pruebas/mock/` (Firebase simulado).
- Construir con una copia de `fuente/config.json` con valores falsos (`projectId: demo-piezas`) en una carpeta temporal; nunca subir esa copia.
- Los cambios se hacen en `fuente/` y se arman con `python3 fuente/build_repo.py`. No editar a mano `index.html`, `tienda.html`, `sw.js`, `firestore.rules`, `version.json`.
- Toda corrección va en una rama nueva (`auditoria-AAAA-MM-DD`), con pruebas, y espera el "sí" de Alan antes de unirse a `main`.
- Distinguir: CONFIRMADO (probado o evidente en código), RIESGO, RECOMENDACIÓN. Compatibilidades: CONFIRMADA / PROBABLE / NO CONFIRMADA / INCOMPATIBLE, nunca confirmar sin evidencia.

## Pasos
1. Leer `docs/AUDITORIA.md` (pendientes y fecha de la última auditoría).
2. `git log --since=<fecha de la última>` y `git diff <commit anterior>..HEAD --stat` para ver qué cambió. Revisar solo a fondo lo que cambió, más los pendientes.
3. Armar copia de prueba y servir: `python3 fuente/build_repo.py && python3 -m http.server 8767 &`.
4. Correr pruebas: `node pruebas/prueba.js`, `node pruebas/auditoria.js`, `node pruebas/lote.js` (variable `CHROME` si hace falta la ruta del navegador).
5. Revisar `fuente/firestore.rules` contra la tabla de permisos de `docs/BASE-DE-DATOS.md`.
6. Revisar `data.json`: números repetidos, nombres, campos `y` (versiones) y secciones sin diagrama (script en `docs/AUDITORIA.md`).
7. Para cada pendiente de `docs/AUDITORIA.md`: marcar Corregido / Sigue / Ya no aplica, con la prueba que lo demuestra.
8. Registrar hallazgos nuevos con: problema, ubicación, evidencia, consecuencia, solución, dificultad, prioridad, cómo comprobar.
9. Actualizar `docs/AUDITORIA.md` (fecha, commit revisado, tabla de pendientes) y entregar a Alan un resumen corto: qué se corrigió, qué sigue, qué es nuevo, y el plan priorizado.
