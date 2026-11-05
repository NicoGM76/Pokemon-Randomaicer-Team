# V2.5: configurar respaldos reales de PostgreSQL a Google Drive

Esta guía es para **Pokémon Adventure** con presupuesto **US$0/mes** de infraestructura adicional.
La cuenta de Drive dedicada está conectada a ChatGPT, pero **esa autorización NO es compartida con GitHub Actions**.

- PostgreSQL: [Supabase pokemon-adventure](https://supabase.com/dashboard/project/ffnutyxsfjkbdgavfmpv), región São Paulo.
- Drive de destino: [Pokemon-Adventure-DB-Backups](https://drive.google.com/drive/folders/1zuJuD8I4Na2nc_oxHfxHMljMv3XI4NNE) en la cuenta dedicada.
- Carpetas: `daily/`, `weekly/`, `monthly/`, `manifests/`, `restore-tests/` (ya creadas).
- Código: [`scripts/db/backup-to-drive.sh`](../scripts/db/backup-to-drive.sh) y [`scripts/db/restore-check.sh`](../scripts/db/restore-check.sh).
- GitHub Actions: [respaldo diario](../.github/workflows/backup-postgres-drive.yml) e [importación manual](../.github/workflows/import-full-catalog.yml).

**Estado:** estos scripts y workflows son preparación. **No afirmar que hay copias automáticas** hasta comprobar el primer respaldo cifrado en Drive y hacer una restauración real.

## 1. Conexión de PostgreSQL, solo en GitHub Secrets

Entrar en Supabase → proyecto `pokemon-adventure` → **Connect**. Elegir cadena de PostgreSQL de tipo **Session pooler** si la red del runner no admite la conexión IPv6 directa. Usar una contraseña segura y no registrar la URL en archivos versionados.

En GitHub, repositorio → **Settings → Secrets and variables → Actions** → *New repository secret*:

| Tipo | Nombre exacto | Qué guardar |
| --- | --- | --- |
| Secret | `PA_BACKUP_DATABASE_URL` | Connection string PostgreSQL completa de Supabase, con contraseña codificada adecuadamente |
| Secret | `PA_BACKUP_RCLONE_CONFIG_B64` | Configuración rclone dedicada codificada en Base64 (no cifrada) |
| Variable | `PA_BACKUP_AGE_RECIPIENT` | Clave **pública** X25519 de age: `age1...` |

**La URL es un secreto poderoso**: el workflow puede leer/modificar la base. No pegarla en issues, PR, correo ni chat. No usarla en `VITE_*` o JavaScript del navegador.

## 2. Cifrado: generar la clave privada offline

Instalar age desde [su proyecto oficial](https://github.com/FiloSottile/age/releases) en el computador del responsable.

```powershell
age-keygen -o pokemon-adventure-backup-key.txt
age-keygen -y pokemon-adventure-backup-key.txt
```

- La segunda orden muestra el **destinatario público** `age1...`; guardarlo en la variable GitHub `PA_BACKUP_AGE_RECIPIENT`.
- Guardar `pokemon-adventure-backup-key.txt` **fuera** del repositorio, con copia offline protegida.
- **Nunca** subir la clave privada a GitHub, Drive o ChatGPT. Sin esta clave no podremos recuperar los respaldos cifrados.

## 3. Autorizar Google Drive para rclone, en Windows

Esto es **una autorización distinta** de la integración Google Drive de ChatGPT.

1. Instalar [rclone](https://rclone.org/downloads/) y crear una configuración dedicada: `rclone --config .\pokemon-adventure-rclone.conf config`.
2. Configurar un único remote llamado **`pa-backups`**, tipo **Google Drive**, autorizando la **cuenta nueva**, no la personal.
3. Para 2026, rclone recomienda [crear tu propio OAuth client ID](https://rclone.org/drive/#making-your-own-client-id) porque está retirando el ID compartido. No es necesario contratar Cloud SQL. Mantener el client secret y el refresh token en el archivo de configuración local.
4. En las opciones avanzadas de Google Drive, usar `root_folder_id = 1zuJuD8I4Na2nc_oxHfxHMljMv3XI4NNE`. Debido a que la carpeta original fue creada desde otra integración, el alcance OAuth debe permitir visualizarla.
5. Comprobar `rclone --config .\pokemon-adventure-rclone.conf lsf pa-backups: --dirs-only`. Deben aparecer `daily/`, `weekly/`, `monthly/`, `manifests/`, `restore-tests/`.
6. Codificar el **archivo completo** de configuración en Base64 desde PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path .\pokemon-adventure-rclone.conf)))
```

Copiar el resultado **solamente** a `PA_BACKUP_RCLONE_CONFIG_B64` dentro de GitHub Actions Secrets. El Base64 **no protege** el refresh token por sí mismo. Borrar copias temporales en equipos compartidos.

**No utilizar una Google Service Account básica para escribir en My Drive:** puede no tener cuota de almacenamiento; se usa OAuth del propietario de la cuenta dedicada.

## 4. Hacer un respaldo de prueba

Una vez configurados los dos secretos y la variable, abrir **GitHub → Actions → V2.5 Encrypted PostgreSQL Backup to Drive → Run workflow**.

El procedimiento:

1. Se conecta a PostgreSQL 17 (cliente Docker `postgres:17`), extrae **solo el esquema `public`** en formato de archivo `pg_dump` personalizado.
2. Comprueba la estructura del dump con `pg_restore -l`.
3. Cifra localmente con age y elimina el archivo temporal sin cifrar.
4. Sube el `.dump.age` a `daily/` y un manifiesto con SHA-256 a `manifests/`.
5. Vuelve a descargar/comparar bytes mediante `rclone check --download` antes de reportar éxito.
6. En domingo UTC duplica a `weekly/`; el primer día de mes UTC duplica a `monthly/`. No elimina versiones.

El workflow programa una ejecución **diaria a las 00:17 de Colombia (05:17 UTC)**, pero solo funcionará cuando la autenticación esté configurada. Si faltan secretos, **falla explícitamente**, en lugar de presentar un respaldo ficticio.

> Es una copia lógica del esquema `public`, no un respaldo total de Supabase Auth, Storage, claves administradas ni otros esquemas. Se ampliará el alcance antes de almacenar información privada o incorporar autenticación de usuarios.

## 5. Probar restauración REAL

Descargar **del Drive** un archivo de `daily/` y su manifiesto de `manifests/` con el mismo nombre base, sin descifrar en la nube.

Desde un equipo autorizado con Docker, age, Node.js y los archivos locales:

```powershell
bash scripts/db/restore-check.sh backup.dump.age backup.dump.manifest.json /ruta/segura/pokemon-adventure-backup-key.txt
```

La prueba verifica SHA-256 de archivo cifrado y descifrado, inicia PostgreSQL 17 en un contenedor local **sin puertos expuestos**, restaura en una base efímera y comprueba las tablas públicas y su RLS. El contenedor y los archivos temporales se eliminan al salir.

El proceso de respaldo deja `restoreVerified: false` en el manifiesto deliberadamente: **una subida correcta no demuestra que se pueda restaurar**. Registrar fecha, nombre y resultado de cada restauración en `restore-tests/`, sin claves privadas.

## 6. Importar las 1025 especies a Supabase

El workflow independiente **V2.5 Import Verified Pokemon Catalog into Supabase** requiere únicamente el secret `PA_BACKUP_DATABASE_URL`.

Antes de importar sincroniza PokéAPI y valida 22 Pokédex regionales; genera SQL transaccional, lo aplica con `psql` y comprueba que PostgreSQL contenga al menos 1000 especies con una importación `full` registrada. No borra equipos privados ni otros datos.

**Si cualquiera de las pruebas falla, el resultado se debe considerar incompleto.** La web pública sigue utilizando JSON/almacenamiento local hasta implementar el cambio de fuente con mecanismo de contingencia.

Fuentes técnicas: [Supabase backup & restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [rclone Google Drive](https://rclone.org/drive/), [GitHub Actions secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions).
