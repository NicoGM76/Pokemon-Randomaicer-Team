# V2.2.x · Editor competitivo guiado por juego (2026-11-04)

## Propósito
Transformar V2.2 en editor híbrido práctico: reglas de entrenamiento por videojuego, habilidad válida por especie, catálogos de objetos/movimientos con recomendaciones, formas (incluyendo megas) y español España/Latinoamérica. Preservar datos y estabilidad de V1/V2.2.

## Decisiones y fronteras verificadas
- Dos dimensiones independientes: Formato Singles/Dobles y **juego de referencia** Saga principal (Escarlata/Púrpura) / Pokémon Champions. Los borradores de ambos formatos mantienen su equipo; cambiar juego no convierte ni borra silenciosamente EVs.
- Saga principal: EV máx. 252 por stat, 510 total; IV 0-31; tera type disponible. NO Mega en Escarlata/Púrpura.
- Champions: puntos de característica máx. 32 por stat y 66 totales; **no hay edición de IV**; mega con piedra obligatoria, tera deshabilitada. Etiqueta Champions "Reg M-C 2026" descriptiva, no verificación total de legalidad. No mezclar formatos con reglamentos oficialmente verificados.
- Catálogo por especie descargado bajo demanda de PokeAPI `pokemon/{id}` + `pokemon-species/{id}`, con abilities/learnsets (filtrado Scarlet-Violet) y formas de PokeAPI, caché de sesión. Nunca permitir elegir habilidades distintas de las opciones verificadas; las abilities de forma Mega se consultan por id de forma si disponible. El formulario no perderá campos por error de red, pero mostrará sin verificación clara.
- Movimientos elegibles de PokeAPI para SV si están en `version_group=scarlet-violet`. En Champions, listas de PokeAPI son **referencia del juego principal**, nunca garantía de learnset de Champions. Los sets existentes manuales se conservan; inválidos se muestran como avisos.
- Objetos: catálogo curado de ítems comunes con canonical English ID y alias español; "res" sugiere Restos/Leftovers. El editor guarda canonical. No afirmar que catálogo sea completísimo ni que los objetos sean legales en Champions.
- Megas: solo un conjunto conocido con piedra asignada por forma. Al elegir Mega el objeto se configura automáticamente y se bloquea la edición hasta dejar la forma. Si el juego cambia a SV, una Mega se marca incompatible y no se usa como forma válida.
- Teracristalización: un tipo por set solamente para Scarlet/Violet; sin sugerencias de tera legales por especie, cualquier tipo válido puede elegirse, se conserva al cambiar de juego.
- Idioma de UI: selector global ES España / ES Latinoamérica, guarda preferencia. Los dos usan el catálogo español disponible; diferencias léxicas en la interfaz. Los nombres que PokeAPI no traduce quedan identificados, no se inventan equivalencias.
- Funcionalidad independiente de V2.2 meta, conservando chunks, borradores V2.1, navegación y datos.

## Criterios de aceptación
1. En SV el editor muestra EVs 510/252 e IVs, más tipo tera. En Champions muestra PC 66/32 y no permite editar IVs o teracristalización. Datos de ambos modos persisten.
2. Pikachu ofrece opciones compatibles del endpoint PokeAPI, no permite escoger Intimidate si no está listado; estado de error con explicación.
3. Buscar "res" sugiere Restos; elegirlo asigna canonical Leftovers.
4. Movimientos se buscan y muestran recomendaciones filtradas por especie y juego cuando hay datos; no afirma que puedan usarse en Champions.
5. Al elegir Mega Charizard X en Champions, objeto Charizardite X se establece automáticamente, y se valida que no se cambie a otros objetos.
6. El idioma puede alternar ES/Latam desde la navegación y se conserva al recargar.
7. Los borradores actuales se conservan; el generador V2.2/Meta y las demás rutas pasan tests.
8. CI sync/validate/test/build final, PR separado, no merge automático.

## Fuentes
- Pokémon Champions official, Regulation M-C (Sept 9 - Dec 2 2026): megapiedras y objetos únicos.
- Champions stat points 66/32 y no IV (Bulbapedia, WikiDex).
- PokeAPI v2 Pokémon endpoint: abilities y moves por version_group, species varieties. No contiene legalidad actual de Pokémon Champions.
