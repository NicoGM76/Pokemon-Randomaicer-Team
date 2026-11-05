# V2.5: PostgreSQL sin presupuesto y recuperación ante fallos

**Decisión:** comenzar sin presupuesto recurrente. **En ejecución:** el proyecto Supabase Free, las 15 tablas y sus RLS ya existen; una primera muestra de catálogo se importó. El Drive dedicado y sus cinco subcarpetas están creados. Aún **no hay** backup real ni failover de producción implementados.

## 1. Componentes y responsabilidades

| Componente | Responsabilidad | Estado previo |
| --- | --- | --- |
| Supabase Free, PostgreSQL | Origen principal para datos normalizados y metadatos curados | Proyecto `pokemon-adventure` creado en São Paulo, PostgreSQL 17; esquema aplicado |
| Google Drive dedicado | Almacén externo para copias cifradas, con historial, fuera del proveedor de la base | Cuenta dedicada conectada y carpetas creadas; aún sin rutina de backup |
| GitHub Pages | Frontend estático y snapshots **públicos** y versionados del catálogo/metagame | Ya existe; JSON generados durante el build |
| Almacenamiento local | Borradores y equipos guardados del navegador, y futura caché de lectura | localStorage activo; adaptador IndexedDB disponible |
| GitHub Actions | Orquestar exportación, verificación de integridad y alertas | Existe pipeline de datos; **no** existe todavía exportación a Drive |

La copia en Drive no es una base activa, **no** permite consultas SQL ni conmutación inmediata con escrituras. No publicar `pg_dump` ni información privada en `public/` o en el frontend.

## 2. Recuperación sin otra base activa

```text
Frontend -> servicio de datos (futuro)
   | consulta remota OK           -> PostgreSQL principal por API con RLS
   | timeout / error verificable  -> snapshot público validado de GitHub Pages
   | snapshot no disponible       -> caché local previamente obtenida
   | ninguna fuente              -> mensaje sin datos, nunca inventar resultados

Editar equipos personales: conserva los guardados/borradores LOCALES actuales.
Operaciones remotas de escritura: deshabilitar/indicar pendiente sin prometer sincronización.
```

- **Lecturas:** en modo degradado solo datos públicos del catálogo y metagame; mostrar fuente y fecha de la copia. El frontend nunca consulta Drive con credenciales privadas.
- **Escrituras:** si el backend está caído, no fingir confirmación. Mantener ediciones locales en los módulos que ya las soportan. Una cola para sincronizar entre dispositivos requiere posteriormente IDs estables, idempotencia y resolución de conflictos.
- **Recuperación:** volver al servicio principal solo tras una comprobación de salud exitosa y revalidar los datos publicados.
- **Corte de circuito:** número limitado de reintentos, tiempos de espera definidos y pantalla con estado del origen. No crear bucles de solicitudes.
- **Exposición sin internet:** GitHub Pages por sí solo **no** es una app offline. Preparar una distribución compilada local o un mecanismo offline probado, más sus datos, para la sustentación.
- **Privacidad:** un snapshot público solo contendrá datos abiertos. Equipos privados y cuentas no se exportan a JSON público.

**Nota:** el frontend actual funciona con JSON estáticos/localStorage; este documento define el comportamiento cuando incorporemos la base remota. No atribuirle capacidades de conmutación que aún no tiene.

## 3. Copias acumulativas/versionadas en Drive

Al principio preferimos **copias completas, independientes y versionadas**. Son más sencillas de restaurar que una cadena de incrementales que podría quedar inutilizada si falta un eslabón.

- **Diaria:** `pg_dump` en formato custom del contenido autorizado de PostgreSQL, con sello de fecha UTC.
- **Integridad:** hash SHA-256 y manifiesto: versión del esquema, fecha, tamaño, origen y resultado de verificación. El manifiesto no incluirá secretos.
- **Cifrado:** cifrar **antes** de subir a Drive con clave gestionada fuera del repositorio; los archivos deben ser ilegibles para alguien que vea el Drive.
- **Subida:** cuenta/bot con permisos mínimos sobre una carpeta específica del Drive dedicado, sin poner tokens ni contraseñas en GitHub.
- **Retención sugerida:** 7 copias diarias + 4 semanales + 3 mensuales. No borrar una copia hasta verificar que la siguiente existe, se puede descargar y descifrar.
- **Sincronización de archivos:** no tratar copias completas como incrementales. Una futura captura WAL/PITR requiere diseño y costos propios y no está incluida.
- **Prueba de restauración:** mensualmente, descargar una copia elegida al azar, descifrar, restaurar en un PostgreSQL efímero y ejecutar conteos/comparaciones de controles. Registrar resultado.
- **Alertas:** si faltan copias, falló la verificación, hubo almacenamiento insuficiente o se pierde autorización del Drive, notificar y **no** reportar éxito.
- **Objetivo inicial de pérdida máxima:** hasta 24 h de datos recientes, **solo una vez** que la rutina diaria funcione. No se garantiza una recuperación instantánea.

### Carpeta propuesta

```text
Pokemon-Adventure-DB-Backups/
  daily/2026/11/
  weekly/2026/
  monthly/2026/
  manifests/
  restore-tests/
```

La carpeta raíz y las cinco subcarpetas **ya existen en Google Drive**. Esto **no** implica que se hayan producido copias de seguridad.

## 4. Preparación relacional antes de migrar

Desarrollar con migraciones versionadas y nombres claros. Fase 1 de datos **públicos**:
- `pokemon_species` y `pokemon_forms`: identificador externo único, tipo/forma y relación de especie.
- `moves`, `abilities`, `items`: identificadores normalizados; relaciones N:N según el alcance comprobado de la fuente.
- `source_snapshots`: URL de origen, fecha, versión, hash, corte/regulación y estado de validación.
- `metagame_usage`: por snapshot y Pokémon, con uso ponderado no confundible con tasa de victorias.
- Tablas de asociaciones de movimientos, habilidades, objetos y compañeros solo cuando sus estadísticas originales estén verificadas.

Fase 2 (no habilitada de entrada): cuentas y equipos privados. Diseñar autenticación, RLS por propietario y migración explícita de localStorage. No migrar ni exponer equipos guardados sin una función de importación consentida.

## 5. Seguridad y costos

- Mantener el sitio en GitHub Pages; no comprar Cloud SQL ni DigitalOcean en V2.5 inicial.
- **No crear** proyecto Supabase o recurso facturable sin verificar condiciones aplicables y aprobación.
- No usar la clave `service_role` ni credenciales PostgreSQL en React, Vite, archivos JSON o repositorio.
- API pública con publishable key cuando se configure el backend; seguridad real mediante RLS, permisos de tabla y servidor para escrituras privilegiadas.
- El plan Free puede tener restricciones, suspensiones y límites; comprobar el estado antes de cada sustentación.
- Verificar capacidad y uso compartido de la cuenta Drive, cuota de GitHub Actions y ejecución de pruebas de restauración.

## 6. Entregables y criterios de aceptación

1. [x] Crear proyecto PostgreSQL sin costo mensual (región São Paulo) y aplicar las tres migraciones iniciales del esquema.
2. [ ] Cargar **catálogo completo** validado y cotejar; primera carga de muestra realizada: 43 especies, 2 formas y 17 evoluciones, sin referencias rotas.
3. [ ] Drive **dedicado** ya conectado y carpetas creadas; falta restringir las credenciales para la automatización del backup.
4. [ ] Implementar rutina automática de exportar, cifrar, subir, retener y alertar.
5. [ ] Demostrar restauración real desde Drive a PostgreSQL alternativo.
6. [ ] Introducir capa de datos frontend con fallback a snapshot/caché cuando falle la API.
7. [ ] Simular caída de Supabase: seguir mostrando catálogo y equipos guardados locales; informar origen y antigüedad.
8. [ ] Simular fallo de Drive: alarma y retención de la última copia disponible; sin falsa confirmación.
9. [ ] Probar sustentación sin acceso a la base y, por separado, sin internet, con build local.
10. [ ] Documentar recuperación paso a paso, tiempos medidos, integridad y propietario del procedimiento.

**Sin concluir los puntos 3-9 no afirmar que contamos con backups automáticos ni tolerancia real a fallos.**

## Avances verificados (5 de noviembre de 2026)

- Proyecto Supabase: `pokemon-adventure` (`ffnutyxsfjkbdgavfmpv`), 15 tablas con RLS y acceso público solo de lectura; consulta PostgreSQL y controles de integridad exitosos.
- Migraciones aplicadas: `create_pokemon_catalog_v25`, `index_pokemon_catalog_foreign_keys`, `grant_catalog_server_import`.
- Registro de importación: `bootstrap-repo-sample-v1`, `completeness=sample`, 43 especies, 67 tipos, 2 formas y 17 evoluciones. La web aún no se conecta a este esquema.
- Drive: https://drive.google.com/drive/folders/1zuJuD8I4Na2nc_oxHfxHMljMv3XI4NNE
- Scripts de exportación validados: [db/README.md](../db/README.md).
