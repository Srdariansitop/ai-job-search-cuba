# cubadevjobs-cli

CLI para buscar ofertas en [CuCoders Empleos](https://cucoders.dev/empleos/), el
portal detrás del canal de Telegram **Cuban Dev Jobs** (`@CuCodersJobs`).

**Fuente de datos:** HTML público de `https://cucoders.dev/empleos/` y de las
páginas de detalle.
**Autenticación:** ninguna.
**Dependencias:** ninguna en runtime (Bun + `fetch`). `bun install` solo instala
los tipos de TypeScript para desarrollo.

## Instalación

```bash
cd .agents/skills/cubadevjobs-search/cli
bun install   # opcional, solo tipos de desarrollo
```

El CLI funciona sin instalar dependencias.

## Base URL

Por defecto usa `https://cucoders.dev`. Se puede cambiar con
`CUCODER_JOBS_BASE_URL`:

```bash
CUCODER_JOBS_BASE_URL=http://localhost:4321 bun run src/cli.ts search -q "python"
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `search` | Escanea páginas de listado y filtra localmente por texto y fecha |
| `detail` | Obtiene el detalle de una oferta por URL o ruta |

`search` acepta `--format json|table|plain` (por defecto `json`); `detail` acepta
`--format json|plain`. Los errores se escriben en **stderr** como
`{ "error": "...", "code": "..." }` y terminan con código `1`.

## Ejemplos

```bash
# ofertas de Python en remoto, escaneando 5 páginas
bun run src/cli.ts search -q "python" --filter remoto --pages 5 --format table

# ofertas de full stack de los últimos 14 días
bun run src/cli.ts search -q "full stack" --jobage 14 --limit 10 --format plain

# detalle por URL completa
bun run src/cli.ts detail https://cucoders.dev/empleos/2026-10-05/Oferta-laboral-Remoto-Setter-Comercial-en-La-Subasta-Cubana/ --format plain
```

## Flags de búsqueda

| Flag | Alias | Descripción |
|------|-------|-------------|
| `--query` | `-q` | Filtra título, descripción, etiquetas y metadatos. |
| `--filter` | | Filtro de listado de CuCoders: `remoto`, `presencial`, `tiempo-completo`, `software-developer`, etc. |
| `--page` | | Primera página de listado a escanear. Por defecto `1`. |
| `--pages` | | Cantidad de páginas a escanear (`1`-`31`). Por defecto `3`. |
| `--limit` | `-n` | Máximo de resultados tras filtrar. Por defecto `25`. |
| `--jobage` | | Solo ofertas con fecha dentro de los últimos N días. |
| `--format` | | `json`, `table` o `plain`. |

CuCoders no tiene API de búsqueda ni parámetro `q`. El CLI descarga páginas de
listado, parsea las tarjetas y aplica el filtro de texto y fecha localmente.
`--page` y `--pages` controlan la ventana de listado que se escanea, no la
paginación de resultados.

## Contrato de salida

`search --format json` devuelve:

```json
{
  "meta": {
    "count": 1,
    "page": 1,
    "pages_scanned": 3,
    "total": 4,
    "fetched": 60,
    "source": "cucoders"
  },
  "results": [
    {
      "id": "/empleos/2026-11-10/Necesitamos-un-matketolace-super-senior-experto-en-marketing-/",
      "title": "Necesitamos un matketolace, super senior experto en marketing",
      "company": null,
      "location": null,
      "date": "2026-11-10",
      "url": "https://cucoders.dev/empleos/2026-11-10/Necesitamos-un-matketolace-super-senior-experto-en-marketing-/",
      "description": "...",
      "salary": "Por convenir",
      "tags": ["System Administrator", "Graphic Designer"],
      "category": "System Administrator",
      "employment_type": "Tiempo Completo, Tiempo Parcial",
      "modality": "remote"
    }
  ]
}
```

`detail --format json` añade `valid_through` y `contacts` (`label`, `url`).

## Limitaciones conocidas

- CuCoders no expone API pública de empleos; el parser depende del HTML. Si
  cambian las clases o el JSON-LD, el CLI falla o devuelve campos incompletos.
- La empresa y la ubicación normalmente no aparecen en las tarjetas de listado;
  se intentan leer del JSON-LD `JobPosting` en `detail`.
- El título del JSON-LD puede ser poco fiable; el CLI prioriza el `<h1>` visible.
- Cada página de listado trae unas 20 tarjetas y el portal tenía ~31 páginas.
  Escanear muchas páginas es lento y genera tráfico; usa `--filter` y un
  `--pages` pequeño.
- El CLI espera 350 ms entre páginas por defecto. Se puede ajustar con
  `CUCODER_REQUEST_DELAY_MS` (por ejemplo `0` en tests).
- Las fechas del listado usan `DD/MM/YY`; se normalizan a `YYYY-MM-DD`.
- Las ofertas incluyen etiquetas de categoría y tipo de empleo mezcladas; el CLI
  separa las que empiezan por `#` como tags y clasifica modalidad/tipo por texto.

Ver `../SKILL.md` y `../url-reference.md` para la referencia completa.
