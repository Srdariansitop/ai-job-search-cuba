<p align="center">
  <img src="assets/mascot/pip_flight_loop.gif" alt="Pip, el pájaro mensajero" width="200">
</p>

# AI Job Search (Búsqueda de Empleo con IA)

*La búsqueda de empleo que se ejecuta en tu propia máquina.*

<p align="center">
  <a href="https://trendshift.io/repositories/43622?utm_source=trendshift-badge&amp;utm_medium=badge&amp;utm_campaign=badge-trendshift-43622" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/trendshift/repositories/43622/daily" alt="MadsLorentzen%2Fai-job-search | Trendshift" width="250" height="55"/></a>
</p>

[![CI](https://github.com/MadsLorentzen/ai-job-search/actions/workflows/ci.yml/badge.svg)](https://github.com/MadsLorentzen/ai-job-search/actions/workflows/ci.yml)

Un framework de solicitudes de empleo impulsado por inteligencia artificial y construido sobre [Claude Code](https://claude.com/claude-code), con compatibilidad adicional para [OpenCode](https://opencode.ai). Haz un fork, completa tu perfil y deja que tu agente evalúe ofertas de trabajo, adapte tu currículum (CV), redacte cartas de presentación y te prepare para las entrevistas.

> Nota: Este es un proyecto independiente de código abierto y no está afiliado, respaldado, patrocinado ni mantenido por Anthropic. Anthropic y Claude Code se mencionan únicamente para describir el conjunto de herramientas que utiliza este flujo de trabajo.
>
> Este proyecto **no tiene criptomonedas, tokens ni programas de patrocinio pagados afiliados**. Cualquier afirmación en contrario no está autorizada y debe considerarse una estafa. Las únicas formas de apoyar el proyecto son el enlace de Ko-fi a continuación y contribuyendo en GitHub.

## Versión Cubana (Fork y Adaptación)

Este repositorio es un fork y una modificación adaptada del proyecto original [ai-job-search](https://github.com/MadsLorentzen/ai-job-search) de Mads Lorentzen, optimizada específicamente para el mercado laboral en **Cuba**. 

Se han integrado habilidades nativas de búsqueda para portales y bolsas de empleo cubanas:
- **BuscoPincha** (`buscopincha-search`): Integración con la plataforma cubana de empleos y servicios.
- **CuCoders / Cuban Dev Jobs** (`cubadevjobs-search`): Extracción de ofertas técnicas y de desarrollo de software en Cuba a través de CuCoders y comunidades de desarrolladores locales.
- **CubaJobs** (`cubajobs-net-search`): Extracción de ofertas de empleo locales y oportunidades remotas para profesionales en Cuba desde `cubajobs.net`.
- **Cubisima Empleos** (`cubisima-search`): Búsqueda de clasificados de empleo en Cuba (sector estatal, empresas mixtas y particulares/MIPYMES) en todas las provincias.
- **Himalayas** (`himalayas-search`): Búsqueda de empleos 100% remotos a nivel mundial compatibles con Cuba (filtrando estrictamente ofertas mundiales / sin restricciones de país, excluyendo requisitos de residencia fuera de Cuba).

Conserva todo el potente flujo de trabajo automatizado de IA (`/scrape`, `/apply`, `/upskill`, `/interview`) adaptado para encontrar y postularse a oportunidades desde Cuba.

## ¿Qué es esto?

Un flujo de trabajo estructurado que convierte a Claude Code o OpenCode en un asistente completo de solicitudes de empleo. El flujo de trabajo principal (auto-perfilado, evaluación de compatibilidad y la tubería de redactor-revisor) es **independiente del idioma y del país**. Las habilidades de búsqueda en portales de empleo se adaptan a tus mercados locales o herramientas globales, permitiendo intercambiar fácilmente las fuentes de búsqueda.

```
+-----------+     +------------------+     +---------------------------+
|   /setup  | --> |     /scrape      | --> |      /apply <url>         |
+-----------+     +------------------+     +---------------------------+
      |                     |                            |
      v                     v                            v
  Completa tu       Busca en portales           Evalúa compatibilidad
    perfil              de empleo              Califica y recomienda
      |                     |                            |
      v                     v                            v
  Archivos del      Presenta coincidencias      Redacta CV + Carta de presentación
 perfil listos       con puntaje de ajuste        (LaTeX, personalizado)
                            |                            |
                            v                            v
                     Elige una oferta            Agente revisor critica
                         -> /apply               -> Revisa -> Resultado final
```

El framework codifica las mejores prácticas de orientación profesional, incluyendo criterios de evaluación estructurados, encuadre prospectivo de cartas de presentación y evaluación comparativa de salarios opcional.

## Prerrequisitos

- [Claude Code](https://claude.com/claude-code) (CLI) o [OpenCode](https://opencode.ai) (CLI)
- Python 3.10+
- [Bun](https://bun.sh) (para las herramientas CLI de búsqueda de empleo)
- Distribución de LaTeX con `lualatex` y `xelatex`: [TeX Live](https://tug.org/texlive/), [MacTeX](https://tug.org/mactex/), [TinyTeX](https://yihui.org/tinytex/), o [MiKTeX](https://miktex.org/). El CV se compila con `lualatex` (pdflatex suele fallar en instalaciones modernas de MiKTeX con errores de expansión de fuentes `fontawesome5`); la carta de presentación se compila con `xelatex` porque `cover.cls` requiere `fontspec`. Si usas una instalación mínima de TeX como TinyTeX o BasicTeX, instala los paquetes adicionales listados en [SETUP.md](SETUP.md#minimal-tex-install-tinytexbasictex).
- Opcional: `pdftotext` de [poppler](https://poppler.freedesktop.org/) (macOS: `brew install poppler`, Debian/Ubuntu: `apt install poppler-utils`, Windows: `choco install poppler`) — utilizado por la verificación de legibilidad ATS de `/apply` en el CV compilado. Si falta, la verificación se degrada de manera elegante a una revisión visual de palabras clave.

## Inicio rápido

### 1. Haz un fork y clona el repositorio

```bash
gh repo fork tu-usuario/ai-job-search --clone
cd ai-job-search
```

### 2. Instala las herramientas de búsqueda de empleo

PowerShell:

```powershell
$tools = @("buscopincha-search", "cubadevjobs-search", "cubajobs-net-search", "cubisima-search", "linkedin-search", "freehire-search", "himalayas-search")
foreach ($tool in $tools) {
  Set-Location ".agents/skills/$tool/cli"
  bun install
  Set-Location "..\..\..\.."
}
```

Bash / zsh / Git Bash:

```bash
for tool in buscopincha-search cubadevjobs-search cubajobs-net-search cubisima-search linkedin-search freehire-search himalayas-search; do
  cd .agents/skills/$tool/cli && bun install && cd ../../../..
done
```

Para `linkedin-search`, `freehire-search`, `buscopincha-search`, `cubadevjobs-search`, `cubajobs-net-search`, `cubisima-search` y `himalayas-search`, la instalación es opcional: todos tienen cero dependencias en tiempo de ejecución y se ejecutan con `bun` puro; `bun install` solo descarga los tipos de desarrollo de TypeScript.

### 3. Configura tu perfil

Claude Code:
```bash
claude
# Luego dentro de Claude Code:
/setup
```

OpenCode:
```bash
opencode
# Luego dentro de OpenCode:
/setup
```

`/setup` ofrece tres rutas: leer tu carpeta `documents/` si tienes una poblada (PDF de CV, exportación de LinkedIn, diplomas, cartas de recomendación, solicitudes pasadas), importar un único CV pegado en el chat, o recorrer una entrevista guiada. Detecta automáticamente lo que tienes y pregunta. El modo de carpeta de documentos es idempotente y seguro de volver a ejecutar a medida que agregas más material; consulta `documents/README.md` para ver la estructura.

### 4. Busca empleos

```bash
/scrape
```

El comando funciona de la misma manera en OpenCode. Esto busca en múltiples portales de empleo posiciones que coincidan con tu perfil, elimina duplicados y los presenta ordenados por compatibilidad. Elige una coincidencia para ejecutar `/apply` directamente en ella; o, cuando una búsqueda devuelva más empleos de los que deseas revisar a simple vista, ejecuta `/rank` para evaluarlos en lote contra el marco de compatibilidad y obtener una lista corta clasificada primero.

### 5. Postúlate a un empleo

```bash
/apply https://ejemplo.com/oferta/1234567
```

Si la URL no se puede recuperar (algunos portales de empleo bloquean el acceso automatizado), puedes pegar la descripción del trabajo directamente:

```bash
/apply <pega aquí la descripción completa del trabajo>
```

El comando funciona de la misma manera en OpenCode. Esto ejecuta el flujo de trabajo completo: evaluar compatibilidad, redactar CV + carta de presentación, revisar con un segundo agente, refinar y presentar el resultado final.

Las ofertas se tratan como entradas no confiables (el flujo de trabajo no sigue instrucciones incrustadas en ellas ni obtiene enlaces de su cuerpo), pero las defensas de los agentes están a nivel de instrucciones y no en un sandbox; en un portal de empleo desconocido, revisa rápidamente lo que se obtuvo y se escribió antes de enviar. Detalles en [SECURITY.md](SECURITY.md).

## Otros comandos

`/setup`, `/scrape` y `/apply` forman el flujo de trabajo principal. Diez comandos adicionales lo amplían una vez que tu perfil está configurado. Todos los comandos funcionan de manera idéntica en OpenCode: la misma sintaxis de `/comando` carga los mismos archivos de flujo de trabajo.

- **`/interview`** te prepara para una entrevista programada en una postulación rastreada. Construye un paquete de preparación específico para la etapa a partir del archivo de la postulación (la oferta exacta, el CV y la carta de presentación que el entrevistador realmente leyó, los comentarios registrados de rondas anteriores), investiga a la empresa y a los entrevistadores con una regla de verificar antes de usar, mapea preguntas probables a tus ejemplos STAR y ofrece una simulación de entrevista siguiendo el protocolo de rol en `07-interview-prep.md`. Las brechas reciben respuestas honestas de transición, nunca experiencia inventada.
- **`/outcome`** registra lo que sucedió con una postulación: etapas de entrevistas, ofertas, rechazos, silencio. Archiva el CV enviado, la carta de presentación y el texto de la oferta en `documents/applications/<empresa>_<puesto>/`, mantiene `outcome.md` en el formato que `/setup` Ruta A analiza, y actualiza el rastreador. También gestiona el seguimiento previo a un resultado: `/outcome followup` muestra postulaciones abiertas que se han quedado en silencio (por defecto 10 días), redacta un breve seguimiento adecuado al canal en tu estilo de escritura utilizando solo afirmaciones de los materiales que ya enviaste (solo borradores, nunca envía; como máximo dos veces por postulación) y ofrece una nota de agradecimiento en el mismo turno en que se registra una etapa de entrevista. Una vez que algunas postulaciones se resuelven, te redirige a `/setup` para calibrar el marco de compatibilidad a partir de lo que realmente consiguió entrevistas.
- **`/notion-sync`** publica una vista unidireccional y de solo lectura de tu pipeline en una base de datos de Notion a través del servidor MCP oficial de Notion (OAuth, sin claves API): una fila por trabajo clasificado más cada postulación rastreada, con una página de resumen de escritura única por fila. Los archivos del repositorio siguen siendo el sistema de registro: nada se sincroniza de regreso y los documentos se sincronizan solo como nombres de archivo. Complementa a `/html-report`: este último es el panel de control offline profundo que regeneras en tu escritorio; Notion es la vista rápida en vivo desde cualquier lugar donde se ejecute Notion (escritorio, web, teléfono).
- **`/gmail-sync`** lee tu Gmail (a través del conector de Gmail) en busca de señales de estado sobre tus postulaciones abiertas (invitaciones a entrevistas, enlaces de evaluación, ofertas, rechazos) y las propone en lote para que las apruebes antes de que se escriba nada en el rastreador o en `outcome.md`, citando el correo electrónico fuente en cada cambio propuesto. Las ofertas se detienen antes de proponer `hired`/`offer_declined` ya que esa es tu decisión; las señales contradictorias o no coincidentes se marcan para una revisión manual con `/outcome` en lugar de adivinarlas.
- **`/rank`** conecta `/scrape` y `/apply`: califica en lote todas las ofertas recién obtenidas frente al marco de compatibilidad (agentes en paralelo obtienen cada oferta y califican las cinco dimensiones de evaluación) y devuelve una lista corta clasificada con fortalezas y debilidades honestas por trabajo. Los factores excluyentes vetan, los plazos obtienen indicadores de urgencia y los puestos caducados se marcan como expirados. Elige un número y se transfiere al flujo de trabajo completo de `/apply`.
- **`/expand`** enriquece tu perfil escaneando fuentes públicas que ya hayas vinculado en él (repositorios de GitHub, sitio de portafolio, Kaggle, Google Scholar) y buscando temarios de cursos y certificaciones nombradas. Las competencias descubiertas se agregan a tu perfil con una etiqueta de fuente. Es útil justo después de `/setup` para resaltar habilidades que los documentos por sí solos no hacen explícitas.
- **`/upskill`** analiza la brecha entre tu perfil y tus ofertas de trabajo rastreadas (o una sola oferta a través de `/upskill <URL>`). Produce un mapa de calor priorizado de brechas de habilidades y un plan de aprendizaje con recursos de estudio buscados en la web y estimaciones de tiempo. Útil para la planificación de la carrera entre postulaciones.
- **`/html-report`** genera un panel HTML independiente a partir de `job_search_tracker.csv` y los archivos de postulaciones: tarjetas de estadísticas, gráficos de estado/sector/canal/embudo (SVG integrado, sin dependencias externas) y una tabla de postulaciones filtrable. Se abre directamente en un navegador, completamente offline. Vuelve a ejecutarlo en cualquier momento después de que `/outcome` agregue nuevas entradas.
- **`/add-template`** registra tu propia plantilla de CV o carta de presentación (LaTeX, Typst u otra herramienta) en lugar de las predeterminadas. Captura las instrucciones de la plantilla (extensión de origen, comando de compilación, fuentes, reglas de estilo, límite de página), ejecuta una compilación de prueba obligatoria e integra la plantilla en `/apply`. Consulta [Plantillas personalizadas](#plantillas-personalizadas) a continuación.
- **`/add-portal`** genera una habilidad de búsqueda en portales de empleo para un sitio de tu mercado. Investiga el portal (patrón de URL de búsqueda, estructura de resultados, reglas de acceso), estructura la habilidad CLI con la misma estructura que las incluidas y prueba una consulta en vivo antes de registrarla. Consulta [Herramientas de búsqueda de empleo](#herramientas-de-búsqueda-de-empleo) a continuación.

`/reset` también está disponible, consulta [Empezar de nuevo](#empezar-de-nuevo) a continuación.

## Estructura de archivos

```
ai-job-search/
├── CLAUDE.md                          # Perfil principal del candidato + reglas de flujo
├── .claude/
│   ├── commands/
│   │   ├── apply.md                   # Flujo de trabajo /apply (redactor-revisor)
│   │   ├── setup.md                   # Onboarding /setup (carpeta documents, importación de CV o entrevista)
│   │   ├── expand.md                  # Enriquecimiento de competencias /expand desde documentos y presencia online
│   │   ├── add-template.md            # Registro de plantillas personalizadas /add-template (LaTeX, Typst, ...)
│   │   ├── add-portal.md              # Generación de habilidad de búsqueda /add-portal para tu mercado
│   │   ├── rank.md                    # Triaje de ofertas obtenidas en una lista corta /rank
│   │   ├── outcome.md                 # Registro de resultados de postulaciones y archivo de materiales /outcome
│   │   ├── gmail-sync.md              # Detección automática de estado de postulación desde Gmail /gmail-sync
│   │   ├── interview.md               # Paquete de preparación específico por etapa + simulacro /interview
│   │   ├── html-report.md             # Generación de panel de control de seguimiento /html-report
│   │   ├── notion-sync.md             # Vista de pipeline unidireccional en base de datos de Notion /notion-sync
│   │   └── reset.md                   # Restablecimiento de datos de perfil o carpeta documents /reset
│   ├── skills/
│   │   ├── job-application-assistant/  # Habilidad principal de postulación
│   │   │   ├── SKILL.md               # Definición de la habilidad
│   │   │   ├── 01-candidate-profile.md # Educación, experiencia y habilidades
│   │   │   ├── 02-behavioral-profile.md# Evaluación de personalidad PI/DISC
│   │   │   ├── 03-writing-style.md    # Tono, estructura, directrices
│   │   │   ├── 04-job-evaluation.md   # Marco de puntuación para ajuste de empleo
│   │   │   ├── 05-cv-templates.md     # Estructura de CV LaTeX + reglas de adaptación
│   │   │   ├── 06-cover-letter-templates.md # Plantillas LaTeX de cartas de presentación
│   │   │   └── 07-interview-prep.md   # Ejemplos STAR + marco de entrevista
│   │   ├── job-scraper/               # Orquestación de búsqueda de empleo
│   │   └── upskill/                   # Análisis de brechas de habilidades y plan de aprendizaje /upskill
│   └── settings.json                  # Permisos de Claude Code (compartidos, delimitados)
├── opencode.json                      # Configuración de comandos de OpenCode (vincula a .claude/commands/)
├── AGENTS.md                          # Puntero delgado para runtimes que no son de Claude
├── .agents/skills/                    # Herramientas CLI de portales de empleo
│   ├── buscopincha-search/            # BuscoPincha (Cuba)
│   ├── cubadevjobs-search/            # Cuba Dev Jobs (Cuba / Remoto)
│   ├── cubajobs-net-search/           # CubaJobs (Cuba / Remoto)
│   ├── cubisima-search/               # Cubisima Empleos (Cuba)
│   ├── linkedin-search/               # Listados públicos de LinkedIn (agnóstico de país)
│   ├── freehire-search/               # Agregador de empleos tecnológicos freehire.me (multi-mercado, REST API)
│   └── himalayas-search/              # Himalayas (Empleos 100% remotos globales compatibles con Cuba)
├── cv/
│   └── main_example.tex               # Plantilla moderncv LaTeX
├── cover_letters/
│   ├── cover.cls                      # Clase LaTeX personalizada para carta de presentación
│   ├── cover_example.tex              # Ejemplo de carta de presentación (referencia estructural + prueba CI)
│   └── OpenFonts/                     # Fuentes Lato + Raleway
├── templates/                         # Plantillas personalizadas registradas vía /add-template
│   └── README.md                      # Instrucciones de diseño de carpetas
├── documents/                         # Materiales fuente de carrera para /setup Ruta A y /expand
│   ├── README.md                      # Instrucciones de diseño de carpetas
│   ├── cv/                            # CV maestro (PDF o .tex)
│   ├── linkedin/                      # Exportación de perfil de LinkedIn (PDF)
│   ├── diplomas/                      # Certificados de títulos y expedientes académicos
│   ├── references/                    # Cartas de recomendación
│   └── applications/                  # Registros de postulaciones pasadas (<empresa>_<puesto>/)
├── .github/workflows/ci.yml           # CI: Compilaciones de prueba LaTeX, lint de habilidades, comprobaciones de tipos CLI
├── salary_lookup.py                   # Herramienta de evaluación comparativa salarial
├── tools/
│   ├── convert_salary_excel.py        # Conversión de Excel salarial a JSON
│   ├── lint_skills.py                 # CI lint para habilidades, comandos, settings.json
│   ├── security_guards.py             # Guardias CI: lista blanca de permisos, reglas de gitignore, manifiestos
│   └── README_SALARY_TOOL.md          # Instrucciones de configuración de la herramienta salarial
├── job_scraper/                       # Estado del scraper (empleos vistos, resultados)
├── gmail_sync/                        # Estado de /gmail-sync (IDs de mensajes procesados, última fecha de sinc.)
├── upskill/                           # Salida de informes /upskill (informes markdown por ejecución)
├── job_search_tracker.csv             # Hoja de cálculo de seguimiento de postulaciones
└── SETUP.md                           # Guía detallada de configuración
```

## Cómo funciona `/apply`

El comando `/apply` ejecuta un **flujo de trabajo de redactor-revisor** con compilación obligatoria de PDF:

1. **Analiza** la oferta de empleo (URL o texto)
2. **Evalúa la compatibilidad** con tu perfil (habilidades, experiencia, cultura, ubicación, alineación profesional)
3. **Redacta** un CV y una carta de presentación personalizados en LaTeX
4. **Despliega un agente revisor** que investiga a la empresa y critica los borradores
5. **Revisa y ajusta** basándose en los comentarios del revisor
6. **Compila e inspecciona** ambos PDFs: `lualatex` para el CV, `xelatex` para la carta de presentación. Claude lee las páginas renderizadas e itera sobre el LaTeX hasta que el CV tenga exactamente 2 páginas sin títulos de entrada huérfanos, y la carta de presentación tenga exactamente 1 página con la firma visible y fuentes coherentes.
7. **Verificación ATS del CV**: extrae la capa de texto del PDF (`pdftotext`, dependencia opcional) y la verifica tal como la ve un analizador ATS (detalles de contacto presentes como texto literal, sin glifos distorsionados, orden de lectura correcto), y luego califica la cobertura de palabras clave de la oferta frente a la extracción. Las palabras clave que el perfil respalda genuinamente se agregan; las brechas reales permanecen visibles y nunca se rellenan artificialmente.
8. **Presenta** el resultado final con una lista de verificación de cumplimiento.

Todas las reclamaciones en el CV y la carta de presentación se verifican con tu perfil real. El sistema nunca fabrica habilidades o experiencia.

### Uso con OpenCode

Este proyecto funciona con [OpenCode](https://opencode.ai) como una alternativa adicional a Claude Code. Los archivos de flujo de trabajo canónicos se encuentran en `.claude/` — OpenCode los lee directamente mediante referencias `{file:...}` en `opencode.json`, por lo que no hay un árbol de configuración paralelo que mantener.

```bash
opencode
# Dentro de OpenCode:
/setup
/scrape
/apply <URL o descripción del empleo>
/rank
/interview
```

Los comandos, mensajes y contratos de salida son idénticos. OpenCode solo necesita un archivo adicional (`opencode.json`) que le indica dónde encontrar cada flujo de trabajo. Consulta `AGENTS.md` para ver la arquitectura.

> **Nota:** El bloque de permisos de OpenCode en `opencode.json` utiliza una lista blanca seleccionada para comandos `bash` (coincidiendo con la postura de `.claude/settings.json` de upstream). Solo los comandos esenciales para el flujo de trabajo (`bun run`, `lualatex`, `xelatex`, `pdftotext`, `python salary_lookup.py`) se aprueban automáticamente; otros comandos solicitan confirmación.

### Lo que hace diferente a este flujo de trabajo

- **Bucle de verificación de PDF.** La mayoría de las plantillas de currículum en LaTeX producen resultados que "se ven bien en el archivo .tex" pero se rompen en el PDF: los títulos de los puestos saltan a la siguiente página, las cartas de presentación se desbordan a la página 2, las fuentes de las listas caen silenciosamente en la fuente del cuerpo. El comando `/apply` compila e inspecciona visualmente cada PDF y aplica correcciones específicas (`\needspace`, `\enlargethispage`, envoltorios de coincidencia de fuentes para elementos de lista) hasta que el diseño esté limpio. Esto se ejecuta automáticamente en cada postulación.
- **Verificación ATS en la capa de texto del PDF.** Un ATS lee el texto incrustado del PDF, no la página renderizada, y LaTeX puede producir silenciosamente PDFs cuyo texto se extrae como basura (glifos de iconos donde debería estar el correo electrónico, líneas intercaladas de diseños de varias columnas). `/apply` extrae la capa de texto del CV compilado con `pdftotext` y verifica los detalles de contacto, el orden de lectura y la cobertura de palabras clave de la oferta contra lo que ve un analizador. Se aplica la regla de honestidad: una palabra clave que el perfil no respalda se reconoce como una brecha, nunca se incluye artificialmente.
- **Corte de CV ponderado por relevancia.** Cuando un currículum supera las 2 páginas, el flujo de trabajo no corta mecánicamente de la sección "más antigua". Califica cada línea candidata por (a) relevancia para la oferta objetivo, (b) singularidad en el documento y (c) si la carta de presentación depende de ella, y corta primero la línea con la menor puntuación total. Un punto de un rol anterior que cumple con las palabras clave de la oferta sobrevive por encima de un punto de un rol reciente que no lo hace.
- **Separación de redactor y revisor.** El redactor escribe; un segundo agente de Claude, generado con un contexto fresco, investiga a la empresa y critica los borradores. El redactor luego revisa. Esto detecta palabras clave omitidas, marcos débiles y lenguaje genérico que una sola pasada a menudo deja atrás.
- **Envío de revisor eficiente en tokens.** El agente revisor recibe los borradores en línea en lugar de volver a leerlos, y la lista de verificación de verificación se ejecuta una vez al final del flujo de trabajo en lugar de ser duplicada por ambos agentes.

## Personalización

### Qué archivos editar manualmente

Si prefieres editar los archivos directamente en lugar de usar `/setup`:

| Archivo | Qué cambiar |
|---|---|
| `CLAUDE.md` | Tu perfil completo (nombre, educación, experiencia, habilidades, objetivos) |
| `01-candidate-profile.md` | Versión estructurada de los datos de tu CV |
| `02-behavioral-profile.md` | Tu evaluación de comportamiento o autoevaluación |
| `04-job-evaluation.md` | Áreas de coincidencia de habilidades, objetivos de carrera, filtros de motivación |
| `05-cv-templates.md` | Plantillas de declaraciones de perfil para diferentes tipos de roles |
| `07-interview-prep.md` | Tus ejemplos STAR de experiencia real |
| `search-queries.md` | Consultas de búsqueda de empleo para tus habilidades y ubicación |

### Actualización de tus consultas de búsqueda

A medida que tus prioridades evolucionen, puedes reconfigurar solo la búsqueda de empleo sin volver a ejecutar la configuración completa del perfil:

```
/setup --section search
```

Esto vuelve a ejecutar la entrevista de configuración de búsqueda: qué roles orientar, qué habilidades buscar, qué ubicaciones y qué portales. También sugiere tipos de roles que quizás no hayas considerado según tu perfil.

### Plantillas personalizadas

El CV utiliza [moderncv](https://ctan.org/pkg/moderncv) (estilo banking). La carta de presentación utiliza un `cover.cls` personalizado con fuentes Lato/Raleway. Ambos son LaTeX.

Para usar tu propia plantilla en su lugar —LaTeX, [Typst](https://typst.app/), o cualquier otra herramienta que compile a PDF desde la línea de comandos— ejecuta:

```
/add-template
```

### Herramientas de búsqueda de empleo

Las herramientas CLI en `.agents/skills/` demuestran el patrón para construir una integración de portales de empleo. Para agregar fuentes adaptadas a tu mercado o mercado global, puedes usar:

```
/add-portal
```

Para puntos de partida **agnósticos de país**, el repositorio incluye:
- **`linkedin-search`** — construido sobre los puntos finales públicos y sin autenticación `jobs-guest` de LinkedIn. Agnóstico de campo, **cero dependencias en tiempo de ejecución** (se ejecuta solo con `bun`), y toma la ubicación de búsqueda como un indicador explícito, por lo que funciona para cualquier mercado desde el primer momento (`-l "La Habana, Cuba"`, `-l "Remote"`, etc.). Diseñado **únicamente para uso personal**. Consulta `.agents/skills/linkedin-search/SKILL.md`.
- **`freehire-search`** — consulta la API REST pública del agregador [freehire.me](https://freehire.me) (JSON, sin clave API). Enfocado en tecnología (software, datos, ingeniería, DevOps, remoto), multi-mercado a través de indicadores de facetas (`--region`, `--country`, `--remote`), y **cero dependencias en tiempo de ejecución**. Consulta `.agents/skills/freehire-search/SKILL.md`.
- **`himalayas-search`** — consulta la API JSON pública de [Himalayas](https://himalayas.app/jobs/api) para buscar empleos 100% remotos, aplicando un filtro estricto que solo incluye ofertas mundiales (Worldwide / Global / sin restricciones geográficas) compatibles con Cuba (excluyendo requisitos de residencia fuera del país). **Cero dependencias en tiempo de ejecución**. Consulta `.agents/skills/himalayas-search/SKILL.md`.

Para **Cuba**, el repositorio incluye:
- **`buscopincha-search`** — consulta la API pública JSON de la sección `/jobs` de [BuscoPincha](https://buscopincha.com), un directorio cubano de servicios con ofertas de empleo. Filtra localmente por texto, modalidad, contrato y precio; no hay fechas de publicación. **Cero dependencias en tiempo de ejecución**. Consulta `.agents/skills/buscopincha-search/SKILL.md`.
- **`cubadevjobs-search`** — busca en [CuCoders Empleos](https://cucoders.dev/empleos/), el portal web detrás del canal de Telegram **Cuban Dev Jobs** (`@CuCodersJobs`). Parsea HTML y JSON-LD, filtra por texto, fecha y filtros de CuCoders, y obtiene el detalle con contactos de postulación. **Cero dependencias en tiempo de ejecución**. Consulta `.agents/skills/cubadevjobs-search/SKILL.md`.
- **`cubajobs-net-search`** — busca ofertas laborales en Cuba y oportunidades remotas para profesionales cubanos en [CubaJobs](https://cubajobs.net). Parsea anuncios y páginas de detalle. **Cero dependencias en tiempo de ejecución**. Consulta `.agents/skills/cubajobs-net-search/SKILL.md`.
- **`cubisima-search`** — busca clasificados de empleo en [Cubisima Empleos](https://www.cubisima.com/empleos/) para todas las provincias y sectores (estatal, empresas mixtas y MIPYMES). **Cero dependencias en tiempo de ejecución**. Consulta `.agents/skills/cubisima-search/SKILL.md`.

### Empezar de nuevo

Para borrar tus datos de perfil y empezar de cero:

```
/reset profile    # limpia los archivos de habilidades, conserva las reglas del framework
/reset documents  # elimina archivos de la carpeta documents/
/reset all        # ambos
```

`/reset` muestra exactamente qué se eliminará y requiere que escribas `RESET` para confirmar. No se elimina nada hasta que lo hagas.

## Contribución

¿Estás pensando en un PR? Lee [CONTRIBUTING.md](CONTRIBUTING.md) primero: explica qué se fusiona, qué vive en forks y por qué.

## Agradecimientos

- [Mikkel Krogholm](https://github.com/mikkelkrogsholm) ([repositorio de habilidades](https://github.com/mikkelkrogsholm/skills)) por las habilidades CLI de búsqueda de empleo.
- Construido con [Claude Code](https://claude.com/claude-code) por [Anthropic](https://anthropic.com).

## Licencia

MIT
