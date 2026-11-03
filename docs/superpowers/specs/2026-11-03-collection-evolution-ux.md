# Colección V2.1.1 · Evoluciones + controles globales + interfaz

**Objetivo:** corregir formas evolucionadas cortadas artificialmente por límites de Pokédex regional, añadir acciones masivas seguras y mejorar claridad visual sin afectar las rutas de Aventura y Competitivo.

## Decisiones
- La generación *objetivo* define el origen de la familia; la generación del **juego elegido** limita las especies en que puede terminar la evolución.
- Sobre el catálogo regional, se permite completar una cadena evolutiva que el propio juego podría admitir en generaciones posteriores, **sin inventar métodos de obtención de objetos ni fechas exactas de acceso**. Con cobertura parcial se muestra explícitamente que la verificación Historia/Postgame y disponibilidad de objetos es provisional.
- El paso de intercambio se respeta mediante `allowTradeEvolution`. Solo se transforma el resultado de Colección, no se cambia el generador de Aventura.
- Se mantiene ramificación real (p. ej. Eevee) y solo se devuelven evoluciones terminales en el ámbito habilitado.
- Acciones masivas: activar/desactivar intercambios, bonus, bloquear equipos, desbloquear equipos, limpiar todos los bloqueos, regenerar miembros desbloqueados, reiniciar configuración con confirmación y copiar resumen. Las preferencias por equipo siguen funcionando.
- Cada tarjeta Pokémon muestra tipos, generación de origen y ruta de evolución en texto si procede, nunca `chain-N`.
- Se añade regeneración de un miembro con conservación de los demás/locks y del orden de los slots. Si no hay alternativa, no se altera el equipo.
- No usar `window.confirm` en pruebas sin stub; confirmar únicamente acciones destructivas.
- Sin cuentas ni servidor; persistencia V2.0 mantiene configuraciones y resultados.

## Aceptación
- HGSS Gen IV permite Misdreavus → Mismagius, Sneasel → Weavile si el dataset define esos pasos y el modo tiene acceso general. Gold Gen II no.
- Original Red Gen I no permite Crobat ni evoluciones posteriores.
- Haunter → Gengar solo con intercambio activado.
- No se duplican especies/familias ni se saltan bloqueos de región/miembro.
- La interfaz de Colección es usable a 320 px, con botones distinguibles y aria-labels; las reglas muestran resultados persistentes.
- CI y test green; PR abierto sin merge automático.

## Enfoques
- Rehacer el dataset completo por cada juego: aplazado por coste y falta de cobertura verificable.
- Relajar sin filtro el grafo mundial: descartado por producir evoluciones fuera de la generación del juego.
- Extensión solo de la capa Colección con tope de generación + motor de condiciones y aviso de cobertura: elegido.
