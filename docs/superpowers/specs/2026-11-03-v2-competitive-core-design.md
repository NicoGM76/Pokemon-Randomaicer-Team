# V2.1 · Núcleo competitivo híbrido (diseño)

## Objetivo
Activar la ruta /competitive como taller funcional de creación, generación y edición de equipos de seis Pokémon, con dos formatos educativos (Singles 6v6 y Dobles estilo VGC) y explicaciones comprensibles para quienes aprenden.

## Decisiones aprobadas y límites
- Híbrido: generar un equipo inicial de ejemplo, cambiar integrantes o sets a mano, bloquear Pokémon y regenerar individualmente.
- Dos formatos: Singles 6v6 y Dobles inspirados en VGC. Dobles muestra nota sobre elección de cuatro en batalla, nivel 50 y cláusula de objetos; NO afirma cumplir con ninguna regulación oficial.
- Cualquier Pokémon del dataset local puede incorporarse al editor. Los ejemplos preconfigurados son un catálogo curado pequeño y explícito, no tasas de uso ni rankings del metajuego.
- Editor: especie, rol, naturaleza, habilidad, objeto, cuatro movimientos, EVs e IVs; avisos para límites numéricos, especies duplicadas, objetos repetidos en Dobles y campos incompletos.
- Modo aprendizaje visible/ocultable: explica roles, naturaleza, EVs, defensas de tipos y límites del análisis.
- Análisis explicable del equipo: tipos con debilidad compartida y distribución de roles, sin porcentajes de victoria ni daño inventados.
- Persistencia: guardar automáticamente dos borradores independientes por formato dentro de un sobre versionado; restaurar al recargar; mantener rutas existentes.
- Carga modular: solo importar el catálogo Pokémon pesado al entrar a /competitive. Mantener intactos motor y datos de Aventura/Colección.
- Ningún verificador de legalidad por versión, tier, regulación, habilidad, habilidad oculta, forma, item, movimiento, tera ni aprender movimientos. Se explicita en UI.
- No se implementan matchmaking, cálculos de daño, estadísticas de Championships, uso, matchups porcentuales o sincronización remota hasta V2.2 o posterior.
- Se puede exportar a texto para compartir, pero no se afirma que el texto sea aceptado por un simulador.

## Enfoques evaluados
1. Motor global con sets automáticos para las 1025 especies. Descartado: sin learnsets ni objetos/formatos verificados generaría sugerencias engañosas.
2. Constructor manual puro. Descartado: no responde al enfoque híbrido de generación + aprendizaje.
3. Catálogo de plantillas didácticas editables + catálogo completo manual. Elegido: útil desde el primer corte, extensible con snapshots más adelante y claro sobre sus límites.

## Diseño de datos
- CompetitiveFormat: 'singles' | 'doubles'.
- CompetitivePokemonSet: id de Pokémon, rol, naturaleza, habilidad, objeto, cuatro movimientos, EVs, IVs, locked y procedencia opcional de plantilla.
- CompetitiveWorkspace: formato activo, guía on/off, selectedSlot y dos arrays de sets.
- PLANTILLAS: especie, formatos permitidos, rol, set de ejemplo y explicación; especies ausentes del dataset se ignoran.
- Funciones puras: createManualSet(), generateCompetitiveTeam(), regenerateCompetitiveSlot(), validateCompetitiveTeam(), analyzeCompetitiveTeam().
- Espacio de borradores versionado, con validación defensiva y sin guardar el dataset completo.

## Flujo visual
1. Cabecera: Singles / Dobles, explicación de regulación NO validada, toggle aprender.
2. Barra de acciones: generar equipo, reiniciar formato, copiar.
3. Seis tarjetas de miembros con selección, bloqueo y rol.
4. Editor del miembro seleccionado: cambio de especie, rol, habilidad, objeto, naturaleza, EVs/IVs y movimientos.
5. Análisis: conteo de roles, debilidades comunes, problemas de set; explicaciones básicas si guía está activa.

## Criterios de aceptación
- Generar dos veces cambia el ejemplo sin perder los bloqueados cuando haya alternativas.
- Sets generados: seis especies únicas y, en Dobles, seis objetos no repetidos.
- EVs por stat <=252 y suma <=510; IVs entre 0 y 31.
- Los cambios manuales se restauran tras recarga o remount.
- Cambiar Singles/Dobles conserva cada borrador por separado.
- Los campos vacíos y conflictos muestran avisos, nunca se presentan como sets validados.
- CI pasa sincronización, validación, pruebas y compilación.
