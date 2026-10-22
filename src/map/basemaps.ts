import {
  GeographicTilingScheme,
  ImageryLayer,
  UrlTemplateImageryProvider,
  WebMapTileServiceImageryProvider,
  WebMercatorTilingScheme,
  type Viewer,
} from 'cesium'

export type BasemapMode = 'ortho' | 'relief' | 'dark'

const PNOA_URL =
  'https://www.ign.es/wmts/pnoa-ma?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
  '&LAYER=OI.OrthoimageCoverage&STYLE=default&TILEMATRIXSET=EPSG:4326' +
  '&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&FORMAT=image/jpeg'

const RELIEF_URL =
  'https://tms-relieve.idee.es/1.0.0/relieve/{z}/{x}/{reverseY}.jpeg'

let orthoLayer: ImageryLayer | null = null
let reliefLayer: ImageryLayer | null = null

export function createBasemaps(viewer: Viewer): void {
  const orthoProvider = new WebMapTileServiceImageryProvider({
    url: PNOA_URL,
    layer: 'OI.OrthoimageCoverage',
    style: 'default',
    format: 'image/jpeg',
    tileMatrixSetID: 'EPSG:4326',
    tileMatrixLabels: Array.from({ length: 21 }, (_, level) => `EPSG:4326:${level}`),
    tilingScheme: new GeographicTilingScheme(),
    maximumLevel: 20,
    credit: 'IGN · PNOA',
  })

  const reliefProvider = new UrlTemplateImageryProvider({
    url: RELIEF_URL,
    tilingScheme: new WebMercatorTilingScheme(),
    maximumLevel: 18,
    credit: 'IGN · relieve',
  })

  orthoLayer = viewer.imageryLayers.addImageryProvider(orthoProvider)
  reliefLayer = viewer.imageryLayers.addImageryProvider(reliefProvider)
  reliefLayer.show = false
}

export function setBasemap(mode: BasemapMode): void {
  if (orthoLayer) orthoLayer.show = mode === 'ortho'
  if (reliefLayer) reliefLayer.show = mode === 'relief'
}
