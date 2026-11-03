# Collection Evolution and Bulk UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** completar evoluciones según juego, añadir acciones globales con locks correctos y rediseñar la Colección.

**Architecture:** sobre datos de base, una capa colección resuelve evoluciones posteriores con límite de generación; reducers puros para acciones masivas; UI de configuración y resultados con estilos propios y pruebas.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, GitHub Actions.

**Spec:** docs/superpowers/specs/2026-11-03-collection-evolution-ux.md

## Global Constraints
- Cambios solo en feature/collection-evolutions-bulk-ux, PR hacia main.
- No mutar el dataset general ni afirmar legalidad exacta en juegos con disponibilidad parcial.
- Respetar persistencia y API anteriores.
- Mantener rutas existentes.

## Review Focus
- Evoluciones posteriores no disponibles en juegos antiguos: tope generación y tests.
- Evolución por intercambio desactivado: debe permanecer Haunter.
- Eevee no pierde ramas cuando se amplía la Pokédex: test ramificación.
- Bloqueos masivos y reroll individual no modifican regiones/slots ajenos: tests.
- Anchos móviles y controles de borrado/recarga: test accesibilidad y estilos.

---

### Task 1 · Evoluciones coherentes
**Files:** `src/generator/collection/collectionCandidates.ts`, `src/generator/collection/collectionCandidates.test.ts`, `generateCollection.ts`.
- [ ] Test rojo synthetic HGSS / Gold / Red, intercambios y ramificación.
- [ ] Resolver finales de origen regional filtrando aristas al juego (generación, condiciones).
- [ ] Evitar volver a mostrar intermedios cuando existe final alcanzable.
- [ ] Reutilizar el conjunto final en generation y bonus; tests verdes.

### Task 2 · Acciones globales / reroll de miembro
**Files:** `src/collection/collectionActions.ts`, `src/collection/collectionActions.test.ts`, `src/generator/collection/regenerateCollectionMember.ts` y tests.
- [ ] Test rojo bulk trade/bonus/lock/clear; red de regeneración exacta.
- [ ] Implementar reducers puros y regeneración que conserve otros slots y estadísticas agregadas.
- [ ] Tests verdes.

### Task 3 · Vista global y tarjetas
**Files:** `src/collection/CollectionPage.tsx`, `collection.css`, `CollectionActionButton.tsx`, tests UI.
- [ ] Test rojo toggles y global actions; tarjeta sin IDs y con controles de miembro.
- [ ] Aplicar esquema configurador / toolbar / tarjetas informativas con responsive.
- [ ] Tests verdes.

### Task 4 · Verificación y PR
- [ ] Ejecutar CI sync / validate / tests / build.
- [ ] Revisar diff, corregir regresiones y abrir PR; no fusionar.
