# V2.1 Competitive Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Entregar generador/editor competitivo educativo híbrido con dos formatos, validación básica y borradores persistentes.

**Architecture:** Motor puro y plantillas curadas en src/competitive/core; UI lazy en ruta /competitive; persistencia versionada en LocalDraftStore. La Pokédex V1 se consulta al abrir el módulo, no se copia al borrador.

**Tech Stack:** React + TypeScript + Vite + Vitest + React Testing Library.

**Spec:** docs/superpowers/specs/2026-11-03-v2-competitive-core-design.md

## Global Constraints
- Proteger main; rama feature/v2-competitive-core y PR sin merge automático.
- Sin nuevos paquetes ni servicios externos en ejecución.
- No afirmar legalidad OU/VGC actual; mostrar limitaciones y procedencia de ejemplos.
- Mantener accesible /adventure, /collection, /saved y restauración de V2.0.
- Mantener interfaz responsiva.

## Review Focus
- Equipo con 6 especies + bloqueo: regenerar sin duplicados ni perder bloqueos (prueba generación).
- Datos de EV/IV incorrectos: mostrar errores separados sin modificar lo introducido (prueba validador).
- Objetos iguales en Dobles y permitidos en Singles (prueba validador).
- Borrador antiguo/corrupto o especie eliminada del dataset: recuperar estado seguro (prueba storage/UI).
- Cambiar formato y regresar: equipos no se pisan (prueba UI/persistencia).

---

### Task 1: Domain + pure engine
**Files:** src/competitive/core/types.ts, templates.ts, teamBuilder.ts, validation.ts, analysis.ts y pruebas *.test.ts.
- [ ] Definir tipos y plantillas didácticas de Singles/Dobles con IDs del dataset.
- [ ] Test rojo: generar seis especies sin duplicados, preservar bloqueados y objetos únicos Dobles.
- [ ] Implementar selección del catálogo de plantillas, creación manual de sets y regeneración por miembro.
- [ ] Test rojo: EVs/IVs, especies y objetos duplicados, campos incompletos, tipo compartido.
- [ ] Implementar validador y análisis de debilidades/roles, sin legalidad de metagame.
- [ ] Confirmar tests verdes y commit.

### Task 2: Persisted workspace
**Files:** src/competitive/competitiveDraft.ts, src/competitive/competitiveDraft.test.ts.
- [ ] Test rojo: serialización de dos formatos, corrupción y versiones incompatibles.
- [ ] Crear store versionado con guardia de tipo y sanitización de 6 slots.
- [ ] Confirmar tests verdes y commit.

### Task 3: Real interactive UI
**Files:** src/competitive/CompetitiveLandingPage.tsx, src/competitive/competitive.css, src/competitive/CompetitiveLandingPage.test.tsx.
- [ ] Test rojo: abrir ruta, generar Singles, editar set, navegar a Dobles y restaurar Singles.
- [ ] Implementar selección de formato y guía, tarjetas, locks, reroll, editor EV/IV, naturaleza, movimientos, análisis, exportación texto y avisos.
- [ ] Confirmar test y build; corregir errores.

### Task 4: Documentation + verification
**Files:** README.md y docs/superpowers.
- [ ] Documentar V2.1 activo, límites y roadmap V2.2.
- [ ] CI fresco: data:sync-all, data:validate-all,  tests, build y chunks.
- [ ] Revisar diff y abrir PR hacia main, sin mergear.
