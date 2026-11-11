# buscopincha-cli

CLI para buscar ofertas de empleo publicadas en la sección `/jobs` de
[BuscoPincha](https://buscopincha.com), un directorio cubano de servicios y
freelance con una bolsa de ofertas laborales.

**Fuente de datos:** API pública JSON de BuscoPincha:
`/api/job-offer/public/cards/` y `/api/job-offer/public/{slug}/`.
**Autenticación:** ninguna; las lecturas son públicas.
**Dependencias:** ninguna en runtime (Bun + `fetch`). `bun install` solo instala
los tipos de TypeScript para desarrollo.

## Instalación

```bash
cd .agents/skills/buscopincha-search/cli
bun install   # opcional, solo tipos de desarrollo
```

El CLI funciona sin instalar dependencias.

## Base URL

Por defecto usa `https://buscopincha.com`. Se puede cambiar con
`BUSCOPINCHA_API_URL`, útil para pruebas o para apuntar a una instancia distinta:

```bash
BUSCOPINCHA_API_URL=http://localhost:8000 bun run src/cli.ts search -q "marketing"
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `search` | Busca ofertas y filtra localmente por texto y atributos |
| `detail` | Obtiene el detalle completo de una oferta por slug o URL |

`search` acepta `--format json|table|plain` (por defecto `json`); `detail` acepta
`--format json|plain`. Todos los errores se escriben en **stderr** como
`{ "error": "...", "code": "..." }` y terminan con código `1`.

## Ejemplos

```bash
# buscar ofertas de marketing en remoto
bun run src/cli.ts search -q "marketing" --modality remote --limit 10 --format table

# ofertas con precio mínimo
bun run src/cli.ts search --min-price 50000 --format plain

# detalle de una oferta
bun run src/cli.ts detail gestor-de-venta-online --format plain

# usando una URL copiada del portal
bun run src/cli.ts detail https://buscopincha.com/jobs/gestor-de-venta-online/
```

## Flags de búsqueda

| Flag | Alias | Descripción |
|------|-------|-------------|
| `--query` | `-q` | Filtra título, descripción, empresa, ubicación y categorías. |
| `--page` | | Página de resultados ya filtrados. Por defecto `1`. |
| `--limit` | `-n` | Resultados por página. Por defecto `25`. |
| `--modality` | | `remote`, `hybrid` o `in_person`. |
| `--contract-type` | | `fixed` o `punctual`. |
| `--price-type` | | Tipo de precio devuelto por la API, por ejemplo `fixed`. |
| `--min-price` | | Precio numérico mínimo. |
| `--max-price` | | Precio numérico máximo. |
| `--include-filled` | | Incluye ofertas marcadas como cubiertas. Por defecto se excluyen. |
| `--format` | | `json`, `table` o `plain`. |

## Contrato de salida

`search --format json` devuelve:

```json
{
  "meta": {
    "count": 1,
    "page": 1,
    "total": 13,
    "fetched": 13,
    "source": "buscopincha"
  },
  "results": [
    {
      "id": "gestor-de-venta-online",
      "title": "Gestor de venta online",
      "company": "Kike Ruiz",
      "location": "La Habana, Cerro",
      "date": null,
      "url": "https://buscopincha.com/jobs/gestor-de-venta-online/",
      "description": "...",
      "modality": "in_person",
      "contract_type": "fixed",
      "price": 82000,
      "price_type": "fixed",
      "category": null,
      "secondary_category": null,
      "is_filled": false,
      "is_premium": true
    }
  ]
}
```

`detail --format json` añade `price_usd`, `price_eur`, `phones`,
`social_links`, `is_active`, `is_verified` y `paid_until`.

## Limitaciones conocidas

- BuscoPincha no es un job board puro: es un directorio de servicios con una
  sección de empleo y un volumen pequeño de ofertas.
- La API pública no expone la fecha de publicación de las ofertas. Por eso
  `date` normalmente es `null` y este CLI no implementa `--jobage`.
- Los filtros de texto y precio se aplican localmente después de recuperar las
  tarjetas. Se recuperan como máximo 10 páginas de 100 tarjetas.
- El endpoint puede cambiar sin aviso. Si la estructura cambia, el CLI falla con
  un error explícito en vez de devolver resultados vacíos.
- Las ofertas pueden incluir teléfonos de contacto públicos; `detail` los muestra
  porque forman parte del anuncio.

Ver `../SKILL.md` y `../url-reference.md` para la referencia completa.
