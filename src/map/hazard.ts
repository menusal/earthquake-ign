import {
  WebMapServiceImageryProvider,
  type ImageryLayer,
  type Viewer,
} from 'cesium'

let layer: ImageryLayer | null = null

export function setHazardLayer(viewer: Viewer, show: boolean): void {
  if (!show) {
    if (layer) layer.show = false
    return
  }

  if (!layer) {
    layer = viewer.imageryLayers.addImageryProvider(
      new WebMapServiceImageryProvider({
        url: 'https://www.ign.es/wms-inspire/geofisica',
        layers: 'HazardArea2015.PGA475_p',
        parameters: { transparent: true, format: 'image/png' },
        credit: 'IGN · peligrosidad 2015',
      }),
    )
  }
  layer.show = show
}

export function resetHazardLayer(): void {
  layer = null
}
