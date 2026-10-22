# Atribuciones y fuentes

Este proyecto combina software libre con datos públicos de varias administraciones. Las licencias del **código** y de los **datos** son independientes.

## Datos

### Instituto Geográfico Nacional (IGN)

Se utilizan las siguientes fuentes del IGN:

- Catálogo y feed de terremotos recientes.
- Shakemaps por evento.
- Metadatos y geometrías de estaciones sísmicas.
- Modelo Digital del Terreno (WCS INSPIRE).
- Ortofoto PNOA (WMTS) y relieve (IDEE).
- Mapa de peligrosidad sísmica de 2015 (WMS INSPIRE).

**Licencia:** CC-BY 4.0, según la *Licencia de los productos y servicios de datos geográficos producidos por el IGN*.

- Texto de la licencia: <https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf>
- Resumen CC-BY 4.0: <https://creativecommons.org/licenses/by/4.0/>
- Portal del IGN: <https://www.ign.es>
- X/Twitter: [@IGNSpain](https://twitter.com/IGNSpain)
- Catálogo de terremotos: <https://www.ign.es/web/ign/portal/sis-catalogo-terremotos>
- DOI del catálogo: <https://doi.org/10.7419/162.03.2022>

**Atribución recomendada:**

> © Instituto Geográfico Nacional de España (IGN), CC-BY 4.0. Fuente: ign.es

Cuando se reutilicen productos concretos, el IGN recomienda la fórmula:

> `<identificador del producto> <fecha> CC-BY 4.0 ign.es`

La aplicación muestra la atribución en la leyenda y en la pantalla de entrada. Si reutilizas este visor o sus datos, mantén una atribución visible equivalente.

### IGME · QAFI

Las fallas activas proceden de la base **QAFI v4** (Quaternary Active Faults of Iberia) del Instituto Geológico y Minero de España.

- Servicio: <https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_QAFI/MapServer>
- Portal del IGME: <https://www.igme.es>
- QAFI: <https://www.igme.es/QAFI/>

El servicio publicado por el IGME no declara una licencia explícita en sus metadatos. **Consulta las condiciones de uso del IGME** antes de redistribuir estos datos. La aplicación los muestra con atribución y con la advertencia de que las cortinas 3D son interpretativas: QAFI publica trazas sin buzamiento ni dirección de plano.

### ShakeMap

Los mapas de sacudida se generan con el software **ShakeMap®** del USGS a partir de datos del IGN y de redes colaboradoras. La cartografía y los grids se publican a través del IGN.

- ShakeMap (USGS): <https://earthquake.usgs.gov/data/shakemap/>
- Productos del IGN: <https://www.ign.es/web/ign/portal/sis-catalogo-shakemaps>

## Software

| Componente | Licencia | Enlace |
|---|---|---|
| CesiumJS | Apache-2.0 | <https://github.com/CesiumGS/cesium> |
| driver.js | MIT | <https://github.com/kamranahmedse/driver.js> |
| React | MIT | <https://github.com/facebook/react> |
| React Router | MIT | <https://github.com/remix-run/react-router> |
| Vite | MIT | <https://github.com/vitejs/vite> |
| Tailwind CSS | MIT | <https://github.com/tailwindlabs/tailwindcss> |
| Zustand | MIT | <https://github.com/pmndrs/zustand> |
| Zod | MIT | <https://github.com/colinhacks/zod> |
| TanStack Virtual | MIT | <https://github.com/TanStack/virtual> |
| TypeScript | Apache-2.0 | <https://github.com/microsoft/TypeScript> |
| geotiff.js | MIT | <https://github.com/geotiffjs/geotiff.js> |

Las licencias completas de las dependencias están disponibles en `node_modules` y en sus repositorios.

## Licencia del proyecto

El código de este repositorio se distribuye bajo **MIT** (texto canónico en [LICENSE](LICENSE); traducción de referencia en [LICENSE.es.md](LICENSE.es.md)).

La licencia MIT **no se aplica a los datos**. Los datos conservan sus licencias y condiciones de atribución descritas arriba.
