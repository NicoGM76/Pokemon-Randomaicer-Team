# Pokémon Adventure Team Generator

Generador web de equipos Pokémon para **aventura**, con una base modular preparada para incorporar competitivo sin convertir toda la aplicación en una sola pantalla pesada.

La V1 cubre generación individual y colecciones multirregión. La **V2.0** añade navegación real, progreso persistente y carga por módulos. La **V2.1** activa un taller competitivo educativo para construir, editar y analizar equipos.

## 🌐 Probar la página

**Web publicada:**  
https://nicogm76.github.io/Pokemon-Randomaicer-Team/

La interfaz es responsive y puede usarse en computador y dispositivos móviles.

### Rutas de la V2.0

La aplicación usa navegación hash para funcionar correctamente en GitHub Pages:

```text
/#/adventure    Generador individual
/#/collection   Colección multirregión
/#/competitive  Entrada al futuro módulo competitivo
/#/saved        Equipos guardados
```

Esto permite utilizar **Atrás / Adelante** del navegador y recargar una sección sin depender de un único estado interno de React.

---

## ✨ V1 · Generador de aventura

### Equipo individual

Tres modos:

- **Aventura:** busca equipos variados y cómodos para completar una partida.
- **Full Random:** genera un equipo legal de forma aleatoria.
- **Personalizado:** permite combinar reglas y filtros adicionales.

Configuración disponible:

- Generación y juego.
- Contenido base y DLC cuando aplica.
- Equipo de 1 a 6 Pokémon.
- Historia, Postgame o Todo.
- Métodos de obtención.
- Evolución por intercambio.
- Reglas para iniciales.
- Reglas para legendarios y míticos.
- Pokémon introducidos en la generación seleccionada.
- Filtros de tipos y categorías especiales.
- Bloqueo de Pokémon individuales.
- Regeneración de slots o del equipo completo.
- Guardado de equipos en el navegador.

### 🗃️ Colección de equipos

Modo para retos de varias regiones o generaciones. Permite configurar entre **2 y 9 equipos** y generarlos coordinadamente.

Incluye:

- Generación/región objetivo por equipo.
- Juego concreto para cada aventura.
- 1 a 6 miembros por equipo.
- No repetir especies entre equipos.
- No repetir familias evolutivas.
- Evoluciones posteriores asociadas al origen de su línea.
- Hasta un Pokémon bonus opcional por equipo.
- Generación conjunta de toda la colección.
- Bloqueo de equipos completos o miembros individuales.
- Regeneración de una sola región respetando el resto de la colección.
- Resumen global de miembros, bonus y duplicados.

Ejemplos de origen de línea:

- Crobat puede contar como Kanto por Zubat.
- Scizor puede contar como Kanto por Scyther.
- Rhyperior puede contar como Kanto por Rhyhorn.

---

## ⚙️ V2.0 · Navegación, persistencia y rendimiento

Antes de añadir EVs, movesets y análisis competitivo, la aplicación se reorganizó para soportar un producto más grande.

### Navegación real

Las secciones principales son rutas independientes. Los cambios de sección quedan en el historial del navegador en lugar de vivir únicamente en un `useState`.

### Borradores persistentes

El generador de Aventura conserva automáticamente:

- configuración actual;
- equipo generado;
- bloqueos;
- avisos de la sesión.

La Colección conserva:

- configuración de todos los equipos;
- resultado generado;
- bloqueos de equipos y Pokémon.

Al recargar la página, el borrador compatible se restaura. Los datos corruptos o de versiones incompatibles se descartan de forma segura y la aplicación vuelve a sus valores iniciales.

### Guardados separados de borradores

Los equipos guardados siguen siendo permanentes en el navegador mediante el repositorio existente. Cargar uno escribe ese equipo como borrador de Aventura y navega a `/#/adventure`.

### Carga modular

Las páginas principales se cargan con `React.lazy` y `Suspense`:

```text
shell / router
├── adventure chunk
├── collection chunk
├── saved chunk
└── competitive chunk
```

Por ejemplo, visitar la página competitiva no obliga a montar el generador de Colección. El módulo Guardados tampoco carga el dataset Pokémon completo solo para mostrar el nombre de un juego.

### IndexedDB preparado para V2

V2.0 añade un adaptador de clave/valor para **IndexedDB**. Todavía no migra los pequeños datos de V1, pero queda preparado para futuros datasets competitivos más pesados, como:

- snapshots de metagame;
- estadísticas de uso;
- matchups;
- resultados de torneos;
- sets frecuentes.

---

## 🎮 Juegos y datos

El catálogo cubre las generaciones **I a IX** e incluye juegos principales, terceras versiones, remakes, Let's Go y Legends configurados en el proyecto.

El pipeline trabaja con:

- Pokédex regionales;
- especies Pokémon;
- líneas evolutivas;
- juegos y familias de juegos;
- content packs y DLC;
- availability curada por juego cuando existe.

Cuando la disponibilidad detallada todavía es parcial, el generador utiliza la **Pokédex regional** como fallback.

Estado del dataset base:

- **38 juegos configurados**;
- **22 Pokédex regionales** sincronizadas;
- más de **1000 especies**;
- grafo de evoluciones generado desde datos estructurados.

---

## 🧠 Reglas de aventura

Aventura prioriza:

- diversidad de tipos;
- menor acumulación de debilidades compartidas;
- balance físico/especial;
- variedad dentro del equipo;
- evitar repeticiones innecesarias.

Para los retos multirregión se utiliza la tabla de tipos histórica:

- **Generación I:** tabla correspondiente a la primera generación.
- **Generaciones II a V:** sin Hada y con resistencias históricas de Acero.
- **Generación VI en adelante:** tabla moderna de 18 tipos.

---

## 🛠️ Tecnologías

- **React**
- **React Router**
- **TypeScript**
- **Vite**
- **Vitest**
- **Testing Library**
- **localStorage** para datos pequeños y borradores actuales
- **IndexedDB** preparado para cachés competitivas futuras
- **GitHub Actions**
- **GitHub Pages**

Arquitectura simplificada:

```text
fuentes externas
      ↓
importadores
      ↓
datos generados + curados
      ↓
validación + tests
      ↓
motor TypeScript
      ↓
router / shell
 ┌────┼────────┬───────────┐
aventura  colección  guardados  competitivo
```

El motor de generación permanece separado de la interfaz.

---

## 💻 Ejecutar localmente

Requisitos: Node.js 22 o compatible y npm.

En Windows PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
```

Vite mostrará la URL local, normalmente `http://localhost:5173/`.

### Tests

```powershell
npm.cmd run test:run
```

### Build

```powershell
npm.cmd run build
```

### Datos

```powershell
npm.cmd run data:sync-all
npm.cmd run data:validate-all
```

Para forzar una descarga nueva:

```powershell
npm.cmd run data:sync-all:refresh
```

---

## 🧪 Calidad y CI

GitHub Actions valida ramas de trabajo y pull requests con:

```text
instalar dependencias
→ sincronizar datos
→ validar catálogo y referencias
→ ejecutar tests
→ compilar
```

El despliegue de `main` añade la publicación en GitHub Pages.

También existen smoke tests para los **38 juegos** y pruebas específicas de routing, borradores, guardados, colección y evolución.

---

## 🗺️ Roadmap

### V1 ✅

- Aventura / Full Random / Personalizado.
- Generaciones I–IX.
- Juegos, DLC y Pokédex regionales.
- Evoluciones y filtros.
- Guardados, locks y rerolls.
- Colección multirregión híbrida.
- Tabla histórica de tipos.
- Diseño responsive.

### V2.0 · Base de aplicación

- Navegación por rutas.
- Historial Atrás / Adelante.
- Borradores persistentes.
- Recuperación después de recargar.
- Carga modular por página.
- Separación de Guardados.
- Adaptador IndexedDB para datos grandes.
- Entrada ligera para Competitivo.

### V2.1 · Núcleo competitivo educativo ✅

- Singles 6v6 libre y Dobles estilo VGC como **entornos de aprendizaje**, no reglamentos oficiales validados.
- Generación de seis sets de ejemplo a partir de plantillas didácticas curadas.
- Editor manual con **búsqueda por nombre o número de Pokédex**, sugerencias rápidas y selector completo como alternativa. Admite variantes sencillas como «Goldengo» → «Gholdengo» sin recorrer la lista de más de mil especies.
- Naturalezas (incluidas sus modificaciones), EVs, IVs, habilidades, objetos, movimientos y roles.
- Bloqueo y regeneración individual; conserva Pokémon bloqueados al generar de nuevo.
- Validación de EVs/IVs, especie duplicada, objeto duplicado en Dobles y movimientos incompletos o repetidos.
- Análisis de roles y debilidades de tipos compartidas, con explicaciones que pueden ocultarse.
- Borradores separados para Singles y Dobles, restaurados al recargar.
- Exportación a texto con aviso de legalidad no verificada.

**Importante:** la V2.1 no certifica legalidad de tiers, reglamentos, movesets, habilidades ni formas; no ofrece estadísticas reales de torneos o porcentajes de matchup. Ese trabajo requiere datos competitivos normalizados y actualizables de V2.2.

### Ajustes de Colección · Evoluciones y controles globales (en revisión)

Esta mejora, implementada en una rama independiente antes del merge, incluye:

- Resolver evoluciones posteriores a la Pokédex regional hasta el límite de la generación del **juego seleccionado**, manteniendo la generación de origen de la familia para el reto.
- Respetar el interruptor de evoluciones por intercambio; en HeartGold/SoulSilver se respetan limitaciones conocidas de objetos cuando se selecciona solo Historia.
- Evitar expansiones automáticas no compatibles con títulos restringidos como Let's Go y BDSP.
- Activar/desactivar intercambios y bonus en todos los equipos sin perder el ajuste individual.
- Bloquear/desbloquear equipos, limpiar bloqueos, regenerar los desbloqueados o regenerar toda la colección con confirmación.
- Regenerar un Pokémon específico sin modificar los demás, si existe alternativa.
- Tarjetas con tipos y generación de origen en lugar de identificadores internos; interfaz responsive más ordenada.
- Reutilizar candidatos ya calculados a lo largo de los intentos de generación para reducir trabajo repetido.

**Límite actual:** para los juegos con cobertura de disponibilidad parcial, no se pueden certificar todos los objetos, momentos de obtención o métodos exactos de evolución. La interfaz lo advierte; la curación exhaustiva queda pendiente.

### V2.2 · Inteligencia competitiva (en revisión)

La ruta `/#/competitive` ofrece un panel **optativo, cargado bajo demanda** para consultar:

- estadísticas reales de uso de la escalera de Pokémon Showdown/Smogon, con mes, corte de rating, volumen de partidas y fuente enlazada;
- Singles **Gen 9 OU**, corte 1695, y Dobles **Pokémon Champions VGC 2026 Reg M-C BO3**, corte 1630 (este identificador no se cambia automáticamente por uno de otra regulación);
- movimientos, objetos, habilidades y asociaciones positivas de compañeros para especies que coinciden exactamente con el catálogo local;
- comparación básica de tipos del Pokémon rival con los miembros del equipo actual: vulnerables a STAB y miembros con STAB supereficaz;
- mensajes explícitos si los datos no están disponibles, sin inventar estadísticas;
- acceso separado a los resultados oficiales de la Championship Series (sin afirmar que fueron importados).

**Limitaciones:** el porcentaje de uso ponderado no es tasa de victorias, los datos de escalera no equivalen a torneos oficiales, los nombres de formas alternativas sin equivalencia exacta se omiten y el análisis de tipos **no calcula daño ni probabilidad de victoria**. No valida la legalidad de equipos ni actualiza automáticamente la regulación vigente.

**Actualización:** el flujo de despliegue regenera snapshots desde los archivos mensuales `chaos/*.json` de Smogon; además GitHub Actions ejecuta un despliegue los lunes a las 12:00 UTC. Intenta el último mes terminado y retrocede hasta cuatro meses. Si las fuentes fallan, se detiene ese despliegue antes de modificar el sitio público. Para cambiar a una nueva regulación de VGC hay que revisar el identificador de formato y sus reglas.

**Comandos de datos:**

```powershell
npm.cmd run data:sync-all
npm.cmd run data:sync-meta
npm.cmd run meta:test
npm.cmd run test:run
npm.cmd run build
```

Los archivos ligeros se sirven desde `/meta/singles.json` y `/meta/doubles.json`, cargados cuando el usuario abre el panel. Un clon local que aún no ejecutó `data:sync-meta` mostrará "sin estadísticas sincronizadas".

**Pendiente de V2.2+**: importación diferenciada de resultados y rosters reales de torneos, cambios verificables entre meses, daño con sets legales, ranking de contrarrestos y evolución automática de las regulaciones.

### V2.2.x · Editor competitivo guiado e idioma global ✅

Esta actualización mantiene el constructor anterior y añade:

- **Selector global de idioma** en el encabezado, compartido por Aventura, Colección, Competitivo y Guardados. Incluye Español (Latinoamérica) y Español (España); conserva el ajuste al navegar y recargar. Los nombres propios y términos del juego que no cambian entre ambas variedades siguen siendo comunes.
- **Separación entre formato de batalla y videojuego**: Singles/Dobles se eligen independientemente de Escarlata/Púrpura o Pokémon Champions.
- Saga principal: EVs 510/252, IVs 0–31 y tipo Tera, sin Megaevolución.
- Champions: PC 66/32, sin edición de IVs ni Tera. Los EVs de la saga principal se conservan como borrador independiente al alternar el juego.
- Habilidades por especie obtenidas bajo demanda desde PokéAPI. La lista no permite seleccionar habilidades ajenas a la especie (ej. Intimidate en Pikachu). Una habilidad antigua ajena a la lista se conserva, pero se señala como no validada.
- Movimientos sugeridos a partir de la lista de Escarlata/Púrpura que PokéAPI registra para esa especie, priorizando sets didácticos existentes. **No se equiparan esos movimientos a los legales en Pokémon Champions**.
- Objetos con buscador bilingüe de opciones frecuentes, p. ej. `res` sugiere **Restos** y guarda el ID canónico `Leftovers`. El catálogo es parcial y los objetos no listados no se consideran ilegales por defecto.
- Formas Mega curadas de ejemplo en Champions con megapiedra asignada automáticamente. Otras formas que devuelve la API se presentan como referencia, no como legalidad confirmada.
- **Mega-Lucario Z** disponible en Pokémon Champions (Regulación M-C): requiere **Lucarionite Z** y usa **Aura Protectora (Aura Guard)**. Se evita reutilizar accidentalmente la habilidad de Lucario base mediante caché independiente por forma. Fuentes: [regulación oficial M-C](https://champions-news.pokemon-home.com/en/page/816.html), [Aura Guard](https://bulbapedia.bulbagarden.net/wiki/Aura_Guard_(Ability)).
- El panel de metagame de V2.2 solo muestra estadísticas cuando el formato **y** juego coinciden con el snapshot de origen.
- Todo sigue guardándose localmente y la información adicional de PokéAPI solo se consulta al seleccionar un Pokémon en Competitivo.

**Límites actuales:** no es un validador oficial de equipos ni de regulaciones vigentes; el catálogo de formas y objetos no es exhaustivo. Los nombres ingleses de Pokémon y algunos términos técnicos de PokéAPI aún pueden aparecer en las recomendaciones aunque la interfaz esté en español.

### V3 · Posible aplicación móvil

Posible app Android/iOS reutilizando el motor y la arquitectura modular de la web.

---

## 📌 Estado del proyecto

**V1, V2.0, V2.1 y V2.2 están publicadas. El editor guiado y la localización general están publicados. El ajuste de Mega-Lucario Z se prepara en una rama antes del merge.**

👉 https://nicogm76.github.io/Pokemon-Randomaicer-Team/

---

## Aviso

Proyecto independiente con fines educativos y de entretenimiento. Pokémon y sus nombres, criaturas y marcas relacionadas pertenecen a sus respectivos propietarios.
