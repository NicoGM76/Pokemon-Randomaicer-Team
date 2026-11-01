# Pokémon Adventure Team Generator

Generador web de equipos Pokémon para **aventura**, con una base modular preparada para incorporar competitivo sin convertir toda la aplicación en una sola pantalla pesada.

La V1 cubre generación individual y colecciones multirregión. La **V2.0** reorganiza la aplicación con navegación real, progreso persistente y carga por módulos.

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

### V2.1 · Núcleo competitivo

Planeado:

- Singles 6v6 y Dobles/VGC.
- Naturalezas.
- EVs e IVs.
- Objetos.
- Movesets.
- Roles.
- Generación + edición manual híbrida.
- Modo aprendizaje.

### V2.2 · Inteligencia competitiva

Planeado:

- matchups;
- estadísticas de uso;
- metagame por formato/regulación;
- resultados de Championships y torneos;
- compañeros y sets frecuentes;
- snapshots actualizables.

### V3 · Posible aplicación móvil

Posible app Android/iOS reutilizando el motor y la arquitectura modular de la web.

---

## 📌 Estado del proyecto

**V1 publicada. V2.0 en desarrollo sobre una rama dedicada antes de integrarse a `main`.**

👉 https://nicogm76.github.io/Pokemon-Randomaicer-Team/

---

## Aviso

Proyecto independiente con fines educativos y de entretenimiento. Pokémon y sus nombres, criaturas y marcas relacionadas pertenecen a sus respectivos propietarios.
