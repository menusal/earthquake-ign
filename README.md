# Sismicidad 3D · IGN

Visor 3D de la sismicidad reciente en España y su entorno. Muestra los terremotos de los últimos 30 días con hipocentros a su profundidad real, terreno propio del IGN, shakemaps, fallas activas y estaciones sísmicas.

> Proyecto independiente. **No es un producto oficial del Instituto Geográfico Nacional.** Los datos pertenecen a sus organismos de origen y mantienen sus propias condiciones de uso.

## Características

- **Mapa 3D** con CesiumJS, ortofoto PNOA, relieve sombreado y terreno propio generado desde el MDT del IGN.
- **Hipocentros a profundidad real**, con exageración vertical (×1/×3/×5), modo subsuelo y marcador claro de epicentro, hipocentro y tallo de profundidad.
- **Filtros** por magnitud, profundidad, ámbito (España, península, Canarias, mundo), periodo, sentidos y texto. Todo el estado se guarda en la URL.
- **Lista virtualizada** de eventos, con teclado y orden por fecha.
- **Ficha de evento** con magnitud, tipo, profundidad, intensidades, hora UTC/local y enlace al catálogo del IGN.
- **Shakemaps** cuando el evento las tiene: raster de intensidad, superficie 3D por bandas e isolíneas oficiales (MMI o PGA).
- **Fallas activas QAFI** (IGME) como trazas y cortinas 3D interpretativas.
- **Estaciones sísmicas** y **peligrosidad sísmica 2015** como capas conmutables.
- **Secuencia animada** entre terremotos, con velocidad, bucle y vuelo de cámara.
- **Enlaces compartibles** por evento, filtros y capas; preview social para bots.
- **Pantalla de entrada** en cada visita a `/`, ayuda y **tour guiado** (driver.js).
- **Adaptación a mobile**: bottom sheet, ficha inferior, controles compactos y safe areas.

## Stack

React 19 · TypeScript · Vite · pnpm · Tailwind CSS 4 · CesiumJS · Zustand · React Router · Zod · TanStack Virtual · driver.js.

## Arranque rápido

Requisitos: Node.js 22+ y pnpm 10+.

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:5173`.

> `pnpm dev` copia antes los assets de Cesium a `public/cesium` (ignorado por Git).

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con copia de assets de Cesium. |
| `pnpm build` | Copia Cesium, comprueba tipos y genera `dist`. |
| `pnpm preview` | Sirve el build de producción. |
| `pnpm typecheck` | `tsc -b` sin emitir. |
| `pnpm lint` | Oxlint. |
| `pnpm terrain:build` | Genera los tiles de elevación desde el WCS del IGN. |

## Terreno

Los tiles se generan desde el **WCS INSPIRE del IGN** y se guardan en `public/terrain` (versionados para que el despliegue no dependa del WCS en cada build).

- Coberturas: `Elevacion4258_1000`, `_500`, `_200` y `_25` según el nivel.
- Formato: heightmap de **65×65**, `Int16` little-endian, en metros.
- Esquema: `GeographicTilingScheme` (EPSG:4326), alineado con la ortofoto.
- Cobertura: niveles 0–10 nacionales + niveles 11–12 en zonas de interés.
- Volumen actual: ~5.900 tiles, ~48 MB.

La configuración de ámbito, ROIs y niveles está en `terrainAreas.json`.

```bash
pnpm terrain:build
pnpm terrain:build --levels=10-10 --bbox=-3.8,37,-3.4,37.3 --force
```

## Fuentes de datos

| Uso | Servicio | Titularidad |
|---|---|---|
| Terremotos últimos 30 días | `ign.es/web/resources/sismologia/tproximos/todos_visualizadores.js` | IGN |
| Shakemaps por evento | `ign.es/web/resources/sismologia/tproximos/shakemaps/{evid}/` | IGN |
| Estaciones sísmicas | `ign.es/web/resources/sismologia/estaciones/json/*.geojson` | IGN |
| Modelo digital del terreno | `servicios.idee.es/wcs-inspire/mdt` | IGN / CNIG |
| Ortofoto PNOA | `ign.es/wmts/pnoa-ma` | IGN |
| Relieve | `tms-relieve.idee.es` | IGN / IDEE |
| Fallas activas QAFI v4 | `mapas.igme.es/gis/rest/services/BasesDatos/IGME_QAFI` | IGME |
| Peligrosidad sísmica 2015 | `ign.es/wms-inspire/geofisica` | IGN |

Los endpoints internos del IGN no están documentados y pueden cambiar. La capa de datos está aislada y valida las respuestas con Zod.

## Estructura

```
api/                    Funciones edge de Vercel (QAFI, shakemap, Open Graph)
scripts/
  copy-cesium.mjs       Copia de assets de Cesium
  terrain/              Generador de tiles desde WCS
src/
  app/                  Router y composición de la aplicación
  data/                 Fetch, parseo y esquemas (sismicidad, shakemaps, fallas, estaciones)
  hooks/                useMediaQuery
  layers/               Capas Cesium (sismos, shakemaps, fallas, estaciones)
  lib/                  Formateo
  map/                  Viewer, basemaps, cámara, terreno, peligrosidad, tooltips
  state/                Zustand y estado de URL
  ui/                   Top bar, filtros, lista, ficha, leyenda, secuencia
  ui/onboarding/        Splash, ayuda y tour guiado
terrainAreas.json       Ámbito y ROIs del terreno
vercel.json             Rewrites y cabeceras de caché
```

## Despliegue en Vercel

- Build: `pnpm build` · Output: `dist`.
- Sin variables de entorno.
- Funciones edge:
  - `api/qafi.ts`: proxy del servicio QAFI del IGME (CORS y contenido mixto).
  - `api/shakemap.ts`: proxy de los ficheros de shakemap y normalización de 404.
  - `api/og.ts`: metadatos Open Graph para `/e/:evid` cuando lo solicita un bot.
- `vercel.json` reescribe las rutas SPA excluyendo `/api`, `/terrain`, `/cesium` y `/assets`, y aplica caché inmutable a terreno y Cesium.
- El terreno va versionado en `public/terrain`; los assets de Cesium se generan durante el build y no se versionan.

Presupuesto actual del build: ~59 MB y 6.300 ficheros, dentro de los límites de Vercel Hobby (100 MB / 15.000 ficheros).

## Onboarding

- La pantalla de entrada aparece **en cada visita a `/`** y se omite en enlaces profundos `/e/:evid`.
- El botón de ayuda abre el tour guiado, la introducción, los atajos y las atribuciones.
- El tour usa driver.js: 9 pasos en escritorio y 8 en mobile. No se persiste.

## Limitaciones conocidas

- La ventana de datos es de 30 días (España) y 10 días (mundo). Un enlace a un evento antiguo muestra un aviso con enlace al IGN.
- Solo algunos eventos significativos tienen shakemap.
- QAFI publica trazas sin buzamiento: las cortinas 3D son interpretativas, no planos de falla reales.
- La información sísmica está sujeta a revisión continua por parte del IGN.
- Los endpoints internos del IGN pueden cambiar sin aviso.

## Atribuciones

- **Datos sísmicos y geográficos:** © Instituto Geográfico Nacional de España (IGN), [CC-BY 4.0](https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf). Catálogo de terremotos: [doi:10.7419/162.03.2022](https://doi.org/10.7419/162.03.2022).
- **Fallas activas:** IGME, base QAFI v4. Consultar las condiciones de uso del IGME.
- **ShakeMap:** software de USGS; datos sísmicos del IGN y redes colaboradoras.
- **Motor 3D:** CesiumJS (Apache-2.0). **Tour:** driver.js (MIT).

El detalle completo, con enlaces y licencias de las dependencias, está en [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

## Licencia

El **código** de este repositorio se distribuye bajo **licencia MIT**. Consulta [LICENSE](LICENSE).

La licencia MIT **no cubre los datos** mostrados por la aplicación. Cada conjunto de datos conserva su licencia y requiere su atribución (IGN CC-BY 4.0, IGME QAFI, etc.).
