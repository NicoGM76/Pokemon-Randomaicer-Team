# Pokémon Adventure Team Generator

Generador web de equipos Pokémon pensado para **aventuras**, no para competitivo estricto.

Permite construir equipos según el juego elegido, la generación, el contenido disponible y distintas reglas de aventura. Además, la V1 incluye un modo de **colección multirregión** para coordinar varios equipos sin repetir Pokémon o familias evolutivas.

## 🌐 Probar la página

**Web publicada:**  
https://nicogm76.github.io/Pokemon-Randomaicer-Team/

La interfaz es responsive y puede usarse tanto en computador como en dispositivos móviles.

---

## ✨ Funciones principales de la V1

### Generador de equipo individual

Tres modos de generación:

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
- Guardado de equipos en el navegador mediante `localStorage`.

### 🗃️ Colección de equipos

Modo pensado para retos de varias regiones o generaciones.

Permite configurar entre **2 y 9 equipos** y generarlos de forma coordinada.

Incluye:

- Generación/región objetivo por equipo.
- Juego concreto para cada aventura.
- 1 a 6 miembros por equipo.
- No repetir especies entre equipos.
- No repetir familias evolutivas.
- Evoluciones posteriores asociadas al origen de su línea evolutiva.
- Hasta un Pokémon bonus opcional por equipo.
- Generación conjunta de toda la colección.
- Bloqueo de equipos completos.
- Bloqueo de Pokémon individuales.
- Regeneración de una sola región respetando los Pokémon ya utilizados.
- Resumen global de miembros, bonus y duplicados.

Ejemplo de la lógica de origen:

- Crobat puede contar como Kanto por pertenecer a la línea de Zubat.
- Scizor puede contar como Kanto por la línea de Scyther.
- Rhyperior puede contar como Kanto por la línea de Rhyhorn.

---

## 🎮 Juegos y datos

El catálogo actual cubre las generaciones **I a IX** e incluye juegos principales, terceras versiones, remakes, Let's Go y Legends configurados en el proyecto.

El pipeline de datos trabaja con:

- Pokédex regionales.
- Especies Pokémon.
- Líneas evolutivas.
- Juegos y familias de juegos.
- Content packs y DLC.
- Availability curada por juego cuando existe.

Cuando la disponibilidad detallada de un juego todavía es parcial, el generador utiliza su **Pokédex regional** como fallback en lugar de dejar el juego inutilizable.

La V1 contiene actualmente:

- **38 juegos configurados**.
- **22 Pokédex regionales** sincronizadas.
- Más de **1000 especies** en el dataset generado.
- Grafo de evoluciones generado desde datos estructurados.

---

## 🧠 Reglas de aventura

El modo Aventura prioriza una composición práctica para jugar la historia:

- Diversidad de tipos.
- Menor acumulación de debilidades compartidas.
- Balance entre daño físico y especial.
- Variedad dentro del equipo.
- Evitar repetir innecesariamente el mismo tipo.

Para los retos multirregión también se tiene en cuenta la tabla de tipos histórica:

- **Generación I:** tabla correspondiente a la primera generación.
- **Generaciones II a V:** sin tipo Hada y con las resistencias históricas de Acero.
- **Generación VI en adelante:** tabla moderna de 18 tipos.

---

## 🛠️ Tecnologías

- **React**
- **TypeScript**
- **Vite**
- **Vitest**
- **GitHub Actions**
- **GitHub Pages**
- Datos locales preprocesados a partir de fuentes estructuradas y capas curadas del proyecto.

Arquitectura general:

```text
fuentes externas
      ↓
importadores
      ↓
datos generados + datos curados
      ↓
validación
      ↓
tests
      ↓
dataset local
      ↓
motor TypeScript
      ↓
React
```

El motor de generación está separado de la interfaz para poder evolucionar las reglas sin acoplarlas a React.

---

## 💻 Ejecutar localmente

### Requisitos

- Node.js 22 o compatible.
- npm.

En Windows PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
```

Vite mostrará la URL local, normalmente:

```text
http://localhost:5173/
```

### Tests

```powershell
npm.cmd run test:run
```

### Build

```powershell
npm.cmd run build
```

### Sincronizar los datos

```powershell
npm.cmd run data:sync-all
npm.cmd run data:validate-all
```

Para forzar una descarga nueva de los datos estructurados:

```powershell
npm.cmd run data:sync-all:refresh
```

---

## 🧪 Calidad y CI

El repositorio usa GitHub Actions para validar los cambios antes del despliegue.

El pipeline ejecuta:

```text
instalar dependencias
→ sincronizar datos
→ validar catálogo y referencias
→ ejecutar tests
→ compilar
→ publicar en GitHub Pages
```

También existen smoke tests para comprobar que los juegos configurados puedan generar equipos válidos con una configuración base.

---

## 🗺️ Roadmap

### V1 ✅

- Generador de aventura.
- Full Random.
- Personalizado.
- Generaciones I–IX.
- Juegos, DLC y Pokédex regionales.
- Evoluciones.
- Filtros y reglas de aventura.
- Equipos guardados.
- Locks y rerolls.
- Colección multirregión híbrida.
- Diseño responsive.
- Deploy público con GitHub Pages.

### V2 · Competitivo

Planeado para una futura versión:

- Naturalezas.
- EVs.
- IVs.
- Objetos equipados.
- Movesets competitivos.
- Roles de equipo.
- Formatos competitivos.
- Sinergia y análisis avanzado.

### V3 · Posible aplicación móvil

Una posible evolución posterior del proyecto sería convertir la experiencia en una app para **Android/iOS**, reutilizando el motor del generador y la lógica construida para la web.

---

## 📌 Estado del proyecto

**V1 publicada y funcional.**

👉 https://nicogm76.github.io/Pokemon-Randomaicer-Team/

El proyecto sigue abierto a mejoras de datos, reglas, experiencia móvil y nuevas versiones del generador.

---

## Aviso

Proyecto independiente creado con fines educativos y de entretenimiento. Pokémon y sus nombres, criaturas y marcas relacionadas pertenecen a sus respectivos propietarios.